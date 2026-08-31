import { Pool } from 'pg';

let pool = null;

function obtenerConfiguracionConexion() {
  if (process.env.POSTGRES_URL) {
    return {
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }

  if (
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_DB &&
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD
  ) {
    return {
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }

  return null;
}

export function postgresEstaConfigurado() {
  return Boolean(obtenerConfiguracionConexion());
}

export function obtenerPoolPostgres() {
  if (pool) {
    return pool;
  }

  const configuracion = obtenerConfiguracionConexion();

  if (!configuracion) {
    const error = new Error(
      'PostgreSQL no está configurado. Definí POSTGRES_URL o POSTGRES_HOST/POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD.'
    );
    error.code = 'POSTGRES_NO_CONFIGURADO';
    throw error;
  }

  pool = new Pool(configuracion);
  return pool;
}

export async function probarConexionPostgres() {
  const cliente = await obtenerPoolPostgres().connect();

  try {
    await cliente.query('SELECT 1');
    return true;
  } finally {
    cliente.release();
  }
}
