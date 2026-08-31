import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  actualizarEstadoTramoAdmin,
  eliminarTramoAdmin,
  guardarTramoAdmin,
  obtenerTramosAdmin
} from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';

const FORMULARIO_INICIAL = {
  pe: '',
  etapa: '',
  desde: '',
  hasta: '',
  kms: '',
  hora: '',
  peOriginal: null
};

const ESTADOS_TRAMO = ['Demorado', 'En carrera', 'Finalizado', 'Interrumpido', 'Cancelado'];

function obtenerClaseBadgeEtapa(etapa) {
  return Number(etapa) === 2
    ? 'badge-etapa badge-etapa--etapa-2'
    : 'badge-etapa badge-etapa--etapa-1';
}

function obtenerClaseEstadoTramo(estado) {
  const valor = String(estado || '').trim().toLowerCase();

  if (valor === 'cancelado') {
    return 'selector-tabla selector-tabla--estado selector-tabla--estado-cancelado';
  }

  if (valor === 'demorado') {
    return 'selector-tabla selector-tabla--estado selector-tabla--estado-demorado';
  }

  if (valor === 'en carrera') {
    return 'selector-tabla selector-tabla--estado selector-tabla--estado-en-carrera';
  }

  return 'selector-tabla selector-tabla--estado';
}

function normalizarEstadoTramo(estado) {
  return String(estado || '').trim() === 'Programado' ? 'Demorado' : (estado || '');
}

function normalizarHora(valor) {
  const soloDigitos = String(valor || '').replace(/[^\d]/g, '').slice(0, 4);

  if (soloDigitos.length <= 2) {
    return soloDigitos;
  }

  return `${soloDigitos.slice(0, 2)}:${soloDigitos.slice(2)}`;
}

function normalizarKms(valor) {
  const soloPermitidos = String(valor || '').replace(/[^\d,]/g, '');
  const partes = soloPermitidos.split(',');

  if (partes.length === 1) {
    return partes[0].slice(0, 2);
  }

  return `${partes[0].slice(0, 2)},${partes.slice(1).join('').slice(0, 2)}`;
}

export function PaginaTramos() {
  const formularioRef = useRef(null);
  const [tramos, setTramos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState('');
  const [eliminando, setEliminando] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [formularioBase, setFormularioBase] = useState(FORMULARIO_INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const esShakedown = formulario.pe === '0';

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  const hayCambiosPendientes =
    JSON.stringify(formulario) !== JSON.stringify(formularioBase);

  useUnsavedChangesWarning(hayCambiosPendientes);

  useEffect(() => {
    cargarTramos();
  }, []);

  async function cargarTramos() {
    setCargando(true);
    setError('');

    try {
      const datos = await obtenerTramosAdmin();
      setTramos(datos.map((tramo) => ({
        ...tramo,
        estado: normalizarEstadoTramo(tramo.estado)
      })));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tramos.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(event) {
    const { name, value } = event.target;
    setFormulario((actual) => {
      let valorNormalizado = value;

      if (['pe', 'etapa'].includes(name)) {
        valorNormalizado = value.replace(/[^\d]/g, '');
      } else if (name === 'hora') {
        valorNormalizado = normalizarHora(value);
      } else if (name === 'kms') {
        valorNormalizado = normalizarKms(value);
      }

      const proximo = {
        ...actual,
        [name]: valorNormalizado
      };

      if (name === 'pe' && valorNormalizado === '0') {
        proximo.etapa = '1';
        proximo.desde = 'Shakedown';
        proximo.hasta = '';
      } else if (name === 'etapa') {
        proximo.etapa = ['1', '2'].includes(valorNormalizado) ? valorNormalizado : '';
      }

      return proximo;
    });
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setFormularioBase(FORMULARIO_INICIAL);
  }

  function editarTramo(tramo) {
    const siguienteFormulario = {
      pe: String(tramo.pe),
      etapa: String(tramo.etapa),
      desde: tramo.desde || '',
      hasta: tramo.hasta || '',
      kms: tramo.kms || '',
      hora: tramo.hora || '',
      peOriginal: tramo.pe
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
      await guardarTramoAdmin({
        ...formulario,
        pe: Number(formulario.pe),
        etapa: Number(formulario.etapa),
        peOriginal: formulario.peOriginal,
        estado: normalizarEstadoTramo(
          tramos.find((item) => String(item.pe) === String(formulario.peOriginal))?.estado || ''
        )
      });
      await cargarTramos();
      setMensaje(formulario.peOriginal !== null ? 'Tramo actualizado correctamente.' : 'Tramo agregado correctamente.');
      limpiarFormulario();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el tramo.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(pe) {
    const confirmar = window.confirm(`¿Querés eliminar el tramo PE ${pe}?`);
    if (!confirmar) {
      return;
    }

    setEliminando(String(pe));
    setMensaje('');
    setError('');

    try {
      await eliminarTramoAdmin(pe);
      await cargarTramos();
      setMensaje(`Tramo PE ${pe} eliminado correctamente.`);
      if (String(formulario.peOriginal) === String(pe)) {
        limpiarFormulario();
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el tramo.');
    } finally {
      setEliminando('');
    }
  }

  async function manejarCambioEstado(tramo, nuevoEstado) {
    setGuardandoEstado(String(tramo.pe));
    setMensaje('');
    setError('');

    try {
      setTramos((actual) => actual.map((item) => (
        String(item.pe) === String(tramo.pe)
          ? { ...item, estado: nuevoEstado }
          : item
      )));

      await actualizarEstadoTramoAdmin({
        pe: Number(tramo.pe),
        etapa: Number(tramo.etapa),
        desde: tramo.desde,
        hasta: tramo.hasta,
        kms: tramo.kms,
        hora: tramo.hora,
        estado: nuevoEstado
      });
      setMensaje(`Estado del PE ${tramo.pe} actualizado correctamente.`);
    } catch (err) {
      await cargarTramos();
      setError(err.message || 'No se pudo actualizar el estado del tramo.');
    } finally {
      setGuardandoEstado('');
    }
  }

  const tramosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return tramos;
    }

    return tramos.filter((tramo) => (
      String(tramo.pe).includes(termino) ||
      String(tramo.etapa).includes(termino) ||
      String(tramo.desde || '').toLowerCase().includes(termino) ||
      String(tramo.hasta || '').toLowerCase().includes(termino) ||
      String(tramo.estado || '').toLowerCase().includes(termino)
    ));
  }, [busqueda, tramos]);

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Configuración de carrera</p>
          <h1>Tramos</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>Total cargados</span>
            <strong>{tramos.length}</strong>
          </article>
          <article className="estado-card">
            <span>Mostrando</span>
            <strong>{tramosFiltrados.length}</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido panel__contenido--stack">
        <form ref={formularioRef} className="formulario-tramos" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="pe">PE</label>
            <input id="pe" name="pe" type="text" value={formulario.pe} onChange={manejarCambio} />
            <small>"0" reservado para Shakedown.</small>
          </div>

          <div className="campo">
            <label htmlFor="etapa">Etapa</label>
            <select id="etapa" name="etapa" value={formulario.etapa} onChange={manejarCambio} disabled={esShakedown}>
              <option value="">Seleccionar</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="hora">Hora</label>
            <input
              id="hora"
              name="hora"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Ej: 09:18"
              value={formulario.hora}
              onChange={manejarCambio}
            />
            <small>Formato: "HH:MM".</small>
          </div>

          <div className="campo campo--ancho">
            <label htmlFor="desde">Desde</label>
            <input id="desde" name="desde" type="text" value={formulario.desde} onChange={manejarCambio} readOnly={esShakedown} />
          </div>

          <div className="campo campo--ancho">
            <label htmlFor="hasta">Hasta</label>
            <input id="hasta" name="hasta" type="text" value={formulario.hasta} onChange={manejarCambio} readOnly={esShakedown} />
          </div>

          <div className="campo">
            <label htmlFor="kms">Kms</label>
            <input
              id="kms"
              name="kms"
              type="text"
              inputMode="decimal"
              maxLength={5}
              placeholder="Ej: 12,41"
              value={formulario.kms}
              onChange={manejarCambio}
            />
            <small>Formato: "KK,MM".</small>
          </div>

          <div className="acciones acciones--dobles">
            <button type="button" className="boton-secundario" onClick={limpiarFormulario}>
              Limpiar
            </button>
            <button type="submit" className="boton-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : (formulario.peOriginal !== null ? 'Actualizar tramo' : 'Agregar tramo')}
            </button>
          </div>
        </form>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Listado actual</h2>
              <p>Podés buscar por PE, etapa, nombre del tramo o estado.</p>
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
            <div className="feedback feedback--info">Cargando tramos...</div>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>PE</th>
                    <th>Etapa</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Kms</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tramosFiltrados.map((tramo) => (
                    <tr key={tramo.pe}>
                      <td>{tramo.pe}</td>
                      <td>
                        <span className={obtenerClaseBadgeEtapa(tramo.etapa)}>
                          {tramo.etapa}
                        </span>
                      </td>
                      <td>{tramo.desde}</td>
                      <td>{tramo.hasta}</td>
                      <td>{tramo.kms}</td>
                      <td>{tramo.hora}</td>
                      <td>
                        <select
                          className={obtenerClaseEstadoTramo(tramo.estado)}
                          value={tramo.estado || ''}
                          disabled={guardandoEstado === String(tramo.pe)}
                          onChange={(event) => manejarCambioEstado(tramo, event.target.value)}
                        >
                          <option value="">Sin asignar</option>
                          {ESTADOS_TRAMO.map((estado) => (
                            <option key={estado} value={estado}>{estado}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="tabla-admin__acciones tabla-admin__acciones--iconos">
                          <button
                            type="button"
                            className="boton-icono boton-icono--editar"
                            onClick={() => editarTramo(tramo)}
                            title={`Editar PE ${tramo.pe}`}
                            aria-label={`Editar PE ${tramo.pe}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="boton-icono boton-icono--eliminar"
                            disabled={eliminando === String(tramo.pe)}
                            onClick={() => manejarEliminar(tramo.pe)}
                            title={`Eliminar PE ${tramo.pe}`}
                            aria-label={`Eliminar PE ${tramo.pe}`}
                          >
                            {eliminando === String(tramo.pe) ? '...' : <Trash2 size={16} />}
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
