import PDFDocument from 'pdfkit';
import { dibujarEncabezado, dibujarPieDePagina, guardarPDF, COLORES, FUENTES } from './pdfBase.js';

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

const MARGEN_H     = 15;

const ANCHO_POS    = 28;
const ANCHO_NRO    = 28;
const ANCHO_NAC    = 55;
const ANCHO_CLASE  = 60;

const ALTO_FILA    = 20;
const ALTO_ENC_TAB = 22;
const FONT_SIZE    = 8;

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

/**
 * Formatea la nacionalidad como "ARG | ARG"
 */
function formatearNac(nac) {
  if (!nac) return 'ARG | ARG';
  const p = nac.trim().split(/\s+/);
  return `${(p[0] || 'ARG').toUpperCase()} | ${(p[1] || p[0] || 'ARG').toUpperCase()}`;
}

/**
 * Calcula el ancho mínimo necesario para el texto más largo de una columna
 */
function calcularAnchoAuto(doc, textos, padding = 6) {
  doc.font(FUENTES.normal).fontSize(FONT_SIZE);
  const max = textos.reduce((m, t) => {
    const w = doc.widthOfString(String(t || ''));
    return w > m ? w : m;
  }, 0);
  return Math.ceil(max) + padding * 2;
}

/**
 * Construye las columnas con anchos calculados según los datos reales
 */
function construirColumnas(doc, inscriptos) {
  const anchoPiloto = calcularAnchoAuto(doc, [
    ...inscriptos.map(i => i.piloto || '-'),
    'PILOTO',
  ]);

  const anchoNavegante = calcularAnchoAuto(doc, [
    ...inscriptos.map(i => i.navegante || '-'),
    'NAVEGANTE',
  ]);

  const anchoVehiculo = calcularAnchoAuto(doc, [
    ...inscriptos.map(i => i.vehiculo || '-'),
    'VEHÍCULO',
  ]);

  return [
    { label: 'POS',       campo: '_pos',      ancho: ANCHO_POS,      align: 'center', bold: false },
    { label: 'Nº',        campo: 'nro',       ancho: ANCHO_NRO,      align: 'center', bold: true  },
    { label: 'NAC',       campo: '_nac',      ancho: ANCHO_NAC,      align: 'center', bold: false },
    { label: 'PILOTO',    campo: 'piloto',    ancho: anchoPiloto,    align: 'center', bold: false },
    { label: 'NAVEGANTE', campo: 'navegante', ancho: anchoNavegante, align: 'center', bold: false },
    { label: 'VEHÍCULO',  campo: 'vehiculo',  ancho: anchoVehiculo,  align: 'center', bold: false },
    { label: 'CLASE',     campo: 'clase',     ancho: ANCHO_CLASE,    align: 'center', bold: false },
  ];
}

// ─── DIBUJADO ─────────────────────────────────────────────────────────────────

function dibujarEncabezadoTabla(doc, y, columnas) {
  const anchoReal  = columnas.reduce((s, c) => s + c.ancho, 0);
  const anchoPagina = doc.page.width;
  const xBase      = (anchoPagina - anchoReal) / 2;

  doc.rect(xBase, y, anchoReal, ALTO_ENC_TAB).fill(COLORES.encabezadoTabla);

  let x = xBase;
  columnas.forEach((col, i) => {
    if (i > 0) {
      doc.moveTo(x, y).lineTo(x, y + ALTO_ENC_TAB)
         .strokeColor('#ffffff').lineWidth(0.3).stroke();
    }
    doc.font(FUENTES.negrita)
       .fontSize(FONT_SIZE)
       .fillColor(COLORES.textoBlanco)
       .text(col.label, x + 3, y + (ALTO_ENC_TAB - FONT_SIZE) / 2, {
         width: col.ancho - 6,
         align: 'center',
         lineBreak: false,
       });
    x += col.ancho;
  });

  return y + ALTO_ENC_TAB;
}

