import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

export async function obtenerRallyAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT id_rally, nombre, subtitulo, en_carrera
    FROM rally
    ORDER BY id_rally ASC
    LIMIT 1
  `);

  return resultado.rows[0] || null;
}

export async function guardarRallyAdmin(rally) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    INSERT INTO rally (id_rally, nombre, subtitulo, en_carrera)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_rally)
    DO UPDATE SET
      nombre = EXCLUDED.nombre,
      subtitulo = EXCLUDED.subtitulo,
      en_carrera = EXCLUDED.en_carrera
    RETURNING id_rally, nombre, subtitulo, en_carrera
  `, [
    rally.id_rally,
    rally.nombre,
    rally.subtitulo,
    rally.en_carrera || 'no'
  ]);

  return resultado.rows[0];
}
