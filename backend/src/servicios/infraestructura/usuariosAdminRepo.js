import { obtenerPoolPostgres } from './postgres.js';

const COLUMNAS_USUARIO_ADMIN = `
  id,
  nombre,
  username,
  password_hash,
  activo,
  created_at,
  updated_at
`;

export async function obtenerUsuarioAdminPorUsername(username) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_USUARIO_ADMIN}
    FROM usuarios_admin
    WHERE LOWER(username) = LOWER($1)
    LIMIT 1
  `, [username]);

  return resultado.rows[0] || null;
}

export async function obtenerUsuarioAdminPorId(id) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT ${COLUMNAS_USUARIO_ADMIN}
    FROM usuarios_admin
    WHERE id = $1
    LIMIT 1
  `, [id]);

  return resultado.rows[0] || null;
}
