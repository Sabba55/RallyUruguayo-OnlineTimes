import {
  actualizarPenalizacionAdmin,
  crearPenalizacionAdmin,
  eliminarPenalizacionAdmin,
  obtenerPenalizacionAdminPorId,
  obtenerPenalizacionesAdmin
} from '../../servicios/internos/penalizacionesAdmin.js';
import { obtenerInscriptoAdminPorNro } from '../../servicios/internos/inscriptosAdmin.js';
import { obtenerTramoAdminPorPe } from '../../servicios/internos/tramosAdmin.js';
import { validarPenalizacionAdmin } from '../../validaciones/penalizacionesAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

async function validarReferenciasPenalizacion(datosNormalizados) {
  const [inscripto, tramo] = await Promise.all([
    obtenerInscriptoAdminPorNro(datosNormalizados.nro),
    obtenerTramoAdminPorPe(datosNormalizados.peocurrido)
  ]);

  const errores = [];

  if (!inscripto) {
    errores.push(`No existe un inscripto con el número ${datosNormalizados.nro}.`);
  }

  if (!tramo) {
    errores.push(`No existe un tramo con PE ${datosNormalizados.peocurrido}.`);
  }

  return errores;
}

export async function obtenerPenalizaciones(req, res) {
  try {
    const penalizaciones = await obtenerPenalizacionesAdmin();

    return res.json({
      exito: true,
      datos: penalizaciones,
      cantidad: penalizaciones.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/penalizaciones');
  }
}

export async function obtenerPenalizacionPorId(req, res) {
  try {
    const idPenal = Number(req.params.idPenal);
    const penalizacion = await obtenerPenalizacionAdminPorId(idPenal);

    if (!penalizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe una penalización con ID ${req.params.idPenal}.`
      });
    }

    return res.json({
      exito: true,
      datos: penalizacion
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/penalizaciones');
  }
}

export async function crearPenalizacion(req, res) {
  const validacion = validarPenalizacionAdmin(req.body);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Penalizaciones no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const erroresReferencias = await validarReferenciasPenalizacion(validacion.datosNormalizados);
    if (erroresReferencias.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La penalización referencia datos inexistentes.',
        errores: erroresReferencias
      });
    }

    const penalizacion = await crearPenalizacionAdmin(validacion.datosNormalizados);

    return res.status(201).json({
      exito: true,
      mensaje: 'Penalización creada correctamente.',
      datos: penalizacion
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/penalizaciones');
  }
}

export async function actualizarPenalizacion(req, res) {
  const datosEntrada = {
    ...req.body,
    id_penal: req.params.idPenal ?? req.body.id_penal
  };

  const validacion = validarPenalizacionAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Penalizaciones no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const erroresReferencias = await validarReferenciasPenalizacion(validacion.datosNormalizados);
    if (erroresReferencias.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La penalización referencia datos inexistentes.',
        errores: erroresReferencias
      });
    }

    const penalizacion = await actualizarPenalizacionAdmin(validacion.datosNormalizados);

    if (!penalizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe una penalización con ID ${req.params.idPenal}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Penalización actualizada correctamente.',
      datos: penalizacion
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/penalizaciones');
  }
}

export async function eliminarPenalizacion(req, res) {
  try {
    const idPenal = Number(req.params.idPenal);
    const penalizacionEliminada = await eliminarPenalizacionAdmin(idPenal);

    if (!penalizacionEliminada) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe una penalización con ID ${req.params.idPenal}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Penalización eliminada correctamente.',
      datos: penalizacionEliminada
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/penalizaciones');
  }
}