function dibujarFila(doc, valores, columnas, y, esImpar) {
  const anchoReal   = columnas.reduce((s, c) => s + c.ancho, 0);
  const anchoPagina = doc.page.width;
  const xBase       = (anchoPagina - anchoReal) / 2;

  // Fondo de fila
  doc.rect(xBase, y, anchoReal, ALTO_FILA)
     .fill(esImpar ? COLORES.filaImpar : COLORES.filaPar);

  // Bordes horizontales y laterales
  doc.moveTo(xBase, y + ALTO_FILA).lineTo(xBase + anchoReal, y + ALTO_FILA)
     .strokeColor(COLORES.borde).lineWidth(0.3).stroke();
  doc.moveTo(xBase, y).lineTo(xBase, y + ALTO_FILA)
     .strokeColor(COLORES.borde).lineWidth(0.3).stroke();
  doc.moveTo(xBase + anchoReal, y).lineTo(xBase + anchoReal, y + ALTO_FILA)
     .strokeColor(COLORES.borde).lineWidth(0.3).stroke();

  let x = xBase;
  columnas.forEach((col, i) => {
    if (i > 0) {
      doc.moveTo(x, y).lineTo(x, y + ALTO_FILA)
         .strokeColor(COLORES.borde).lineWidth(0.3).stroke();
    }

    doc.font(col.bold ? FUENTES.negrita : FUENTES.normal)
       .fontSize(FONT_SIZE)
       .fillColor(COLORES.texto)
       .text(valores[col.campo] || '-', x + 3, y + (ALTO_FILA - FONT_SIZE) / 2, {
         width: col.ancho - 6,
         align: col.align,
         lineBreak: false,
         ellipsis: true,
       });

    x += col.ancho;
  });
}

// ─── EXPORTADO ────────────────────────────────────────────────────────────────

/**
 * Genera el PDF de inscriptos del rally.
 *
 * @param {object} metadatos     - { numeroFecha, fechaEvento }
 * @param {Array}  inscriptos    - Lista pública actual de inscriptos
 */
export async function generarInscriptos(metadatos, inscriptos, opciones = {}) {
  const { numeroFecha, fechaEvento } = metadatos;

  console.log('\n📄 Generando Lista de Inscriptos...');

  if (!inscriptos || inscriptos.length === 0) {
    console.error('❌ No hay inscriptos para generar el PDF.');
    return;
  }

  // Ordenar por número de inscripción (numérico)
  const ordenados = [...inscriptos].sort((a, b) => parseInt(a.nro) - parseInt(b.nro));

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 40, bottom: 35, left: MARGEN_H, right: MARGEN_H },
    bufferPages: true,
    autoFirstPage: true,
  });

  const columnas = construirColumnas(doc, ordenados);
  const tipoPDF  = 'Lista de Inscriptos';
  const yLimite  = doc.page.height - doc.page.margins.bottom - 20;

  let y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
  y = dibujarEncabezadoTabla(doc, y, columnas);

  ordenados.forEach((inscripto, idx) => {
    if (y + ALTO_FILA > yLimite) {
      doc.addPage();
      y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
      y = dibujarEncabezadoTabla(doc, y, columnas);
    }

    dibujarFila(doc, {
      _pos:      String(idx + 1),
      nro:       String(inscripto.nro || '-'),
      _nac:      formatearNac(inscripto.nac),
      piloto:    inscripto.piloto   || '-',
      navegante: inscripto.navegante || '-',
      vehiculo:  inscripto.vehiculo  || '-',
      clase:     inscripto.clase     || '-',
    }, columnas, y, idx % 2 === 0);

    y += ALTO_FILA;
  });

  dibujarPieDePagina(doc);

  const hoy = new Date().toISOString().split('T')[0];
  return guardarPDF(doc, `inscriptos-${hoy}.pdf`, opciones);
}
