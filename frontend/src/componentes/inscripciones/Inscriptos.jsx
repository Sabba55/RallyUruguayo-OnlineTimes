import React, { useEffect, useState } from 'react';
import { obtenerInscriptos } from '../../servicios/apiService';
import { obtenerRutaLogoVehiculo } from '../../utilidades/logosVehiculos';
import '../../estilos/inscripciones/Inscriptos.css';

function Inscriptos({ onVolver }) {
  const [inscriptos, setInscriptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarInscriptos();
  }, []);

  const cargarInscriptos = async () => {
    try {
      setCargando(true);
      const datos = await obtenerInscriptos();
      setInscriptos(datos);
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar inscriptos:', err);
      setError('Error al cargar la lista de inscriptos');
      setCargando(false);
    }
  };

  const primeraPalabra = (texto) => texto ? texto.split(' ')[0] : '-';

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando inscriptos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  // Ordenar inscriptos por número
  const inscriptosOrdenados = [...inscriptos].sort((a, b) => parseInt(a.nro) - parseInt(b.nro));

  return (
    <div className="contenedor-inscriptos">
      {/* TABLA ÚNICA DE INSCRIPTOS */}
      <table className="table table-bordered table-striped tabla-inscriptos mb-0">
        <thead>
          <tr className="tabla-encabezado-inscriptos">
            <th>POS</th>
            <th>Nº</th>
            <th>NAC</th>
            <th>PILOTO</th>
            <th>NAVEGANTE</th>
            <th>VEHÍCULO</th>
            <th>CLASE</th>
          </tr>
        </thead>
        <tbody>
          {inscriptosOrdenados.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center text-muted py-3">
                No hay inscriptos registrados
              </td>
            </tr>
          ) : (
            inscriptosOrdenados.map((inscripto, index) => (
            <tr key={inscripto.nro} className="tabla-fila-datos-inscriptos">
              <td className="text-center">
                <span className="badge-pos-inscriptos">{index + 1}</span>
              </td>
              <td className="text-center fs-6 fw-bold">{inscripto.nro}</td>
              <td className="text-center celda-nacionalidad-inscriptos">
                {(() => {
                  const nacionalidades = inscripto.nac ? inscripto.nac.trim().split(/\s+/) : ['ARG'];
                  
                  // Si solo hay una nacionalidad, aplicarla para ambos
                  const nacPiloto = nacionalidades[0] || 'ARG';
                  const nacNavegante = nacionalidades[1] || nacPiloto;
                  
                  const rutaBanderaPiloto = `/assets/flags/${nacPiloto.toLowerCase()}.png`;
                  const rutaBanderaNavegante = `/assets/flags/${nacNavegante.toLowerCase()}.png`;

                  return (
                    <div className="contenedor-banderas">
                      <img
                        src={rutaBanderaPiloto}
                        alt={nacPiloto}
                        className="bandera-nacionalidad"
                        title={`Piloto: ${nacPiloto}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.replaceWith(document.createTextNode(nacPiloto));
                        }}
                      />
                      <span className="separador-banderas"> </span>
                      <img
                        src={rutaBanderaNavegante}
                        alt={nacNavegante}
                        className="bandera-nacionalidad"
                        title={`Navegante: ${nacNavegante}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.replaceWith(document.createTextNode(nacNavegante));
                        }}
                      />
                    </div>
                  );
                })()}
              </td>
              <td className="text-center">
                <span className="nombre-piloto-inscriptos">{inscripto.piloto}</span>
              </td>
              <td className="text-center">
                <span className="nombre-navegante-inscriptos">{inscripto.navegante}</span>
              </td>
              <td className="text-center celda-vehiculo-inscriptos">
                {(() => {
                  const marca = primeraPalabra(inscripto.vehiculo);
                  const rutaLogo = obtenerRutaLogoVehiculo(inscripto.vehiculo);

                  return (
                    <>
                      <img
                        src={rutaLogo}
                        alt={marca}
                        className="logo-marca-inscriptos"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="texto-vehiculo-inscriptos">{inscripto.vehiculo}</span>
                    </>
                  );
                })()}
              </td>
              <td className="text-center fw-semibold">
                {(() => {
                  if (!inscripto.clase) return '-';
                  
                  const partes = inscripto.clase.trim().split(/\s+/);
                  
                  // Si hay más de una palabra y alguna tiene un guion, insertamos la barra estilizada
                  if (partes.length > 1 && inscripto.clase.includes('-')) {
                    const resultado = [];
                    
                    partes.forEach((palabra, index) => {
                      resultado.push(palabra);
                      // Si no es la última palabra, y (la actual tiene '-' o la siguiente tiene '-')
                      if (index < partes.length - 1 && (palabra.includes('-') || partes[index + 1].includes('-'))) {
                        resultado.push(<span key={`sep-${index}`} className="separador-clase"> | </span>);
                      } else if (index < partes.length - 1) {
                        // Si es un nombre compuesto como "COPA RC2", solo dejamos el espacio
                        resultado.push(' ');
                      }
                    });
                    return resultado;
                  }
                  
                  return inscripto.clase;
                })()}
              </td>
          </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Inscriptos;
