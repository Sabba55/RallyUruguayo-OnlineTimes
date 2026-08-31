import express from 'express';
import {
  descargarChapa,
  eliminarChapa,
  guardarRally,
  guardarChapa,
  obtenerEstadoChapa,
  obtenerEstadoAdmin,
  obtenerRally
} from '../../controladores/admin/rallyAdminController.js';
import {
  eliminarTodosLosInscriptos,
  eliminarInscripto,
  guardarLoteInscriptos,
  guardarInscripto,
  obtenerInscriptoPorNro,
  obtenerInscriptos
} from '../../controladores/admin/inscriptosAdminController.js';
import {
  eliminarTramo,
  guardarTramo,
  obtenerTramoPorPe,
  obtenerTramos
} from '../../controladores/admin/tramosAdminController.js';
import {
  eliminarHorariosPorEtapa,
  eliminarHorario,
  guardarHorario,
  guardarLoteHorarios,
  obtenerHorarioPorEtapaYNro,
  obtenerHorarios,
  obtenerHorariosPorEtapa,
  publicarHorariosPorEtapa
} from '../../controladores/admin/horariosAdminController.js';
import {
  actualizarPenalizacion,
  crearPenalizacion,
  eliminarPenalizacion,
  obtenerPenalizacionPorId,
  obtenerPenalizaciones
} from '../../controladores/admin/penalizacionesAdminController.js';
import {
  descargarPdfAdmin,
  obtenerTiposPdf
} from '../../controladores/admin/pdfAdminController.js';
import {
  eliminarShakedown,
  guardarLoteShakedown,
  guardarShakedown,
  obtenerShakedown,
  obtenerShakedownPorNro
} from '../../controladores/admin/shakedownAdminController.js';
import {
  eliminarAbandonoTiempo,
  guardarLoteTiempos,
  registrarAbandonoTiempo,
  guardarTiempoCompetidor,
  obtenerTiempoPorCompetidor,
  obtenerTiempos
} from '../../controladores/admin/tiemposAdminController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    exito: true,
    nombre: 'Rally Argentino - API Admin',
    version: '1.0.0',
    endpoints: {
      estado: 'GET /api/admin/estado',
      rally: 'GET /api/admin/rally',
      guardar_rally: 'PUT /api/admin/rally',
      rally_chapa: 'GET /api/admin/rally/chapa',
      guardar_rally_chapa: 'PUT /api/admin/rally/chapa',
      eliminar_rally_chapa: 'DELETE /api/admin/rally/chapa',
      archivo_rally_chapa: 'GET /api/admin/rally/chapa/archivo',
      tipos_pdf: 'GET /api/admin/pdfs',
      descargar_pdf: 'POST /api/admin/pdfs/:tipoPdf',
      inscriptos: 'GET /api/admin/inscriptos',
      inscripto: 'GET /api/admin/inscriptos/:nro',
      guardar_inscripto: 'POST /api/admin/inscriptos',
      guardar_inscriptos_lote: 'POST /api/admin/inscriptos/lote',
      eliminar_todos_los_inscriptos: 'DELETE /api/admin/inscriptos',
      eliminar_inscripto: 'DELETE /api/admin/inscriptos/:nro',
      tramos: 'GET /api/admin/tramos',
      tramo: 'GET /api/admin/tramos/:pe',
      guardar_tramo: 'POST /api/admin/tramos',
      eliminar_tramo: 'DELETE /api/admin/tramos/:pe',
      horarios: 'GET /api/admin/horarios',
      horarios_etapa: 'GET /api/admin/horarios/etapa/:etapa',
      horario: 'GET /api/admin/horarios/etapa/:etapa/nro/:nro',
      guardar_horario: 'POST /api/admin/horarios',
      guardar_horarios_lote: 'POST /api/admin/horarios/lote',
      eliminar_horarios_etapa: 'DELETE /api/admin/horarios/etapa/:etapa',
      eliminar_horario: 'DELETE /api/admin/horarios/etapa/:etapa/nro/:nro',
      publicar_horarios_etapa: 'POST /api/admin/horarios/publicar/etapa/:etapa',
      penalizaciones: 'GET /api/admin/penalizaciones',
      penalizacion: 'GET /api/admin/penalizaciones/:idPenal',
      crear_penalizacion: 'POST /api/admin/penalizaciones',
      actualizar_penalizacion: 'PUT /api/admin/penalizaciones/:idPenal',
      eliminar_penalizacion: 'DELETE /api/admin/penalizaciones/:idPenal',
      shakedown: 'GET /api/admin/shakedown',
      shakedown_registro: 'GET /api/admin/shakedown/:nro',
      guardar_shakedown: 'POST /api/admin/shakedown',
      guardar_shakedown_lote: 'POST /api/admin/shakedown/lote',
      eliminar_shakedown: 'DELETE /api/admin/shakedown/:nro',
      tiempos: 'GET /api/admin/tiempos',
      tiempos_abandonos: 'POST /api/admin/tiempos/abandonos',
      tiempo_competidor: 'GET /api/admin/tiempos/:nro',
      guardar_tiempo: 'PUT /api/admin/tiempos/:nro',
      guardar_tiempos_lote: 'POST /api/admin/tiempos/lote',
      eliminar_abandono_tiempo: 'DELETE /api/admin/tiempos/abandonos/nro/:nro/etapa/:etapa'
    }
  });
});

