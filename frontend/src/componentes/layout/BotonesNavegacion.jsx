import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../estilos/layout/BotonesNavegacion.css';

function BotonesNavegacion() {
  const navigate = useNavigate();
  
  const manejarClickBoton = (seccion) => {
    console.log(`Navegando a: ${seccion}`);
    
    switch(seccion) {
      case 'inscriptos':
        navigate('/inscriptos');
        break;
      case 'orden-largada-e1':
        navigate('/orden-largada/etapa1');
        break;
      case 'orden-largada-e2':
        navigate('/orden-largada/etapa2');
        break;
      case 'penalizaciones':
        navigate('/penalizaciones');
        break;
      default:
        console.log('Sección no reconocida');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="d-flex justify-content-center flex-wrap gap-3 my-4 px-3">
      <button 
        className="btn btn-menu text-uppercase fw-bold"
        onClick={() => manejarClickBoton('inscriptos')}
      >
        INSCRIPTOS
      </button>
      <button 
        className="btn btn-menu text-uppercase fw-bold"
        onClick={() => manejarClickBoton('orden-largada-e1')}
      >
        ORD. LARGADA<br/>ETAPA 1
      </button>
      <button 
        className="btn btn-menu text-uppercase fw-bold"
        onClick={() => manejarClickBoton('orden-largada-e2')}
      >
        ORD. LARGADA<br/>ETAPA 2
      </button>
      <button 
        className="btn btn-menu text-uppercase fw-bold"
        onClick={() => manejarClickBoton('penalizaciones')}
      >
        PENALIZACIONES
      </button>
    </nav>
  );
}

export default BotonesNavegacion;