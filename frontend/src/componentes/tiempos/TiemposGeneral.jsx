import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerTiemposGeneralPorPE, obtenerTramosCarrera } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/tiempos/TiemposGeneral.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function TiemposGeneral({ pe }) {
  const { refreshKey, segundosRestantes } = useGlobalRefresh();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);
  const [pesNavegables, setPesNavegables] = useState([]);

  useEffect(() => {
    const cargarTramosNavegables = async () => {
      try {
        const respuesta = await obtenerTramosCarrera();
        const todosLosTramos = (respuesta?.etapas || []).flatMap((bloque) => bloque.tramos || []);
        const tramosValidos = todosLosTramos
          .filter((tramo) => !tramo.shakedown && parseInt(tramo.pe, 10) > 0)
          .map((tramo) => ({
            pe: parseInt(tramo.pe, 10),
            nombre: tramo.nombre,
            kms: tramo.kms,
            hora: tramo.hora,
            cancelado: Boolean(tramo.cancelado),
            sinEstado: !tramo.estado || String(tramo.estado).trim() === '' || String(tramo.estado).trim() === '-'
          }))
          .sort((a, b) => a.pe - b.pe);

        setPesNavegables(tramosValidos);
      } catch (err) {
        console.error('Error al cargar tramos para navegación:', err);
      }
    };

    cargarTramosNavegables();
  }, []);

  useEffect(() => {
    cargarDatos(true);
  }, [pe]);

  useEffect(() => {
    if (refreshKey === 0) {
      return;
    }

      cargarDatos(false);
  }, [refreshKey, pe]);

  const cargarDatos = async (esInicial = false) => {
    try {
      const scrollPosition = window.scrollY;

      if (esInicial) {
        setCargandoInicial(true);
      }
      setError(null);

      const respuesta = await obtenerTiemposGeneralPorPE(pe);
      setDatos(respuesta);

      if (esInicial) {
        setCargandoInicial(false);
      }

      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los tiempos');
      if (esInicial) {
        setCargandoInicial(false);
      }
    }
  };

  const primeraPalabra = (texto) => (texto ? texto.split(' ')[0] : '-');
  const clasificacionPE = datos?.clasificacion_pe || [];
  const clasificacionGeneral = datos?.clasificacion_general || [];
  const esPowerStage = datos?.tramo?.power_stage;
  const numeroPE = datos?.tramo?.pe || pe;
  const peActualInfo = pesNavegables.find((tramo) => tramo.pe === parseInt(pe, 10));
  const nombreTramo = peActualInfo?.nombre || datos?.tramo?.nombre || 'Tramo';
  const distanciaTramo = peActualInfo?.kms || datos?.tramo?.kms || '-';
  const horaTramo = peActualInfo?.hora || datos?.tramo?.hora || '-';
  const peActualInfoDisponible = Boolean(peActualInfo) && !peActualInfo.cancelado && !peActualInfo.sinEstado;
  const mostrarBotonesNav = peActualInfoDisponible && (clasificacionPE.length > 0 || clasificacionGeneral.length > 0);

  const obtenerPeAnterior = () => {
    const peActual = parseInt(pe, 10);
    const candidatos = pesNavegables
      .filter((tramo) => tramo.pe < peActual && !tramo.cancelado && !tramo.sinEstado)
      .sort((a, b) => b.pe - a.pe);

    return candidatos.length > 0 ? candidatos[0].pe : null;
  };

  const obtenerPeSiguiente = () => {
    const peActual = parseInt(pe, 10);
    const candidatos = pesNavegables
      .filter((tramo) => tramo.pe > peActual && !tramo.cancelado && !tramo.sinEstado)
      .sort((a, b) => a.pe - b.pe);

    return candidatos.length > 0 ? candidatos[0].pe : null;
  };

  const navegarAPe = (numeroPe) => {
    if (!numeroPe) {
      return;
    }

    navigate(`/tiempos-general/pe/${numeroPe}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const peAnterior = mostrarBotonesNav ? obtenerPeAnterior() : null;
  const peSiguiente = mostrarBotonesNav ? obtenerPeSiguiente() : null;

  if (cargandoInicial) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando tiempos generales...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
  }

  return (
    <div className="contenedor-tiempos-general">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <div className="encabezado-tramo-general">
          <div className="nav-pe-general-lado nav-pe-general-lado--izq">
            {mostrarBotonesNav && (
              <button
                className="btn-nav-pe-general"
                onClick={() => navegarAPe(peAnterior)}
                disabled={peAnterior === null}
                title={peAnterior !== null ? `Ir a PE ${peAnterior}` : 'No hay PE anterior disponible'}
                aria-label="PE anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          <div className="encabezado-tramo-general-centro">
            <h2 className="titulo-pe-general text-center mb-2">
              <span className={`titulo-tramo-pe-general ${esPowerStage ? 'titulo-tramo-pe-general--power-stage' : ''}`}>
                PE{numeroPE}
              </span>
              <span className="titulo-tramo-texto-general"> | {nombreTramo}</span>
            </h2>
            <div className="subtitulo-tramo-datos-general">
              <span>Distancia: {distanciaTramo} km</span>
              <span className="subtitulo-tramo-separador-general">|</span>
              <span>Hora: {horaTramo}</span>
            </div>
          </div>

          <div className="nav-pe-general-lado nav-pe-general-lado--der">
            {mostrarBotonesNav && (
              <button
                className="btn-nav-pe-general"
                onClick={() => navegarAPe(peSiguiente)}
                disabled={peSiguiente === null}
                title={peSiguiente !== null ? `Ir a PE ${peSiguiente}` : 'No hay PE siguiente disponible'}
                aria-label="PE siguiente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 d-flex align-items-center gap-2">
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
            Próxima actualización en:
          </span>
          <span
            className="badge badge-contador-general bg-primary d-flex align-items-center gap-1"
            style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
            {segundosRestantes}s
          </span>
        </div>
      </div>

      <div className="d-flex justify-content-between gap-4 pb-5">
        <div className="tabla-pe-general flex-grow-1">
          <h4 className="subtitulo-general text-center">Clasificación PE. {pe}</h4>
          <table className="table table-bordered table-striped tabla-general-pe mb-0">
            <thead>
              <tr className="tabla-encabezado-general text-center">
                <th>POS</th>
                <th>Nº</th>
                <th>PILOTO / NAVEGANTE</th>
                <th>TIEMPO</th>
                <th>DIF. 1º</th>
                <th>PROM</th>
              </tr>
            </thead>
            <tbody>
              {clasificacionPE.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">
                    No hay tiempos registrados para este PE
                  </td>
                </tr>
              ) : (
                clasificacionPE.map((piloto) => (
                  <tr key={piloto.nro} className="tabla-fila-datos-general">
                    <td className="text-center">
                      <span className="badge-pos-general">{piloto.posicion}</span>
                    </td>
                    <td className="text-center celda-numero-pe">
                      <div className="numero-piloto-pe">{piloto.nro}</div>
                      <div className="categoria-piloto-pe">{piloto.clase}</div>
                    </td>
                    <td className="text-start celda-piloto-general">
                      <div className="nombre-piloto-general">{piloto.piloto}</div>
                      <div className="nombre-navegante-general">{piloto.navegante}</div>
                    </td>
                    <td className="text-center fw-bold">{piloto.tiempo_pe}</td>
                    <td className="text-center">{piloto.diferencia_primero}</td>
                    <td className="text-center">{piloto.promedio_kmh}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="tabla-general-acumulada flex-grow-1">
          <h4 className="text-center subtitulo-general">Clasificación General</h4>
          <table className="table table-bordered table-striped tabla-general-pe mb-0">
            <thead>
              <tr className="tabla-encabezado-general text-center">
                <th>POS</th>
                <th>Nº</th>
                <th>PILOTO / NAVEGANTE</th>
                <th>CLASE</th>
                <th>MARCA</th>
                <th>TIEMPO.</th>
                <th>PENAL.</th>
                <th>T.TOTAL</th>
                <th style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                  <div className="fw-bold">DIF. 1º</div>
                  <div className="fw-semibold">DIF. ANT</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {clasificacionGeneral.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-3">
                    No hay tiempos registrados para este PE
                  </td>
                </tr>
              ) : (
                clasificacionGeneral.map((piloto) => (
                  <tr key={piloto.nro} className="tabla-fila-datos-general">
                    <td className="text-center">
                      <span className="badge-pos-general">{piloto.posicion}</span>
                    </td>
                    <td className="text-center fw-bold celda-numero-piloto-general">
                      <div className="numero-piloto-general">{piloto.nro}</div>
                      {piloto.cambio_posicion !== 0 && (
                        <div className="indicador-posicion-general">
                          {piloto.cambio_posicion > 0 ? (
                            <span className="text-success">+{piloto.cambio_posicion}</span>
                          ) : (
                            <span className="text-danger">{piloto.cambio_posicion}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-start celda-piloto-general">
                      <div className="nombre-piloto-general">{piloto.piloto}</div>
                      <div className="nombre-navegante-general">{piloto.navegante}</div>
                    </td>
                    <td className="text-center fw-medium">{piloto.clase}</td>
                    <td className="text-center">
                      <img
                        src={piloto.logo_marca}
                        alt={primeraPalabra(piloto.vehiculo)}
                        style={{ height: '24px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.replaceWith(document.createTextNode(primeraPalabra(piloto.vehiculo)));
                        }}
                      />
                    </td>
                    <td className="text-center fw-bold">{piloto.tiempo_neto}</td>
                    <td className="text-center">
                      {piloto.penalizacion !== '-' ? (
                        <span className="text-danger fw-bold">{piloto.penalizacion}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-center fw-bold">{piloto.tiempo_total}</td>
                    <td className="text-center" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                      <div className="fw-semibold">{piloto.diferencia_primero}</div>
                      <div className="text-muted">{piloto.diferencia_anterior}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TiemposGeneral;
