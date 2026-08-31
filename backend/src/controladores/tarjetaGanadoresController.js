import { obtenerVistaTarjetaGanadores } from '../servicios/internos/tarjetaGanadoresProcesada.js';

async function obtenerTarjetaGanadores(req, res) {
  try {
    const datos = await obtenerVistaTarjetaGanadores();
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la tarjeta de ganadores',
      error: error.message
    });
  }
}

export { obtenerTarjetaGanadores };
