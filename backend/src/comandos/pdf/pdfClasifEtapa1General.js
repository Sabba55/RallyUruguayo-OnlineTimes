import PDFDocument from 'pdfkit';
import { dibujarEncabezado, dibujarPieDePagina, guardarPDF, COLORES, FUENTES } from './pdfBase.js';

// A4 landscape
const MARGEN_H   = 15;
const ANCHO_UTIL = 841.89 - MARGEN_H * 2;

// Anchos fijos
const ANCHO_POS   = 28;
const ANCHO_NRO   = 28;
const ANCHO_NAC   = 55;
const ANCHO_CLASE   = 50;
const ANCHO_POS_CLA = 35;
const ANCHO_PENAL   = 45;
const ANCHO_DIF   = 55;
const ANCHO_PROM  = 40;

const ALTO_FILA    = 20;
const ALTO_ENC_TAB = 22;
const FONT_SIZE    = 8;

// ─── LÓGICA DE CLASIFICACIÓN (idéntica al frontend TiemposGeneral) ────────────

function corregirFormatoTiempo(t) {
  if (!t || t === '' || t === '-' || t === null || t === undefined) return '';
  let tiempo = String(t).trim();
  const especiales = ['DNF', 'RET', 'AB', 'DNS', 'DSQ', 'NC'];
  if (especiales.includes(tiempo.toUpperCase())) return '-';
  const seps = (tiempo.match(/[:.,]/g) || []).length;
  if (seps === 2) {
    const partes = tiempo.split(/[:.,]/);
    if (partes.length === 3) tiempo = `${partes[0]}:${partes[1]}.${partes[2]}`;
  } else if (seps === 1) {
    tiempo = tiempo.replace(',', '.');
  }
  return tiempo;
}

function convertirASegundos(t) {
  if (!t || t === '-' || t === '' || t === null || t === undefined) return 0;
  try {
    const tc = corregirFormatoTiempo(t);
    if (!tc || tc === '-') return 0;
    const [min, seg] = tc.split(':');
    return (parseInt(min) || 0) * 60 + (parseFloat(seg) || 0);
  } catch { return 0; }
}

