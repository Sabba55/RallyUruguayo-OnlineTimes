import {
  eliminarTodosLosInscriptosAdmin,
  eliminarInscriptoAdmin,
  guardarLoteInscriptosAdmin,
  guardarInscriptoAdmin,
  obtenerInscriptoAdminPorNro,
  obtenerInscriptosAdmin
} from '../../servicios/internos/inscriptosAdmin.js';
import {
  validarInscriptosAdmin,
  validarLoteInscriptosAdmin
} from '../../validaciones/inscriptosAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerInscriptos(req, res) {
  try {
    const inscriptos = await obtenerInscriptosAdmin();

    return res.json({
      exito: true,
      datos: inscriptos,
      cantidad: inscriptos.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}

export async function obtenerInscriptoPorNro(req, res) {
  try {
    const nro = Number(req.params.nro);
    const inscripto = await obtenerInscriptoAdminPorNro(nro);

    if (!inscripto) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un inscripto con el número ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      datos: inscripto
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}

export async function guardarInscripto(req, res) {
  const datosEntrada = {
    ...req.body,
    nro: req.body.nro ?? req.params.nro,
    nroOriginal: req.body.nroOriginal ?? req.params.nro ?? null
  };

  const validacion = validarInscriptosAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Inscriptos no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const inscripto = await guardarInscriptoAdmin(validacion.datosNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Inscripto guardado correctamente.',
      datos: inscripto
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}

export async function eliminarInscripto(req, res) {
  try {
    const nro = Number(req.params.nro);
    const inscriptoEliminado = await eliminarInscriptoAdmin(nro);

    if (!inscriptoEliminado) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un inscripto con el número ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Inscripto eliminado correctamente.',
      datos: inscriptoEliminado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}

export async function guardarLoteInscriptos(req, res) {
  const validacion = validarLoteInscriptosAdmin(req.body.items);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El lote de inscriptos no es válido.',
      errores: validacion.errores
    });
  }

  try {
    const resultado = await guardarLoteInscriptosAdmin(validacion.itemsNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Lote de inscriptos guardado correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}

export async function eliminarTodosLosInscriptos(req, res) {
  try {
    const resultado = await eliminarTodosLosInscriptosAdmin();

    return res.json({
      exito: true,
      mensaje: 'Todos los inscriptos y sus datos asociados fueron eliminados correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/inscriptos');
  }
}
