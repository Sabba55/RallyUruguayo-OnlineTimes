import React, { useEffect, useState } from 'react';
import { obtenerShakedownProcesado } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/shakedown/ShakedownGeneral.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function ShakedownGeneral() {
  const { refreshKey, segundosRestantes } = useGlobalRefresh();
  const [datos, setDatos] = useState([]);
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
      setDatos(respuesta.general || []);

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
    <div className="contenedor-shakedown-general">
      <div className="d-flex justify-content-center align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
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

      <div className="tabla-shakedown-wrapper pb-3 mb-4">
        <table className="table table-bordered table-striped tabla-shakedown mb-0">
          <thead>
            <tr className="tabla-encabezado-shakedown text-center">
              <th>POS</th>
              <th>Nº</th>
              <th>NAC</th>
              <th>PILOTO / NAVEGANTE</th>
              <th>CLASE</th>
              <th>VEHÍCULO</th>
              <th>VUELTA 1</th>
              <th>VUELTA 2</th>
              <th>VUELTA 3</th>
              <th>MEJOR VTA.</th>
              <th style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                <div style={{ fontWeight: '700' }}>DIF. 1º</div>
                <div style={{ fontWeight: '600' }}>DIF. ANT</div>
              </th>
            </tr>
          </thead>

          <tbody>
            {datos.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center text-muted py-3">
                  No hay tiempos registrados en el Shakedown
                </td>
              </tr>
            ) : (
              datos.map((piloto) => {
                const marca = primeraPalabra(piloto.vehiculo);
                return (
                  <tr key={piloto.nro} className="tabla-fila-datos-shakedown">
                    <td className="text-center">
                      <span className="badge-pos-shakedown">{piloto.posicion}</span>
                    </td>
                    <td className="text-center fw-bold">{piloto.nro}</td>
                    <td className="text-center celda-nacionalidad-shakedown">
                      <div className="contenedor-banderas-apiladas">
                        <img
                          src={`/assets/flags/${piloto.nacionalidades.piloto}.png`}
                          alt={piloto.nacionalidades.piloto}
                          className="bandera-nacionalidad-shake"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.replaceWith(document.createTextNode(piloto.nacionalidades.piloto.toUpperCase()));
                          }}
                        />
                        <img
                          src={`/assets/flags/${piloto.nacionalidades.navegante}.png`}
                          alt={piloto.nacionalidades.navegante}
                          className="bandera-nacionalidad-shake"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.replaceWith(document.createTextNode(piloto.nacionalidades.navegante.toUpperCase()));
                          }}
                        />
                      </div>
                    </td>
                    <td className="text-center celda-piloto-shakedown">
                      <div className="nombre-piloto-shakedown">{piloto.piloto}</div>
                      <div className="nombre-navegante-shakedown">{piloto.navegante}</div>
                    </td>
                    <td className="text-center fw-medium">{piloto.clase}</td>
                    <td className="text-center celda-vehiculo-shakedown">
                      <img
                        src={piloto.logo_marca}
                        alt={marca}
                        className="logo-marca-shakedown"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="texto-vehiculo-shakedown">{piloto.vehiculo}</span>
                    </td>
                    <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v1' ? 'mejor-tiempo-piloto' : ''}`}>{piloto.vuelta_1}</td>
                    <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v2' ? 'mejor-tiempo-piloto' : ''}`}>{piloto.vuelta_2}</td>
                    <td className={`text-center fw-bold ${piloto.mejor_vuelta === 'v3' ? 'mejor-tiempo-piloto' : ''}`}>{piloto.vuelta_3}</td>
                    <td className="text-center fw-bold mejor-tiempo-general">{piloto.mejor_tiempo}</td>
                    <td className="text-center">
                      <div style={{ fontWeight: '600' }}>{piloto.diferencia_primero}</div>
                      <div style={{ color: '#6c757d' }}>{piloto.diferencia_anterior}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ShakedownGeneral;
