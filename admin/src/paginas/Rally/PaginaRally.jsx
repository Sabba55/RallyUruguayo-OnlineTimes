import { useEffect, useState } from 'react';
import {
  descargarPdfAdmin,
  eliminarChapaRallyAdmin,
  guardarChapaRallyAdmin,
  guardarRallyAdmin,
  obtenerChapaRallyAdmin,
  obtenerEstadoAdmin,
  obtenerRallyAdmin,
  obtenerTiposPdfAdmin
} from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';

const API_BACKEND = 'http://localhost:5000';
const STORAGE_PDF_METADATOS = 'admin-rally-pdf-metadatos';

const ESTADO_INICIAL = {
  id_rally: 1,
  nombre: '',
  subtitulo: ''
};

const ESTADO_PDF_INICIAL = {
  numeroFecha: '',
  diaInicio: '',
  diaFin: ''
};

const GRUPOS_PDF = [
  {
    titulo: 'Inscriptos / Ordenes de largada',
    items: ['inscriptos', 'orden_largada_etapa_1', 'orden_largada_etapa_2']
  },
  {
    titulo: 'Clasificaciones finales',
    items: ['clasif_final_general', 'clasif_final_categoria']
  },
  {
    titulo: 'Clasificaciones Dia 1 / Dia 2',
    items: [
      'clasif_etapa_1_categoria',
      'clasif_etapa_2_categoria',
      'clasif_etapa_1_general',
      'clasif_etapa_2_general'
    ]
  }
];

function leerArchivoComoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    lector.readAsDataURL(archivo);
  });
}

function descargarBlobEnNavegador(blob, nombreArchivo) {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}

function cargarMetadatosGuardados() {
  try {
    const guardado = window.localStorage.getItem(STORAGE_PDF_METADATOS);
    if (!guardado) {
      return ESTADO_PDF_INICIAL;
    }

    const parseado = JSON.parse(guardado);
    return {
      numeroFecha: parseado.numeroFecha || '',
      diaInicio: parseado.diaInicio || '',
      diaFin: parseado.diaFin || ''
    };
  } catch {
    return ESTADO_PDF_INICIAL;
  }
}

