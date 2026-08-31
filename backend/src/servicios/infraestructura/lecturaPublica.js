import cache from './cache.js';
import { obtenerPoolPostgres, postgresEstaConfigurado } from './postgres.js';

const TTL_CACHE_POSTGRES_SEGUNDOS = 25;

function normalizarTexto(valor, fallback = '') {
  if (valor === null || valor === undefined) {
    return fallback;
  }

  return String(valor).trim();
}

function formatearTaqueoParaPublico(valor) {
  const texto = normalizarTexto(valor);
  if (!texto) {
    return '';
  }

  const coincidencia = texto.match(/^(\d{1,2}:\d{2}:\d{2})\.(\d{3})$/);
  if (!coincidencia) {
    return texto;
  }

  const [, base, decimales] = coincidencia;
  const visibles = decimales.replace(/0+$/, '') || '0';
  return `${base}.${visibles}`;
}

function construirFilaTiempoPublica(inscripto, resumenCompetidor, registrosPorNro, tramos) {
  const fila = {
    nro: normalizarTexto(inscripto.nro),
    piloto: normalizarTexto(inscripto.piloto),
    navegante: normalizarTexto(inscripto.navegante),
    vehiculo: normalizarTexto(inscripto.vehiculo),
    clase: normalizarTexto(inscripto.clase),
    finalizo: normalizarTexto(resumenCompetidor?.finalizo)
  };

  const registros = registrosPorNro.get(inscripto.nro) || new Map();

  tramos.forEach((tramo) => {
    const pe = Number(tramo.pe);
    const registro = registros.get(pe);
    const cancelado = normalizarTexto(tramo.estado).toLowerCase() === 'cancelado';

    fila[`hlpe${pe}`] = normalizarTexto(registro?.hlpe);
    fila[`tpe${pe}`] = formatearTaqueoParaPublico(registro?.tpe);
    fila[`pe${pe}`] = normalizarTexto(registro?.pe_tiempo, cancelado ? '0:00.000' : '');
  });

  return fila;
}

async function obtenerColeccionDesdePostgres(nombreColeccion) {
  const pool = obtenerPoolPostgres();

  switch (nombreColeccion) {
    case 'rally': {
      const resultado = await pool.query(`
        SELECT id_rally, nombre, subtitulo, en_carrera
        FROM rally
        ORDER BY id_rally ASC
      `);

      return resultado.rows.map((fila) => ({
        id: String(fila.id_rally),
        id_rally: fila.id_rally,
        nombre: normalizarTexto(fila.nombre),
        subtitulo: normalizarTexto(fila.subtitulo),
        en_carrera: normalizarTexto(fila.en_carrera, 'no')
      }));
    }

    case 'tramos': {
      const resultado = await pool.query(`
        SELECT pe, etapa, desde, hasta, kms, hora, estado
        FROM tramos
        ORDER BY pe ASC
      `);

      return resultado.rows.map((fila) => ({
        id: String(fila.pe),
        pe: normalizarTexto(fila.pe),
        etapa: normalizarTexto(fila.etapa),
        desde: normalizarTexto(fila.desde),
        hasta: normalizarTexto(fila.hasta),
        kms: normalizarTexto(fila.kms),
        hora: normalizarTexto(fila.hora),
        estado: normalizarTexto(fila.estado)
      }));
    }

    case 'inscriptos': {
      const resultado = await pool.query(`
        SELECT nro, piloto, navegante, vehiculo, clase, nac
        FROM inscriptos
        ORDER BY nro ASC
      `);

      return resultado.rows.map((fila) => ({
        id: String(fila.nro),
        nro: normalizarTexto(fila.nro),
        piloto: normalizarTexto(fila.piloto),
        navegante: normalizarTexto(fila.navegante),
        vehiculo: normalizarTexto(fila.vehiculo),
        clase: normalizarTexto(fila.clase),
        nac: normalizarTexto(fila.nac)
      }));
    }

    case 'horariosE1':
    case 'horariosE2': {
      const etapa = nombreColeccion === 'horariosE1' ? 1 : 2;
      const resultado = await pool.query(`
        SELECT nro, piloto, navegante, vehiculo, clase, nac, hora
        FROM horarios_largada_publicados
        WHERE etapa = $1
        ORDER BY hora ASC, nro ASC
      `, [etapa]);

      return resultado.rows.map((fila) => ({
        id: `${fila.nro}-${etapa}`,
        nro: normalizarTexto(fila.nro),
        piloto: normalizarTexto(fila.piloto),
        navegante: normalizarTexto(fila.navegante),
        vehiculo: normalizarTexto(fila.vehiculo),
        clase: normalizarTexto(fila.clase),
        nac: normalizarTexto(fila.nac),
        hora: normalizarTexto(fila.hora)
      }));
    }

    case 'penalizaciones': {
      const resultado = await pool.query(`
        SELECT
          p.id_penal,
          p.nro,
          i.piloto,
          i.navegante,
          p.peocurrido,
          p.tiempo,
          p.motivo,
          p.control
        FROM penalizaciones p
        LEFT JOIN inscriptos i ON i.nro = p.nro
        ORDER BY p.id_penal ASC
      `);

      return resultado.rows.map((fila) => ({
        id: String(fila.id_penal),
        nro: normalizarTexto(fila.nro),
        piloto: normalizarTexto(fila.piloto),
        navegante: normalizarTexto(fila.navegante),
        peocurrido: normalizarTexto(fila.peocurrido),
        tiempo: normalizarTexto(fila.tiempo),
        motivo: normalizarTexto(fila.motivo),
        control: normalizarTexto(fila.control)
      }));
    }

    case 'shakedown': {
      const resultado = await pool.query(`
        SELECT
          i.nro,
          i.piloto,
          i.navegante,
          i.vehiculo,
          i.clase,
          i.nac,
          s.hlv1,
          s.tv1,
          s.v1,
          s.hlv2,
          s.tv2,
          s.v2,
          s.hlv3,
          s.tv3,
          s.v3
        FROM inscriptos i
        LEFT JOIN shakedown s ON s.nro = i.nro
        ORDER BY i.nro ASC
      `);

      return resultado.rows.map((fila) => ({
        id: String(fila.nro),
        nro: normalizarTexto(fila.nro),
        piloto: normalizarTexto(fila.piloto),
        navegante: normalizarTexto(fila.navegante),
        vehiculo: normalizarTexto(fila.vehiculo),
        clase: normalizarTexto(fila.clase),
        nac: normalizarTexto(fila.nac),
        hlv1: normalizarTexto(fila.hlv1),
        tv1: formatearTaqueoParaPublico(fila.tv1),
        v1: normalizarTexto(fila.v1),
        hlv2: normalizarTexto(fila.hlv2),
        tv2: formatearTaqueoParaPublico(fila.tv2),
        v2: normalizarTexto(fila.v2),
        hlv3: normalizarTexto(fila.hlv3),
        tv3: formatearTaqueoParaPublico(fila.tv3),
        v3: normalizarTexto(fila.v3)
      }));
    }

    case 'tiempos': {
      const [inscriptosResult, resumenResult, tiemposResult, tramosResult] = await Promise.all([
        pool.query(`
          SELECT nro, piloto, navegante, vehiculo, clase
          FROM inscriptos
          ORDER BY nro ASC
        `),
        pool.query(`
          SELECT nro, finalizo
          FROM tiempos_competidores
        `),
        pool.query(`
          SELECT nro, pe, hlpe, tpe, pe_tiempo
          FROM tiempos_tramos
          ORDER BY nro ASC, pe ASC
        `),
        pool.query(`
          SELECT pe, estado
          FROM tramos
          WHERE pe > 0
          ORDER BY pe ASC
        `)
      ]);

      const resumenPorNro = new Map(resumenResult.rows.map((fila) => [fila.nro, fila]));
      const registrosPorNro = new Map();

      tiemposResult.rows.forEach((registro) => {
        if (!registrosPorNro.has(registro.nro)) {
          registrosPorNro.set(registro.nro, new Map());
        }
        registrosPorNro.get(registro.nro).set(registro.pe, registro);
      });

      return inscriptosResult.rows.map((inscripto) => (
        construirFilaTiempoPublica(
          inscripto,
          resumenPorNro.get(inscripto.nro),
          registrosPorNro,
          tramosResult.rows
        )
      ));
    }

    default:
      return null;
  }
}

