import { obtenerColeccionPublica } from '../servicios/infraestructura/datosPublicos.js';

/**
 * Obtener todos los tramos
 */
async function obtenerTodosLosTramos(req, res) {
  try {
    const tramos = await obtenerColeccionPublica('tramos');
    
    res.json({
      exito: true,
      datos: tramos,
      cantidad: tramos.length
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tramos',
      error: error.message
    });
  }
}

/**
 * Obtener información del rally actual
 */
async function obtenerInfoRally(req, res) {
  try {
    const rally = await obtenerColeccionPublica('rally');
    
    res.json({
      exito: true,
      datos: rally[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener información del rally',
      error: error.message
    });
  }
}

export {
  obtenerTodosLosTramos,
  obtenerInfoRally
};
