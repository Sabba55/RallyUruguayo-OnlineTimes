import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerTiemposEtapa2PorPE, obtenerTramosCarrera } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/tiempos/TiemposEtapa2.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function TiemposEtapa2({ pe }) {
  const navigate = useNavigate();
  const { refreshKey, segundosRestantes } = useGlobalRefresh();
  const [datos, setDatos] = useState(null);
  const [pesNavegables, setPesNavegables] = useState([]);
  const [categoriasOcultas, setCategoriasOcultas] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);
  const claveCategoriasOcultas = 'tiempos_etapa2_categorias_ocultas';

  useEffect(() => {
    const cargarTramosNavegables = async () => {
      try {
        const respuesta = await obtenerTramosCarrera();
        const todosLosTramos = (respuesta?.etapas || []).flatMap((bloque) => bloque.tramos || []);
        const tramosEtapa2 = todosLosTramos
          .filter((tramo) => !tramo.shakedown && String(tramo.etapa) === '2' && parseInt(tramo.pe, 10) > 0)
          .map((tramo) => ({
            pe: parseInt(tramo.pe, 10),
            nombre: tramo.nombre,
            kms: tramo.kms,
            hora: tramo.hora,
            cancelado: Boolean(tramo.cancelado),
            sinEstado:
              !tramo.estado ||
              String(tramo.estado).trim() === '' ||
              String(tramo.estado).trim() === '-',
          }))
          .sort((a, b) => a.pe - b.pe);

        setPesNavegables(tramosEtapa2);
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

      const respuesta = await obtenerTiemposEtapa2PorPE(pe);
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
  const mostrarBotonesNav =
    Boolean(peActualInfo) && !peActualInfo.cancelado && !peActualInfo.sinEstado && categorias.length > 0;

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
    const anterior = pesNavegables
      .filter((tramo) => tramo.pe < peActual && !tramo.cancelado && !tramo.sinEstado)
      .sort((a, b) => b.pe - a.pe)[0];

    return anterior?.pe || null;
  };

  const obtenerPeSiguiente = () => {
    const peActual = parseInt(pe, 10);
    const siguiente = pesNavegables
      .filter((tramo) => tramo.pe > peActual && !tramo.cancelado && !tramo.sinEstado)
      .sort((a, b) => a.pe - b.pe)[0];

    return siguiente?.pe || null;
  };

  const navegarAPe = (numeroPe) => {
    if (!numeroPe) {
      return;
    }

    navigate(`/tiempos-etapa2/pe/${numeroPe}`);
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

    const elemento = document.getElementById(`categoria-etapa2-${categoria.clase}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderizarSelectFiltroCategorias = () => {
    if (categorias.length === 0) {
      return null;
    }

    return (
      <div className="select-filtro-wrapper-etapa2" title="Filtrar categorías">
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
        <p className="mt-3">Cargando tiempos de Etapa 2...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
  }

  return (
    <div className="contenedor-tiempos-etapa2">
      <div className="encabezado-tramo-etapa2 mb-4">
        {/* Div 1: navegación anterior */}
        <div className="nav-pe-etapa2-lado nav-pe-etapa2-lado--izq">
          {mostrarBotonesNav && (
            <button
              type="button"
              className="btn-nav-pe-etapa2"
              onClick={() => navegarAPe(peAnterior)}
              disabled={peAnterior === null}
              aria-label="Ver PE anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Div 2: contenido central (título/datos, categorías, contador) */}
        <div className="encabezado-tramo-etapa2-centro d-flex flex-column align-items-center">

          {/* Sub-div: nombre del tramo + datos */}
          <div className="datos-tramo-etapa2 pb-3">
            <h2 className="titulo-etapa2 text-center mb-2">
              <span className={`titulo-tramo-pe-etapa2 ${esPowerStage ? 'titulo-tramo-pe-etapa2--power-stage' : ''}`}>
                PE{numeroPE}
              </span>
              <span className="titulo-tramo-texto-etapa2"> | {nombreTramo}</span>
            </h2>

            <div className="subtitulo-tramo-datos-etapa2">
              <span>Distancia: {distanciaTramo} km</span>
              <span className="subtitulo-tramo-separador-etapa2">|</span>
              <span>Hora: {horaTramo}</span>
            </div>
          </div>

          {/* Sub-div: botones de categorías */}
          {categorias.length > 0 && (
            <div className="contenedor-indice-principal mb-3">
              <div className="botones-campeonato">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.clase}
                    className={`btn-categoria-etapa2 ${categoriasOcultas.includes(categoria.clase) ? 'btn-categoria-etapa2--oculta' : ''}`}
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

          {/* Sub-div: contador */}
          <div className="mt-3 d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              Próxima actualización en:
            </span>
            <span
              className="badge badge-contador-etapa2 bg-primary d-flex align-items-center gap-1"
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

        {/* Div 3: navegación siguiente */}
        <div className="nav-pe-etapa2-lado nav-pe-etapa2-lado--der">
          {mostrarBotonesNav && (
            <button
              type="button"
              className="btn-nav-pe-etapa2"
              onClick={() => navegarAPe(peSiguiente)}
              disabled={peSiguiente === null}
              aria-label="Ver PE siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {categorias.length === 0 ? (
        <div className="mb-5">
          <div className="tabla-general-etapa2-unica">
            <h4 className="text-center subtitulo-etapa2">PE.{pe} - Clasificación General Etapa 2</h4>
            <table className="table table-bordered table-striped tabla-etapa2-pe mb-0">
              <thead>
                <tr className="tabla-encabezado-etapa2">
                  <th>POS</th>
                  <th>Nº</th>
                  <th>NAC</th>
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
                  <td colSpan="11" className="text-center text-muted py-3">
                    No hay tiempos registrados para este PE
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {categoriasVisibles.map((categoria) => (
            <div key={categoria.clase} className="mb-5" id={`categoria-etapa2-${categoria.clase}`}>
              <h3 className="text-center encabezado-clase-etapa2">{categoria.nombre_mostrar}</h3>
              <div className="tabla-general-etapa2-unica">
                <h4 className="text-center subtitulo-etapa2">PE.{pe} - Clasificación General Etapa 2</h4>
                <table className="table table-bordered table-striped tabla-etapa2-pe mb-0">
                  <thead>
                    <tr className="tabla-encabezado-etapa2">
                      <th>POS</th>
                      <th>Nº</th>
                      <th>NAC</th>
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
                        <td colSpan="11" className="text-center text-muted py-3">
                          No hay pilotos que hayan completado todos los tramos de Etapa 2
                        </td>
                      </tr>
                    ) : (
                      categoria.clasificacion_general.map((piloto) => (
                        <tr key={piloto.nro} className="tabla-fila-datos-etapa2">
                          <td className="text-center">
                            <span className="badge-pos-etapa2">{piloto.posicion}</span>
                          </td>
                          <td className="text-center fw-bold celda-numero-piloto-etapa2">
                            <div className="numero-piloto-etapa2">{piloto.nro}</div>
                            {piloto.cambio_posicion !== 0 && (
                              <div className="indicador-posicion-etapa2">
                                {piloto.cambio_posicion > 0 ? (
                                  <span className="text-success">+{piloto.cambio_posicion}</span>
                                ) : (
                                  <span className="text-danger">{piloto.cambio_posicion}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-center celda-nacionalidad-etapa2">
                            <div className="contenedor-banderas-apiladas-etapa2">
                              <img
                                src={`/assets/flags/${piloto.nacionalidades.piloto}.png`}
                                alt={piloto.nacionalidades.piloto}
                                className="bandera-nacionalidad-etapa2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.replaceWith(document.createTextNode(piloto.nacionalidades.piloto.toUpperCase()));
                                }}
                              />
                              <img
                                src={`/assets/flags/${piloto.nacionalidades.navegante}.png`}
                                alt={piloto.nacionalidades.navegante}
                                className="bandera-nacionalidad-etapa2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.replaceWith(document.createTextNode(piloto.nacionalidades.navegante.toUpperCase()));
                                }}
                              />
                            </div>
                          </td>
                          <td className="text-center celda-piloto-etapa2">
                            <div className="nombre-piloto-etapa2">{piloto.piloto}</div>
                            <div className="nombre-navegante-etapa2">{piloto.navegante}</div>
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
          ))}
        </>
      )}
    </div>
  );
}

export default TiemposEtapa2;
