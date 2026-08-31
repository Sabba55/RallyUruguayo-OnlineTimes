// Cabecera con logo, título y botones de navegación
import React, { useState, useEffect } from 'react';
import { obtenerCabeceraDashboard } from '../../servicios/apiService';
import '../../estilos/layout/CabeceraDashboard.css'

const BASE_BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
const RUTA_CHAPA_RALLY = '/assets/chapa_rally.png';

function CabeceraDashboard({ 
  tituloPersonalizado, 
  mostrarBotonVolver = false, 
  mostrarSubtitulo = false,
  onVolver 
}) {
  const [nombreRally, setNombreRally] = useState('Rally Uruguayo');
  const [subtitulo, setSubtitulo] = useState('');
  const [chapaRally, setChapaRally] = useState(null);
  const [mostrarChapa, setMostrarChapa] = useState(true);
  const [cargandoInfo, setCargandoInfo] = useState(true);

  useEffect(() => {
    const cargarInfoRally = async () => {
      try {
        setCargandoInfo(true);
        const info = await obtenerCabeceraDashboard();
        
        // Si no existe nombre, usar "Rally Uruguayo" por defecto
        setNombreRally(info.nombre && info.nombre.trim() !== '' 
          ? info.nombre 
          : 'Rally Uruguayo'
        );
        
        // Si no existe subtítulo, dejar vacío
        setSubtitulo(info.subtitulo && info.subtitulo.trim() !== '' 
          ? info.subtitulo 
          : ''
        );
        setChapaRally(info.chapa || null);
        setMostrarChapa(Boolean(info.chapa?.existe));
        
        setCargandoInfo(false);
      } catch (error) {
        console.error('Error al cargar info del rally:', error);
        // En caso de error, usar valores por defecto
        setNombreRally('Rally Uruguayo');
        setSubtitulo('');
        setChapaRally(null);
        setMostrarChapa(false);
        setCargandoInfo(false);
      }
    };

    cargarInfoRally();
  }, []);

  return (
    <header className="header-rally py-2 px-4">
      <div className="cabecera-rally-grid">
        <div className="cabecera-rally-col cabecera-rally-col--izq z-index">
          {mostrarBotonVolver ? (
            <button
              className="btn-volver"
              onClick={onVolver}
            >
              ← Volver al Menu
            </button>
          ) : (
            <img
              src="/assets/logo-rally-argentino.png"
              alt="Logo Rally Argentino"
              className="logo-rally"
            />
          )}
        </div>

        <div className="cabecera-rally-col cabecera-rally-col--centro z-index">
          <h1 className="titulo-rally text-center text-white text-uppercase fw-bold m-0 font-header-rally font-argentino">
            {tituloPersonalizado || nombreRally}
          </h1>
          {mostrarSubtitulo && subtitulo && (
            <h6 className="text-center text-uppercase mt-2 subtitulo-rally font-argentino">
              {cargandoInfo ? 'Cargando...' : subtitulo}
            </h6>
          )}
        </div>

        <div className="cabecera-rally-col cabecera-rally-col--der z-index">
          {mostrarChapa && chapaRally?.existe && (
            <img
              src={`${BASE_BACKEND_URL}${RUTA_CHAPA_RALLY}${chapaRally.actualizada_en ? `?v=${encodeURIComponent(chapaRally.actualizada_en)}` : ''}`}
              alt="Chapa del rally"
              className="logo-rally-derecha"
              onError={() => setMostrarChapa(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default CabeceraDashboard;
