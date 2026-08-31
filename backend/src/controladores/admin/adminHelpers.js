export function manejarErrorAdmin(res, error, contexto) {
  if (error.code === 'POSTGRES_NO_CONFIGURADO') {
    return res.status(503).json({
      exito: false,
      mensaje: 'PostgreSQL todavía no está configurado en este entorno.',
      detalle: error.message
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      exito: false,
      mensaje: error.message || `No se pudo procesar la operacion de ${contexto}.`
    });
  }

  console.error(`Error en ${contexto}:`, error);
  return res.status(500).json({
    exito: false,
    mensaje: `No se pudo procesar la operación de ${contexto}.`,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