async function obtenerDocumentoDesdePostgres(nombreColeccion, idDocumento) {
  if (nombreColeccion !== 'tiempos') {
    return null;
  }

  const tiempos = await obtenerColeccionDesdePostgres('tiempos');
  return tiempos.find((fila) => String(fila.nro) === String(idDocumento)) || null;
}

async function obtenerColeccionPublica(nombreColeccion) {
  try {
    const claveCacheGeneral = `coleccion:${nombreColeccion}`;

    const datosEnCache = cache.obtener(claveCacheGeneral);
    if (datosEnCache) {
      return datosEnCache;
    }

    if (!postgresEstaConfigurado()) {
      throw new Error('PostgreSQL no esta configurado para lecturas publicas');
    }

    const datosPostgres = await obtenerColeccionDesdePostgres(nombreColeccion);
    if (datosPostgres === null) {
      throw new Error(`Coleccion ${nombreColeccion} no existe`);
    }

    cache.guardar(claveCacheGeneral, datosPostgres, TTL_CACHE_POSTGRES_SEGUNDOS);
    return datosPostgres;
  } catch (error) {
    console.error(`Error al obtener coleccion '${nombreColeccion}':`, error.message);
    throw error;
  }
}

async function obtenerDocumentoPublico(nombreColeccion, idDocumento) {
  try {
    const claveCache = `documento:${nombreColeccion}:${idDocumento}`;

    const datoEnCache = cache.obtener(claveCache);
    if (datoEnCache) {
      return datoEnCache;
    }

    if (!postgresEstaConfigurado()) {
      throw new Error('PostgreSQL no esta configurado para lecturas publicas');
    }

    const datoPostgres = await obtenerDocumentoDesdePostgres(nombreColeccion, idDocumento);
    if (datoPostgres === null) {
      return null;
    }

    cache.guardar(claveCache, datoPostgres, TTL_CACHE_POSTGRES_SEGUNDOS);
    return datoPostgres;
  } catch (error) {
    console.error(`Error al obtener documento '${idDocumento}':`, error.message);
    throw error;
  }
}

export {
  obtenerColeccionPublica,
  obtenerDocumentoPublico
};
