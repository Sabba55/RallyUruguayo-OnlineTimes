import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

function esEstadoCancelado(estado) {
  return String(estado || '').trim().toLowerCase() === 'cancelado';
}

function construirFilaTiempo(inscripto, resumenCompetidor, registrosPorNro, tramos) {
  const fila = {
    nro: inscripto.nro,
    piloto: inscripto.piloto,
    navegante: inscripto.navegante,
    vehiculo: inscripto.vehiculo,
    clase: inscripto.clase,
    finalizo: resumenCompetidor?.finalizo || ''
  };

  const registros = registrosPorNro.get(inscripto.nro) || new Map();

  tramos.forEach((tramo) => {
    const registro = registros.get(tramo.pe);
    fila[`hlpe${tramo.pe}`] = registro?.hlpe || '';
    fila[`tpe${tramo.pe}`] = registro?.tpe || '';
    fila[`pe${tramo.pe}`] = registro?.pe_tiempo || (esEstadoCancelado(tramo.estado) ? '0:00.000' : '');
  });

  return fila;
}

async function obtenerTramosTiempos(pool) {
  const resultado = await pool.query(`
    SELECT pe, etapa, desde, hasta, kms, hora, estado
    FROM tramos
    WHERE pe > 0
    ORDER BY pe ASC
  `);

  return resultado.rows;
}

