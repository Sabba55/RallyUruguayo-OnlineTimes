import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import os from 'os';

const LOGO_IZQ = path.join(process.cwd(), 'assets/chapa_rally.png');
const LOGO_DER = path.join(process.cwd(), 'assets/info_rally.png');

export const COLORES = {
  encabezadoTabla: '#001628',
  filaImpar:       '#f2f2f2',
  filaPar:         '#ffffff',
  borde:           '#cccccc',
  texto:           '#212529',
  textoClaro:      '#333333',
  textoBlanco:     '#ffffff',
};

export const FUENTES = {
  normal:  'Helvetica',
  negrita: 'Helvetica-Bold',
};

/**
 * Convierte número entero a ordinal en español
 * 1 → "1º", 2 → "2º", etc.
 */
export function numeroAOrdinal(n) {
  const num = parseInt(n);
  if (isNaN(num)) return `${n}º`;
  return `${num}º`;
}

/**
 * Construye el texto de fecha del evento
 * "27 Febrero" + "1 Marzo" + año actual → "27 Febrero al 1 Marzo de 2026"
 */
export function construirFechaEvento(diaInicio, diaFin) {
  const anio = new Date().getFullYear();
  return `${diaInicio.trim()} al ${diaFin.trim()} de ${anio}`;
}

/**
 * Crea un documento PDF A4 vertical con márgenes estándar
 */
export function crearDocumento() {
  return new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 25, bottom: 25, left: 30, right: 30 },
    bufferPages: true,
    autoFirstPage: true,
  });
}

/**
 * Dibuja el encabezado centrado en 3 líneas
 * Retorna la coordenada Y donde debe empezar la tabla
 */
export function dibujarEncabezado(doc, { tipoPDF, numeroFecha, fechaEvento }) {
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const anchoPagina = doc.page.width;

  const anchoUtil = anchoPagina - marginLeft - marginRight;

  // 🔥 CONFIGURACIÓN
  const yBase = doc.page.margins.top - 20;
  const headerHeight = 60;

  // 🧠 Centro vertical REAL del header
  const centroY = yBase + headerHeight / 2;

  // 🟦 Tamaños de zonas
  const anchoLogoIzq = 90;
  const anchoLogoDer = 150;

  const xLogoIzq = marginLeft;
  const xLogoDer = anchoPagina - marginRight - anchoLogoDer;

  // 🧠 Zona central dinámica
  const xCentro = xLogoIzq + anchoLogoIzq;
  const anchoCentro = anchoUtil - anchoLogoIzq - anchoLogoDer;

  // ======================
  // 🖼️ LOGO IZQUIERDA
  // ======================
  const alturaLogoIzq = 73;

  if (fs.existsSync(LOGO_IZQ)) {
    doc.image(LOGO_IZQ, xLogoIzq, centroY - alturaLogoIzq / 2, {
      width: anchoLogoIzq
    });
  }

  // ======================
  // 🖼️ LOGO DERECHA
  // ======================
  const alturaLogoDer = 30;

  if (fs.existsSync(LOGO_DER)) {
    doc.image(LOGO_DER, xLogoDer, centroY - alturaLogoDer / 2, {
      width: anchoLogoDer
    });
  }

  // ======================
  // 🧠 TEXTO CENTRAL
  // ======================
  let y = centroY - 18; // centrado visual del bloque de texto

  // Línea 1
  doc.font(FUENTES.negrita)
     .fontSize(14)
     .fillColor(COLORES.texto)
     .text(tipoPDF.toUpperCase(), xCentro, y, {
       width: anchoCentro,
       align: 'center',
       lineBreak: false,
     });

  y += 16;

  // Línea 2
  doc.font(FUENTES.normal)
     .fontSize(10)
     .fillColor(COLORES.texto)
     .text(
       `${numeroAOrdinal(numeroFecha)} Fecha - Campeonato de Rally Argentino`,
       xCentro,
       y,
       { width: anchoCentro, align: 'center', lineBreak: false }
     );

  y += 14;

  // Línea 3
  doc.font(FUENTES.normal)
     .fontSize(9)
     .fillColor(COLORES.textoClaro)
     .text(fechaEvento, xCentro, y, {
       width: anchoCentro,
       align: 'center',
       lineBreak: false,
     });

  // ======================
  // 📏 LÍNEA SEPARADORA
  // ======================
  const yLinea = yBase + headerHeight + 5;

  doc.moveTo(marginLeft, yLinea)
     .lineTo(marginLeft + anchoUtil, yLinea)
     .strokeColor(COLORES.borde)
     .lineWidth(0.8)
     .stroke();

  return yLinea + 8;
}

/**
 * Dibuja el pie de página en TODAS las páginas del documento
 * Debe llamarse antes de doc.end()
 */
export function dibujarPieDePagina(doc) {
  const range = doc.bufferedPageRange();
  const totalPaginas = range.count;

  const ahora = new Date();
  const fechaHora = ahora.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  for (let i = 0; i < totalPaginas; i++) {
    doc.switchToPage(i);

    const xL = doc.page.margins.left;
    const xR = doc.page.width - doc.page.margins.right;
    const yBase = doc.page.height - doc.page.margins.bottom;

    const yLinea = yBase - 16;
    const yTexto = yBase - 6;

    // Línea separadora
    doc.save();
    doc.moveTo(xL, yLinea)
       .lineTo(xR, yLinea)
       .strokeColor('#cccccc')
       .lineWidth(0.5)
       .stroke();

    // Texto izquierda (SIN width → clave)
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#333333')
       .text(`Página ${i + 1} / ${totalPaginas}`, xL, yTexto, {
         lineBreak: false,
       });

    // Texto derecha (posición absoluta real)
    const textoDerecha = `Procesado y Publicado el ${fechaHora}`;
    const anchoTexto = doc.widthOfString(textoDerecha);

    doc.text(textoDerecha, xR - anchoTexto, yTexto, {
      lineBreak: false,
    });

    doc.restore();
  }
}

/**
 * Guarda el PDF directamente en la carpeta Descargas del usuario
 */
export function guardarPDF(doc, nombreArchivo, opciones = {}) {
  const { destino = 'archivo' } = opciones;

  if (destino === 'buffer') {
    return new Promise((resolve, reject) => {
      const chunks = [];
      doc.flushPages();
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          nombreArchivo,
          buffer: Buffer.concat(chunks)
        });
      });
      doc.on('error', reject);
      doc.end();
    });
  }

  const descargas = path.join(os.homedir(), 'Downloads');

  if (!fs.existsSync(descargas)) {
    fs.mkdirSync(descargas, { recursive: true });
  }

  const rutaFinal = path.join(descargas, nombreArchivo);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(rutaFinal);
    doc.flushPages();

    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => {
      console.log(`\n✅ PDF guardado en: ${rutaFinal}`);
      resolve(rutaFinal);
    });
    stream.on('error', reject);
  });
}
