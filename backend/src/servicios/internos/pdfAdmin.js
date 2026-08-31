import { generarClasifEtapa1 } from '../../comandos/pdf/pdfClasifEtapa1.js';
import { generarClasifEtapa1General } from '../../comandos/pdf/pdfClasifEtapa1General.js';
import { generarClasifEtapa2 } from '../../comandos/pdf/pdfClasifEtapa2.js';
import { generarClasifEtapa2General } from '../../comandos/pdf/pdfClasifEtapa2General.js';
import { generarClasifFinalClases } from '../../comandos/pdf/pdfClasifFinalClases.js';
import { generarClasifFinalGeneral } from '../../comandos/pdf/pdfClasifFinalGeneral.js';
import { construirFechaEvento } from '../../comandos/pdf/pdfBase.js';
import { generarInscriptos } from '../../comandos/pdf/pdfInscriptos.js';
import { generarOrdenLargada } from '../../comandos/pdf/pdfOrdenLargada.js';
import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';

const TIPOS_PDF = {
  inscriptos: 'inscriptos',
  orden_largada_etapa_1: 'orden_largada_etapa_1',
  orden_largada_etapa_2: 'orden_largada_etapa_2',
  clasif_final_general: 'clasif_final_general',
  clasif_final_categoria: 'clasif_final_categoria',
  clasif_etapa_1_categoria: 'clasif_etapa_1_categoria',
  clasif_etapa_2_categoria: 'clasif_etapa_2_categoria',
  clasif_etapa_1_general: 'clasif_etapa_1_general',
  clasif_etapa_2_general: 'clasif_etapa_2_general'
};

function validarMetadatosPdf(payload) {
  const errores = [];
  const numeroFecha = Number.parseInt(payload?.numeroFecha, 10);
  const diaInicio = String(payload?.diaInicio || '').trim();
  const diaFin = String(payload?.diaFin || '').trim();

  if (!numeroFecha || Number.isNaN(numeroFecha) || numeroFecha < 1) {
    errores.push('El numero de fecha debe ser un entero mayor a cero.');
  }

  if (!diaInicio) {
    errores.push('El dia de inicio es obligatorio.');
  }

  if (!diaFin) {
    errores.push('El dia de cierre es obligatorio.');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datos: {
      numeroFecha,
      diaInicio,
      diaFin,
      fechaEvento: construirFechaEvento(diaInicio, diaFin)
    }
  };
}

async function obtenerDatosClasificacion() {
  return Promise.all([
    obtenerColeccionPublica('tiempos'),
    obtenerColeccionPublica('tramos'),
    obtenerColeccionPublica('penalizaciones'),
    obtenerColeccionPublica('inscriptos')
  ]);
}

async function generarPdfAdmin(tipoPdf, metadatos) {
  const opciones = { destino: 'buffer' };

  switch (tipoPdf) {
    case TIPOS_PDF.inscriptos: {
      const inscriptos = await obtenerColeccionPublica('inscriptos');
      return generarInscriptos(metadatos, inscriptos, opciones);
    }

    case TIPOS_PDF.orden_largada_etapa_1: {
      const horariosEtapa1 = await obtenerColeccionPublica('horariosE1');
      return generarOrdenLargada(1, metadatos, horariosEtapa1, opciones);
    }

    case TIPOS_PDF.orden_largada_etapa_2: {
      const horariosEtapa2 = await obtenerColeccionPublica('horariosE2');
      return generarOrdenLargada(2, metadatos, horariosEtapa2, opciones);
    }

    case TIPOS_PDF.clasif_final_general: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifFinalGeneral(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    case TIPOS_PDF.clasif_final_categoria: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifFinalClases(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    case TIPOS_PDF.clasif_etapa_1_categoria: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifEtapa1(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    case TIPOS_PDF.clasif_etapa_2_categoria: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifEtapa2(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    case TIPOS_PDF.clasif_etapa_1_general: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifEtapa1General(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    case TIPOS_PDF.clasif_etapa_2_general: {
      const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
      return generarClasifEtapa2General(metadatos, tiempos, tramos, penalizaciones, inscriptos, opciones);
    }

    default:
      throw new Error('El tipo de PDF solicitado no existe.');
  }
}

export {
  TIPOS_PDF,
  generarPdfAdmin,
  validarMetadatosPdf
};