export function PaginaRally() {
  const [formulario, setFormulario] = useState(ESTADO_INICIAL);
  const [formularioBase, setFormularioBase] = useState(ESTADO_INICIAL);
  const [metadatosPdf, setMetadatosPdf] = useState(cargarMetadatosGuardados);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [estadoSistema, setEstadoSistema] = useState(null);
  const [estadoChapa, setEstadoChapa] = useState(null);
  const [subiendoChapa, setSubiendoChapa] = useState(false);
  const [eliminandoChapa, setEliminandoChapa] = useState(false);
  const [tiposPdf, setTiposPdf] = useState([]);
  const [generandoPdfId, setGenerandoPdfId] = useState('');

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  const hayCambiosPendientes =
    JSON.stringify(formulario) !== JSON.stringify(formularioBase);

  useUnsavedChangesWarning(hayCambiosPendientes);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_PDF_METADATOS, JSON.stringify(metadatosPdf));
  }, [metadatosPdf]);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError('');

      try {
        const [rally, estado, chapa, tipos] = await Promise.all([
          obtenerRallyAdmin(),
          obtenerEstadoAdmin(),
          obtenerChapaRallyAdmin(),
          obtenerTiposPdfAdmin()
        ]);

        if (rally) {
          const siguienteFormulario = {
            id_rally: Number(rally.id_rally) || 1,
            nombre: rally.nombre || '',
            subtitulo: rally.subtitulo || ''
          };
          setFormulario(siguienteFormulario);
          setFormularioBase(siguienteFormulario);
        }

        setEstadoSistema(estado);
        setEstadoChapa(chapa);
        setTiposPdf(tipos || []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la informacion de Rally.');
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  function manejarCambio(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: name === 'id_rally' ? Number(value) : value
    }));
  }

  function manejarCambioMetadatosPdf(event) {
    const { name, value } = event.target;
    setMetadatosPdf((actual) => ({
      ...actual,
      [name]: value
    }));
  }

  async function manejarSubmit(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const respuesta = await guardarRallyAdmin(formulario);
      const siguienteFormulario = {
        id_rally: Number(respuesta.id_rally) || 1,
        nombre: respuesta.nombre || '',
        subtitulo: respuesta.subtitulo || ''
      };
      setFormulario(siguienteFormulario);
      setFormularioBase(siguienteFormulario);
      setMensaje('Los datos del rally se guardaron correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el rally.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarSeleccionChapa(event) {
    const archivo = event.target.files?.[0];
    event.target.value = '';

    if (!archivo) {
      return;
    }

    if (archivo.type !== 'image/png') {
      setMensaje('');
      setError('La chapa del rally debe cargarse en formato PNG.');
      return;
    }

    setSubiendoChapa(true);
    setMensaje('');
    setError('');

    try {
      const imagenBase64 = await leerArchivoComoBase64(archivo);
      const estadoActualizado = await guardarChapaRallyAdmin(imagenBase64);
      setEstadoChapa(estadoActualizado);
      setMensaje('La chapa del rally se guardo correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la chapa del rally.');
    } finally {
      setSubiendoChapa(false);
    }
  }

  async function manejarEliminarChapa() {
    const confirmar = window.confirm('Se eliminara la chapa del rally usada en los PDFs. Deseas continuar?');
    if (!confirmar) {
      return;
    }

    setEliminandoChapa(true);
    setMensaje('');
    setError('');

    try {
      const estadoActualizado = await eliminarChapaRallyAdmin();
      setEstadoChapa(estadoActualizado);
      setMensaje('La chapa del rally se elimino correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la chapa del rally.');
    } finally {
      setEliminandoChapa(false);
    }
  }

  async function manejarGenerarPdf(tipoPdf) {
    setGenerandoPdfId(tipoPdf);
    setMensaje('');
    setError('');

    try {
      const { blob, nombreArchivo } = await descargarPdfAdmin(tipoPdf, metadatosPdf);
      descargarBlobEnNavegador(blob, nombreArchivo);
      setMensaje(`El PDF "${nombreArchivo}" se genero correctamente.`);
    } catch (err) {
      setError(err.message || 'No se pudo generar el PDF.');
    } finally {
      setGenerandoPdfId('');
    }
  }

  const urlPreviewChapa = estadoChapa?.existe && estadoChapa?.url
    ? `${API_BACKEND}${estadoChapa.url}?v=${encodeURIComponent(estadoChapa.actualizada_en || Date.now())}`
    : null;
  const tiposPdfPorId = new Map(tiposPdf.map((tipo) => [tipo.id, tipo]));

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Configuracion general</p>
          <h1>Rally</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>PostgreSQL</span>
            <strong>
              {estadoSistema?.postgres_conectado ? 'Conectado' : 'Pendiente'}
            </strong>
          </article>
          <article className="estado-card">
            <span>Modulo</span>
            <strong>Admin</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido">
        {cargando ? (
          <div className="feedback feedback--info">Cargando datos del rally...</div>
        ) : (
          <>
            <form className="formulario-rally" onSubmit={manejarSubmit}>
              <div className="campo campo--ancho">
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ej: Rally Sudamericano"
                  value={formulario.nombre}
                  onChange={manejarCambio}
                />
              </div>

              <div className="campo campo--ancho">
                <label htmlFor="subtitulo">Subtitulo</label>
                <input
                  id="subtitulo"
                  name="subtitulo"
                  type="text"
                  placeholder="Ej: Mina Clavero - Cordoba - Argentina"
                  value={formulario.subtitulo}
                  onChange={manejarCambio}
                />
              </div>
              <input
                type="hidden"
                name="id_rally"
                value={formulario.id_rally}
                readOnly
              />

              {(mensaje || error) && (
                <div className={`feedback ${error ? 'feedback--error' : 'feedback--ok'}`}>
                  {error || mensaje}
                </div>
              )}

              <div className="acciones">
                <button type="submit" className="boton-principal" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>

            <section className="bloque-secundario">
              <div className="bloque-secundario__encabezado">
                <div>
                  <h2>Chapa del rally para PDFs</h2>
                  <p>Solo se usa en los encabezados de los PDFs y se guarda como <code>chapa_rally.png</code>.</p>
                </div>
              </div>

              <div className="chapa-rally-admin">
                <div className="chapa-rally-admin__preview">
                  {urlPreviewChapa ? (
                    <img
                      src={urlPreviewChapa}
                      alt="Chapa actual del rally"
                      className="chapa-rally-admin__imagen"
                    />
                  ) : (
                    <div className="chapa-rally-admin__placeholder">
                      No hay una chapa cargada actualmente.
                    </div>
                  )}
                </div>

                <div className="chapa-rally-admin__detalles">
                  <p>
                    <strong>Estado:</strong>{' '}
                    {estadoChapa?.existe ? 'Cargada' : 'Sin imagen'}
                  </p>
                  <p>
                    <strong>Archivo:</strong>{' '}
                    {estadoChapa?.nombre || 'chapa_rally.png'}
                  </p>
                  <p>
                    <strong>Ultima actualizacion:</strong>{' '}
                    {estadoChapa?.actualizada_en
                      ? new Date(estadoChapa.actualizada_en).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                      : 'Sin cargar'}
                  </p>

                  <div className="acciones acciones--envolver">
                    <label className="boton-principal boton-principal--label" htmlFor="chapa-rally-input">
                      {subiendoChapa ? 'Cargando...' : estadoChapa?.existe ? 'Reemplazar chapa' : 'Cargar chapa'}
                    </label>
                    <input
                      id="chapa-rally-input"
                      type="file"
                      accept=".png,image/png"
                      className="input-file-oculto"
                      onChange={manejarSeleccionChapa}
                      disabled={subiendoChapa}
                    />

                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={manejarEliminarChapa}
                      disabled={!estadoChapa?.existe || eliminandoChapa}
                    >
                      {eliminandoChapa ? 'Borrando...' : 'Borrar chapa'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bloque-secundario">
              <div className="bloque-secundario__encabezado">
                <div>
                  <h2>Generar PDFs</h2>
                </div>
              </div>

              <div className="pdf-admin">
                <div className="pdf-admin__metadatos">
                  <div className="campo">
                    <label htmlFor="numeroFecha">Numero de fecha</label>
                    <input
                      id="numeroFecha"
                      name="numeroFecha"
                      type="number"
                      min="1"
                      placeholder="Ej: 4"
                      value={metadatosPdf.numeroFecha}
                      onChange={manejarCambioMetadatosPdf}
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="diaInicio">Dia de inicio</label>
                    <input
                      id="diaInicio"
                      name="diaInicio"
                      type="text"
                      placeholder="Ej: 27 Febrero"
                      value={metadatosPdf.diaInicio}
                      onChange={manejarCambioMetadatosPdf}
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="diaFin">Dia de cierre</label>
                    <input
                      id="diaFin"
                      name="diaFin"
                      type="text"
                      placeholder="Ej: 1 Marzo"
                      value={metadatosPdf.diaFin}
                      onChange={manejarCambioMetadatosPdf}
                    />
                  </div>
                </div>

                <div className="pdf-admin__grupos">
                  {GRUPOS_PDF.map((grupo) => (
                    <section key={grupo.titulo} className="pdf-admin__grupo">
                      <h3>{grupo.titulo}</h3>
                      <div className="pdf-admin__botonera">
                        {grupo.items
                          .map((id) => tiposPdfPorId.get(id))
                          .filter(Boolean)
                          .map((tipo) => (
                            <button
                              key={tipo.id}
                              type="button"
                              className={`boton-secundario pdf-admin__boton ${generandoPdfId === tipo.id ? 'pdf-admin__boton--generando' : ''}`}
                              onClick={() => manejarGenerarPdf(tipo.id)}
                              disabled={Boolean(generandoPdfId)}
                            >
                              {generandoPdfId === tipo.id ? `Generando ${tipo.nombre}...` : tipo.nombre}
                            </button>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}
