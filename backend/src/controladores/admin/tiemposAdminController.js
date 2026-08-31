import {
  eliminarAbandonoTiempoAdmin,
  guardarLoteTiemposAdmin,
  registrarAbandonoTiempoAdmin,
  guardarTiempoCompetidorAdmin,
  obtenerTiempoCompetidorAdminPorNro,
  obtenerTiemposAdmin
} from '../../servicios/internos/tiemposAdmin.js';
import {
  validarLoteTiemposAdmin,
  validarTiempoCompetidorAdmin
} from '../../validaciones/tiemposAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerTiempos(req, res) {
  try {
    const tiempos = await obtenerTiemposAdmin();

    return res.json({
      exito: true,
      columnas: tiempos.columnas,
      datos: tiempos.datos,
      abandonos: tiempos.abandonos || [],
      cantidad: tiempos.datos.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos');
  }
}

export async function obtenerTiempoPorCompetidor(req, res) {
  try {
    const nro = Number(req.params.nro);
    const tiempo = await obtenerTiempoCompetidorAdminPorNro(nro);

    if (!tiempo) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un competidor con número ${req.params.nro} en Inscriptos.`
      });
    }

    return res.json({
      exito: true,
      columnas: tiempo.columnas,
      datos: tiempo.datos
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos');
  }
}

export async function guardarTiempoCompetidor(req, res) {
  const datosEntrada = {
    ...req.body,
    nro: req.params.nro ?? req.body.nro
  };

  const validacion = validarTiempoCompetidorAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Tiempos no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const tiempo = await guardarTiempoCompetidorAdmin(validacion.datosNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Fila de tiempos guardada correctamente.',
      columnas: tiempo.columnas,
      datos: tiempo.datos
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos');
  }
}

export async function guardarLoteTiempos(req, res) {
  const validacion = validarLoteTiemposAdmin(req.body.items);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El lote de tiempos no es válido.',
      errores: validacion.errores
    });
  }

  try {
    const resultado = await guardarLoteTiemposAdmin(validacion.itemsNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Lote de tiempos guardado correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos');
  }
}

export async function registrarAbandonoTiempo(req, res) {
  try {
    const abandono = await registrarAbandonoTiempoAdmin(req.body);

    return res.json({
      exito: true,
      mensaje: 'Abandono registrado correctamente.',
      datos: abandono
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos/abandonos');
  }
}

export async function eliminarAbandonoTiempo(req, res) {
  try {
    const resultado = await eliminarAbandonoTiempoAdmin({
      nro: req.params.nro,
      etapa: req.params.etapa
    });

    return res.json({
      exito: true,
      mensaje: 'Abandono eliminado correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/tiempos/abandonos');
  }
}
