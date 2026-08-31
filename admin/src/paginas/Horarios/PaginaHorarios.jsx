import { useMemo, useState, useEffect, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  eliminarHorariosPorEtapaAdmin,
  eliminarHorarioAdmin,
  guardarHorarioAdmin,
  guardarLoteHorariosAdmin,
  publicarHorariosPorEtapaAdmin,
  obtenerHorariosAdmin
} from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { BadgeNro } from '../../componentes/comunes/BadgeNro.jsx';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';

const FORMULARIO_INICIAL = {
  nro: '',
  etapa: '1',
  piloto: '',
  navegante: '',
  vehiculo: '',
  clase: '',
  nac: '',
  hora: '',
  nroOriginal: null,
  etapaOriginal: null
};

function normalizarNac(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function normalizarHora(valor) {
  return String(valor || '').replace(/[^\d:]/g, '').slice(0, 5);
}

function serializarHorariosEtapa(items) {
  return JSON.stringify(
    [...items]
      .map((item) => ({
        nro: Number(item.nro),
        etapa: Number(item.etapa),
        piloto: String(item.piloto || ''),
        navegante: String(item.navegante || ''),
        vehiculo: String(item.vehiculo || ''),
        clase: String(item.clase || ''),
        nac: String(item.nac || ''),
        hora: String(item.hora || '')
      }))
      .sort((a, b) => Number(a.hora.replace(':', '')) - Number(b.hora.replace(':', '')) || Number(a.nro) - Number(b.nro))
  );
}

export function PaginaHorarios() {
  const formularioRef = useRef(null);
  const [horarios, setHorarios] = useState([]);
  const [horariosPublicados, setHorariosPublicados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [eliminando, setEliminando] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('1');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [formularioBase, setFormularioBase] = useState(FORMULARIO_INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [textoMasivo, setTextoMasivo] = useState('');

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  const hayCambiosPendientes =
    JSON.stringify(formulario) !== JSON.stringify(formularioBase) ||
    String(textoMasivo || '').trim().length > 0;

  useUnsavedChangesWarning(hayCambiosPendientes);

  useEffect(() => {
    cargarHorarios();
  }, []);

  async function cargarHorarios() {
    setCargando(true);
    setError('');

    try {
      const respuestaHorarios = await obtenerHorariosAdmin();
      setHorarios(respuestaHorarios.datos || []);
      setHorariosPublicados(respuestaHorarios.publicados || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los horarios.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]:
        name === 'nro'
          ? value.replace(/[^\d]/g, '')
          : name === 'hora'
            ? normalizarHora(value)
            : value
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setFormularioBase(FORMULARIO_INICIAL);
  }

  function parsearTextoMasivo(texto, etapa) {
    const lineas = texto
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter(Boolean);

    if (!lineas.length) {
      return [];
    }

    const filas = lineas.map((linea) => linea.split('\t').map((parte) => parte.trim()));
    const primeraFila = filas[0].map((valor) => valor.toUpperCase());
    const tieneCabecera = ['NRO', 'PILOTO', 'NAVEGANTE', 'VEHÍCULO', 'CLASE', 'NAC', 'HORA']
      .every((columna, index) => primeraFila[index] === columna || (columna === 'VEHÍCULO' && primeraFila[index] === 'VEHICULO'));

    const filasDatos = tieneCabecera ? filas.slice(1) : filas;

    return filasDatos.map((columnas, index) => {
      if (columnas.length < 7) {
        throw new Error(`La fila ${index + 1} no tiene las 7 columnas esperadas.`);
      }

      const [nro, piloto, navegante, vehiculo, clase, nac, hora] = columnas;

      if (!/^\d+$/.test(nro)) {
        throw new Error(`La fila ${index + 1} tiene un Nro invalido.`);
      }

      const nacNormalizada = normalizarNac(nac);
      if (!/^([A-Z]{3})(\s+[A-Z]{3})*$/.test(nacNormalizada)) {
        throw new Error(`La fila ${index + 1} tiene "Nac" invalido. Usa codigos como "ARG" o "ARG ARG".`);
      }

      return {
        nro: Number(nro),
        etapa: Number(etapa),
        piloto,
        navegante,
        vehiculo,
        clase,
        nac: nacNormalizada,
        hora
      };
    });
  }

  function editarHorario(horario) {
    const siguienteFormulario = {
      nro: String(horario.nro),
      etapa: String(horario.etapa),
      piloto: horario.piloto || '',
      navegante: horario.navegante || '',
      vehiculo: horario.vehiculo || '',
      clase: horario.clase || '',
      nac: horario.nac || '',
      hora: horario.hora || '',
      nroOriginal: horario.nro,
      etapaOriginal: horario.etapa
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
      await guardarHorarioAdmin({
        ...formulario,
        nro: Number(formulario.nro),
        etapa: Number(formulario.etapa),
        nac: normalizarNac(formulario.nac)
      });
      await cargarHorarios();
      setMensaje(formulario.nroOriginal !== null ? 'Horario actualizado correctamente.' : 'Horario agregado correctamente.');
      limpiarFormulario();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el horario.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarCargaMasiva() {
    setGuardandoLote(true);
    setMensaje('');
    setError('');

    try {
      const items = parsearTextoMasivo(textoMasivo, filtroEtapa);
      if (!items.length) {
        throw new Error('Pega al menos una fila para importar.');
      }

      await guardarLoteHorariosAdmin(items, Number(filtroEtapa));
      await cargarHorarios();
      setTextoMasivo('');
      setMensaje(`Se importaron ${items.length} horarios correctamente para la etapa ${filtroEtapa}.`);
    } catch (err) {
      setError(err.message || 'No se pudo importar el bloque de horarios.');
    } finally {
      setGuardandoLote(false);
    }
  }

  async function manejarEliminar(etapa, nro) {
    const confirmar = window.confirm(`¿Querés eliminar el horario del auto #${nro} en la etapa ${etapa}?`);
    if (!confirmar) {
      return;
    }

    setEliminando(`${etapa}-${nro}`);
    setMensaje('');
    setError('');

    try {
      await eliminarHorarioAdmin(etapa, nro);
      await cargarHorarios();
      setMensaje(`Horario del auto #${nro} eliminado correctamente.`);

      if (
        String(formulario.nroOriginal) === String(nro) &&
        String(formulario.etapaOriginal) === String(etapa)
      ) {
        limpiarFormulario();
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el horario.');
    } finally {
      setEliminando('');
    }
  }

  async function manejarEliminarEtapa() {
    const confirmar = window.confirm(`¿Querés borrar todos los horarios cargados en la etapa ${filtroEtapa}?`);
    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const resultado = await eliminarHorariosPorEtapaAdmin(Number(filtroEtapa));
      await cargarHorarios();
      setMensaje(`Se borraron ${resultado.eliminados} horarios de la etapa ${filtroEtapa}.`);

      if (String(formulario.etapa) === String(filtroEtapa)) {
        limpiarFormulario();
      }
    } catch (err) {
      setError(err.message || 'No se pudieron borrar los horarios de la etapa.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarGuardarCambios() {
    if (String(textoMasivo || '').trim().length > 0) {
      await manejarCargaMasiva();
      return;
    }

    if (JSON.stringify(formulario) !== JSON.stringify(formularioBase)) {
      formularioRef.current?.requestSubmit();
      return;
    }

    setMensaje('No hay cambios pendientes para guardar en Horarios.');
    setError('');
  }

  async function manejarPublicarEtapa() {
    if (hayCambiosPendientes) {
      setError('Guardá primero los cambios pendientes antes de publicar.');
      setMensaje('');
      return;
    }

    const confirmar = window.confirm(`¿Querés publicar ahora los horarios de la etapa ${filtroEtapa} en la web pública?`);
    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const resultado = await publicarHorariosPorEtapaAdmin(Number(filtroEtapa));
      setHorariosPublicados((actual) => {
        const resto = actual.filter((horario) => String(horario.etapa) !== String(filtroEtapa));
        return [...resto, ...horariosFiltrados].sort((a, b) => (
          Number(a.etapa) - Number(b.etapa) ||
          String(a.hora || '').localeCompare(String(b.hora || '')) ||
          Number(a.nro) - Number(b.nro)
        ));
      });
      setMensaje(`Se publicaron ${resultado.publicados} horarios de la etapa ${filtroEtapa} en la web.`);
    } catch (err) {
      setError(err.message || 'No se pudieron publicar los horarios en la web.');
    } finally {
      setGuardando(false);
    }
  }

  const horariosFiltrados = useMemo(() => (
    horarios.filter((horario) => String(horario.etapa) === String(filtroEtapa))
  ), [filtroEtapa, horarios]);

  const horariosPublicadosFiltrados = useMemo(() => (
    horariosPublicados.filter((horario) => String(horario.etapa) === String(filtroEtapa))
  ), [filtroEtapa, horariosPublicados]);

  const hayCambiosPublicables = useMemo(
    () => serializarHorariosEtapa(horariosFiltrados) !== serializarHorariosEtapa(horariosPublicadosFiltrados),
    [horariosFiltrados, horariosPublicadosFiltrados]
  );

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Orden de largada</p>
          <h1>Horarios</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>Total cargados</span>
            <strong>{horarios.length}</strong>
          </article>
          <article className="estado-card">
            <span>Filtro activo</span>
            <strong>{`Etapa ${filtroEtapa}`}</strong>
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
            <label htmlFor="etapa">Etapa</label>
            <select id="etapa" name="etapa" value={formulario.etapa} onChange={manejarCambio}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="hora">Hora</label>
            <input id="hora" name="hora" type="text" placeholder="Ej: 8:02" value={formulario.hora} onChange={manejarCambio} />
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
            <label htmlFor="nac">Nac</label>
            <input id="nac" name="nac" type="text" value={formulario.nac} onChange={manejarCambio} placeholder="Ej: ARG ARG" />
          </div>

          <div className="acciones acciones--dobles">
            <button type="button" className="boton-secundario" onClick={limpiarFormulario}>
              Limpiar
            </button>
            <button type="submit" className="boton-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : (formulario.nroOriginal !== null ? 'Actualizar horario' : 'Agregar horario')}
            </button>
          </div>
        </form>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Carga masiva</h2>
              <p>Elegí la etapa arriba y pegá filas copiadas desde Google Sheets.</p>
            </div>

            <div className="selector-etapas">
              <button
                type="button"
                className={`selector-etapas__boton ${filtroEtapa === '1' ? 'selector-etapas__boton--activo' : ''}`}
                onClick={() => setFiltroEtapa('1')}
              >
                Etapa 1
              </button>
              <button
                type="button"
                className={`selector-etapas__boton ${filtroEtapa === '2' ? 'selector-etapas__boton--activo' : ''}`}
                onClick={() => setFiltroEtapa('2')}
              >
                Etapa 2
              </button>
            </div>
          </div>

          <div className="carga-masiva">
            <textarea
              className="carga-masiva__texto"
              value={textoMasivo}
              onChange={(event) => setTextoMasivo(event.target.value)}
              placeholder={`NRO\tPILOTO\tNAVEGANTE\tVEHÍCULO\tCLASE\tNAC\tHORA\n1\tMiguel BALDONI\tGustavo FRANCHELLO\tSkoda Fabia RS Rally2\tRC2\tARG ARG\t8:00`}
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
                {guardandoLote ? 'Importando...' : `Importar en Etapa ${filtroEtapa}`}
              </button>
            </div>
          </div>
        </section>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Listado actual</h2>
            </div>

            <div className="selector-etapas">
              <button
                type="button"
                className={`selector-etapas__boton ${filtroEtapa === '1' ? 'selector-etapas__boton--activo' : ''}`}
                onClick={() => setFiltroEtapa('1')}
              >
                Etapa 1
              </button>
              <button
                type="button"
                className={`selector-etapas__boton ${filtroEtapa === '2' ? 'selector-etapas__boton--activo' : ''}`}
                onClick={() => setFiltroEtapa('2')}
              >
                Etapa 2
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="feedback feedback--info">Cargando horarios...</div>
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
                    <th>Hora</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosFiltrados.map((horario) => (
                    <tr key={`${horario.etapa}-${horario.nro}`}>
                      <td><BadgeNro nro={horario.nro} clase={horario.clase} /></td>
                      <td>{horario.piloto}</td>
                      <td>{horario.navegante}</td>
                      <td>{horario.vehiculo}</td>
                      <td>{horario.clase}</td>
                      <td>{horario.nac}</td>
                      <td>{horario.hora}</td>
                      <td>
                        <div className="tabla-admin__acciones tabla-admin__acciones--iconos">
                          <button
                            type="button"
                            className="boton-icono boton-icono--editar"
                            onClick={() => editarHorario(horario)}
                            title="Editar horario"
                            aria-label="Editar horario"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="boton-icono boton-icono--eliminar"
                            disabled={eliminando === `${horario.etapa}-${horario.nro}`}
                            onClick={() => manejarEliminar(horario.etapa, horario.nro)}
                            title="Eliminar horario"
                            aria-label="Eliminar horario"
                          >
                            {eliminando === `${horario.etapa}-${horario.nro}` ? '...' : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="tabla-bloque__footer-acciones">
            <button
              type="button"
              className="boton-secundario boton-secundario--danger"
              disabled={guardando}
              onClick={manejarEliminarEtapa}
            >
              {guardando ? 'Procesando...' : `Borrar Etapa ${filtroEtapa}`}
            </button>

            <div className="acciones__grupo">
              <button
                type="button"
                className="boton-secundario"
                onClick={manejarGuardarCambios}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="boton-principal"
                onClick={manejarPublicarEtapa}
                disabled={guardando || !hayCambiosPublicables}
              >
                {guardando ? 'Procesando...' : 'Publicar en la web'}
              </button>
            </div>
          </div>
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
