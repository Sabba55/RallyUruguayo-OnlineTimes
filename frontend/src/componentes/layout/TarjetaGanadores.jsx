import React, { useEffect, useState } from 'react';
import { obtenerTarjetaGanadores } from '../../servicios/apiService';
import { obtenerRutaLogoVehiculo } from '../../utilidades/logosVehiculos';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import '../../estilos/layout/TarjetaGanadores.css';

function TarjetaGanadores() {
  const { refreshKey } = useGlobalRefresh();
  const [datos, setDatos] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);

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
      if (esInicial) setCargandoInicial(true);
      const respuesta = await obtenerTarjetaGanadores();
      setDatos(respuesta);
      if (esInicial) setCargandoInicial(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (esInicial) setCargandoInicial(false);
    }
  };

  if (cargandoInicial) {
    return null;
  }

  if (!datos?.visible) {
    return null;
  }

  return (
    <div className="contenedor-tarjetas-ganadores">
      <h2 className="titulo-ganadores text-center mb-4 font-argentino">
        Clasificacion Final
      </h2>

      <div className="grid-tarjetas-ganadores">
        {datos.categorias.map((categoria) => (
          <div key={categoria.clase} className="tarjeta-ganador">
            <div className="encabezado-tarjeta">
              <h3 className="nombre-categoria font-argentino">{categoria.nombre_mostrar}</h3>
              <span className="estado-etiqueta">{categoria.estado}</span>
            </div>

            <div className="cuerpo-tarjeta">
              {categoria.pilotos.map((piloto) => (
                <div key={piloto.nro} className={`fila-podio posicion-${piloto.posicion}`}>
                  <div className="columna-posicion">
                    <span className={`badge-podio badge-podio-${piloto.posicion}`}>
                      {piloto.posicion}
                    </span>
                  </div>

                  <div className="columna-info">
                    <div className="nombres-piloto">
                      <div className="nombre-piloto-linea">{piloto.piloto}</div>
                      <div className="nombre-navegante-linea">{piloto.navegante}</div>
                    </div>
                    <div className="info-vehiculo">
                      <img
                        src={piloto.logo_marca || obtenerRutaLogoVehiculo(piloto.vehiculo)}
                        alt={piloto.vehiculo}
                        className="logo-marca-vehiculo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="nombre-vehiculo">{piloto.vehiculo}</span>
                    </div>
                  </div>

                  <div className="columna-tiempo">
                    {piloto.posicion === 1 ? (
                      <span className="tiempo-ganador">{piloto.tiempo}</span>
                    ) : (
                      <span className="diferencia-tiempo">{piloto.tiempo}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TarjetaGanadores;
