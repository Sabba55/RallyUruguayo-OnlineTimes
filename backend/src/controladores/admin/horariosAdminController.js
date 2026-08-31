import {
  eliminarHorariosPorEtapaAdmin,
  eliminarHorarioAdmin,
  guardarHorarioAdmin,
  guardarLoteHorariosAdmin,
  obtenerHorarioAdminPorEtapaYNro,
  obtenerHorariosAdmin,
  obtenerHorariosAdminPorEtapa,
  obtenerHorariosPublicadosAdmin,
  publicarHorariosPorEtapaAdmin
} from '../../servicios/internos/horariosAdmin.js';
import {
  validarHorarioAdmin,
  validarLoteHorariosAdmin
} from '../../validaciones/horariosAdminValidacion.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerHorarios(req, res) {
  try {
    const horarios = await obtenerHorariosAdmin();
    const publicados = await obtenerHorariosPublicadosAdmin();

    return res.json({
      exito: true,
      datos: horarios,
      publicados,
      cantidad: horarios.length
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function obtenerHorariosPorEtapa(req, res) {
  try {
    const etapa = Number(req.params.etapa);
    const horarios = await obtenerHorariosAdminPorEtapa(etapa);

    return res.json({
      exito: true,
      datos: horarios,
      cantidad: horarios.length,
      etapa
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function obtenerHorarioPorEtapaYNro(req, res) {
  try {
    const etapa = Number(req.params.etapa);
    const nro = Number(req.params.nro);
    const horario = await obtenerHorarioAdminPorEtapaYNro(etapa, nro);

    if (!horario) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un horario para la etapa ${req.params.etapa} y el numero ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      datos: horario
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function guardarHorario(req, res) {
  const datosEntrada = {
    ...req.body,
    etapa: req.body.etapa ?? req.params.etapa,
    nro: req.body.nro ?? req.params.nro,
    etapaOriginal: req.body.etapaOriginal ?? req.params.etapa ?? null,
    nroOriginal: req.body.nroOriginal ?? req.params.nro ?? null
  };

  const validacion = validarHorarioAdmin(datosEntrada);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos enviados para Horarios no son validos.',
      errores: validacion.errores
    });
  }

  try {
    const horario = await guardarHorarioAdmin(validacion.datosNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Horario guardado correctamente.',
      datos: horario
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function guardarLoteHorarios(req, res) {
  const validacion = validarLoteHorariosAdmin(req.body.items, req.body.etapa);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'El lote de horarios no es valido.',
      errores: validacion.errores
    });
  }

  try {
    const resultado = await guardarLoteHorariosAdmin(validacion.itemsNormalizados);

    return res.json({
      exito: true,
      mensaje: 'Lote de horarios guardado correctamente.',
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function eliminarHorario(req, res) {
  try {
    const etapa = Number(req.params.etapa);
    const nro = Number(req.params.nro);
    const horarioEliminado = await eliminarHorarioAdmin(etapa, nro);

    if (!horarioEliminado) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un horario para la etapa ${req.params.etapa} y el numero ${req.params.nro}.`
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Horario eliminado correctamente.',
      datos: horarioEliminado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function eliminarHorariosPorEtapa(req, res) {
  try {
    const etapa = Number(req.params.etapa);
    const resultado = await eliminarHorariosPorEtapaAdmin(etapa);

    return res.json({
      exito: true,
      mensaje: `Se eliminaron ${resultado.eliminados} horarios de la etapa ${etapa}.`,
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}

export async function publicarHorariosPorEtapa(req, res) {
  try {
    const etapa = Number(req.params.etapa);
    const resultado = await publicarHorariosPorEtapaAdmin(etapa);

    return res.json({
      exito: true,
      mensaje: `Se publicaron ${resultado.publicados} horarios de la etapa ${etapa}.`,
      datos: resultado
    });
  } catch (error) {
    return manejarErrorAdmin(res, error, 'admin/horarios');
  }
}
