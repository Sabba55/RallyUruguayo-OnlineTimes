import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import rutas from './rutas/index.js';
import { validarVariablesDeEntorno } from './configuracion/validarEntorno.js';

dotenv.config();
validarVariablesDeEntorno();

const app = express();
const PORT = process.env.PORT || 5000;

const ORIGENES_PERMITIDOS = Array.from(new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...((process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean))
]));

app.use(cors({
  origin: ORIGENES_PERMITIDOS,
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'X-Pdf-Filename']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('trust proxy', 1);
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets'), {
  immutable: false,
  maxAge: 0
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 250,
  message: { exito: false, mensaje: 'Demasiadas peticiones, intenta de nuevo en 1 minuto' }
});
app.use('/api/', limiter);

app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=30');
  next();
});

app.use('/api', rutas);

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Rally Argentino - Backend de Tiempos en Vivo',
    estado: 'activo',
    version: '1.0.0',
    api_url: '/api',
    documentacion: 'Visita /api para ver todos los endpoints disponibles'
  });
});

app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
    ruta_solicitada: req.path,
    metodo: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      exito: false,
      mensaje: 'El archivo o formulario enviado es demasiado grande. Intenta con una imagen mas liviana.'
    });
  }

  const statusCode = Number(err?.statusCode) || 500;

  res.status(statusCode).json({
    exito: false,
    mensaje: err?.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error del servidor'
  });
});

app.listen(PORT, () => {
  console.clear();
  console.log('===================================================');
  console.log('RALLY ARGENTINO - BACKEND DE TIEMPOS EN VIVO');
  console.log('===================================================');
  console.log('\n✅ Servidor iniciado correctamente');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`\n⏰ Fecha de inicio: ${new Date().toLocaleString('es-AR')}`);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Senal SIGTERM recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ Servidor detenido por el usuario (Ctrl+C)');
  process.exit(0);
});

export default app;
