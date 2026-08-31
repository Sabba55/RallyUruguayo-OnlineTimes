import { obtenerRallyAdmin, guardarRallyAdmin } from '../../servicios/internos/rallyAdmin.js';
import {
  eliminarChapaRally,
  existeArchivoChapaRally,
  guardarChapaRallyDesdeBase64,
  obtenerEstadoChapaRally,
  obtenerRutaChapaRally
} from '../../servicios/infraestructura/chapaRally.js';
import { postgresEstaConfigurado, probarConexionPostgres } from '../../servicios/infraestructura/postgres.js';
import { validarRallyAdmin } from '../../validaciones/rallyAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerRally(req, res) {
  try {
    const rally = await obtenerRallyAdmin();

    return res.json({
      exito: true,
      datos: rally
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally');
  }
}

export async function guardarRally(req, res) {
  const validacion = validarRallyAdmin(req.body);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Rally no son válidos.',
      errores: validacion.errores
    });
  }

  try {
    const rally = await guardarRallyAdmin(validacion.datosNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Rally guardado correctamente.',
      datos: rally
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally');
  }
}

export async function obtenerEstadoAdmin(req, res) {
  try {
    const postgresConfigurado = postgresEstaConfigurado();
    const postgresConectado = postgresConfigurado ? await probarConexionPostgres() : false;

    return res.json({
      exito: true,
      datos: {
        modulo: 'admin',
        postgres_configurado: postgresConfigurado,
        postgres_conectado: postgresConectado
      }
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/estado');
  }
}

export async function obtenerEstadoChapa(req, res) {
  try {
    const estado = await obtenerEstadoChapaRally();

    return res.json({
      exito: true,
      datos: estado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally/chapa');
  }
}

export async function guardarChapa(req, res) {
  try {
    const { imagenBase64 } = req.body || {};

    const estado = await guardarChapaRallyDesdeBase64(imagenBase64);

    return res.json({
      exito: true,
      mensaje: 'La chapa del rally se guardo correctamente.',
      datos: estado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally/chapa');
  }
}

export async function eliminarChapa(req, res) {
  try {
    const estado = await eliminarChapaRally();

    return res.json({
      exito: true,
      mensaje: 'La chapa del rally se elimino correctamente.',
      datos: estado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally/chapa');
  }
}

export async function descargarChapa(req, res) {
  try {
    if (!existeArchivoChapaRally()) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay una chapa de rally cargada.'
      });
    }

    return res.sendFile(obtenerRutaChapaRally(), {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/rally/chapa/archivo');
  }
}
