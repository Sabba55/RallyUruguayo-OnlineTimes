import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerTramosCarrera } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import SpinnerCarga from '../comunes/SpinnerCarga';
import ErrorDisplay from '../errores/ErrorDisplay';

function formatearHoraTramo(hora) {
  const texto = String(hora || '').trim();

  if (/^0\d:\d{2}$/.test(texto) && texto !== '00:00') {
    return texto.substring(1);
  }

  return texto || '-';
}

function formatearEstadoTramo(estado) {
  const texto = String(estado || '').trim();
  return texto.toLowerCase() === 'programado' ? 'demorado' : (texto || '-');
}

function TablaTramos({ onVerTiemposPorClase = () => {}, onVerTiemposGeneral = () => {}, onVerTiemposEtapa2 = () => {} }) {
  const navigate = useNavigate();
  const { refreshKey } = useGlobalRefresh();
  const [datos, setDatos] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);
  const [firmaDatos, setFirmaDatos] = useState('');
  const [ultimaActualizacionVisible, setUltimaActualizacionVisible] = useState(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    cargarDatos(true);
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (refreshKey === 0) {
      return;
    }

    cargarDatos(false);
  }, [refreshKey]);

  const cargarDatos = async (esInicial = false) => {
    try {
      if (esInicial) {
        setCargandoInicial(true);
      }
      setError(null);

      const respuesta = await obtenerTramosCarrera();
      const nuevaFirma = JSON.stringify(respuesta?.etapas || []);

      setDatos(respuesta);
      setFirmaDatos((firmaAnterior) => {
        if (firmaAnterior !== nuevaFirma) {
          setUltimaActualizacionVisible(new Date());
        }
        return nuevaFirma;
      });

      if (esInicial) {
        setCargandoInicial(false);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      if (esInicial) {
        setCargandoInicial(false);
      }
      console.error(err);
    }
  };

  const navegarAClasificacionFinalGeneral = () => {
    navigate('/clasificacion-final/general');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navegarAClasificacionFinalClases = () => {
    navigate('/clasificacion-final/clases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navegarAClasificacionFinalEtapa2 = () => {
    navigate('/clasificacion-final/etapa2');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navegarAShakedownGeneral = () => {
    navigate('/shakedown/general');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navegarAShakedownClases = () => {
    navigate('/shakedown/clases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatearFecha = () => {
    if (!ultimaActualizacionVisible) {
      return 'Cargando...';
    }

    return ultimaActualizacionVisible.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const obtenerMinutosDesdeActualizacion = () => {
    if (!ultimaActualizacionVisible) {
      return null;
    }

    return Math.floor((ahora - ultimaActualizacionVisible.getTime()) / 60000);
  };

  if (cargandoInicial) {
    return <SpinnerCarga mensaje="Cargando tramos..." />;
  }

  if (error) {
    return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
  }

  const etapas = datos?.etapas || [];

  return (
    <div className="contenedor-tabla-tramos">
      <div className="table-responsive">
        <table className="table table-bordered mb-0">
          <thead>
            <tr className="tabla-encabezado">
              <th className="text-center align-middle col-pe">PE</th>
              <th className="text-center align-middle col-desde-hasta">DESDE - HASTA</th>
              <th className="text-center align-middle col-kms">KMS</th>
              <th className="text-center align-middle col-hora">HORA</th>
              <th className="text-center align-middle col-general">GENERAL</th>
              <th className="text-center align-middle col-clases">CLASES</th>
              <th className="text-center align-middle col-etapa">ETAPA</th>
              <th className="text-center align-middle col-estado">ESTADO</th>
              <th className="text-center align-middle col-ganador">GANADOR</th>
            </tr>
          </thead>

          <tbody>
            {etapas.map((bloque) => (
              <React.Fragment key={`etapa-${bloque.etapa}`}>
                {bloque.tramos.map((tramo) => (
                  <tr key={tramo.pe} className={`tabla-fila-datos ${tramo.power_stage ? 'fila-power-stage' : ''}`}>
                    <td className="text-center align-middle col-pe">
                      {tramo.power_stage ? (
                        <div className="pe-power-stage-contenedor">
                          <span className="badge-pe-power-stage">{tramo.pe}</span>
                        </div>
                      ) : tramo.shakedown ? (
                        <span className="badge-pe-shakedown">{tramo.pe}</span>
                      ) : (
                        <span className="badge-pe">{tramo.pe}</span>
                      )}
                    </td>

                    <td className="text-center align-middle fw-medium col-desde-hasta">
                      {tramo.power_stage ? (
                        <div className="desde-hasta-power-stage">
                          <span className="nombre-tramo-power-stage">{tramo.nombre}</span>
                          <span className="etiqueta-power-stage">Power Stage</span>
                        </div>
                      ) : (
                        <span className="desde-hasta">{tramo.nombre}</span>
                      )}
                    </td>

                    <td className="text-center align-middle col-kms">{tramo.kms}</td>
                    <td className="text-center align-middle fw-medium col-hora">{formatearHoraTramo(tramo.hora)}</td>

                    <td className="text-center align-middle col-general">
                      {tramo.shakedown ? (
                        <button
                          className="btn btn-sm btn-shakedown"
                          onClick={navegarAShakedownGeneral}
                          disabled={tramo.cancelado}
                          style={tramo.cancelado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          General
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-resultado"
                          onClick={() => onVerTiemposGeneral(tramo.pe, tramo.etapa, tramo.nombre, tramo.kms, tramo.hora)}
                          disabled={tramo.cancelado}
                          style={tramo.cancelado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          GENERAL
                        </button>
                      )}
                    </td>

                    <td className="text-center align-middle col-clases">
                      {tramo.shakedown ? (
                        <button
                          className="btn btn-sm btn-shakedown"
                          onClick={navegarAShakedownClases}
                          disabled={tramo.cancelado}
                          style={tramo.cancelado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          Por Clases
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-resultado"
                          onClick={() => onVerTiemposPorClase(tramo.pe, tramo.etapa, tramo.nombre, tramo.kms, tramo.hora)}
                          disabled={tramo.cancelado}
                          style={tramo.cancelado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          POR CLASES
                        </button>
                      )}
                    </td>

                    <td className="text-center align-middle col-etapa">
                      {!tramo.shakedown && parseInt(tramo.etapa, 10) >= 2 && (
                        <button
                          className="btn btn-sm btn-resultado"
                          onClick={() => onVerTiemposEtapa2(tramo.pe, tramo.etapa, tramo.nombre, tramo.kms, tramo.hora)}
                          disabled={tramo.cancelado}
                          style={tramo.cancelado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          ETAPA {tramo.etapa}
                        </button>
                      )}
                    </td>

                    <td className="text-center align-middle col-estado">
                      <span
                        className="fw-bold"
                        style={{
                          color: tramo.color_estado,
                          textTransform: 'capitalize',
                          fontSize: '0.9rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {formatearEstadoTramo(tramo.estado)}
                      </span>
                    </td>

                    <td className={`text-center align-middle fw-semibold col-ganador ${
                      tramo.cancelado ? 'celda-cancelada' :
                        tramo.estado === 'en carrera' ? 'celda-en-carrera' :
                          tramo.ganador ? 'celda-con-ganador' : ''
                    }`}
                    >
                      {tramo.cancelado ? (
                        <span className="text-muted">-</span>
                      ) : tramo.estado === 'en carrera' ? (
                        <div className="en-carrera-contenedor">
                          <div className="puntos-animados">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      ) : tramo.ganador ? (
                        <div className="ganador-contenedor">
                          <span className="ganador-nombre">{tramo.ganador.piloto}</span>
                          <div className="ganador-detalles">
                            <span className="ganador-categoria">{tramo.ganador.categoria}</span>
                            <span className="ganador-separador"></span>
                            <span className="ganador-tiempo">{tramo.ganador.tiempo}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan="10" className="p-0">
                    <div className="tabla-separador-etapa">
                      <h2 className="mb-0">ETAPA {bloque.etapa}</h2>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}

            <tr className="tabla-fila-clasificacion">
              <td colSpan="4" className="text-start align-middle">
                <span className="clasificacion-label">CLASIFICACIÓN FINAL</span>
              </td>
              <td className="text-center align-middle col-general">
                <button className="btn btn-sm btn-clasificacion-final" onClick={navegarAClasificacionFinalGeneral}>
                  GENERAL
                </button>
              </td>
              <td className="text-center align-middle col-clases">
                <button className="btn btn-sm btn-clasificacion-final" onClick={navegarAClasificacionFinalClases}>
                  GRAL. CLASES
                </button>
              </td>
              <td className="text-center align-middle col-clases">
                <button className="btn btn-sm btn-clasificacion-final" onClick={navegarAClasificacionFinalEtapa2}>
                  ETAPA 2
                </button>
              </td>
              <td colSpan="4" className="text-center align-middle"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-center py-3 border-top bg-white">
        <small className="text-muted">
          Última actualización: {formatearFecha()}
        </small>
      </div>
    </div>
  );
}

export default TablaTramos;