function segundosATiempo(s) {
  const total  = Math.floor(Math.round(s * 1000) / 1000 * 10) / 10;
  const seg    = Math.floor(total % 60);
  const decima = Math.floor(Math.round((total % 1) * 100) / 100 * 10);
  const minT   = Math.floor(total / 60);
  if (minT >= 60) {
    const h = Math.floor(minT / 60);
    const m = minT % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(seg).padStart(2,'0')}.${decima}`;
  }
  return `${minT}:${String(seg).padStart(2,'0')}.${decima}`;
}

function calcularDiferencia(a, b) {
  const diff = a - b;
  if (diff <= 0) return '–';
  return '+' + segundosATiempo(diff);
}

function estaTramoCancelado(pe, tramos) {
  const tramo = tramos.find(t => parseInt(t.pe) === parseInt(pe));
  if (!tramo || !tramo.estado) return false;
  const est = tramo.estado.toLowerCase().trim();
  return est === 'cancelado' || est === 'cancelada';
}

/**
 * Solo PEs con etapa === '1', excluyendo PE 0 (Shakedown) y cancelados
 */
function obtenerPEsEtapa1(tramos) {
  return tramos
    .filter(t => {
      const esEtapa1      = t.etapa === '1' || t.etapa === 1;
      const noCancelado   = !estaTramoCancelado(parseInt(t.pe), tramos);
      const noEsShakedown = parseInt(t.pe) > 0;
      return esEtapa1 && noCancelado && noEsShakedown;
    })
    .map(t => parseInt(t.pe))
    .sort((a, b) => a - b);
}

function pilotoCompletoEtapa1(piloto, tramos) {
  for (const pe of obtenerPEsEtapa1(tramos)) {
    const t = piloto[`pe${pe}`];
    if (!t || t === '-' || t === '') return false;
  }
  return true;
}

function calcularTiempoNeto(piloto, tramos) {
  return obtenerPEsEtapa1(tramos).reduce((sum, pe) => {
    const t = piloto[`pe${pe}`];
    return sum + (t && t !== '-' && t !== '' ? convertirASegundos(t) : 0);
  }, 0);
}

function calcularTotalPenalizaciones(nro, tramos, penalizaciones) {
  const pesEtapa1   = obtenerPEsEtapa1(tramos);
  const peMaxEtapa1 = pesEtapa1.length ? Math.max(...pesEtapa1) : 0;

  return penalizaciones
    .filter(pen => {
      const match   = String(pen.nro).trim() === String(nro).trim();
      const peOcurr = parseInt(pen.peocurrido) || 0;
      return match && peOcurr <= peMaxEtapa1 && pesEtapa1.includes(peOcurr);
    })
    .reduce((sum, pen) => sum + convertirASegundos(pen.tiempo), 0);
}

function obtenerDistanciaTotal(tramos) {
  return obtenerPEsEtapa1(tramos).reduce((sum, pe) => {
    const tramo = tramos.find(t => t.pe === String(pe) || t.pe === pe);
    return sum + (tramo?.kms ? parseFloat(tramo.kms) || 0 : 0);
  }, 0);
}

function calcularVelocidadPromedio(totalSegundos, tramos) {
  if (totalSegundos === 0) return '-';
  const dist = obtenerDistanciaTotal(tramos);
  if (dist === 0) return '-';
  return (dist / (totalSegundos / 3600)).toFixed(1);
}

function normalizarClase(clase) {
  if (!clase) return 'Sin clase';
  const n = clase.toLowerCase().trim();
  if (n.includes('rc2') && n.includes('copa')) return 'RC2';
  return clase;
}

function formatearNac(nac) {
  if (!nac) return 'ARG | ARG';
  const p = nac.trim().split(/\s+/);
  return `${(p[0] || 'ARG').toUpperCase()} | ${(p[1] || p[0] || 'ARG').toUpperCase()}`;
}

/**
 * Genera la clasificación general de Etapa 1
 * Todos los que completaron los PEs de Etapa 1 (sin importar finalizo)
 */
function generarClasificacionEtapa1General(tiempos, tramos, penalizaciones, inscriptos) {
  const clasificados = tiempos
    .filter(p => pilotoCompletoEtapa1(p, tramos))
    .map(p => {
      const insc       = inscriptos.find(i => String(i.nro) === String(p.nro));
      const tiempoNeto = calcularTiempoNeto(p, tramos);
      const penal      = calcularTotalPenalizaciones(p.nro, tramos, penalizaciones);
      return {
        ...p,
        nac:       insc?.nac       || p.nac       || 'ARG ARG',
        piloto:    insc?.piloto    || p.piloto,
        navegante: insc?.navegante || p.navegante,
        vehiculo:  insc?.vehiculo  || p.vehiculo,
        clase:     insc?.clase     || p.clase,
        tiempoNeto,
        penal,
        totalSegundos: tiempoNeto + penal,
      };
    });

  clasificados.sort((a, b) => a.totalSegundos - b.totalSegundos);
  return clasificados;
}

// ─── POSICIÓN POR CLASE ───────────────────────────────────────────────────────

function calcularPosicionesPorClase(clasificados) {
  const contadorPorClase = {};
  return clasificados.map(p => {
    const clase = normalizarClase(p.clase);
    if (!contadorPorClase[clase]) contadorPorClase[clase] = 0;
    contadorPorClase[clase]++;
    return { ...p, posClase: contadorPorClase[clase] };
  });
}

function dibujarBadgePosClase(doc, posClase, xCelda, y, anchoCelda) {
  const tam   = 13;
  const xCent = xCelda + anchoCelda / 2;
  const yCent = y + ALTO_FILA / 2;
  const xRect = xCent - tam / 2;
  const yRect = yCent - tam / 2;

  const esRelleno  = posClase <= 3;
  const fondo      = posClase === 1 ? '#000000' : posClase === 2 ? '#555555' : '#aaaaaa';
  const colorTexto = esRelleno ? '#ffffff' : '#000000';

  if (esRelleno) {
    doc.rect(xRect, yRect, tam, tam).fill(fondo);
  } else {
    doc.rect(xRect, yRect, tam, tam).stroke('#000000');
  }

  doc.font(esRelleno ? FUENTES.negrita : FUENTES.normal)
     .fontSize(7).fillColor(colorTexto)
     .text(String(posClase), xRect, yRect + (tam - 7) / 2, {
       width: tam, align: 'center', lineBreak: false,
     });
}

// ─── CONSTRUCCIÓN DE COLUMNAS ────────────────────────────────────────────────

function calcularAnchoAuto(doc, textos, padding = 6) {
  doc.font(FUENTES.normal).fontSize(FONT_SIZE);
  const max = textos.reduce((m, t) => {
    const w = doc.widthOfString(String(t || ''));
    return w > m ? w : m;
  }, 0);
  return Math.ceil(max) + padding * 2;
}

function construirColumnas(doc, pilotos) {
  const anchoVehiculo = calcularAnchoAuto(doc, [
    ...pilotos.map(p => p.vehiculo || '-'), 'VEHÍCULO',
  ]);
  const anchoTripula = calcularAnchoAuto(doc, [
    ...pilotos.map(p => `${p.piloto || '-'} / ${p.navegante || '-'}`), 'PILOTO / NAVEGANTE',
  ]);
  const anchoTiempo = calcularAnchoAuto(doc, [
    ...pilotos.map(p => segundosATiempo(p.tiempoNeto)), 'TIEMPO',
  ]);
  const anchoTotal = calcularAnchoAuto(doc, [
    ...pilotos.map(p => segundosATiempo(p.totalSegundos)), 'T.TOTAL',
  ]);

  const fijos  = ANCHO_POS + ANCHO_NRO + ANCHO_NAC + anchoTripula + ANCHO_CLASE +
                 anchoVehiculo + anchoTiempo + ANCHO_PENAL + anchoTotal +
                 ANCHO_DIF + ANCHO_DIF + ANCHO_PROM;
  const escala = fijos > ANCHO_UTIL ? ANCHO_UTIL / fijos : 1;
  const esc    = v => Math.floor(v * escala);

  return [
    { label: 'POS',                campo: '_pos',     ancho: esc(ANCHO_POS),     align: 'center', bold: false },
    { label: 'Nº',                 campo: 'nro',      ancho: esc(ANCHO_NRO),     align: 'center', bold: true  },
    { label: 'NAC',                campo: '_nac',     ancho: esc(ANCHO_NAC),     align: 'center', bold: false },
    { label: 'PILOTO / NAVEGANTE', campo: '_tripula', ancho: esc(anchoTripula),  align: 'center', bold: false },
    { label: 'CLASE',              campo: '_clase',   ancho: esc(ANCHO_CLASE),   align: 'center', bold: false },
    { label: 'P. CL',              campo: '_posClase',ancho: esc(ANCHO_POS_CLA), align: 'center', bold: false, esBadge: true },
    { label: 'VEHÍCULO',           campo: 'vehiculo', ancho: esc(anchoVehiculo), align: 'center', bold: false },
    { label: 'TIEMPO',             campo: '_tiempo',  ancho: esc(anchoTiempo),   align: 'center', bold: false },
    { label: 'PENAL.',             campo: '_penal',   ancho: esc(ANCHO_PENAL),   align: 'center', bold: false },
    { label: 'T.TOTAL',            campo: '_total',   ancho: esc(anchoTotal),    align: 'center', bold: true  },
    { label: 'DIF. 1º',            campo: '_dif1',    ancho: esc(ANCHO_DIF),     align: 'center', bold: false },
    { label: 'DIF. ANT.',          campo: '_difAnt',  ancho: esc(ANCHO_DIF),     align: 'center', bold: false },
    { label: 'PROM.',              campo: '_prom',    ancho: esc(ANCHO_PROM),    align: 'center', bold: false },
  ];
}

// ─── DIBUJADO ─────────────────────────────────────────────────────────────────

function dibujarEncabezadoTabla(doc, y, columnas) {
  const anchoReal = columnas.reduce((s, c) => s + c.ancho, 0);
  const xBase     = (doc.page.width - anchoReal) / 2;

  doc.rect(xBase, y, anchoReal, ALTO_ENC_TAB).fill(COLORES.encabezadoTabla);

  let x = xBase;
  columnas.forEach((col, i) => {
    if (i > 0) {
      doc.moveTo(x, y).lineTo(x, y + ALTO_ENC_TAB)
         .strokeColor('#ffffff').lineWidth(0.3).stroke();
    }
    doc.font(FUENTES.negrita).fontSize(FONT_SIZE).fillColor(COLORES.textoBlanco)
       .text(col.label, x + 3, y + (ALTO_ENC_TAB - FONT_SIZE) / 2, {
         width: col.ancho - 6, align: 'center', lineBreak: false,
       });
    x += col.ancho;
  });

  return y + ALTO_ENC_TAB;
}

function dibujarFila(doc, valores, columnas, y, esImpar) {
  const anchoReal = columnas.reduce((s, c) => s + c.ancho, 0);
  const xBase     = (doc.page.width - anchoReal) / 2;

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
    if (col.esBadge) {
      const posNum = parseInt(valores[col.campo]);
      if (!isNaN(posNum)) dibujarBadgePosClase(doc, posNum, x, y, col.ancho);
    } else {
      doc.font(col.bold ? FUENTES.negrita : FUENTES.normal)
         .fontSize(FONT_SIZE).fillColor(COLORES.texto)
         .text(valores[col.campo] || '-', x + 3, y + (ALTO_FILA - FONT_SIZE) / 2, {
           width: col.ancho - 6, align: col.align, lineBreak: false, ellipsis: true,
         });
    }
    x += col.ancho;
  });
}

// ─── EXPORTADO ────────────────────────────────────────────────────────────────

export async function generarClasifEtapa1General({ numeroFecha, fechaEvento }, tiempos, tramos, penalizaciones, inscriptos, opciones = {}) {
  console.log('\n📄 Generando Clasificación General Etapa 1...');

  const clasificadosBase = generarClasificacionEtapa1General(tiempos, tramos, penalizaciones, inscriptos);
  const clasificados = calcularPosicionesPorClase(clasificadosBase);

  if (clasificados.length === 0) {
    console.error('❌ No hay pilotos clasificados en Etapa 1 para generar el PDF');
    return;
  }

  const mejor = clasificados[0]?.totalSegundos || 0;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 25, bottom: 35, left: MARGEN_H, right: MARGEN_H },
    bufferPages: true,
    autoFirstPage: true,
  });

  const columnas = construirColumnas(doc, clasificados);
  const tipoPDF  = 'Clasificación General Etapa 1';
  const yLimite  = doc.page.height - doc.page.margins.bottom - 20;

  let y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
  y = dibujarEncabezadoTabla(doc, y, columnas);

  clasificados.forEach((p, idx) => {
    if (y + ALTO_FILA > yLimite) {
      doc.addPage();
      y = dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento });
      y = dibujarEncabezadoTabla(doc, y, columnas);
    }

    const anterior = idx > 0 ? clasificados[idx - 1].totalSegundos : p.totalSegundos;

    dibujarFila(doc, {
      _pos:     String(idx + 1),
      nro:      String(p.nro || '-'),
      _nac:     formatearNac(p.nac),
      _tripula: `${p.piloto || '-'} / ${p.navegante || '-'}`,
      _clase:    normalizarClase(p.clase),
      _posClase: String(p.posClase || '-'),
      vehiculo: p.vehiculo || '-',
      _tiempo:  segundosATiempo(p.tiempoNeto),
      _penal:   p.penal > 0 ? segundosATiempo(p.penal) : '-',
      _total:   segundosATiempo(p.totalSegundos),
      _dif1:    calcularDiferencia(p.totalSegundos, mejor),
      _difAnt:  calcularDiferencia(p.totalSegundos, anterior),
      _prom:    calcularVelocidadPromedio(p.totalSegundos, tramos),
    }, columnas, y, idx % 2 === 0);

    y += ALTO_FILA;
  });

  dibujarPieDePagina(doc);

  const hoy = new Date().toISOString().split('T')[0];
  return guardarPDF(doc, `clasif-etapa1-general-${hoy}.pdf`, opciones);
}
