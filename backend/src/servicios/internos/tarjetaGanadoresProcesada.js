import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';
import { convertirASegundos } from './tiemposProcesados.js';
import { obtenerRutaMarca } from '../../utilidades/logosVehiculos.js';

const ORDEN_CATEGORIAS = ['RC2', 'Copa RC2', 'RCMR', 'CT', 'RC4', 'RC3', 'RC5'];

function obtenerMaximoPE(tramos) {
  if (!tramos.length) {
    return 0;
  }
  return Math.max(...tramos.map((tramo) => parseInt(tramo.pe, 10) || 0));
}

function estaTramoCancelado(pe, tramos) {
  const tramo = tramos.find((item) => parseInt(item.pe, 10) === parseInt(pe, 10));
  if (!tramo?.estado) {
    return false;
  }

  const estado = String(tramo.estado).toLowerCase().trim();
  return estado === 'cancelado' || estado === 'cancelada';
}

function obtenerPEsValidos(peMaximo, tramos) {
  const resultado = [];
  for (let pe = 1; pe <= peMaximo; pe += 1) {
    if (!estaTramoCancelado(pe, tramos)) {
      resultado.push(pe);
    }
  }
  return resultado;
}

function verificarTramosFinalizados(tramos) {
  if (!tramos.length) {
    return false;
  }

  const tramosValidos = tramos.filter((tramo) => {
    if (String(tramo.pe) === '0') {
      return false;
    }

    const estado = String(tramo.estado || '').toLowerCase().trim();
    return estado !== 'cancelado' && estado !== 'cancelada';
  });

  return tramosValidos.every((tramo) => {
    const estado = String(tramo.estado || '').toLowerCase().trim();
    return (
      estado === 'finalizado' ||
      estado === 'finalizada' ||
      estado === 'interrumpido' ||
      estado === 'interrumpida' ||
      estado === 'suspendido' ||
      estado === 'suspendida'
    );
  });
}

function pilotoCompletoTodosLosPEs(piloto, peMaximo, tramos) {
  const pesValidos = obtenerPEsValidos(peMaximo, tramos);
  return pesValidos.every((pe) => {
    const tiempo = piloto[`pe${pe}`];
    return tiempo && tiempo !== '-' && tiempo !== '';
  });
}

function obtenerPenalizacionesPiloto(nroPiloto, peMaximo, penalizaciones) {
  return penalizaciones.filter((penalizacion) => {
    const mismoNro = String(penalizacion.nro).trim() === String(nroPiloto).trim();
    const peOcurrido = parseInt(penalizacion.peocurrido, 10) || 0;
    return mismoNro && peOcurrido <= peMaximo;
  });
}

function calcularTotalPenalizaciones(nroPiloto, peMaximo, penalizaciones) {
  return obtenerPenalizacionesPiloto(nroPiloto, peMaximo, penalizaciones)
    .reduce((total, penalizacion) => total + convertirASegundos(penalizacion.tiempo), 0);
}

function calcularTiempoNetoTotal(piloto, peMaximo, tramos) {
  return obtenerPEsValidos(peMaximo, tramos).reduce((total, pe) => {
    const tiempo = piloto[`pe${pe}`];
    if (!tiempo || tiempo === '-' || tiempo === '') {
      return total;
    }
    return total + convertirASegundos(tiempo);
  }, 0);
}

function calcularTotalConPenalizaciones(piloto, peMaximo, tramos, penalizaciones) {
  return calcularTiempoNetoTotal(piloto, peMaximo, tramos) +
    calcularTotalPenalizaciones(piloto.nro, peMaximo, penalizaciones);
}

function segundosATiempo(segundos) {
  const totalSegundos = Math.floor(Math.round(segundos * 1000) / 1000 * 10) / 10;
  const seg = Math.floor(totalSegundos % 60);
  const decima = Math.floor(Math.round((totalSegundos % 1) * 100) / 100 * 10);
  const minTotal = Math.floor(totalSegundos / 60);

  if (minTotal >= 60) {
    const horas = Math.floor(minTotal / 60);
    const min = minTotal % 60;
    return `${horas}:${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}.${decima}`;
  }

  return `${minTotal}:${String(seg).padStart(2, '0')}.${decima}`;
}

