import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';
import { convertirASegundos } from './tiemposProcesados.js';
import { obtenerRutaMarca } from '../../utilidades/logosVehiculos.js';

const ORDEN_CATEGORIAS = ['RC2', 'Copa RC2', 'RCMR', 'CT', 'RC4', 'RC3', 'RC5'];

function normalizarClase(clase) {
  if (!clase) {
    return 'Sin clase';
  }

  return clase;
}

function formatearTiempo(tiempo) {
  if (!tiempo || tiempo === '' || String(tiempo).trim() === '') {
    return '-';
  }

  const tiempoStr = String(tiempo);
  const indicePunto = tiempoStr.lastIndexOf('.');
  if (indicePunto === -1) {
    return tiempoStr;
  }

  return tiempoStr.substring(0, indicePunto + 2);
}

function segundosATiempo(segundos) {
  if (segundos === null || segundos === undefined) {
    return '-';
  }

  const totalSegundos = Math.floor(Math.round(segundos * 1000) / 1000 * 10) / 10;
  const seg = Math.floor(totalSegundos % 60);
  const decima = Math.floor(Math.round((totalSegundos % 1) * 100) / 100 * 10);
  const minTotal = Math.floor(totalSegundos / 60);

  return `${minTotal}:${String(seg).padStart(2, '0')}.${decima}`;
}

function calcularDiferencia(actual, referencia) {
  if (actual === null || actual === undefined || referencia === null || referencia === undefined) {
    return '-';
  }

  if (actual === referencia) {
    return '—';
  }

  return `+${segundosATiempo(actual - referencia)}`;
}

function obtenerNacionalidades(inscriptos, piloto) {
  const datosInscripto = inscriptos.find((item) => String(item.nro) === String(piloto.nro));
  const nac = piloto.nac || datosInscripto?.nac || 'ARG ARG';
  const nacionalidades = String(nac).trim().split(/\s+/);
  return {
    piloto: (nacionalidades[0] || 'ARG').toLowerCase(),
    navegante: (nacionalidades[1] || nacionalidades[0] || 'ARG').toLowerCase()
  };
}

function obtenerMejorTiempoPiloto(piloto) {
  const tiempos = ['v1', 'v2', 'v3']
    .map((vuelta) => ({
      vuelta,
      segundos: convertirASegundos(piloto[vuelta])
    }))
    .filter((item) => item.segundos);

  if (!tiempos.length) {
    return {
      mejorTiempoSegundos: null,
      mejorVuelta: null,
      tieneTiempos: false
    };
  }

  const mejor = tiempos.reduce((acumulado, actual) => (
    actual.segundos < acumulado.segundos ? actual : acumulado
  ));

  return {
    mejorTiempoSegundos: mejor.segundos,
    mejorVuelta: mejor.vuelta,
    tieneTiempos: true
  };
}

function construirFilaShakedown(piloto, inscriptos) {
  const base = obtenerMejorTiempoPiloto(piloto);
  const datosInscripto = inscriptos.find((item) => String(item.nro) === String(piloto.nro));
  const vehiculo = piloto.vehiculo || datosInscripto?.vehiculo || '-';
  const marca = obtenerRutaMarca(vehiculo);

  return {
    nro: piloto.nro,
    piloto: piloto.piloto || datosInscripto?.piloto || '-',
    navegante: piloto.navegante || datosInscripto?.navegante || '-',
    clase: normalizarClase(piloto.clase || datosInscripto?.clase),
    vehiculo,
    marca: marca.marca,
    logo_marca: marca.logo,
    nacionalidades: obtenerNacionalidades(inscriptos, piloto),
    vuelta_1: formatearTiempo(piloto.v1),
    vuelta_2: formatearTiempo(piloto.v2),
    vuelta_3: formatearTiempo(piloto.v3),
    mejor_tiempo_segundos: base.mejorTiempoSegundos,
    mejor_vuelta: base.mejorVuelta,
    tiene_tiempos: base.tieneTiempos
  };
}

function ordenarCategorias(categorias) {
  return [...categorias].sort((a, b) => {
    const indexA = ORDEN_CATEGORIAS.indexOf(a);
    const indexB = ORDEN_CATEGORIAS.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) {
      return -1;
    }
    if (indexB !== -1) {
      return 1;
    }
    return a.localeCompare(b);
  });
}

function obtenerNombreCategoria(clase) {
  if (clase === 'CT') {
    return 'COPA TOYOTA';
  }

  return clase;
}

function agruparPorClaseConCopaRC2(datos) {
  const grupos = {};

  datos.forEach((piloto) => {
    const claseOriginal = piloto.clase || 'Sin clase';
    const claseNormalizada = claseOriginal.toLowerCase().trim();
    const esCopaRC2 = claseNormalizada.includes('rc2') && claseNormalizada.includes('copa');
    const esRC2Puro = /\brc2\b(?!\w)/i.test(claseNormalizada);

    if (esCopaRC2) {
      grupos['Copa RC2'] = grupos['Copa RC2'] || [];
      grupos.RC2 = grupos.RC2 || [];
      grupos['Copa RC2'].push(piloto);
      grupos.RC2.push(piloto);
      return;
    }

    if (esRC2Puro) {
      grupos.RC2 = grupos.RC2 || [];
      grupos.RC2.push(piloto);
      return;
    }

    const categorias = claseOriginal.split(/\s+/).filter((categoria) => categoria.trim() !== '');
    if (categorias.length > 1) {
      categorias.forEach((categoria) => {
        grupos[categoria] = grupos[categoria] || [];
        grupos[categoria].push(piloto);
      });
      return;
    }

    grupos[claseOriginal] = grupos[claseOriginal] || [];
    grupos[claseOriginal].push(piloto);
  });

  return grupos;
}

function completarDiferencias(lista) {
  const mejorTiempo = lista.length ? lista[0].mejor_tiempo_segundos : null;

  return lista.map((piloto, index) => {
    const anterior = index > 0 ? lista[index - 1].mejor_tiempo_segundos : piloto.mejor_tiempo_segundos;
    return {
      ...piloto,
      posicion: index + 1,
      mejor_tiempo: segundosATiempo(piloto.mejor_tiempo_segundos),
      diferencia_primero: calcularDiferencia(piloto.mejor_tiempo_segundos, mejorTiempo),
      diferencia_anterior: calcularDiferencia(piloto.mejor_tiempo_segundos, anterior)
    };
  });
}

async function obtenerVistaShakedown() {
  const [shakedown, inscriptos] = await Promise.all([
    obtenerColeccionPublica('shakedown'),
    obtenerColeccionPublica('inscriptos')
  ]);

  const filas = shakedown
    .map((piloto) => construirFilaShakedown(piloto, inscriptos))
    .filter((piloto) => piloto.tiene_tiempos)
    .sort((a, b) => a.mejor_tiempo_segundos - b.mejor_tiempo_segundos);

  const general = completarDiferencias(filas);
  const grupos = agruparPorClaseConCopaRC2(filas);

  const categorias = ordenarCategorias(Object.keys(grupos))
    .map((clase) => {
      const pilotos = [...grupos[clase]]
        .filter((piloto) => piloto.tiene_tiempos)
        .sort((a, b) => a.mejor_tiempo_segundos - b.mejor_tiempo_segundos);

      return {
        clase,
        nombre_mostrar: obtenerNombreCategoria(clase),
        pilotos: completarDiferencias(pilotos)
      };
    })
    .filter((categoria) => categoria.pilotos.length > 0);

  return {
    general,
    categorias
  };
}

export { obtenerVistaShakedown };
