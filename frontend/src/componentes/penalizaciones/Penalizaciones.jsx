import React, { useEffect, useState } from 'react';
import { obtenerPenalizaciones } from '../../servicios/apiService';
import '../../estilos/penalizaciones/Penalizaciones.css';

function Penalizaciones({ onVolver }) {
  const [penalizaciones, setPenalizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPenalizaciones();
  }, []);

  const cargarPenalizaciones = async () => {
    try {
      setCargando(true);
      const datos = await obtenerPenalizaciones();
      setPenalizaciones(datos);
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar penalizaciones:', err);
      setError('Error al cargar las penalizaciones');
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Cargando penalizaciones...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <div className="contenedor-penalizaciones">
      {/* TABLA DE PENALIZACIONES */}
      <table className="table table-bordered table-striped tabla-penalizaciones mb-0">
        <thead>
          <tr className="tabla-encabezado-penalizaciones">
            <th>Nº</th>
            <th>PILOTO / NAVEGANTE</th>
            <th>CONTROL</th>
            <th>PENALIZ.</th>
            <th>MOTIVO</th>
          </tr>
        </thead>
        <tbody>
          {penalizaciones.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-muted py-3">
                No hay penalizaciones registradas
              </td>
            </tr>
          ) : (
            penalizaciones.map((penalizacion, index) => (
              <tr key={`${penalizacion.nro}-${index}`} className="tabla-fila-datos-penalizaciones">
                <td className="text-center">
                  <span className="badge-nro-penalizaciones">{penalizacion.nro}</span>
                </td>
                <td className="text-center celda-binomio-penalizaciones">
                  <span className="nombre-piloto-penalizaciones">{penalizacion.piloto}</span>
                  <span className="separador-binomio-penalizaciones"> | </span>
                  <span className="nombre-navegante-penalizaciones">{penalizacion.navegante}</span>
                </td>
                <td className="text-center">
                  <span className="badge-control-penalizaciones">{penalizacion.control}</span>
                </td>
                <td className="text-center">
                  <span className="tiempo-penalizacion">{penalizacion.tiempo}</span>
                </td>
                <td className="text-center">
                  <span className="motivo-penalizacion">{penalizacion.motivo}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Penalizaciones;
