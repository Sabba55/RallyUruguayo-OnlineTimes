import { obtenerVistaShakedown } from '../servicios/internos/shakedownProcesado.js';

async function obtenerShakedownProcesado(req, res) {
  try {
    const datos = await obtenerVistaShakedown();
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener datos procesados del shakedown',
      error: error.message
    });
  }
}

export { obtenerShakedownProcesado };
