// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';

// Layout
import CabeceraDashboard from './componentes/layout/CabeceraDashboard';
import FooterDashboard from './componentes/layout/FooterDashboard';
import BotonesNavegacion from './componentes/layout/BotonesNavegacion';
// import TarjetaGanadores from './componentes/layout/TarjetaGanadores';

// Tramos
import TablaTramos from './componentes/tramos/TablaTramos';

// Tiempos
import TiemposPorClase from './componentes/tiempos/TiemposPorClase';
import TiemposGeneral from './componentes/tiempos/TiemposGeneral';
import TiemposEtapa2 from './componentes/tiempos/TiemposEtapa2';

// Clasificaciones
import ClasFinalGeneral from './componentes/clasificaciones/ClasFinalGeneral';
import ClasFinalClases from './componentes/clasificaciones/ClasFinalClases';
import ClasFinalEtapa2 from './componentes/clasificaciones/ClasFinalEtapa2';

// Shakedown
import ShakedownGeneral from './componentes/shakedown/ShakedownGeneral';
import ShakedownClases from './componentes/shakedown/ShakedownClases';

// Inscripciones
import Inscriptos from './componentes/inscripciones/Inscriptos';
import OrdLargadaEtapa1 from './componentes/inscripciones/OrdLargadaEtapa1';
import OrdLargadaEtapa2 from './componentes/inscripciones/OrdLargadaEtapa2';

// Penalizaciones
import Penalizaciones from './componentes/penalizaciones/Penalizaciones';

import './estilos/layout/dashboard.css';

// ============================================
// COMPONENTES AUXILIARES REUTILIZABLES
// ============================================

// Layout principal que tienen todas las páginas
function LayoutPrincipal({ children, header }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      {header}
      <main className="flex-grow-1 bg-light">
        <div className="container-fluid py-2 px-4" style={{ maxWidth: '1400px' }}>
          {children}
        </div>
      </main>
      <footer className="footer-rally">
        <FooterDashboard />
      </footer>
    </div>
  );
}

// ============================================
// VISTAS PRINCIPALES
// ============================================

// Vista inicial con tabla de tramos
function VistaInicio({ onNavegarClases, onNavegarGeneral, onNavegarEtapa2 }) {
  return (
    <LayoutPrincipal
      header={<CabeceraDashboard mostrarSubtitulo={true} />}
    >
      <BotonesNavegacion />
      <TablaTramos 
        onVerTiemposPorClase={onNavegarClases}
        onVerTiemposGeneral={onNavegarGeneral}
        onVerTiemposEtapa2={onNavegarEtapa2}
      />
      {/* Desactive las tarjetas de ganadores, para usarlo en otra ocasion */}
      {/* <TarjetaGanadores /> */}
    </LayoutPrincipal>
  );
}

// Vista de Inscriptos
function VistaInscriptos() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="INSCRIPTOS"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <Inscriptos onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Orden de Largada Etapa 1
function VistaOrdenLargadaEtapa1() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="ORDEN DE LARGADA - ETAPA 1"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <OrdLargadaEtapa1 onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Orden de Largada Etapa 2
function VistaOrdenLargadaEtapa2() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="ORDEN DE LARGADA - ETAPA 2"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <OrdLargadaEtapa2 onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Penalizaciones
function VistaPenalizaciones() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="PENALIZACIONES"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <Penalizaciones onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Clasificación Final General
function VistaClasificacionFinalGeneral() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="CLASIFICACIÓN FINAL GENERAL"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ClasFinalGeneral onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Clasificación Final por Clases
function VistaClasificacionFinalClases() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="CLASIFICACIÓN FINAL POR CLASES"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ClasFinalClases onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Clasificación Final Etapa 2
function VistaClasificacionFinalEtapa2() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="CLASIFICACIÓN FINAL ETAPA 2"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ClasFinalEtapa2 onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Shakedown General
function VistaShakedownGeneral() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="SHAKEDOWN"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ShakedownGeneral onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista para Shakedown Por Clases
function VistaShakedownClases() {
  const navigate = useNavigate();

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard 
          nombreRally="RALLY URUGUAYO"
          tituloPersonalizado="SHAKEDOWN"
          mostrarBotonVolver={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ShakedownClases onVolver={volverAlInicio} />
    </LayoutPrincipal>
  );
}

