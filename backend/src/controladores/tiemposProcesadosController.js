// ============================================
// CONTROLADORES HTTP DE TIEMPOS POR PE
// Validan el parámetro PE de la ruta y delegan
// el procesamiento al servicio tiemposProcesados.
// ============================================

import {
  obtenerVistaClasesPorPE,
  obtenerVistaEtapa2PorPE,
  obtenerVistaGeneralPorPE
} from '../servicios/internos/tiemposProcesados.js';

function obtenerPEDesdeParams(req) {
  const pe = parseInt(req.params.pe, 10);
  if (!Number.isInteger(pe) || pe <= 0) {
    return null;
  }
  return pe;
}

async function obtenerTiemposGeneralPorPE(req, res) {
  try {
    const pe = obtenerPEDesdeParams(req);
    if (!pe) {
      return res.status(400).json({ exito: false, mensaje: 'PE inválido' });
    }

    const datos = await obtenerVistaGeneralPorPE(pe);
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tiempos generales procesados',
      error: error.message
    });
  }
}

async function obtenerTiemposClasesPorPE(req, res) {
  try {
    const pe = obtenerPEDesdeParams(req);
    if (!pe) {
      return res.status(400).json({ exito: false, mensaje: 'PE inválido' });
    }

    const datos = await obtenerVistaClasesPorPE(pe);
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tiempos por clases procesados',
      error: error.message
    });
  }
}

async function obtenerTiemposEtapa2PorPE(req, res) {
  try {
    const pe = obtenerPEDesdeParams(req);
    if (!pe) {
      return res.status(400).json({ exito: false, mensaje: 'PE inválido' });
    }

    const datos = await obtenerVistaEtapa2PorPE(pe);
    return res.json({ exito: true, datos });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tiempos de etapa 2 procesados',
      error: error.message
    });
  }
}

export {
  obtenerTiemposGeneralPorPE,
  obtenerTiemposClasesPorPE,
  obtenerTiemposEtapa2PorPE
};
