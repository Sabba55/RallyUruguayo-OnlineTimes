import React from 'react';
import '../../estilos/errores/ErrorDisplay.css';

function ErrorDisplay({ mensaje, onReintentar, onVolver }) {
  return (
    <div className="contenedor-tiempos">
      <div className="contenedor-error">
        {/* Ícono de error */}
        <div className="icono-error-wrapper">
          <svg 
            className="icono-error" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Mensaje de error */}
        <div className="mensaje-error">
          <h3 className="titulo-error">Error al cargar los datos</h3>
          <p className="descripcion-error">
            Hubo un problema al conectar con el servidor. Probá reintentar en unos segundos.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="acciones-error">
          {onReintentar && (
            <button 
              className="btn-reintentar-principal"
              onClick={onReintentar}
            >
              <svg 
                className="icono-btn" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reintentar
            </button>
          )}
          
          {onVolver && (
            <button 
              className="btn-reintentar-secundario"
              onClick={onVolver}
            >
              <svg 
                className="icono-btn" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver
            </button>
          )}
        </div>

        {/* Información adicional */}
        <div className="info-adicional-error">
          <p>
            Si el problema persiste, comunicarse con soporte.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay;