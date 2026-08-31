import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';
import { obtenerEstadoChapaRally } from '../infraestructura/chapaRally.js';

function limpiarTexto(valor, fallback = '') {
  if (!valor || String(valor).trim() === '') {
    return fallback;
  }

  return String(valor).trim();
}

function normalizarNombreRally(nombre) {
  const texto = limpiarTexto(nombre, 'Rally Uruguayo');

  if (/argentino/i.test(texto) && !/uruguayo/i.test(texto)) {
    return 'Rally Uruguayo';
  }

  return texto;
}

async function obtenerVistaCabeceraDashboard() {
  const rally = await obtenerColeccionPublica('rally');
  const info = rally[0] || {};
  const chapa = await obtenerEstadoChapaRally();

  return {
    nombre: normalizarNombreRally(info.nombre),
    subtitulo: limpiarTexto(info.subtitulo, ''),
    chapa: {
      existe: Boolean(chapa?.existe),
      actualizada_en: chapa?.actualizada_en || null
    }
  };
}

export { obtenerVistaCabeceraDashboard };
