import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

const DIRECTORIO_ASSETS = path.resolve(process.cwd(), 'assets');
const NOMBRE_ARCHIVO_CHAPA = 'chapa_rally.png';
const RUTA_ARCHIVO_CHAPA = path.join(DIRECTORIO_ASSETS, NOMBRE_ARCHIVO_CHAPA);

function obtenerRutaChapaRally() {
  return RUTA_ARCHIVO_CHAPA;
}

function obtenerUrlChapaRally() {
  return '/api/admin/rally/chapa/archivo';
}

async function obtenerEstadoChapaRally() {
  try {
    const estadisticas = await fsPromises.stat(RUTA_ARCHIVO_CHAPA);

    return {
      existe: true,
      nombre: NOMBRE_ARCHIVO_CHAPA,
      tamanio_bytes: estadisticas.size,
      actualizada_en: estadisticas.mtime.toISOString(),
      url: obtenerUrlChapaRally()
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        existe: false,
        nombre: NOMBRE_ARCHIVO_CHAPA,
        tamanio_bytes: 0,
        actualizada_en: null,
        url: null
      };
    }

    throw error;
  }
}

async function guardarChapaRallyDesdeBase64(imagenBase64) {
  if (!imagenBase64 || typeof imagenBase64 !== 'string') {
    throw new Error('No se recibio una imagen valida para la chapa del rally.');
  }

  const coincidencia = imagenBase64.match(/^data:(image\/png);base64,(.+)$/);
  if (!coincidencia) {
    throw new Error('La chapa del rally debe subirse en formato PNG.');
  }

  const [, , contenidoBase64] = coincidencia;
  const buffer = Buffer.from(contenidoBase64, 'base64');

  await fsPromises.mkdir(DIRECTORIO_ASSETS, { recursive: true });
  await fsPromises.writeFile(RUTA_ARCHIVO_CHAPA, buffer);

  return obtenerEstadoChapaRally();
}

async function eliminarChapaRally() {
  try {
    await fsPromises.unlink(RUTA_ARCHIVO_CHAPA);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return obtenerEstadoChapaRally();
}

function existeArchivoChapaRally() {
  return fs.existsSync(RUTA_ARCHIVO_CHAPA);
}

export {
  eliminarChapaRally,
  existeArchivoChapaRally,
  guardarChapaRallyDesdeBase64,
  obtenerEstadoChapaRally,
  obtenerRutaChapaRally
};
