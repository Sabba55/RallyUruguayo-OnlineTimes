import React, { useEffect, useState } from 'react';
import { obtenerShakedownProcesado } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/shakedown/ShakedownClases.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function ShakedownClases() {
  const { refreshKey, segundosRestantes } = useGlobalRefresh();
  const [categorias, setCategorias] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos(true);
  }, []);

  useEffect(() => {
    if (refreshKey === 0) {
      return;
    }

      cargarDatos(false);
  }, [refreshKey]);

  const cargarDatos = async (esInicial = false) => {
    try {
      const posicionScroll = window.scrollY;

      if (esInicial) setCargandoInicial(true);
      setError(null);

      const respuesta = await obtenerShakedownProcesado();
      setCategorias(respuesta.categorias || []);

      if (esInicial) setCargandoInicial(false);

      setTimeout(() => {
        window.scrollTo(0, posicionScroll);
      }, 0);
    } catch (err) {
      setError('Error al cargar los datos del Shakedown');
      if (esInicial) setCargandoInicial(false);
      console.error(err);
    }
  };

  const obtenerNombreSimplificado = (clase) => {
    if (clase.includes('-')) {
      return clase.split('-').pop().trim();
    }
    return clase;
  };

  const primeraPalabra = (texto) => (texto ? texto.split(' ')[0] : '-');

  if (cargandoInicial) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando datos del Shakedown...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
  }

  return (
    <div className="contenedor-shakedown-clases">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="titulo-shakedown-clases text-center mb-2">Índices de Categorías</h2>

        {categorias.filter((categoria) => !categoria.clase.includes('-')).length > 0 && (
          <div className="contenedor-indice-principal mb-2">
            <div className="logo-campeonato">
              <img src="/assets/logo-rally-argentino.png" alt="Rally Argentino" className="img-logo-campeonato" />
            </div>
            <div className="linea-divisoria"></div>
            <div className="botones-campeonato">
              {categorias
                .filter((categoria) => !categoria.clase.includes('-'))
                .map((categoria) => (
                  <button
                    key={categoria.clase}
                    className="btn-categoria-shakedown"
                    onClick={() => {
                      const elemento = document.getElementById(`categoria-shakedown-${categoria.clase}`);
                      if (elemento) {
                        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {categoria.clase}
                  </button>
                ))}
            </div>
          </div>
        )}

        {categorias.filter((categoria) => categoria.clase.includes('-')).length > 0 && (
          <div className="contenedor-indice-secundario">
            <div className="logo-campeonato">
              <img src="/assets/icon-rally/rally-mys.png" alt="Rally Mar y Sierras" className="img-logo-campeonato" />
            </div>
            <div className="linea-divisoria"></div>
            <div className="botones-campeonato">
              {categorias
                .filter((categoria) => categoria.clase.includes('-'))
                .map((categoria) => (
                  <button
                    key={categoria.clase}
                    className="btn-categoria-secundario"
                    onClick={() => {
                      const elemento = document.getElementById(`categoria-shakedown-${categoria.clase}`);
                      if (elemento) {
                        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {obtenerNombreSimplificado(categoria.clase)}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="mt-2 d-flex align-items-center gap-2">
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
            Próxima actualización en:
          </span>
          <span className="badge bg-primary d-flex align-items-center gap-1" style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
            {segundosRestantes}s
          </span>
        </div>
      </div>

      {categorias.length === 0 ? (
        <div className="alert alert-info text-center mt-4 mb-4">
          No hay tiempos registrados en el Shakedown
        </div>
      ) : (
        <>
          {categorias.map((categoria) => (
            <div key={categoria.clase} className="mb-5" id={`categoria-shakedown-${categoria.clase}`}>
              <h3 className="text-center encabezado-clase-shakedown">{categoria.nombre_mostrar}</h3>
              <div className="tabla-shakedown-clase-wrapper pb-3">
                <table className="table table-bordered table-striped tabla-shakedown-clase mb-0">
                  <thead>
                    <tr className="tabla-encabezado-shakedown-clase text-center">
                      <th>POS</th>
                      <th>Nº</th>
                      <th>NAC</th>
                      <th>PILOTO / NAVEGANTE</th>
                      <th>VEHÍCULO</th>
                      <th>VUELTA 1</th>
                      <th>VUELTA 2</th>
                      <th>VUELTA 3</th>
                      <th>MEJOR VTA.</th>
                      <th>DIF. 1º</th>
                      <th>DIF. ANT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoria.pilotos.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-3">
                          No hay datos disponibles para esta clase
                        </td>
                      </tr>
                    ) : (
                      categoria.pilotos.map((piloto) => {
                        const marca = primeraPalabra(piloto.vehiculo);
                        return (
                          <tr key={piloto.nro} className="tabla-fila-datos-shakedown-clase">
                            <td className="text-center">
                              <span className="badge-pos-shakedown-clase">{piloto.posicion}</span>
                            </td>
                            <td className="text-center fw-bold">{piloto.nro}</td>
                            <td className="text-center celda-nacionalidad-shakedown-clase">
                              <div className="contenedor-banderas-apiladas">
                                <img
                                  src={`/assets/flags/${piloto.nacionalidades.piloto}.png`}
                                  alt={piloto.nacionalidades.piloto}
                                  className="bandera-nacionalidad-shake-clase"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.replaceWith(document.createTextNode(piloto.nacionalidades.piloto.toUpperCase()));
                                  }}
                                />
                                <img
                                  src={`/assets/flags/${piloto.nacionalidades.navegante}.png`}
                                  alt={piloto.nacionalidades.navegante}
                                  className="bandera-nacionalidad-shake-clase"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.replaceWith(document.createTextNode(piloto.nacionalidades.navegante.toUpperCase()));
                                  }}
                                />
                              </div>
                            </td>
                            <td className="text-center celda-piloto-shakedown-clase">
                              <div className="nombre-piloto-shakedown-clase">{piloto.piloto}</div>
                              <div className="nombre-navegante-shakedown-clase">{piloto.navegante}</div>
                            </td>
                            <td className="text-center celda-vehiculo-shakedown-clase">
                              <img
                                src={piloto.logo_marca}
                                alt={marca}
                                className="logo-marca-shakedown-clase"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="texto-vehiculo-shakedown-clase">{piloto.vehiculo}</span>
                            </td>
                            <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v1' ? 'mejor-tiempo-piloto-clase' : ''}`}>{piloto.vuelta_1}</td>
                            <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v2' ? 'mejor-tiempo-piloto-clase' : ''}`}>{piloto.vuelta_2}</td>
                            <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v3' ? 'mejor-tiempo-piloto-clase' : ''}`}>{piloto.vuelta_3}</td>
                            <td className="text-center fw-bold celda-mejor-tiempo-general-clase">{piloto.mejor_tiempo}</td>
                            <td className="text-center">{piloto.diferencia_primero}</td>
                            <td className="text-center">{piloto.diferencia_anterior}</td>
                          </tr>
                        );
                      })
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

export default ShakedownClases;
