import { obtenerColeccionPublica, obtenerDocumentoPublico } from '../servicios/infraestructura/datosPublicos.js';

/**
obtenerInscriptos: Devuelve la lista completa de pilotos inscriptos (NRO, PILOTO, NAVEGANTE, VEHICULO, CLASE, NAC)
obtenerHorariosEtapa1 / obtenerHorariosEtapa2: Devuelve los horarios de largada de cada etapa
obtenerPenalizaciones: Devuelve todas las penalizaciones (NRO, PILOTO, PE_OCURRIDO, TIEMPO, MOTIVO)
obtenerTodosLosTiempos: Devuelve la tabla completa de tiempos de todos los competidores (con todas las PEs)
obtenerTiemposPorCompetidor: Devuelve los tiempos de UN solo competidor específico (busca por número)
*/


/**
 * Obtener todos los inscriptos
*/
async function obtenerInscriptos(req, res) {
  try {
    const inscriptos = await obtenerColeccionPublica('inscriptos');
    
    res.json({
      exito: true,
      datos: inscriptos,
      cantidad: inscriptos.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener inscriptos',
      error: error.message
    });
  }
}

/**
 * Obtener horarios de Etapa 1
 */
async function obtenerHorariosEtapa1(req, res) {
  try {
    const horarios = await obtenerColeccionPublica('horariosE1');
    
    res.json({
      exito: true,
      datos: horarios,
      cantidad: horarios.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener horarios de Etapa 1',
      error: error.message
    });
  }
}

/**
 * Obtener horarios de Etapa 2
 */
async function obtenerHorariosEtapa2(req, res) {
  try {
    const horarios = await obtenerColeccionPublica('horariosE2');
    
    res.json({
      exito: true,
      datos: horarios,
      cantidad: horarios.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener horarios de Etapa 2',
      error: error.message
    });
  }
}

/**
 * Obtener todas las penalizaciones
 */
async function obtenerPenalizaciones(req, res) {
  try {
    const penalizaciones = await obtenerColeccionPublica('penalizaciones');
    
    res.json({
      exito: true,
      datos: penalizaciones,
      cantidad: penalizaciones.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener penalizaciones',
      error: error.message
    });
  }
}

/**
 * Obtener todos los tiempos
 */
async function obtenerTodosLosTiempos(req, res) {
  try {
    const tiempos = await obtenerColeccionPublica('tiempos');
    
    res.json({
      exito: true,
      datos: tiempos,
      cantidad: tiempos.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tiempos',
      error: error.message
    });
  }
}

/**
 * Obtener tiempos de un competidor específico
 */
async function obtenerTiemposPorCompetidor(req, res) {
  try {
    const { nro } = req.params;
    const tiempos = await obtenerDocumentoPublico('tiempos', nro);
    
    if (!tiempos) {
      return res.status(404).json({
        exito: false,
        mensaje: `No se encontraron tiempos para el competidor #${nro}`
      });
    }
    
    res.json({
      exito: true,
      datos: tiempos
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tiempos del competidor',
      error: error.message
    });
  }
}

/**
 * Obtener resultados del Shakedown
 */
async function obtenerShakedown(req, res) {
  try {
    const shakedown = await obtenerColeccionPublica('shakedown');
    
    res.json({
      exito: true,
      datos: shakedown,
      cantidad: shakedown.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener datos del Shakedown',
      error: error.message
    });
  }
}

export {
  obtenerInscriptos,
  obtenerHorariosEtapa1,
  obtenerHorariosEtapa2,
  obtenerPenalizaciones,
  obtenerTodosLosTiempos,
  obtenerTiemposPorCompetidor,
  obtenerShakedown
};
