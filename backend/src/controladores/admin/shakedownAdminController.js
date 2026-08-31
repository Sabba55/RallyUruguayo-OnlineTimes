import {
  eliminarShakedownAdmin,
  guardarLoteShakedownAdmin,
  guardarShakedownAdmin,
  obtenerShakedownAdmin,
  obtenerShakedownAdminPorNro
} from '../../servicios/internos/shakedownAdmin.js';
import { validarLoteShakedownAdmin, validarShakedownAdmin } from '../../validaciones/shakedownAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerShakedown(req, res) {
  try {
    const shakedown = await obtenerShakedownAdmin();

    return res.json({
      exito: true,
      datos: shakedown,
      cantidad: shakedown.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/shakedown');
  }
}

export async function obtenerShakedownPorNro(req, res) {
  try {
    const nro = Number(req.params.nro);
    const registro = await obtenerShakedownAdminPorNro(nro);

    if (!registro) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un registro de Shakedown para el número ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      datos: registro
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/shakedown');
  }
}

export async function guardarShakedown(req, res) {
  const datosEntrada = {
    ...req.body,
    nro: req.params.nro ?? req.body.nro
  };

  const validacion = validarShakedownAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Shakedown no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const registro = await guardarShakedownAdmin(validacion.datosNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Registro de Shakedown guardado correctamente.',
      datos: registro
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/shakedown');
  }
}

export async function guardarLoteShakedown(req, res) {
  const validacion = validarLoteShakedownAdmin(req.body.items);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El lote de Shakedown no es válido.',
      errores: validacion.errores
    });
  }

  try {
    const resultado = await guardarLoteShakedownAdmin(validacion.itemsNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Lote de Shakedown guardado correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/shakedown');
  }
}

export async function eliminarShakedown(req, res) {
  try {
    const nro = Number(req.params.nro);
    const registro = await eliminarShakedownAdmin(nro);

    if (!registro) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un registro de Shakedown para el número ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Registro de Shakedown eliminado correctamente.',
      datos: registro
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/shakedown');
  }
}
