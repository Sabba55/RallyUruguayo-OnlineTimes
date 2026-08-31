import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

const CAMPOS_SHAKEDOWN = `
  i.nro,
  i.piloto,
  i.navegante,
  i.vehiculo,
  i.clase,
  s.hlv1,
  s.tv1,
  s.v1,
  s.hlv2,
  s.tv2,
  s.v2,
  s.hlv3,
  s.tv3,
  s.v3
`;

export async function obtenerShakedownAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${CAMPOS_SHAKEDOWN}
    FROM inscriptos i
    LEFT JOIN shakedown s ON s.nro = i.nro
    ORDER BY i.nro ASC
  `);

  return resultado.rows;
}

export async function obtenerShakedownAdminPorNro(nro) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${CAMPOS_SHAKEDOWN}
    FROM inscriptos i
    LEFT JOIN shakedown s ON s.nro = i.nro
    WHERE i.nro = $1
  `, [nro]);

  return resultado.rows[0] || null;
}

export async function guardarShakedownAdmin(shakedown) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    INSERT INTO shakedown (
      nro, hlv1, tv1, v1, hlv2, tv2, v2, hlv3, tv3, v3
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (nro)
    DO UPDATE SET
      hlv1 = EXCLUDED.hlv1,
      tv1 = EXCLUDED.tv1,
      v1 = EXCLUDED.v1,
      hlv2 = EXCLUDED.hlv2,
      tv2 = EXCLUDED.tv2,
      v2 = EXCLUDED.v2,
      hlv3 = EXCLUDED.hlv3,
      tv3 = EXCLUDED.tv3,
      v3 = EXCLUDED.v3
    RETURNING nro
  `, [
    shakedown.nro,
    shakedown.hlv1,
    shakedown.tv1,
    shakedown.v1,
    shakedown.hlv2,
    shakedown.tv2,
    shakedown.v2,
    shakedown.hlv3,
    shakedown.tv3,
    shakedown.v3
  ]);

  return obtenerShakedownAdminPorNro(resultado.rows[0].nro);
}

async function guardarShakedownEnTransaccion(cliente, shakedown) {
  await cliente.query(`
    INSERT INTO shakedown (
      nro, hlv1, tv1, v1, hlv2, tv2, v2, hlv3, tv3, v3
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (nro)
    DO UPDATE SET
      hlv1 = EXCLUDED.hlv1,
      tv1 = EXCLUDED.tv1,
      v1 = EXCLUDED.v1,
      hlv2 = EXCLUDED.hlv2,
      tv2 = EXCLUDED.tv2,
      v2 = EXCLUDED.v2,
      hlv3 = EXCLUDED.hlv3,
      tv3 = EXCLUDED.tv3,
      v3 = EXCLUDED.v3
  `, [
    shakedown.nro,
    shakedown.hlv1,
    shakedown.tv1,
    shakedown.v1,
    shakedown.hlv2,
    shakedown.tv2,
    shakedown.v2,
    shakedown.hlv3,
    shakedown.tv3,
    shakedown.v3
  ]);
}

export async function guardarLoteShakedownAdmin(items) {
  const pool = obtenerPoolPostgres();
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    for (const item of items) {
      await guardarShakedownEnTransaccion(cliente, item);
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

export async function eliminarShakedownAdmin(nro) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    DELETE FROM shakedown
    WHERE nro = $1
    RETURNING nro, hlv1, tv1, v1, hlv2, tv2, v2, hlv3, tv3, v3
  `, [nro]);

  return resultado.rows[0] || null;
}