router.get('/estado', obtenerEstadoAdmin);
router.get('/rally', obtenerRally);
router.put('/rally', guardarRally);
router.get('/rally/chapa', obtenerEstadoChapa);
router.get('/rally/chapa/archivo', descargarChapa);
router.put('/rally/chapa', guardarChapa);
router.delete('/rally/chapa', eliminarChapa);
router.get('/pdfs', obtenerTiposPdf);
router.post('/pdfs/:tipoPdf', descargarPdfAdmin);
router.get('/inscriptos', obtenerInscriptos);
router.post('/inscriptos/lote', guardarLoteInscriptos);
router.delete('/inscriptos', eliminarTodosLosInscriptos);
router.get('/inscriptos/:nro', obtenerInscriptoPorNro);
router.post('/inscriptos', guardarInscripto);
router.put('/inscriptos/:nro', guardarInscripto);
router.delete('/inscriptos/:nro', eliminarInscripto);
router.get('/tramos', obtenerTramos);
router.get('/tramos/:pe', obtenerTramoPorPe);
router.post('/tramos', guardarTramo);
router.put('/tramos/:pe', guardarTramo);
router.delete('/tramos/:pe', eliminarTramo);
router.get('/horarios', obtenerHorarios);
router.get('/horarios/etapa/:etapa', obtenerHorariosPorEtapa);
router.get('/horarios/etapa/:etapa/nro/:nro', obtenerHorarioPorEtapaYNro);
router.post('/horarios/lote', guardarLoteHorarios);
router.post('/horarios', guardarHorario);
router.put('/horarios/etapa/:etapa/nro/:nro', guardarHorario);
router.post('/horarios/publicar/etapa/:etapa', publicarHorariosPorEtapa);
router.delete('/horarios/etapa/:etapa', eliminarHorariosPorEtapa);
router.delete('/horarios/etapa/:etapa/nro/:nro', eliminarHorario);
router.get('/penalizaciones', obtenerPenalizaciones);
router.get('/penalizaciones/:idPenal', obtenerPenalizacionPorId);
router.post('/penalizaciones', crearPenalizacion);
router.put('/penalizaciones/:idPenal', actualizarPenalizacion);
router.delete('/penalizaciones/:idPenal', eliminarPenalizacion);
router.get('/shakedown', obtenerShakedown);
router.get('/shakedown/:nro', obtenerShakedownPorNro);
router.post('/shakedown/lote', guardarLoteShakedown);
router.post('/shakedown', guardarShakedown);
router.put('/shakedown/:nro', guardarShakedown);
router.delete('/shakedown/:nro', eliminarShakedown);
router.get('/tiempos', obtenerTiempos);
router.post('/tiempos/abandonos', registrarAbandonoTiempo);
router.delete('/tiempos/abandonos/nro/:nro/etapa/:etapa', eliminarAbandonoTiempo);
router.get('/tiempos/:nro', obtenerTiempoPorCompetidor);
router.post('/tiempos', guardarTiempoCompetidor);
router.put('/tiempos/:nro', guardarTiempoCompetidor);
router.post('/tiempos/lote', guardarLoteTiempos);

export default router;
