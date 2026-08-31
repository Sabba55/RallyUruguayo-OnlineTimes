import { obtenerPoolPostgres } from '../infraestructura/postgres.js';

export async function obtenerPenalizacionesAdmin() {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT
      p.id_penal,
      p.nro,
      i.piloto,
      i.navegante,
      i.clase,
      p.peocurrido,
      p.tiempo,
      p.motivo,
      p.control
    FROM penalizaciones p
    LEFT JOIN inscriptos i ON i.nro = p.nro
    ORDER BY peocurrido ASC, nro ASC, id_penal ASC
  `);

  return resultado.rows;
}

export async function obtenerPenalizacionAdminPorId(idPenal) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    SELECT
      p.id_penal,
      p.nro,
      i.piloto,
      i.navegante,
      i.clase,
      p.peocurrido,
      p.tiempo,
      p.motivo,
      p.control
    FROM penalizaciones p
    LEFT JOIN inscriptos i ON i.nro = p.nro
    WHERE p.id_penal = $1
  `, [idPenal]);

  return resultado.rows[0] || null;
}

export async function crearPenalizacionAdmin(penalizacion) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    INSERT INTO penalizaciones (nro, peocurrido, tiempo, motivo, control)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id_penal
  `, [
    penalizacion.nro,
    penalizacion.peocurrido,
    penalizacion.tiempo,
    penalizacion.motivo,
    penalizacion.control
  ]);

  return obtenerPenalizacionAdminPorId(resultado.rows[0].id_penal);
}

export async function actualizarPenalizacionAdmin(penalizacion) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    UPDATE penalizaciones
    SET
      nro = $2,
      peocurrido = $3,
      tiempo = $4,
      motivo = $5,
      control = $6
    WHERE id_penal = $1
    RETURNING id_penal
  `, [
    penalizacion.id_penal,
    penalizacion.nro,
    penalizacion.peocurrido,
    penalizacion.tiempo,
    penalizacion.motivo,
    penalizacion.control
  ]);

  if (!resultado.rows[0]) {
    return null;
  }

  return obtenerPenalizacionAdminPorId(resultado.rows[0].id_penal);
}

export async function eliminarPenalizacionAdmin(idPenal) {
  const pool = obtenerPoolPostgres();
  const resultado = await pool.query(`
    DELETE FROM penalizaciones
    WHERE id_penal = $1
    RETURNING id_penal, nro, peocurrido, tiempo, motivo, control
  `, [idPenal]);

  return resultado.rows[0] || null;
}
