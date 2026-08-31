import { obtenerVistaTramosCarrera } from '../servicios/internos/tramosCarrera.js';

async function obtenerTramosCarrera(req, res) {
  try {
    const datos = await obtenerVistaTramosCarrera();
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la vista de tramos de carrera',
      error: error.message
    });
  }
}

export { obtenerTramosCarrera };
