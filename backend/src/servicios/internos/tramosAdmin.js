import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

export async function obtenerTramosAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT pe, etapa, desde, hasta, kms, hora, estado
    FROM tramos
    ORDER BY pe ASC
  `);

  return resultado.rows;
}

export async function obtenerTramoAdminPorPe(pe) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT pe, etapa, desde, hasta, kms, hora, estado
    FROM tramos
    WHERE pe = $1
  `, [pe]);

  return resultado.rows[0] || null;
}

export async function guardarTramoAdmin(tramo) {
  const pool = obtenerPoolPostgres();
  const peOriginal = tramo.peOriginal !== undefined && tramo.peOriginal !== null
    ? Number(tramo.peOriginal)
    : null;

  if (peOriginal === null) {
    const existente = await obtenerTramoAdminPorPe(tramo.pe);
    if (existente) {
      const error = new Error(`Ya existe un tramo con PE ${tramo.pe}.`);
      error.code = 'TRAMO_DUPLICADO';
      throw error;
    }
  } else if (peOriginal !== tramo.pe) {
    const existente = await obtenerTramoAdminPorPe(tramo.pe);
    if (existente) {
      const error = new Error(`Ya existe un tramo con PE ${tramo.pe}.`);
      error.code = 'TRAMO_DUPLICADO';
      throw error;
    }
  }

  const resultado = peOriginal !== null
    ? await pool.query(`
      UPDATE tramos
      SET pe = $1, etapa = $2, desde = $3, hasta = $4, kms = $5, hora = $6, estado = $7
      WHERE pe = $8
      RETURNING pe, etapa, desde, hasta, kms, hora, estado
    `, [
      tramo.pe,
      tramo.etapa,
      tramo.desde,
      tramo.hasta,
      tramo.kms,
      tramo.hora,
      tramo.estado,
      peOriginal
    ])
    : await pool.query(`
      INSERT INTO tramos (pe, etapa, desde, hasta, kms, hora, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING pe, etapa, desde, hasta, kms, hora, estado
    `, [
      tramo.pe,
      tramo.etapa,
      tramo.desde,
      tramo.hasta,
      tramo.kms,
      tramo.hora,
      tramo.estado
    ]);

  return resultado.rows[0];
}

export async function eliminarTramoAdmin(pe) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    DELETE FROM tramos
    WHERE pe = $1
    RETURNING pe, etapa, desde, hasta, kms, hora, estado
  `, [pe]);

  return resultado.rows[0] || null;
}