function calcularDiferencia(actual, referencia) {
  const diff = actual - referencia;
  if (diff <= 0) {
    return '—';
  }
  return `+${segundosATiempo(diff)}`;
}

function agruparPorClaseConCopaRC2(tiempos) {
  const grupos = {};

  tiempos.forEach((piloto) => {
    const claseOriginal = piloto.clase || 'Sin clase';
    const claseNormalizada = claseOriginal.toLowerCase().trim();

    if (claseOriginal.includes('-')) {
      return;
    }

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
        if (!categoria.includes('-')) {
          grupos[categoria] = grupos[categoria] || [];
          grupos[categoria].push(piloto);
        }
      });
      return;
    }

    grupos[claseOriginal] = grupos[claseOriginal] || [];
    grupos[claseOriginal].push(piloto);
  });

  return grupos;
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

function construirPilotoTarjeta(piloto, mejorTiempo, posicion) {
  const marca = obtenerRutaMarca(piloto.vehiculo || '-');

  return {
    posicion,
    nro: piloto.nro,
    piloto: piloto.piloto,
    navegante: piloto.navegante,
    vehiculo: piloto.vehiculo,
    logo_marca: marca.logo,
    tiempo: posicion === 1
      ? segundosATiempo(piloto.totalSegundos)
      : calcularDiferencia(piloto.totalSegundos, mejorTiempo)
  };
}

async function obtenerVistaTarjetaGanadores() {
  const [tiempos, tramos, penalizaciones] = await Promise.all([
    obtenerColeccionPublica('tiempos'),
    obtenerColeccionPublica('tramos'),
    obtenerColeccionPublica('penalizaciones')
  ]);

  const peMaximo = obtenerMaximoPE(tramos);
  const todosLosTramosFinalizados = verificarTramosFinalizados(tramos);

  const pilotosFinalistas = tiempos.filter((piloto) => {
    if (!pilotoCompletoTodosLosPEs(piloto, peMaximo, tramos)) {
      return false;
    }

    const finalizo = String(piloto.finalizo || piloto.fin || '').toLowerCase().trim();
    return finalizo === 'si';
  });

  const hayPilotosCompletos = pilotosFinalistas.length > 0;

  if (!hayPilotosCompletos) {
    return {
      visible: false,
      motivo: 'sin_pilotos_completos',
      categorias: [],
      todos_los_tramos_finalizados: todosLosTramosFinalizados
    };
  }

  const grupos = agruparPorClaseConCopaRC2(tiempos);
  const categorias = ordenarCategorias(Object.keys(grupos))
    .map((clase) => {
      const pilotosCompletos = grupos[clase]
        .filter((piloto) => {
          if (!pilotoCompletoTodosLosPEs(piloto, peMaximo, tramos)) {
            return false;
          }

          const finalizo = String(piloto.finalizo || piloto.fin || '').toLowerCase().trim();
          return finalizo === 'si';
        })
        .map((piloto) => ({
          ...piloto,
          totalSegundos: calcularTotalConPenalizaciones(piloto, peMaximo, tramos, penalizaciones)
        }))
        .sort((a, b) => a.totalSegundos - b.totalSegundos)
        .slice(0, 3);

      if (!pilotosCompletos.length) {
        return null;
      }

      const mejorTiempo = pilotosCompletos[0].totalSegundos;

      return {
        clase,
        nombre_mostrar: obtenerNombreCategoria(clase),
        estado: todosLosTramosFinalizados ? 'Finalizado' : 'En carrera',
        pilotos: pilotosCompletos.map((piloto, index) => construirPilotoTarjeta(piloto, mejorTiempo, index + 1))
      };
    })
    .filter(Boolean);

  return {
    visible: categorias.length > 0,
    motivo: categorias.length > 0 ? null : 'sin_categorias',
    todos_los_tramos_finalizados: todosLosTramosFinalizados,
    categorias
  };
}

export { obtenerVistaTarjetaGanadores };
