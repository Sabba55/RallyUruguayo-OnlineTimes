import { obtenerVistaCabeceraDashboard } from '../servicios/internos/cabeceraDashboard.js';

async function obtenerCabeceraDashboard(req, res) {
  try {
    const datos = await obtenerVistaCabeceraDashboard();
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la cabecera del dashboard',
      error: error.message
    });
  }
}

export { obtenerCabeceraDashboard };
