import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

const COLUMNAS_HORARIO = 'nro, etapa, piloto, navegante, vehiculo, clase, nac, hora';

export async function obtenerHorariosAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_HORARIO}
    FROM horarios_largada
    ORDER BY etapa ASC, hora ASC, nro ASC
  `);

  return resultado.rows;
}

export async function obtenerHorariosAdminPorEtapa(etapa) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_HORARIO}
    FROM horarios_largada
    WHERE etapa = $1
    ORDER BY hora ASC, nro ASC
  `, [etapa]);

  return resultado.rows;
}

export async function obtenerHorariosPublicadosAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_HORARIO}
    FROM horarios_largada_publicados
    ORDER BY etapa ASC, hora ASC, nro ASC
  `);

  return resultado.rows;
}

export async function obtenerHorarioAdminPorEtapaYNro(etapa, nro) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_HORARIO}
    FROM horarios_largada
    WHERE etapa = $1 AND nro = $2
  `, [etapa, nro]);

  return resultado.rows[0] || null;
}

async function upsertHorarioEnTransaccion(cliente, horario) {
  const resultado = await cliente.query(`
    INSERT INTO horarios_largada (nro, etapa, piloto, navegante, vehiculo, clase, nac, hora)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (nro, etapa)
    DO UPDATE SET
      piloto = EXCLUDED.piloto,
      navegante = EXCLUDED.navegante,
      vehiculo = EXCLUDED.vehiculo,
      clase = EXCLUDED.clase,
      nac = EXCLUDED.nac,
      hora = EXCLUDED.hora
    RETURNING ${COLUMNAS_HORARIO}
  `, [
    horario.nro,
    horario.etapa,
    horario.piloto,
    horario.navegante,
    horario.vehiculo,
    horario.clase,
    horario.nac,
    horario.hora
  ]);

  return resultado.rows[0];
}

async function renumerarHorarioEnTransaccion(cliente, horario) {
  const nroOriginal = Number(horario.nroOriginal);
  const etapaOriginal = Number(horario.etapaOriginal);
  const nroNuevo = Number(horario.nro);
  const etapaNueva = Number(horario.etapa);

  const originalResult = await cliente.query(
    'SELECT nro, etapa FROM horarios_largada WHERE etapa = $1 AND nro = $2',
    [etapaOriginal, nroOriginal]
  );

  if (!originalResult.rows.length) {
    const error = new Error(`No existe un horario para la etapa ${etapaOriginal} y el numero ${nroOriginal}.`);
    error.code = 'HORARIO_NO_EXISTE';
    throw error;
  }

  if (nroOriginal !== nroNuevo || etapaOriginal !== etapaNueva) {
    const destinoResult = await cliente.query(
      'SELECT nro, etapa FROM horarios_largada WHERE etapa = $1 AND nro = $2',
      [etapaNueva, nroNuevo]
    );

    if (destinoResult.rows.length) {
      const error = new Error(`Ya existe un horario para la etapa ${etapaNueva} y el numero ${nroNuevo}.`);
      error.code = 'HORARIO_DUPLICADO';
      throw error;
    }
  }

  const resultado = await cliente.query(`
    UPDATE horarios_largada
    SET nro = $1,
        etapa = $2,
        piloto = $3,
        navegante = $4,
        vehiculo = $5,
        clase = $6,
        nac = $7,
        hora = $8
    WHERE etapa = $9 AND nro = $10
    RETURNING ${COLUMNAS_HORARIO}
  `, [
    nroNuevo,
    etapaNueva,
    horario.piloto,
    horario.navegante,
    horario.vehiculo,
    horario.clase,
    horario.nac,
    horario.hora,
    etapaOriginal,
    nroOriginal
  ]);

  return resultado.rows[0] || null;
}

export async function guardarHorarioAdmin(horario) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const debeRenumerar =
      Number.isInteger(Number(horario.nroOriginal)) &&
      Number.isInteger(Number(horario.etapaOriginal)) &&
      (
        Number(horario.nroOriginal) !== Number(horario.nro) ||
        Number(horario.etapaOriginal) !== Number(horario.etapa)
      );

    const resultado = debeRenumerar
      ? await renumerarHorarioEnTransaccion(cliente, horario)
      : await upsertHorarioEnTransaccion(cliente, horario);

    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export async function guardarLoteHorariosAdmin(items) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    for (const item of items) {
      await upsertHorarioEnTransaccion(cliente, item);
    }

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return {
    actualizados: items.length
  };
}

export async function eliminarHorarioAdmin(etapa, nro) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    DELETE FROM horarios_largada
    WHERE etapa = $1 AND nro = $2
    RETURNING ${COLUMNAS_HORARIO}
  `, [etapa, nro]);

  return resultado.rows[0] || null;
}

export async function eliminarHorariosPorEtapaAdmin(etapa) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    DELETE FROM horarios_largada
    WHERE etapa = $1
    RETURNING ${COLUMNAS_HORARIO}
  `, [etapa]);

  return {
    eliminados: resultado.rowCount || 0,
    etapa
  };
}

export async function publicarHorariosPorEtapaAdmin(etapa) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    await cliente.query(`
      DELETE FROM horarios_largada_publicados
      WHERE etapa = $1
    `, [etapa]);

    const insercion = await cliente.query(`
      INSERT INTO horarios_largada_publicados (
        nro,
        etapa,
        piloto,
        navegante,
        vehiculo,
        clase,
        nac,
        hora
      )
      SELECT
        nro,
        etapa,
        piloto,
        navegante,
        vehiculo,
        clase,
        nac,
        hora
      FROM horarios_largada
      WHERE etapa = $1
    `, [etapa]);

    await cliente.query('COMMIT');

    return {
      publicados: insercion.rowCount || 0,
      etapa
    };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
