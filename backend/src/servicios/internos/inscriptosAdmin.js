import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

const TABLAS_RELACIONADAS_POR_NRO = [
  'shakedown',
  'tiempos_tramos',
  'tiempos_competidores',
  'abandono_competidores',
  'horarios_largada',
  'penalizaciones'
];

export async function obtenerInscriptosAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT nro, piloto, navegante, vehiculo, clase, nac
    FROM inscriptos
    ORDER BY nro ASC
  `);

  return resultado.rows;
}

export async function obtenerInscriptoAdminPorNro(nro) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT nro, piloto, navegante, vehiculo, clase, nac
    FROM inscriptos
    WHERE nro = $1
  `, [nro]);

  return resultado.rows[0] || null;
}

async function actualizarNroRelacionadoEnTransaccion(cliente, tabla, nroOriginal, nroNuevo) {
  await cliente.query(
    `UPDATE ${tabla} SET nro = $1 WHERE nro = $2`,
    [nroNuevo, nroOriginal]
  );
}

async function renumerarInscriptoEnTransaccion(cliente, inscripto) {
  const nroOriginal = Number(inscripto.nroOriginal);
  const nroNuevo = Number(inscripto.nro);

  const originalResult = await cliente.query(
    'SELECT nro FROM inscriptos WHERE nro = $1',
    [nroOriginal]
  );

  if (!originalResult.rows.length) {
    const error = new Error(`No existe un inscripto con el numero ${nroOriginal}.`);
    error.code = 'INSCRIPTO_NO_EXISTE';
    throw error;
  }

  const destinoResult = await cliente.query(
    'SELECT nro FROM inscriptos WHERE nro = $1',
    [nroNuevo]
  );

  if (destinoResult.rows.length) {
    const error = new Error(`Ya existe un inscripto con el numero ${nroNuevo}.`);
    error.code = 'INSCRIPTO_NRO_DUPLICADO';
    throw error;
  }

  await cliente.query(
    `
      UPDATE inscriptos
      SET nro = $1,
          piloto = $2,
          navegante = $3,
          vehiculo = $4,
          clase = $5,
          nac = $6
      WHERE nro = $7
    `,
    [
      nroNuevo,
      inscripto.piloto,
      inscripto.navegante,
      inscripto.vehiculo,
      inscripto.clase,
      inscripto.nac,
      nroOriginal
    ]
  );

  for (const tabla of TABLAS_RELACIONADAS_POR_NRO) {
    await actualizarNroRelacionadoEnTransaccion(cliente, tabla, nroOriginal, nroNuevo);
  }

  const resultado = await cliente.query(`
    SELECT nro, piloto, navegante, vehiculo, clase, nac
    FROM inscriptos
    WHERE nro = $1
  `, [nroNuevo]);

  return resultado.rows[0] || null;
}

async function upsertInscriptoEnTransaccion(cliente, inscripto) {
  const resultado = await cliente.query(`
    INSERT INTO inscriptos (nro, piloto, navegante, vehiculo, clase, nac)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (nro)
    DO UPDATE SET
      piloto = EXCLUDED.piloto,
      navegante = EXCLUDED.navegante,
      vehiculo = EXCLUDED.vehiculo,
      clase = EXCLUDED.clase,
      nac = EXCLUDED.nac
    RETURNING nro, piloto, navegante, vehiculo, clase, nac
  `, [
    inscripto.nro,
    inscripto.piloto,
    inscripto.navegante,
    inscripto.vehiculo,
    inscripto.clase,
    inscripto.nac
  ]);

  return resultado.rows[0];
}

export async function guardarInscriptoAdmin(inscripto) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const debeRenumerar =
      Number.isInteger(Number(inscripto.nroOriginal)) &&
      Number(inscripto.nroOriginal) > 0 &&
      Number(inscripto.nroOriginal) !== Number(inscripto.nro);

    const resultado = debeRenumerar
      ? await renumerarInscriptoEnTransaccion(cliente, inscripto)
      : await upsertInscriptoEnTransaccion(cliente, inscripto);

    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function guardarInscriptoEnTransaccion(cliente, inscripto) {
  await cliente.query(`
    INSERT INTO inscriptos (nro, piloto, navegante, vehiculo, clase, nac)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (nro)
    DO UPDATE SET
      piloto = EXCLUDED.piloto,
      navegante = EXCLUDED.navegante,
      vehiculo = EXCLUDED.vehiculo,
      clase = EXCLUDED.clase,
      nac = EXCLUDED.nac
  `, [
    inscripto.nro,
    inscripto.piloto,
    inscripto.navegante,
    inscripto.vehiculo,
    inscripto.clase,
    inscripto.nac
  ]);
}

export async function guardarLoteInscriptosAdmin(items) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    for (const item of items) {
      await guardarInscriptoEnTransaccion(cliente, item);
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

export async function eliminarInscriptoAdmin(nro) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const resultado = await cliente.query(`
      DELETE FROM inscriptos
      WHERE nro = $1
      RETURNING nro, piloto, navegante, vehiculo, clase, nac
    `, [nro]);

    const inscriptoEliminado = resultado.rows[0] || null;

    if (!inscriptoEliminado) {
      await cliente.query('ROLLBACK');
      return null;
    }

    await cliente.query('DELETE FROM shakedown WHERE nro = $1', [nro]);
    await cliente.query('DELETE FROM tiempos_tramos WHERE nro = $1', [nro]);
    await cliente.query('DELETE FROM tiempos_competidores WHERE nro = $1', [nro]);
    await cliente.query('DELETE FROM abandono_competidores WHERE nro = $1', [nro]);
    await cliente.query('DELETE FROM horarios_largada WHERE nro = $1', [nro]);
    await cliente.query('DELETE FROM penalizaciones WHERE nro = $1', [nro]);

    await cliente.query('COMMIT');
    return inscriptoEliminado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export async function eliminarTodosLosInscriptosAdmin() {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const totalResult = await cliente.query('SELECT COUNT(*)::int AS total FROM inscriptos');
    const total = totalResult.rows[0]?.total || 0;

    await cliente.query('DELETE FROM shakedown');
    await cliente.query('DELETE FROM tiempos_tramos');
    await cliente.query('DELETE FROM tiempos_competidores');
    await cliente.query('DELETE FROM abandono_competidores');
    await cliente.query('DELETE FROM horarios_largada');
    await cliente.query('DELETE FROM penalizaciones');
    await cliente.query('DELETE FROM inscriptos');

    await cliente.query('COMMIT');
    return { eliminados: total };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
