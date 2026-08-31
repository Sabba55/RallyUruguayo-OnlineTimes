import React, { useEffect, useState } from 'react';
import { obtenerHorariosEtapa1 } from '../../servicios/apiService';
import { obtenerRutaLogoVehiculo } from '../../utilidades/logosVehiculos';
import '../../estilos/inscripciones/OrdLargadaEtapa.css';

function OrdLargadaEtapa1({ onVolver }) {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busquedaPiloto, setBusquedaPiloto] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  useEffect(() => {
    cargarHorarios();
  }, []);

  const cargarHorarios = async () => {
    try {
      setCargando(true);
      const datos = await obtenerHorariosEtapa1();
      
      // Ordenar por hora de menor a mayor
      const datosOrdenados = datos
        .filter(piloto => piloto.hora && piloto.hora.trim() !== '')  // ← filtra sin hora
        .sort((a, b) => {
          const aMinutos = a.hora.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
          const bMinutos = b.hora.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
          return aMinutos - bMinutos;
        })
        .map((piloto, index) => ({
          ...piloto,
          posicionLargada: index + 1
        }));
      
      setHorarios(datosOrdenados);
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
      setError('Error al cargar el orden de largada');
      setCargando(false);
    }
  };

  const primeraPalabra = (texto) => texto ? texto.split(' ')[0] : '-';
  const normalizarTextoFiltro = (texto) => String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" style={{ color: '#18283c' }}></div>
        <p className="mt-3">Cargando orden de largada...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  const categoriasDisponibles = [...new Set(
    horarios
      .map(piloto => piloto.clase)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'es'));

  const busquedaNormalizada = normalizarTextoFiltro(busquedaPiloto);
  const categoriaNormalizada = normalizarTextoFiltro(categoriaSeleccionada);
  const horariosFiltrados = horarios.filter((piloto) => {
    const pilotoNormalizado = normalizarTextoFiltro(piloto.piloto);
    const categoriaPilotoNormalizada = normalizarTextoFiltro(piloto.clase);

    const coincidePiloto = !busquedaNormalizada || pilotoNormalizado.includes(busquedaNormalizada);
    const coincideCategoria = !categoriaNormalizada || categoriaPilotoNormalizada === categoriaNormalizada;

    return coincidePiloto && coincideCategoria;
  });

  return (
    <div className="contenedor-orden-largada">
      <div className="filtros-orden-largada">
        <div className="filtro-grupo-orden-largada">
          <label htmlFor="filtroPilotoEtapa1">Buscar piloto</label>
          <input
            id="filtroPilotoEtapa1"
            type="search"
            className="filtro-control-orden-largada"
            placeholder="Escribí el nombre..."
            value={busquedaPiloto}
            onChange={(event) => setBusquedaPiloto(event.target.value)}
          />
        </div>
        <div className="filtro-grupo-orden-largada">
          <label htmlFor="filtroCategoriaEtapa1">Categoría</label>
          <select
            id="filtroCategoriaEtapa1"
            className="filtro-control-orden-largada"
            value={categoriaSeleccionada}
            onChange={(event) => setCategoriaSeleccionada(event.target.value)}
          >
            <option value="">Todas</option>
            {categoriasDisponibles.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA DE ORDEN DE LARGADA */}
      <table className="table table-bordered table-striped tabla-orden-largada mb-0">
        <thead>
          <tr className="tabla-encabezado-orden-largada">
            <th>POS</th>
            <th>Nº</th>
            <th>NAC</th>
            <th>PILOTO</th>
            <th>NAVEGANTE</th>
            <th>VEHÍCULO</th>
            <th>CLASE</th>
            <th>HORA</th>
          </tr>
        </thead>
        <tbody>
            {horarios.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="text-muted">
                    <h5 className="mb-2">No hay horarios asignados</h5>
                    <p className="mb-0">Vuelva mas tarde</p>
                  </div>
                </td>
              </tr>
            ) : horariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="text-muted">
                    <h5 className="mb-2">No se encontraron resultados</h5>
                    <p className="mb-0">Reintentar con otro nombre o categoría</p>
                  </div>
                </td>
              </tr>
            ) : (
            horariosFiltrados.map((piloto) => (
                <tr key={piloto.nro} className="tabla-fila-datos-orden-largada">
                <td className="text-center">
                    <span className="badge-pos-orden-largada">{piloto.posicionLargada}</span>
                </td>
                <td className="text-center fw-bold fs-6">{piloto.nro}</td>
                <td className="text-center celda-nacionalidad-orden-largada">
                    {(() => {
                    const nacionalidades = piloto.nac ? piloto.nac.trim().split(/\s+/) : ['ARG'];
                    
                    const nacPiloto = nacionalidades[0] || 'ARG';
                    const nacNavegante = nacionalidades[1] || nacPiloto;
                    
                    const rutaBanderaPiloto = `/assets/flags/${nacPiloto.toLowerCase()}.png`;
                    const rutaBanderaNavegante = `/assets/flags/${nacNavegante.toLowerCase()}.png`;

                    return (
                        <div className="contenedor-banderas-largada">
                        <img
                            src={rutaBanderaPiloto}
                            alt={nacPiloto}
                            className="bandera-nacionalidad-largada"
                            title={`Piloto: ${nacPiloto}`}
                            onError={(e) => {
                            e.target.onerror = null;
                            e.target.replaceWith(document.createTextNode(nacPiloto));
                            }}
                        />
                        <span className="separador-banderas-largada"> </span>
                        <img
                            src={rutaBanderaNavegante}
                            alt={nacNavegante}
                            className="bandera-nacionalidad-largada"
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
                <td className="text-center celda-piloto-orden-largada">
                    <span className="nombre-piloto-orden-largada">{piloto.piloto}</span>
                </td>
                <td className="text-center celda-navegante-orden-largada">
                    <span className="nombre-navegante-orden-largada">{piloto.navegante}</span>
                </td>
                <td className="text-center celda-vehiculo-orden-largada">
                    {(() => {
                    const marca = primeraPalabra(piloto.vehiculo);
                    const rutaLogo = obtenerRutaLogoVehiculo(piloto.vehiculo);

                    return (
                        <>
                        <img
                            src={rutaLogo}
                            alt={marca}
                            className="logo-marca-orden-largada"
                            onError={(e) => {
                            e.target.style.display = 'none';
                            }}
                        />
                        <span className="texto-vehiculo-orden-largada">{piloto.vehiculo}</span>
                        </>
                    );
                    })()}
                </td>
                <td className="text-center fw-semibold">
                  {(() => {
                    if (!piloto.clase) return '-';
                    
                    const partes = piloto.clase.trim().split(/\s+/);
                    
                    // Si hay más de una palabra y existe un guion, aplicamos el separador estilizado
                    if (partes.length > 1 && piloto.clase.includes('-')) {
                      const contenidoProcesado = [];
                      
                      partes.forEach((palabra, index) => {
                        contenidoProcesado.push(palabra);
                        
                        // Verificamos si debemos poner la barra: 
                        // Solo si no es el último elemento Y alguna de las partes adyacentes tiene un guion
                        if (index < partes.length - 1) {
                          if (palabra.includes('-') || partes[index + 1].includes('-')) {
                            contenidoProcesado.push(
                              <span key={`sep-${index}`} className="separador-clase"> | </span>
                            );
                          } else {
                            // Si es un nombre compuesto sin guiones (ej. "COPA RC2"), solo espacio
                            contenidoProcesado.push(' ');
                          }
                        }
                      });
                      return contenidoProcesado;
                    }
                    
                    return piloto.clase;
                  })()}
                </td>
                <td className="text-center">
                    <span className="hora-largada">{piloto.hora}</span>
                </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdLargadaEtapa1;
