import React, { useEffect, useState } from 'react'; import { useNavigate } from 'react-router-dom';
import { obtenerTiemposClasesPorPE, obtenerTramosCarrera } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/tiempos/TiemposPorClase.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function TiemposPorClase({ pe }) {
  const { refreshKey, segundosRestantes } = useGlobalRefresh();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);
  const [categoriasOcultas, setCategoriasOcultas] = useState([]);
  const [pesNavegables, setPesNavegables] = useState([]);
  const claveCategoriasOcultas = 'tiempos_por_clase_categorias_ocultas';

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

      const respuesta = await obtenerTiemposClasesPorPE(pe);
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

  const guardarCategoriasOcultas = (ocultas) => {
    localStorage.setItem(claveCategoriasOcultas, JSON.stringify({
      categorias: ocultas,
      timestamp: Date.now()
    }));
  };

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(claveCategoriasOcultas) || 'null');
      if (!guardado) {
        setCategoriasOcultas([]);
        return;
      }

      const unaHora = 60 * 60 * 1000;
      if (Date.now() - guardado.timestamp > unaHora) {
        localStorage.removeItem(claveCategoriasOcultas);
        setCategoriasOcultas([]);
        return;
      }

      setCategoriasOcultas(guardado.categorias || []);
    } catch {
      setCategoriasOcultas([]);
    }
  }, []);

  const primeraPalabra = (texto) => (texto ? texto.split(' ')[0] : '-');
  const categorias = datos?.categorias || [];
  const esPowerStage = datos?.tramo?.power_stage;
  const numeroPE = datos?.tramo?.pe || pe;
  const peActualInfo = pesNavegables.find((tramo) => tramo.pe === parseInt(pe, 10));
  const nombreTramo = peActualInfo?.nombre || datos?.tramo?.nombre || 'Tramo';
  const distanciaTramo = peActualInfo?.kms || datos?.tramo?.kms || '-';
  const horaTramo = peActualInfo?.hora || datos?.tramo?.hora || '-';
  const categoriasVisibles = categorias.filter((categoria) => !categoriasOcultas.includes(categoria.clase));
  const mostrarBotonesNav = Boolean(peActualInfo) && !peActualInfo.cancelado && !peActualInfo.sinEstado && categorias.length > 0;

  useEffect(() => {
    if (categorias.length === 0) {
      return;
    }

    const clasesDisponibles = categorias.map((categoria) => categoria.clase);
    setCategoriasOcultas((ocultasActuales) => {
      const ocultasValidas = ocultasActuales.filter((clase) => clasesDisponibles.includes(clase));
      if (ocultasValidas.length === ocultasActuales.length) {
        return ocultasActuales;
      }

      guardarCategoriasOcultas(ocultasValidas);
      return ocultasValidas;
    });
  }, [categorias]);

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

    navigate(`/tiempos-por-categoria/pe/${numeroPe}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cambiarCategoriasOcultas = (nuevasOcultas) => {
    setCategoriasOcultas(nuevasOcultas);
    guardarCategoriasOcultas(nuevasOcultas);
  };

  const aplicarFiltroCategorias = (valor) => {
    if (!valor) {
      return;
    }

    const clasesDisponibles = categorias.map((categoria) => categoria.clase);

    if (valor === '__todas__') {
      cambiarCategoriasOcultas([]);
      return;
    }

    if (valor === '__ninguna__') {
      cambiarCategoriasOcultas(clasesDisponibles);
      return;
    }

    if (categoriasOcultas.includes(valor)) {
      cambiarCategoriasOcultas(categoriasOcultas.filter((clase) => clase !== valor));
      return;
    }

    cambiarCategoriasOcultas([...categoriasOcultas, valor]);
  };

  const scrollACategoria = (categoria) => {
    if (categoriasOcultas.includes(categoria.clase)) {
      return;
    }

    const elemento = document.getElementById(`categoria-${categoria.clase}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderizarSelectFiltroCategorias = () => {
    if (categorias.length === 0) {
      return null;
    }

    return (
      <div className="select-filtro-wrapper" title="Filtrar categorías">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M13 5h8" />
          <path d="M13 12h8" />
          <path d="M13 19h8" />
          <path d="m3 17 2 2 4-4" />
          <rect x="3" y="4" width="6" height="6" rx="1" />
        </svg>
        <select
          aria-label="Filtrar categorías"
          defaultValue=""
          onChange={(evento) => {
            aplicarFiltroCategorias(evento.target.value);
            evento.target.value = '';
          }}
        >
          <option value="" disabled hidden>Filtrar categorías</option>
          <option value="__todas__">Mostrar todas</option>
          <option value="__ninguna__">Ocultar todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.clase} value={categoria.clase}>
              {categoriasOcultas.includes(categoria.clase) ? '☐' : '☑'} {categoria.nombre_mostrar || categoria.clase}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const peAnterior = mostrarBotonesNav ? obtenerPeAnterior() : null;
  const peSiguiente = mostrarBotonesNav ? obtenerPeSiguiente() : null;

  if (cargandoInicial) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" style={{ color: '#18283c' }}></div>
        <p className="mt-3">Cargando tiempos...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
  }

  return (
    <div className="contenedor-tiempos">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="titulo-pe text-center mb-2">
          <span className={`titulo-tramo-pe ${esPowerStage ? 'titulo-tramo-pe--power-stage' : ''}`}>
            PE{numeroPE}
          </span>
          <span className="titulo-tramo-texto"> | {nombreTramo}</span>
        </h2>
        <div className="subtitulo-tramo-datos mb-3">
          <span>Distancia: {distanciaTramo} km</span>
          <span className="subtitulo-tramo-separador">|</span>
          <span>Hora: {horaTramo}</span>
        </div>

        <div className="nav-pe-wrapper">
          <div className="nav-pe-lado nav-pe-lado--izq">
            {mostrarBotonesNav && (
              <button
                className="btn-nav-pe"
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

          <div className="nav-pe-centro">
            {categorias.length > 0 && (
              <div className="contenedor-indice-principal mb-3">
                <div className="botones-campeonato">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.clase}
                      className={`btn-categoria ${categoriasOcultas.includes(categoria.clase) ? 'btn-categoria--oculta' : ''}`}
                      onClick={() => scrollACategoria(categoria)}
                      title={categoriasOcultas.includes(categoria.clase) ? 'Categoría oculta' : `Ir a ${categoria.nombre_mostrar || categoria.clase}`}
                    >
                      {categoria.nombre_mostrar || categoria.clase}
                    </button>
                  ))}
                  {renderizarSelectFiltroCategorias()}
                </div>
              </div>
            )}
          </div>

          <div className="nav-pe-lado nav-pe-lado--der">
            {mostrarBotonesNav && (
              <button
                className="btn-nav-pe"
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
            className="badge badge-contador bg-primary d-flex align-items-center gap-1"
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

      {categorias.length === 0 ? (
        <div className="mb-5">
          <div className="d-flex justify-content-between gap-4">
            <div className="tabla-pe-clases flex-grow-1">
              <h4 className="subtitulo-clase text-center">Clasificación PE. {pe}</h4>
              <table className="table table-bordered tabla-pe mb-0">
                <thead>
                  <tr className="tabla-encabezado">
                    <th>POS</th>
                    <th>Nº</th>
                    <th>PILOTO / NAVEGANTE</th>
                    <th>TIEMPO</th>
                    <th>DIF. 1º</th>
                    <th>PROM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">
                      No hay tiempos registrados para este PE
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tabla-general flex-grow-1">
              <h4 className="text-center subtitulo-clase">Clasificación General</h4>
              <table className="table table-bordered tabla-pe mb-0">
                <thead>
                  <tr className="tabla-encabezado">
                    <th>POS</th>
                    <th>Nº</th>
                    <th>PILOTO / NAVEGANTE</th>
                    <th>MARCA</th>
                    <th>TIEMPO</th>
                    <th>PENAL.</th>
                    <th>T. TOTAL</th>
                    <th>DIF. 1º</th>
                    <th>DIF. ANT</th>
                    <th>PROM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-3">
                      No hay tiempos registrados para este PE
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {categoriasVisibles.map((categoria) => (
            <div key={categoria.clase} className="mb-5" id={`categoria-${categoria.clase}`}>
              <h3 className="text-center encabezado-clase">{categoria.nombre_mostrar}</h3>
              <div className="d-flex justify-content-between gap-4">
                <div className="tabla-pe-clases flex-grow-1">
                  <h4 className="subtitulo-clase text-center">Clasificación PE. {pe}</h4>
                  <table className="table table-bordered tabla-pe mb-0">
                    <thead>
                      <tr className="tabla-encabezado">
                        <th>POS</th>
                        <th>Nº</th>
                        <th>PILOTO / NAVEGANTE</th>
                        <th>TIEMPO</th>
                        <th>DIF. 1º</th>
                        <th>PROM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoria.clasificacion_pe.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-3">
                            No hay tiempos registrados para este PE
                          </td>
                        </tr>
                      ) : (
                        categoria.clasificacion_pe.map((piloto) => (
                          <tr key={piloto.nro} className="tabla-fila-datos">
                            <td className="text-center">
                              <span className={`badge-pos ${piloto.posicion === 1 && esPowerStage ? 'badge-pos-power-stage' : ''}`}>
                                {piloto.posicion}
                              </span>
                            </td>
                            <td className="text-center fw-bold">{piloto.nro}</td>
                            <td className="text-start celda-piloto">
                              <div className="nombre-piloto">{piloto.piloto}</div>
                              <div className="nombre-navegante">{piloto.navegante}</div>
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

                <div className="tabla-general flex-grow-1">
                  <h4 className="text-center subtitulo-clase">Clasificación General</h4>
                  <table className="table table-bordered tabla-pe mb-0">
                    <thead>
                      <tr className="tabla-encabezado">
                        <th>POS</th>
                        <th>Nº</th>
                        <th>PILOTO / NAVEGANTE</th>
                        <th>MARCA</th>
                        <th>TIEMPO</th>
                        <th>PENAL.</th>
                        <th>T. TOTAL</th>
                        <th>DIF. 1º</th>
                        <th>DIF. ANT</th>
                        <th>PROM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoria.clasificacion_general.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center text-muted py-3">
                            No hay pilotos que hayan completado todos los tramos
                          </td>
                        </tr>
                      ) : (
                        categoria.clasificacion_general.map((piloto) => (
                          <tr key={piloto.nro} className="tabla-fila-datos">
                            <td className="text-center">
                              <span className={`badge-pos ${piloto.posicion === 1 && esPowerStage ? 'badge-pos-power-stage' : ''}`}>
                                {piloto.posicion}
                              </span>
                            </td>
                            <td className="text-center fw-bold celda-numero-piloto">
                              <div className="numero-piloto">{piloto.nro}</div>
                              {piloto.cambio_posicion !== 0 && (
                                <div className="indicador-posicion">
                                  {piloto.cambio_posicion > 0 ? (
                                    <span className="text-success">+{piloto.cambio_posicion}</span>
                                  ) : (
                                    <span className="text-danger">{piloto.cambio_posicion}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="text-start celda-piloto">
                              <div className="nombre-piloto">{piloto.piloto}</div>
                              <div className="nombre-navegante">{piloto.navegante}</div>
                            </td>
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
                            <td className="text-center">{piloto.diferencia_primero}</td>
                            <td className="text-center">{piloto.diferencia_anterior}</td>
                            <td className="text-center">{piloto.promedio_general_kmh}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default TiemposPorClase;
