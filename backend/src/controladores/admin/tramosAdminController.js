import {
  eliminarTramoAdmin,
  guardarTramoAdmin,
  obtenerTramoAdminPorPe,
  obtenerTramosAdmin
} from '../../servicios/internos/tramosAdmin.js';
import { validarTramoAdmin } from '../../validaciones/tramosAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerTramos(req, res) {
  try {
    const tramos = await obtenerTramosAdmin();

    return res.json({
      exito: true,
      datos: tramos,
      cantidad: tramos.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tramos');
  }
}

export async function obtenerTramoPorPe(req, res) {
  try {
    const pe = Number(req.params.pe);
    const tramo = await obtenerTramoAdminPorPe(pe);

    if (!tramo) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un tramo con PE ${req.params.pe}.`
      });
    }

    return res.json({
      exito: true,
      datos: tramo
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tramos');
  }
}

export async function guardarTramo(req, res) {
  const datosEntrada = {
    ...req.body,
    pe: req.params.pe ?? req.body.pe
  };

  const validacion = validarTramoAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Tramos no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const tramo = await guardarTramoAdmin({
      ...validacion.datosNormalizados,
      peOriginal: req.params.pe ? Number(req.params.pe) : null
    });

    return res.json({
      exito: true,
      mensaje: 'Tramo guardado correctamente.',
      datos: tramo
    });
  } catch (error) {
    if (error.code === 'TRAMO_DUPLICADO') {
      return res.status(400).json({
        exito: false,
        mensaje: error.message
      });
    }
    return manejarErrorAdmin(res, error, 'admin/tramos');
  }
}

export async function eliminarTramo(req, res) {
  try {
    const pe = Number(req.params.pe);
    const tramoEliminado = await eliminarTramoAdmin(pe);

    if (!tramoEliminado) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un tramo con PE ${req.params.pe}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Tramo eliminado correctamente.',
      datos: tramoEliminado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tramos');
  }
}
