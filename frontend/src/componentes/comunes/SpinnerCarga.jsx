import React from 'react';

function SpinnerCarga({ mensaje = 'Cargando...' }) {
  // Seleccionar un spinner aleatorio entre 1 y 5
  const spinnerAleatorio = Math.floor(Math.random() * 5) + 1;

  return (
    <div className="contenedor-spinner-carga">
      <div className="text-center py-5">
        {/* ESTILOS CSS */}
        <style>
          {`
            @keyframes speedLinesRight {
              0% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(200px); opacity: 0; }
            }
            @keyframes carVibrate {
              0%, 100% { transform: translateY(0) translateX(0); }
              25% { transform: translateY(-1px) translateX(-0.5px); }
              50% { transform: translateY(0) translateX(0); }
              75% { transform: translateY(1px) translateX(0.5px); }
            }
            
            /* ANIMACIÓN DE NUBE DE POLVO VOLUMÉTRICA - HACIA LA DERECHA */
            @keyframes dustCloud1 {
              0% { 
                transform: translate(0, 0) scale(0.3); 
                opacity: 0; 
              }
              15% {
                opacity: 0.85;
              }
              100% { 
                transform: translate(120px, 10px) scale(2.5); 
                opacity: 0; 
              }
            }
            
            @keyframes dustCloud2 {
              0% { 
                transform: translate(0, 0) scale(0.4); 
                opacity: 0; 
              }
              20% {
                opacity: 0.75;
              }
              100% { 
                transform: translate(130px, -5px) scale(2.8); 
                opacity: 0; 
              }
            }
            
            @keyframes dustCloud3 {
              0% { 
                transform: translate(0, 0) scale(0.35); 
                opacity: 0; 
              }
              18% {
                opacity: 0.7;
              }
              100% { 
                transform: translate(110px, 15px) scale(2.3); 
                opacity: 0; 
              }
            }
            
            @keyframes dustCloud4 {
              0% { 
                transform: translate(0, 0) scale(0.25); 
                opacity: 0; 
              }
              22% {
                opacity: 0.65;
              }
              100% { 
                transform: translate(100px, 8px) scale(2.6); 
                opacity: 0; 
              }
            }
            
            @keyframes dustCloud5 {
              0% { 
                transform: translate(0, 0) scale(0.3); 
                opacity: 0; 
              }
              17% {
                opacity: 0.8;
              }
              100% { 
                transform: translate(125px, 0px) scale(2.4); 
                opacity: 0; 
              }
            }
            
            /* Partículas pequeñas adicionales */
            @keyframes smallDustParticle {
              0% { 
                transform: translate(0, 0) scale(1) rotate(0deg); 
                opacity: 0.9; 
              }
              100% { 
                transform: translate(80px, 20px) scale(0.2) rotate(360deg); 
                opacity: 0; 
              }
            }
            
            @keyframes shadowPulse {
              0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.3; }
              50% { transform: scaleX(1.05) scaleY(0.95); opacity: 0.4; }
            }
            
            .speed-line-right {
              animation: speedLinesRight 0.6s linear infinite;
            }
            .speed-line-right:nth-child(1) { animation-delay: 0s; }
            .speed-line-right:nth-child(2) { animation-delay: 0.1s; }
            .speed-line-right:nth-child(3) { animation-delay: 0.2s; }
            .speed-line-right:nth-child(4) { animation-delay: 0.3s; }
            .speed-line-right:nth-child(5) { animation-delay: 0.4s; }
            .speed-line-right:nth-child(6) { animation-delay: 0.5s; }
            
            .car-vibrate {
              animation: carVibrate 0.15s ease-in-out infinite;
            }
            
            .car-shadow {
              animation: shadowPulse 0.15s ease-in-out infinite;
            }
            
            .dust-cloud-layer {
              position: absolute;
              border-radius: 50%;
              mix-blend-mode: multiply;
            }
            
            .dust-cloud-1 { animation: dustCloud1 1.5s ease-out infinite; }
            .dust-cloud-2 { animation: dustCloud2 1.6s ease-out infinite; }
            .dust-cloud-3 { animation: dustCloud3 1.4s ease-out infinite; }
            .dust-cloud-4 { animation: dustCloud4 1.55s ease-out infinite; }
            .dust-cloud-5 { animation: dustCloud5 1.45s ease-out infinite; }
            
            .small-dust-particle {
              animation: smallDustParticle 1.2s ease-out infinite;
            }
          `}
        </style>
        
        {/* CONTENEDOR PRINCIPAL DE LA ANIMACIÓN */}
        <div className="position-relative d-inline-block" style={{ width: '500px', height: '200px' }}>
          
          {/* DIV: NUBE DE POLVO VOLUMÉTRICA */}
          <div className="spinner-dust-cloud" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            
            {/* Capa 1 - Base grande y difusa */}
            <div 
              className="dust-cloud-layer dust-cloud-1"
              style={{
                top: '105px',
                left: '300px',
                width: '80px',
                height: '50px',
                background: 'radial-gradient(ellipse, rgba(160, 82, 45, 0.7) 0%, rgba(160, 82, 45, 0.4) 50%, rgba(160, 82, 45, 0.1) 80%, transparent 100%)',
                filter: 'blur(15px)',
                animationDelay: '0s'
              }}
            />
            
            {/* Capa 2 - Nube secundaria */}
            <div 
              className="dust-cloud-layer dust-cloud-2"
              style={{
                top: '110px',
                left: '295px',
                width: '70px',
                height: '45px',
                background: 'radial-gradient(ellipse, rgba(139, 69, 19, 0.65) 0%, rgba(139, 69, 19, 0.35) 55%, rgba(139, 69, 19, 0.08) 75%, transparent 100%)',
                filter: 'blur(12px)',
                animationDelay: '0.2s'
              }}
            />
            
            {/* Capa 3 - Nube superior */}
            <div 
              className="dust-cloud-layer dust-cloud-3"
              style={{
                top: '100px',
                left: '298px',
                width: '65px',
                height: '40px',
                background: 'radial-gradient(ellipse, rgba(150, 75, 0, 0.6) 0%, rgba(150, 75, 0, 0.3) 50%, rgba(150, 75, 0, 0.05) 90%, transparent 100%)',
                filter: 'blur(10px)',
                animationDelay: '0.1s'
              }}
            />
            
            {/* Capa 4 - Nube media */}
            <div 
              className="dust-cloud-layer dust-cloud-4"
              style={{
                top: '115px',
                left: '302px',
                width: '75px',
                height: '48px',
                background: 'radial-gradient(ellipse, rgba(165, 85, 50, 0.55) 0%, rgba(165, 85, 50, 0.28) 48%, rgba(165, 85, 50, 0.06) 78%, transparent 100%)',
                filter: 'blur(14px)',
                animationDelay: '0.3s'
              }}
            />
            
            {/* Capa 5 - Nube central */}
            <div 
              className="dust-cloud-layer dust-cloud-5"
              style={{
                top: '108px',
                left: '297px',
                width: '72px',
                height: '46px',
                background: 'radial-gradient(ellipse, rgba(155, 78, 30, 0.68) 0%, rgba(155, 78, 30, 0.38) 42%, rgba(155, 78, 30, 0.07) 72%, transparent 100%)',
                filter: 'blur(13px)',
                animationDelay: '0.15s'
              }}
            />
            
            {/* Capas adicionales con diferentes delays para efecto continuo */}
            <div 
              className="dust-cloud-layer dust-cloud-1"
              style={{
                top: '105px',
                left: '330px',
                width: '80px',
                height: '50px',
                background: 'radial-gradient(ellipse, rgba(160, 82, 45, 0.7) 0%, rgba(160, 82, 45, 0.4) 40%, rgba(160, 82, 45, 0.1) 70%, transparent 100%)',
                filter: 'blur(15px)',
                animationDelay: '0.75s'
              }}
            />
            
            <div 
              className="dust-cloud-layer dust-cloud-3"
              style={{
                top: '100px',
                left: '328px',
                width: '65px',
                height: '40px',
                background: 'radial-gradient(ellipse, rgba(150, 75, 0, 0.6) 0%, rgba(150, 75, 0, 0.3) 50%, rgba(150, 75, 0, 0.05) 80%, transparent 100%)',
                filter: 'blur(10px)',
                animationDelay: '0.85s'
              }}
            />
            
            {/* Partículas pequeñas para detalle */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={`small-dust-${i}`}
                className="small-dust-particle position-absolute"
                style={{
                  top: `${125 + Math.random() * 15}px`,
                  left: '330px',
                  width: `${4 + Math.random() * 6}px`,
                  height: `${4 + Math.random() * 6}px`,
                  background: `rgba(${130 + Math.random() * 30}, ${60 + Math.random() * 20}, ${10 + Math.random() * 15}, 0.7)`,
                  borderRadius: '50%',
                  filter: 'blur(1.5px)',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${1.1 + Math.random() * 0.3}s`
                }}
              />
            ))}
          </div>

          {/* DIV: LÍNEAS DE VELOCIDAD */}
          <div className="spinner-speed-lines position-absolute" style={{ top: '90px', left: '0px' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="speed-line-right position-absolute"
                style={{
                  top: `${i * 13}px`,
                  left: '260px',
                  width: `${90 - i * 8}px`,
                  height: '2px',
                  background: `linear-gradient(to right, rgba(100, 100, 100, ${0.5 - i * 0.06}), transparent)`,
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {/* DIV: SOMBRA DEL AUTO */}
          <div className="spinner-car-shadow">
            <div 
              className="car-shadow position-absolute"
              style={{ 
                top: '150px', 
                left: '155px',
                width: '220px',
                height: '30px',
                background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.4) 20%, rgba(0, 0, 0, 0.2) 70%, transparent 30%)',
                borderRadius: '50%',
                filter: 'blur(8px)'
              }}
            />
          </div>

          {/* DIV: AUTO MIG RACING */}
          <div className="spinner-car">
            <div 
              className="car-vibrate position-absolute"
              style={{ top: '60px', left: '120px' }}
            >
              <img 
                src={`/assets/spinner/spinner${spinnerAleatorio}.png`}
                alt="Rally Car" 
                style={{ 
                  width: '250px', 
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* TEXTO DE CARGA */}
        <div className="spinner-loading-text">
          <p className="fw-bold font-argentino" style={{ fontSize: '1.5rem' }}>{mensaje}</p>
        </div>
        
        {/* DIV: INDICADOR DE PROGRESO */}
        <div className="spinner-progress-indicator mt-3 d-flex justify-content-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#00bcd4',
                animation: `carVibrate 0.6s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpinnerCarga;