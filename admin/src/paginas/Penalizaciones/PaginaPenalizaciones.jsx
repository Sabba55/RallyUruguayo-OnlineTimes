import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  eliminarPenalizacionAdmin,
  guardarPenalizacionAdmin,
  obtenerInscriptosAdmin,
  obtenerPenalizacionesAdmin
} from '../../servicios/adminApi.js';
import { obtenerTramosAdmin } from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { BadgeNro } from '../../componentes/comunes/BadgeNro.jsx';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';

const FORMULARIO_INICIAL = {
  id_penal: null,
  nro: '',
  peocurrido: '',
  tiempo: '',
  motivo: '',
  control: ''
};

export function PaginaPenalizaciones() {
  const [penalizaciones, setPenalizaciones] = useState([]);
  const [inscriptos, setInscriptos] = useState([]);
  const [tramos, setTramos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [formularioBase, setFormularioBase] = useState(FORMULARIO_INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  const hayCambiosPendientes =
    JSON.stringify(formulario) !== JSON.stringify(formularioBase);

  useUnsavedChangesWarning(hayCambiosPendientes);

  useEffect(() => {
    cargarPenalizaciones();
  }, []);

  async function cargarPenalizaciones() {
    setCargando(true);
    setError('');

    try {
      const [datosPenalizaciones, datosInscriptos, datosTramos] = await Promise.all([
        obtenerPenalizacionesAdmin(),
        obtenerInscriptosAdmin(),
        obtenerTramosAdmin()
      ]);
      setPenalizaciones(datosPenalizaciones);
      setInscriptos(datosInscriptos);
      setTramos(datosTramos.filter((tramo) => Number(tramo.pe) > 0));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las penalizaciones.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(event) {
    const { name, value } = event.target;

    if (name === 'tiempo') {
      const tiempoNormalizado = value.replace(/[^\d:.]/g, '').slice(0, 7);
      setFormulario((actual) => ({
        ...actual,
        tiempo: tiempoNormalizado
      }));
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      [name]: ['nro', 'peocurrido'].includes(name) ? value.replace(/[^\d]/g, '') : value
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setFormularioBase(FORMULARIO_INICIAL);
  }

  function editarPenalizacion(penalizacion) {
    const siguienteFormulario = {
      id_penal: penalizacion.id_penal,
      nro: String(penalizacion.nro),
      peocurrido: String(penalizacion.peocurrido),
      tiempo: penalizacion.tiempo || '',
      motivo: penalizacion.motivo || '',
      control: penalizacion.control || ''
    };
    setFormulario(siguienteFormulario);
    setFormularioBase(siguienteFormulario);
    setMensaje('');
    setError('');
  }

  async function manejarSubmit(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      await guardarPenalizacionAdmin({
        ...formulario,
        nro: Number(formulario.nro),
        peocurrido: Number(formulario.peocurrido)
      });
      await cargarPenalizaciones();
      setMensaje(formulario.id_penal ? 'Penalización actualizada correctamente.' : 'Penalización creada correctamente.');
      limpiarFormulario();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la penalización.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(idPenal) {
    const confirmar = window.confirm(`¿Querés eliminar la penalización #${idPenal}?`);
    if (!confirmar) {
      return;
    }

    setEliminando(String(idPenal));
    setMensaje('');
    setError('');

    try {
      await eliminarPenalizacionAdmin(idPenal);
      await cargarPenalizaciones();
      setMensaje(`Penalización #${idPenal} eliminada correctamente.`);
      if (String(formulario.id_penal) === String(idPenal)) {
        limpiarFormulario();
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la penalización.');
    } finally {
      setEliminando('');
    }
  }

  const penalizacionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return penalizaciones;
    }

    return penalizaciones.filter((penalizacion) => (
      String(penalizacion.id_penal).includes(termino) ||
      String(penalizacion.nro).includes(termino) ||
      String(penalizacion.piloto || '').toLowerCase().includes(termino) ||
      String(penalizacion.motivo || '').toLowerCase().includes(termino) ||
      String(penalizacion.control || '').toLowerCase().includes(termino)
    ));
  }, [busqueda, penalizaciones]);

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Control de Penalizaciones</p>
          <h1>Penalizaciones</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>Total cargadas</span>
            <strong>{penalizaciones.length}</strong>
          </article>
          <article className="estado-card">
            <span>Mostrando</span>
            <strong>{penalizacionesFiltradas.length}</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido panel__contenido--stack">
        <form className="formulario-penalizaciones" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="nro">Nro</label>
            <select id="nro" name="nro" value={formulario.nro} onChange={manejarCambio}>
              <option value="">Seleccionar auto</option>
              {inscriptos.map((inscripto) => (
                <option key={inscripto.nro} value={inscripto.nro}>
                  #{inscripto.nro} - {inscripto.piloto}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="peocurrido">PE ocurrido</label>
            <select id="peocurrido" name="peocurrido" value={formulario.peocurrido} onChange={manejarCambio}>
              <option value="">Seleccionar PE</option>
              {tramos.map((tramo) => (
                <option key={tramo.pe} value={tramo.pe}>
                  PE {tramo.pe} · Etapa {tramo.etapa} · {tramo.desde}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="tiempo">Tiempo</label>
            <input
              id="tiempo"
              name="tiempo"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 0:20.0"
              value={formulario.tiempo}
              onChange={manejarCambio}
            />
            <small>Formato obligatorio: `mm:ss.d`.</small>
          </div>

          <div className="campo campo--ancho">
            <label htmlFor="motivo">Motivo</label>
            <input id="motivo" name="motivo" type="text" value={formulario.motivo} onChange={manejarCambio} />
          </div>

          <div className="campo">
            <label htmlFor="control">Control</label>
            <input id="control" name="control" type="text" placeholder="Ej: CH2" value={formulario.control} onChange={manejarCambio} />
          </div>

          <div className="acciones acciones--dobles">
            <button type="button" className="boton-secundario" onClick={limpiarFormulario}>
              Limpiar
            </button>
            <button type="submit" className="boton-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : (formulario.id_penal ? 'Actualizar penalización' : 'Agregar penalización')}
            </button>
          </div>
        </form>

        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Listado actual</h2>
              <p>Podés buscar por ID, auto, piloto, motivo o control.</p>
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
            <div className="feedback feedback--info">Cargando penalizaciones...</div>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nº</th>
                    <th>Piloto</th>
                    <th>PE</th>
                    <th>Tiempo</th>
                    <th>Motivo</th>
                    <th>Control</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {penalizacionesFiltradas.map((penalizacion) => (
                    <tr key={penalizacion.id_penal}>
                      <td>{penalizacion.id_penal}</td>
                      <td><BadgeNro nro={penalizacion.nro} clase={penalizacion.clase} /></td>
                      <td>{penalizacion.piloto || '-'}</td>
                      <td>{penalizacion.peocurrido}</td>
                      <td>{penalizacion.tiempo}</td>
                      <td>{penalizacion.motivo}</td>
                      <td>{penalizacion.control}</td>
                      <td>
                        <div className="tabla-admin__acciones tabla-admin__acciones--iconos">
                          <button
                            type="button"
                            className="boton-icono boton-icono--editar"
                            onClick={() => editarPenalizacion(penalizacion)}
                            title="Editar penalización"
                            aria-label="Editar penalización"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="boton-icono boton-icono--eliminar"
                            disabled={eliminando === String(penalizacion.id_penal)}
                            onClick={() => manejarEliminar(penalizacion.id_penal)}
                            title="Eliminar penalización"
                            aria-label="Eliminar penalización"
                          >
                            {eliminando === String(penalizacion.id_penal) ? '...' : <Trash2 size={16} />}
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