function crearErrorAdmin(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function registroTieneDatos(registro) {
  if (!registro) {
    return false;
  }

  return Boolean(
    String(registro.hlpe || '').trim() ||
    String(registro.tpe || '').trim() ||
    String(registro.pe_tiempo || '').trim()
  );
}

function registroSiguePendientePorAbandono(registro) {
  if (!registro) {
    return true;
  }

  return !String(registro.tpe || '').trim() && !String(registro.pe_tiempo || '').trim();
}

async function obtenerAbandonosAdminDesdePool(pool) {
  const resultado = await pool.query(`
    SELECT nro, etapa, pes_pendientes, created_at, updated_at
    FROM abandono_competidores
    ORDER BY etapa ASC, nro ASC
  `);

  return resultado.rows.map((fila) => ({
    nro: fila.nro,
    etapa: fila.etapa,
    pes_pendientes: Array.isArray(fila.pes_pendientes) ? fila.pes_pendientes : [],
    created_at: fila.created_at,
    updated_at: fila.updated_at
  }));
}

export async function obtenerTiemposAdmin() {
  const pool = obtenerPoolPostgres();

  const [inscriptosResult, tramos, resumenResult, tiemposResult, abandonos] = await Promise.all([
    pool.query(`
      SELECT nro, piloto, navegante, vehiculo, clase
      FROM inscriptos
      ORDER BY nro ASC
    `),
    obtenerTramosTiempos(pool),
    pool.query(`
      SELECT nro, finalizo
      FROM tiempos_competidores
    `),
    pool.query(`
      SELECT nro, pe, hlpe, tpe, pe_tiempo
      FROM tiempos_tramos
      ORDER BY nro ASC, pe ASC
    `),
    obtenerAbandonosAdminDesdePool(pool)
  ]);

  const resumenPorNro = new Map(
    resumenResult.rows.map((fila) => [fila.nro, fila])
  );

  const registrosPorNro = new Map();
  tiemposResult.rows.forEach((registro) => {
    if (!registrosPorNro.has(registro.nro)) {
      registrosPorNro.set(registro.nro, new Map());
    }
    registrosPorNro.get(registro.nro).set(registro.pe, registro);
  });

  return {
    columnas: tramos.map((tramo) => ({
      pe: tramo.pe,
      etapa: tramo.etapa,
      desde: tramo.desde,
      hasta: tramo.hasta,
      kms: tramo.kms,
      hora: tramo.hora,
      estado: tramo.estado
    })),
    datos: inscriptosResult.rows.map((inscripto) => (
      construirFilaTiempo(
        inscripto,
        resumenPorNro.get(inscripto.nro),
        registrosPorNro,
        tramos
      )
    )),
    abandonos
  };
}

export async function obtenerTiempoCompetidorAdminPorNro(nro) {
  const pool = obtenerPoolPostgres();

  const [inscriptoResult, tramos, resumenResult, tiemposResult] = await Promise.all([
    pool.query(`
      SELECT nro, piloto, navegante, vehiculo, clase
      FROM inscriptos
      WHERE nro = $1
    `, [nro]),
    obtenerTramosTiempos(pool),
    pool.query(`
      SELECT nro, finalizo
      FROM tiempos_competidores
      WHERE nro = $1
    `, [nro]),
    pool.query(`
      SELECT nro, pe, hlpe, tpe, pe_tiempo
      FROM tiempos_tramos
      WHERE nro = $1
      ORDER BY pe ASC
    `, [nro])
  ]);

  const inscripto = inscriptoResult.rows[0];
  if (!inscripto) {
    return null;
  }

  const registros = new Map(
    tiemposResult.rows.map((registro) => [registro.pe, registro])
  );

  return {
    columnas: tramos.map((tramo) => ({
      pe: tramo.pe,
      etapa: tramo.etapa,
      desde: tramo.desde,
      hasta: tramo.hasta,
      kms: tramo.kms,
      hora: tramo.hora,
      estado: tramo.estado
    })),
    datos: construirFilaTiempo(
      inscripto,
      resumenResult.rows[0],
      new Map([[nro, registros]]),
      tramos
    )
  };
}

async function guardarTiempoCompetidorEnTransaccion(cliente, tiempo) {
  await cliente.query(`
    INSERT INTO tiempos_competidores (nro, finalizo)
    VALUES ($1, $2)
    ON CONFLICT (nro)
    DO UPDATE SET
      finalizo = EXCLUDED.finalizo
  `, [tiempo.nro, tiempo.finalizo || '']);

  await cliente.query(`
    DELETE FROM tiempos_tramos
    WHERE nro = $1
  `, [tiempo.nro]);

  for (const registro of tiempo.registros) {
    await cliente.query(`
      INSERT INTO tiempos_tramos (nro, pe, hlpe, tpe, pe_tiempo)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      tiempo.nro,
      registro.pe,
      registro.hlpe,
      registro.tpe,
      registro.pe_tiempo
    ]);
  }
}

export async function guardarTiempoCompetidorAdmin(tiempo) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');
    await guardarTiempoCompetidorEnTransaccion(cliente, tiempo);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  return obtenerTiempoCompetidorAdminPorNro(tiempo.nro);
}

export async function guardarLoteTiemposAdmin(items) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    for (const item of items) {
      await guardarTiempoCompetidorEnTransaccion(cliente, item);
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

export async function registrarAbandonoTiempoAdmin({ nro, etapa }) {
  const pool = obtenerPoolPostgres();
  const nroNormalizado = Number(nro);
  const etapaNormalizada = Number(etapa);

  if (!Number.isInteger(nroNormalizado) || nroNormalizado <= 0) {
    throw crearErrorAdmin('El numero del piloto es invalido.');
  }

  if (!Number.isInteger(etapaNormalizada) || etapaNormalizada <= 0) {
    throw crearErrorAdmin('La etapa seleccionada es invalida.');
  }

  const [inscriptoResult, tramosResult, tiemposResult] = await Promise.all([
    pool.query(`
      SELECT nro
      FROM inscriptos
      WHERE nro = $1
    `, [nroNormalizado]),
    pool.query(`
      SELECT pe
      FROM tramos
      WHERE pe > 0 AND etapa = $1
      ORDER BY pe ASC
    `, [etapaNormalizada]),
    pool.query(`
      SELECT tt.pe, tt.hlpe, tt.tpe, tt.pe_tiempo
      FROM tiempos_tramos tt
      INNER JOIN tramos t ON t.pe = tt.pe
      WHERE tt.nro = $1 AND t.etapa = $2
      ORDER BY tt.pe ASC
    `, [nroNormalizado, etapaNormalizada])
  ]);

  if (!inscriptoResult.rows.length) {
    throw crearErrorAdmin(`No existe un piloto con numero ${nroNormalizado}.`, 404);
  }

  if (!tramosResult.rows.length) {
    throw crearErrorAdmin(`La etapa ${etapaNormalizada} no tiene PEs cargados.`);
  }

  const registrosPorPe = new Map(tiemposResult.rows.map((registro) => [registro.pe, registro]));
  const pesPendientes = tramosResult.rows
    .map((tramo) => Number(tramo.pe))
    .filter((pe) => registroSiguePendientePorAbandono(registrosPorPe.get(pe)));

  if (!pesPendientes.length) {
    throw crearErrorAdmin(`El piloto #${nroNormalizado} no tiene PEs pendientes vacios en la etapa ${etapaNormalizada}.`);
  }

  const resultado = await pool.query(`
    INSERT INTO abandono_competidores (nro, etapa, pes_pendientes)
    VALUES ($1, $2, $3::integer[])
    ON CONFLICT (nro, etapa)
    DO UPDATE SET
      pes_pendientes = EXCLUDED.pes_pendientes,
      updated_at = NOW()
    RETURNING nro, etapa, pes_pendientes, created_at, updated_at
  `, [nroNormalizado, etapaNormalizada, pesPendientes]);

  const fila = resultado.rows[0];

  return {
    nro: fila.nro,
    etapa: fila.etapa,
    pes_pendientes: Array.isArray(fila.pes_pendientes) ? fila.pes_pendientes : [],
    created_at: fila.created_at,
    updated_at: fila.updated_at
  };
}

export async function eliminarAbandonoTiempoAdmin({ nro, etapa }) {
  const pool = obtenerPoolPostgres();
  const nroNormalizado = Number(nro);
  const etapaNormalizada = Number(etapa);

  const abandonoResult = await pool.query(`
    SELECT nro, etapa, pes_pendientes
    FROM abandono_competidores
    WHERE nro = $1 AND etapa = $2
  `, [nroNormalizado, etapaNormalizada]);

  const abandono = abandonoResult.rows[0];

  if (!abandono) {
    throw crearErrorAdmin(`No existe un abandono registrado para el auto #${nroNormalizado} en la etapa ${etapaNormalizada}.`, 404);
  }

  const pesPendientes = Array.isArray(abandono.pes_pendientes) ? abandono.pes_pendientes : [];

  if (pesPendientes.length) {
    const tiemposConDatosResult = await pool.query(`
      SELECT 1
      FROM tiempos_tramos
      WHERE nro = $1
        AND pe = ANY($2::integer[])
        AND (
          COALESCE(hlpe, '') <> '' OR
          COALESCE(tpe, '') <> '' OR
          COALESCE(pe_tiempo, '') <> ''
        )
      LIMIT 1
    `, [nroNormalizado, pesPendientes]);

    if (tiemposConDatosResult.rows.length) {
      throw crearErrorAdmin(`No se puede borrar el abandono del auto #${nroNormalizado} porque ya tiene tiempos cargados en la etapa ${etapaNormalizada}.`);
    }
  }

  await pool.query(`
    DELETE FROM abandono_competidores
    WHERE nro = $1 AND etapa = $2
  `, [nroNormalizado, etapaNormalizada]);

  return {
    nro: nroNormalizado,
    etapa: etapaNormalizada,
    eliminado: true
  };
}