// Vista unificada para todos los tipos de tiempos (por clase, general, copa RC2, etapa 2)
function VistaTiempos({ tipo }) {
  const { pe } = useParams();
  const navigate = useNavigate();
  const peNumero = parseInt(pe);

  const volverAlInicio = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mapeo de tipos a componentes
  const componentesPorTipo = {
    'por-clase': TiemposPorClase,
    'general': TiemposGeneral,
    'etapa2': TiemposEtapa2
  };

  const ComponenteTiempos = componentesPorTipo[tipo];

  return (
    <LayoutPrincipal
      header={
        <CabeceraDashboard
          mostrarBotonVolver={true}
          mostrarSubtitulo={true}
          onVolver={volverAlInicio}
        />
      }
    >
      <ComponenteTiempos 
        pe={peNumero}
        onVolver={volverAlInicio}
      />
    </LayoutPrincipal>
  );
}

// ============================================
// COMPONENTE PRINCIPAL APP
// ============================================

function App() {
  const navigate = useNavigate();

  // Función unificada para navegar a cualquier tipo de tiempos
  const navegarATiempos = (tipo, pe) => {
    const rutasPorTipo = {
      'clases': 'tiempos-por-categoria',
      'general': 'tiempos-general',
      'etapa2': 'tiempos-etapa2'
    };

    console.log(`🔍 Navegando a tiempos ${tipo} - PE: ${pe}`);
    navigate(`/${rutasPorTipo[tipo]}/pe/${pe}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Routes>
      {/* Ruta principal */}
      <Route 
        path="/" 
        element={
          <VistaInicio 
            onNavegarClases={(pe) => navegarATiempos('clases', pe)}
            onNavegarGeneral={(pe) => navegarATiempos('general', pe)}
            onNavegarEtapa2={(pe) => navegarATiempos('etapa2', pe)}
          />
        } 
      />
      
      {/* Inscriptos */}
      <Route 
        path="/inscriptos" 
        element={<VistaInscriptos />} 
      />

      {/* Orden de Largada */}
      <Route 
        path="/orden-largada/etapa1" 
        element={<VistaOrdenLargadaEtapa1 />} 
      />
      <Route 
        path="/orden-largada/etapa2" 
        element={<VistaOrdenLargadaEtapa2 />} 
      />

      {/* Penalizaciones */}
      <Route 
        path="/penalizaciones" 
        element={<VistaPenalizaciones />} 
      />

      {/* Clasificación Final General */}
      <Route 
        path="/clasificacion-final/general" 
        element={<VistaClasificacionFinalGeneral />} 
      />

      {/* Clasificación Final por Clases */}
      <Route 
        path="/clasificacion-final/clases" 
        element={<VistaClasificacionFinalClases />} 
      />

      {/* Clasificación Final Etapa 2 */}
      <Route 
        path="/clasificacion-final/etapa2" 
        element={<VistaClasificacionFinalEtapa2 />} 
      />

      {/* Shakedown General */}
      <Route 
        path="/shakedown/general" 
        element={<VistaShakedownGeneral />} 
      />

      {/* Shakedown Por Clases */}
      <Route 
        path="/shakedown/clases" 
        element={<VistaShakedownClases />} 
      />

      {/* Tiempos - Todas las variantes usan el mismo componente unificado */}
      <Route 
        path="/tiempos-por-categoria/pe/:pe" 
        element={<VistaTiempos tipo="por-clase" />} 
      />
      <Route 
        path="/tiempos-general/pe/:pe" 
        element={<VistaTiempos tipo="general" />} 
      />
      <Route 
        path="/tiempos-etapa2/pe/:pe" 
        element={<VistaTiempos tipo="etapa2" />} 
      />
    </Routes>
  );
}

// Wrapper con Router
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
