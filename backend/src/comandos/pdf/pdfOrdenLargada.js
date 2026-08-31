import PDFDocument from 'pdfkit';
import { dibujarEncabezado, dibujarPieDePagina, guardarPDF, COLORES, FUENTES } from './pdfBase.js';

// FIX 1 — Márgenes reducidos para ocupar ~95% del ancho A4
const MARGEN_H   = 15;

// Anchos fijos ajustables manualmente
const ANCHO_POS   = 28;
const ANCHO_NRO   = 28;
const ANCHO_NAC   = 55;
const ANCHO_CLASE = 55;
const ANCHO_HORA  = 58;

const ALTO_FILA    = 20;
const ALTO_ENC_TAB = 22;
const FONT_SIZE    = 8;

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

/**
 * FIX 5 — Formatea hora respetando HH:MM con cero a la izquierda
 * "9:00:00" → "09:00" | "10h30:00" → "10:30" | "9" → "09:00"
 */
function formatearHora(hora) {
  if (!hora || hora === '-') return '-';
  let s = String(hora).trim().replace('h', ':').replace(/:00$/, '');
  if (/^\d{1,2}$/.test(s)) s = `${s}:00`;
  const [hh = '0', mm = '0'] = s.split(':');
  return `${String(parseInt(hh)).padStart(2, '0')}:${String(parseInt(mm)).padStart(2, '0')}`;
}

/**
 * FIX 4 — Convierte hora a minutos totales para ordenamiento numérico correcto
 * "09:00" → 540 | "10:30" → 630
 */
function horaAMinutos(piloto) {
  const h = formatearHora(piloto.hora_etapa || piloto.hora);
  if (h === '-') return 9999;
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

/**
 * Formatea la nacionalidad como "ARG | ARG"
 */
function formatearNac(nac) {
  if (!nac) return 'ARG | ARG';
  const p = nac.trim().split(/\s+/);
  return `${(p[0] || 'ARG').toUpperCase()} | ${(p[1] || p[0] || 'ARG').toUpperCase()}`;
}

/**
 * FIX 2 — Calcula el ancho mínimo necesario para el texto más largo de una columna
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
function construirColumnas(doc, pilotos) {
    const anchoVehiculo = calcularAnchoAuto(doc, [
    ...pilotos.map(p => p.vehiculo || '-'),
    'VEHÍCULO',
    ]);

    const anchoTripula = calcularAnchoAuto(doc, [
    ...pilotos.map(p => `${p.piloto || '-'} / ${p.navegante || '-'}`),
    'PILOTO / NAVEGANTE',
    ]);

    return [
    { label: 'POS',                campo: '_pos',      ancho: ANCHO_POS,     align: 'center', bold: false },
    { label: 'Nº',                 campo: 'nro',       ancho: ANCHO_NRO,     align: 'center', bold: true  },
    { label: 'NAC',                campo: '_nac',      ancho: ANCHO_NAC,     align: 'center', bold: false },
    { label: 'PILOTO / NAVEGANTE', campo: '_tripula',  ancho: anchoTripula,  align: 'center', bold: false },
    { label: 'VEHÍCULO',           campo: 'vehiculo',  ancho: anchoVehiculo, align: 'center', bold: false },
    { label: 'CLASE',              campo: 'clase',     ancho: ANCHO_CLASE,   align: 'center', bold: false },
    { label: 'HORA',               campo: '_hora',     ancho: ANCHO_HORA,    align: 'center', bold: true },
    ];
}

// ─── DIBUJADO ─────────────────────────────────────────────────────────────────

function dibujarEncabezadoTabla(doc, y, columnas) {
    const anchoReal = columnas.reduce((s, c) => s + c.ancho, 0);
    const anchoPagina = doc.page.width;
    const xBase = (anchoPagina - anchoReal) / 2;

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
         width: col.ancho - 6, align: col.align === 'left' ? 'left' : 'center', lineBreak: false,
       });
    x += col.ancho;
  });

  return y + ALTO_ENC_TAB;
}

function dibujarFila(doc, valores, columnas, y, esImpar) {
    const anchoReal = columnas.reduce((s, c) => s + c.ancho, 0);
    const anchoPagina = doc.page.width;
    const xBase = (anchoPagina - anchoReal) / 2;

  doc.rect(xBase, y, anchoReal, ALTO_FILA)
     .fill(esImpar ? COLORES.filaImpar : COLORES.filaPar);

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

    // FIX 3 — Nº usa negrita, el resto normal
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

export async function generarOrdenLargada(etapa, { numeroFecha, fechaEvento }, pilotos, opciones = {}) {
  console.log(`\n📄 Generando Orden de Largada Etapa ${etapa}...`);

  if (!pilotos || pilotos.length === 0) {
    console.error(`❌ No hay datos de horarios para la Etapa ${etapa}`);
    return;
  }

  // FIX 4 — Ordenar numéricamente por minutos totales
  const ordenados = [...pilotos].sort((a, b) => horaAMinutos(a) - horaAMinutos(b));

  // FIX 1 — Márgenes reducidos para 95% del ancho
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 40, bottom: 35, left: MARGEN_H, right: MARGEN_H },
    bufferPages: true,
    autoFirstPage: true,
  });

  // FIX 2 — Calcular anchos con los datos reales antes de dibujar
  const columnas = construirColumnas(doc, ordenados);
  const tipoPDF  = `Orden de Largada Etapa ${etapa}`;
  const yLimite  = doc.page.height - doc.page.margins.bottom - 20;

  let y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
  y = dibujarEncabezadoTabla(doc, y, columnas);

  ordenados.forEach((piloto, idx) => {
    if (y + ALTO_FILA > yLimite) {
      doc.addPage();
      y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
      y = dibujarEncabezadoTabla(doc, y, columnas);
    }

    dibujarFila(doc, {
      _pos:     String(idx + 1),
      nro:      String(piloto.nro || '-'),
      _nac:     formatearNac(piloto.nac),
      _tripula: `${piloto.piloto || '-'} / ${piloto.navegante || '-'}`,
      vehiculo: piloto.vehiculo || '-',
      clase:    piloto.clase || '-',
      _hora:    formatearHora(piloto.hora_etapa || piloto.hora),
    }, columnas, y, idx % 2 === 0);

    y += ALTO_FILA;
  });

  dibujarPieDePagina(doc);

  const hoy = new Date().toISOString().split('T')[0];
  return guardarPDF(doc, `orden-largada-etapa${etapa}-${hoy}.pdf`, opciones);
}
