import express from 'express';
import rutasAdmin from './admin/index.js';
import rutasAuth from './auth/index.js';
import { requiereAuthAdmin } from '../middlewares/requiereAuthAdmin.js';
import {
  obtenerTodosLosTramos,
  obtenerInfoRally
} from '../controladores/tramosController.js';
import {
  obtenerInscriptos,
  obtenerHorariosEtapa1,
  obtenerHorariosEtapa2,
  obtenerPenalizaciones,
  obtenerTodosLosTiempos,
  obtenerTiemposPorCompetidor,
  obtenerShakedown
} from '../controladores/datosController.js';
import {
  obtenerTiemposClasesPorPE,
  obtenerTiemposEtapa2PorPE,
  obtenerTiemposGeneralPorPE
} from '../controladores/tiemposProcesadosController.js';
import { obtenerTramosCarrera } from '../controladores/tramosCarreraController.js';
import { obtenerShakedownProcesado } from '../controladores/shakedownProcesadoController.js';
import { obtenerTarjetaGanadores } from '../controladores/tarjetaGanadoresController.js';
import { obtenerCabeceraDashboard } from '../controladores/cabeceraDashboardController.js';

const router = express.Router();

router.use('/auth', rutasAuth);
router.use('/admin', requiereAuthAdmin, rutasAdmin);

router.get('/rally', obtenerInfoRally);
router.get('/tramos', obtenerTodosLosTramos);

router.get('/inscriptos', obtenerInscriptos);
router.get('/horarios/etapa1', obtenerHorariosEtapa1);
router.get('/horarios/etapa2', obtenerHorariosEtapa2);

router.get('/tiempos', obtenerTodosLosTiempos);
router.get('/tiempos/:nro', obtenerTiemposPorCompetidor);
router.get('/penalizaciones', obtenerPenalizaciones);
router.get('/shakedown', obtenerShakedown);

router.get('/v2/tiempos/general/pe/:pe', obtenerTiemposGeneralPorPE);
router.get('/v2/tiempos/clases/pe/:pe', obtenerTiemposClasesPorPE);
router.get('/v2/tiempos/etapa2/pe/:pe', obtenerTiemposEtapa2PorPE);
router.get('/v2/tramos/carrera', obtenerTramosCarrera);
router.get('/v2/shakedown', obtenerShakedownProcesado);
router.get('/v2/tarjeta-ganadores', obtenerTarjetaGanadores);
router.get('/v2/cabecera-dashboard', obtenerCabeceraDashboard);

router.get('/health', (req, res) => {
  res.json({
    exito: true,
    mensaje: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/', (req, res) => {
  res.json({
    nombre: 'Rally Argentino - API de Tiempos en Vivo',
    version: '1.0.0',
    estado: 'activo',
    endpoints: {
      admin: 'GET /api/admin',
      auth_login: 'POST /api/auth/login',
      auth_logout: 'POST /api/auth/logout',
      auth_me: 'GET /api/auth/me',
      rally: 'GET /api/rally',
      tramos: 'GET /api/tramos',
      inscriptos: 'GET /api/inscriptos',
      horarios_etapa1: 'GET /api/horarios/etapa1',
      horarios_etapa2: 'GET /api/horarios/etapa2',
      tiempos: 'GET /api/tiempos',
      tiempos_competidor: 'GET /api/tiempos/:nro',
      penalizaciones: 'GET /api/penalizaciones',
      shakedown: 'GET /api/shakedown',
      health: 'GET /api/health'
    }
  });
});

export default router;
