import { generarPdfAdmin, TIPOS_PDF, validarMetadatosPdf } from '../../servicios/internos/pdfAdmin.js';
import { manejarErrorAdmin } from './adminHelpers.js';

export async function obtenerTiposPdf(req, res) {
  return res.json({
    exito: true,
    datos: [
      { id: TIPOS_PDF.inscriptos, nombre: 'Inscriptos' },
      { id: TIPOS_PDF.orden_largada_etapa_1, nombre: 'Orden de Largada Etapa 1' },
      { id: TIPOS_PDF.orden_largada_etapa_2, nombre: 'Orden de Largada Etapa 2' },
      { id: TIPOS_PDF.clasif_final_general, nombre: 'Clasificacion Final General' },
      { id: TIPOS_PDF.clasif_final_categoria, nombre: 'Clasificacion Final por Categoria' },
      { id: TIPOS_PDF.clasif_etapa_1_categoria, nombre: 'Clasificacion por Categoria Etapa 1' },
      { id: TIPOS_PDF.clasif_etapa_2_categoria, nombre: 'Clasificacion por Categoria Etapa 2' },
      { id: TIPOS_PDF.clasif_etapa_1_general, nombre: 'Clasificacion General Etapa 1' },
      { id: TIPOS_PDF.clasif_etapa_2_general, nombre: 'Clasificacion General Etapa 2' }
    ]
  });
}

export async function descargarPdfAdmin(req, res) {
  const tipoPdf = String(req.params.tipoPdf || '').trim();
  const validacion = validarMetadatosPdf(req.body);

  if (!validacion.esValido) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Los datos del encabezado del PDF no son validos.',
      errores: validacion.errores
    });
  }

  try {
    const resultado = await generarPdfAdmin(tipoPdf, {
      numeroFecha: validacion.datos.numeroFecha,
      fechaEvento: validacion.datos.fechaEvento
    });

    if (!resultado?.buffer || !resultado?.nombreArchivo) {
      throw new Error('No se pudo generar el PDF solicitado.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
    res.setHeader('X-Pdf-Filename', resultado.nombreArchivo);
    res.setHeader('Cache-Control', 'no-store');

    return res.send(resultado.buffer);
  } catch (error) {
    return manejarErrorAdmin(res, error, `admin/pdfs/${tipoPdf}`);
  }
}
