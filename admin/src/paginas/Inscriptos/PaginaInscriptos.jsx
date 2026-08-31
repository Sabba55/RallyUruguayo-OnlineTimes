import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  eliminarTodosLosInscriptosAdmin,
  eliminarInscriptoAdmin,
  guardarLoteInscriptosAdmin,
  guardarInscriptoAdmin,
  obtenerInscriptosAdmin
} from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { BadgeNro } from '../../componentes/comunes/BadgeNro.jsx';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';

const FORMULARIO_INICIAL = {
  nro: '',
  piloto: '',
  navegante: '',
  vehiculo: '',
  clase: '',
  nac: '',
  nroOriginal: null
};

export function PaginaInscriptos() {
  const formularioRef = useRef(null);
  const [inscriptos, setInscriptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState('');
  const [borrandoTodo, setBorrandoTodo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [formularioBase, setFormularioBase] = useState(FORMULARIO_INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [textoMasivo, setTextoMasivo] = useState('');
  const [guardandoLote, setGuardandoLote] = useState(false);

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  const hayCambiosPendientes =
    JSON.stringify(formulario) !== JSON.stringify(formularioBase) ||
    String(textoMasivo || '').trim().length > 0;

  useUnsavedChangesWarning(hayCambiosPendientes);

  useEffect(() => {
    cargarInscriptos();
  }, []);

  async function cargarInscriptos() {
    setCargando(true);
    setError('');

    try {
      const datos = await obtenerInscriptosAdmin();
      setInscriptos(datos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los inscriptos.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: name === 'nro' ? value.replace(/[^\d]/g, '') : value
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setFormularioBase(FORMULARIO_INICIAL);
  }

  function normalizarNac(valor) {
    return String(valor || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
  }

  function parsearTextoMasivo(texto) {
    const lineas = texto
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter(Boolean);

    if (!lineas.length) {
      return [];
    }

    const filas = lineas.map((linea) => linea.split('\t').map((parte) => parte.trim()));
    const primeraFila = filas[0].map((valor) => valor.toUpperCase());
    const tieneCabecera = ['NRO', 'PILOTO', 'NAVEGANTE', 'VEHICULO', 'CLASE', 'NAC']
      .every((columna, index) => primeraFila[index] === columna);

    const filasDatos = tieneCabecera ? filas.slice(1) : filas;

    return filasDatos.map((columnas, index) => {
      if (columnas.length < 6) {
        throw new Error(`La fila ${index + 1} no tiene las 6 columnas esperadas.`);
      }

      const [nro, piloto, navegante, vehiculo, clase, nac] = columnas;

      if (!/^\d+$/.test(nro)) {
        throw new Error(`La fila ${index + 1} tiene un Nro inválido.`);
      }

      const nacNormalizada = normalizarNac(nac);
      if (!/^([A-Z]{3})(\s+[A-Z]{3})*$/.test(nacNormalizada)) {
        throw new Error(`La fila ${index + 1} tiene "Nac" inválido. Usá códigos como "ARG" o "ARG ARG".`);
      }

      return {
        nro: Number(nro),
        piloto,
        navegante,
        vehiculo,
        clase,
        nac: nacNormalizada
      };
    });
  }

  function editarInscripto(inscripto) {
    const siguienteFormulario = {
      nro: String(inscripto.nro),
      piloto: inscripto.piloto || '',
      navegante: inscripto.navegante || '',
      vehiculo: inscripto.vehiculo || '',
      clase: inscripto.clase || '',
      nac: inscripto.nac || '',
      nroOriginal: inscripto.nro
    };
    setFormulario(siguienteFormulario);
    setFormularioBase(siguienteFormulario);
    setMensaje('');
    setError('');
    requestAnimationFrame(() => {
      formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function manejarSubmit(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const payload = {
        ...formulario,
        nro: Number(formulario.nro),
        nroOriginal: formulario.nroOriginal
      };

      await guardarInscriptoAdmin(payload);
      await cargarInscriptos();
      setMensaje(formulario.nroOriginal ? 'Inscripto actualizado correctamente.' : 'Inscripto agregado correctamente.');
      limpiarFormulario();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el inscripto.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(nro) {
    const confirmar = window.confirm(`¿Querés eliminar el inscripto #${nro}?`);
    if (!confirmar) {
      return;
    }

    setEliminando(String(nro));
    setMensaje('');
    setError('');

    try {
      await eliminarInscriptoAdmin(nro);
      await cargarInscriptos();
      setMensaje(`Inscripto #${nro} eliminado correctamente.`);

      if (String(formulario.nroOriginal) === String(nro)) {
        limpiarFormulario();
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el inscripto.');
    } finally {
      setEliminando('');
    }
  }

  async function manejarCargaMasiva() {
    setGuardandoLote(true);
    setMensaje('');
    setError('');

    try {
      const items = parsearTextoMasivo(textoMasivo);
      if (!items.length) {
        throw new Error('Pegá al menos una fila para importar.');
      }

      const numeros = new Set();
      for (const item of items) {
        if (numeros.has(item.nro)) {
          throw new Error(`El número ${item.nro} está repetido dentro del bloque pegado.`);
        }
        numeros.add(item.nro);
      }

      await guardarLoteInscriptosAdmin(items);
      await cargarInscriptos();
      setTextoMasivo('');
      setFormularioBase(FORMULARIO_INICIAL);
      setMensaje(`Se importaron ${items.length} inscriptos correctamente.`);
    } catch (err) {
      setError(err.message || 'No se pudo importar el bloque de inscriptos.');
    } finally {
      setGuardandoLote(false);
    }
  }

  async function manejarBorrarTodo() {
    const confirmar = window.confirm('¿Querés borrar toda la lista de inscriptos? También se eliminarán tiempos, shakedown, horarios y penalizaciones asociados.');
    if (!confirmar) {
      return;
    }

    setBorrandoTodo(true);
    setMensaje('');
    setError('');

    try {
      const resultado = await eliminarTodosLosInscriptosAdmin();
      await cargarInscriptos();
      limpiarFormulario();
      setTextoMasivo('');
      setMensaje(`Se borraron ${resultado.eliminados} inscriptos con todos sus datos asociados.`);
    } catch (err) {
      setError(err.message || 'No se pudieron borrar todos los inscriptos.');
    } finally {
      setBorrandoTodo(false);
    }
  }

  const inscriptosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return inscriptos;
    }

    return inscriptos.filter((inscripto) => (
      String(inscripto.nro).includes(termino) ||
      String(inscripto.piloto || '').toLowerCase().includes(termino) ||
      String(inscripto.navegante || '').toLowerCase().includes(termino) ||
      String(inscripto.vehiculo || '').toLowerCase().includes(termino) ||
      String(inscripto.clase || '').toLowerCase().includes(termino)
    ));
  }, [busqueda, inscriptos]);

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Operación</p>
          <h1>Inscriptos</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>Total cargados</span>
            <strong>{inscriptos.length}</strong>
          </article>
          <article className="estado-card">
            <span>Mostrando</span>
            <strong>{inscriptosFiltrados.length}</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido panel__contenido--stack">
        <form ref={formularioRef} className="formulario-inscriptos" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="nro">Nro</label>
            <input id="nro" name="nro" type="text" value={formulario.nro} onChange={manejarCambio} />
          </div>

          <div className="campo">
            <label htmlFor="piloto">Piloto</label>
            <input id="piloto" name="piloto" type="text" value={formulario.piloto} onChange={manejarCambio} />
          </div>

          <div className="campo">
            <label htmlFor="navegante">Navegante</label>
            <input id="navegante" name="navegante" type="text" value={formulario.navegante} onChange={manejarCambio} />
          </div>

          <div className="campo campo--ancho">
            <label htmlFor="vehiculo">Vehículo</label>
            <input id="vehiculo" name="vehiculo" type="text" value={formulario.vehiculo} onChange={manejarCambio} />
          </div>

          <div className="campo">
            <label htmlFor="clase">Clase</label>
            <input id="clase" name="clase" type="text" value={formulario.clase} onChange={manejarCambio} />
          </div>

          <div className="campo">
            <label htmlFor="nac">Nacionalidades</label>
            <input id="nac" name="nac" type="text" value={formulario.nac} onChange={manejarCambio} placeholder="Ej: ARG ARG" />
            <small>Usá códigos de 3 letras `ARG ARG`.</small>
          </div>

          <div className="acciones acciones--dobles">
            <button type="button" className="boton-secundario" onClick={limpiarFormulario}>
              Limpiar
            </button>
            <div className="acciones__grupo">
              <button
                type="button"
                className="boton-secundario boton-secundario--danger"
                disabled={borrandoTodo}
                onClick={manejarBorrarTodo}
              >
                {borrandoTodo ? 'Borrando...' : 'Borrar Todo'}
              </button>
              <button type="submit" className="boton-principal" disabled={guardando}>
                {guardando ? 'Guardando...' : (formulario.nroOriginal ? 'Actualizar inscripto' : 'Agregar inscripto')}
              </button>
            </div>
          </div>
        </form>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Carga masiva</h2>
              <p>Pegá directamente filas copiadas desde Google Sheets con columnas separadas por tabulación.</p>
            </div>
          </div>

          <div className="carga-masiva">
            <textarea
              className="carga-masiva__texto"
              value={textoMasivo}
              onChange={(event) => setTextoMasivo(event.target.value)}
              placeholder={`NRO\tPILOTO\tNAVEGANTE\tVEHICULO\tCLASE\tNAC\n1\tMiguel BALDONI\tGustavo FRANCHELLO\tSkoda Fabia RS Rally2\tRC2\tARG ARG`}
            />

            <div className="acciones acciones--dobles">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setTextoMasivo('')}
              >
                Limpiar bloque
              </button>
              <button
                type="button"
                className="boton-principal"
                disabled={guardandoLote}
                onClick={manejarCargaMasiva}
              >
                {guardandoLote ? 'Importando...' : 'Importar bloque'}
              </button>
            </div>
          </div>
        </section>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Listado actual</h2>
              <p>Podés buscar por número, piloto, navegante, vehículo o clase.</p>
            </div>

            <input
              className="buscador"
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          {cargando ? (
            <div className="feedback feedback--info">Cargando inscriptos...</div>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Piloto</th>
                    <th>Navegante</th>
                    <th>Vehículo</th>
                    <th>Clase</th>
                    <th>Nac</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptosFiltrados.map((inscripto) => (
                    <tr key={inscripto.nro}>
                      <td><BadgeNro nro={inscripto.nro} clase={inscripto.clase} /></td>
                      <td>{inscripto.piloto}</td>
                      <td>{inscripto.navegante}</td>
                      <td>{inscripto.vehiculo}</td>
                      <td>{inscripto.clase}</td>
                      <td>{inscripto.nac}</td>
                      <td>
                        <div className="tabla-admin__acciones tabla-admin__acciones--iconos">
                          <button
                            type="button"
                            className="boton-icono boton-icono--editar"
                            onClick={() => editarInscripto(inscripto)}
                            title="Editar inscripto"
                            aria-label="Editar inscripto"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="boton-icono boton-icono--eliminar"
                            disabled={eliminando === String(inscripto.nro)}
                            onClick={() => manejarEliminar(inscripto.nro)}
                            title="Eliminar inscripto"
                            aria-label="Eliminar inscripto"
                          >
                            {eliminando === String(inscripto.nro) ? '...' : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ToastAdmin
        abierto={Boolean(error || mensaje)}
        tipo={error ? 'error' : 'info'}
        mensaje={error || mensaje}
        onClose={() => {
          setMensaje('');
          setError('');
        }}
      />
    </section>
  );
}
