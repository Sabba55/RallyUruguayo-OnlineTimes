// ============================================
// SERVICIO DE PROCESAMIENTO DE TIEMPOS DE RALLY
// listas para consumir: por PE, por clase y por etapa.
// ============================================

import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';
import { obtenerRutaMarca } from '../../utilidades/logosVehiculos.js';

const ESTADOS_ESPECIALES = ['DNF', 'RET', 'AB', 'DNS', 'DSQ', 'NC'];
const ORDEN_CATEGORIAS = ['RC2', 'Copa RC2', 'RCMR', 'CT', 'RC4', 'RC3', 'RC5'];

function corregirFormatoTiempo(timeStr) {
  if (!timeStr || timeStr === '' || timeStr === '-' || timeStr === null || timeStr === undefined) {
    return '';
  }

  let tiempo = String(timeStr).trim();

  if (ESTADOS_ESPECIALES.includes(tiempo.toUpperCase())) {
    return '-';
  }

  const separadores = (tiempo.match(/[:.,]/g) || []).length;

  if (separadores === 2) {
    const partes = tiempo.split(/[:.,]/);
    if (partes.length === 3) {
      tiempo = `${partes[0]}:${partes[1]}.${partes[2]}`;
    }
  } else if (separadores === 1) {
    tiempo = tiempo.replace(',', '.');
  }

  return tiempo;
}

function convertirASegundos(valor) {
  if (!valor || valor === '-' || valor === '' || valor === null || valor === undefined) {
    return 0;
  }

  try {
    const tiempoCorregido = corregirFormatoTiempo(valor);
    if (!tiempoCorregido || tiempoCorregido === '-') {
      return 0;
    }

    const partes = tiempoCorregido.split(':');
    if (partes.length === 2) {
      const minutos = parseInt(partes[0], 10) || 0;
      const segundos = parseFloat(partes[1]) || 0;
      return (minutos * 60) + segundos;
    }

    if (partes.length === 3) {
      const horas = parseInt(partes[0], 10) || 0;
      const minutos = parseInt(partes[1], 10) || 0;
      const segundos = parseFloat(partes[2]) || 0;
      return (horas * 3600) + (minutos * 60) + segundos;
    }

    return 0;
  } catch {
    return 0;
  }
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
  const diferencia = actual - referencia;
  if (diferencia <= 0) {
    return '—';
  }
  return `+${segundosATiempo(diferencia)}`;
}

function normalizarClaseGeneral(clase) {
  if (!clase) {
    return 'Sin clase';
  }

  const claseNormalizada = clase.toLowerCase().trim();
  if (claseNormalizada.includes('rc2') && claseNormalizada.includes('copa')) {
    return 'RC2';
  }

  return clase;
}

function obtenerNombreCategoria(clase) {
  if (clase === 'CT') {
    return 'COPA TOYOTA';
  }

  return clase;
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

function estaTramoCancelado(pe, tramos) {
  const tramo = tramos.find((item) => parseInt(item.pe, 10) === parseInt(pe, 10));
  if (!tramo || !tramo.estado) {
    return false;
  }

  const estado = String(tramo.estado).toLowerCase().trim();
  return estado === 'cancelado' || estado === 'cancelada';
}

function obtenerPEsValidosHasta(peActual, tramos) {
  const peMaximo = parseInt(peActual, 10);
  const resultado = [];

  for (let i = 1; i <= peMaximo; i += 1) {
    if (!estaTramoCancelado(i, tramos)) {
      resultado.push(i);
    }
  }

  return resultado;
}

function obtenerPEsEtapa2Hasta(peActual, tramos) {
  return tramos
    .filter((tramo) => {
      const esEtapa2 = String(tramo.etapa) === '2';
      const pe = parseInt(tramo.pe, 10);
      return esEtapa2 && pe <= peActual && !estaTramoCancelado(pe, tramos);
    })
    .map((tramo) => parseInt(tramo.pe, 10))
    .sort((a, b) => a - b);
}

function obtenerDistanciaPE(numeroPE, tramos) {
  const tramo = tramos.find((item) => String(item.pe) === String(numeroPE));
  if (!tramo?.kms) {
    return 0;
  }

  const kms = parseFloat(String(tramo.kms).replace(',', '.'));
  return Number.isFinite(kms) ? kms : 0;
}

function calcularVelocidadPromedioPE(tiempo, numeroPE, tramos) {
  const segundos = convertirASegundos(tiempo);
  if (!segundos) {
    return '-';
  }

  const distancia = obtenerDistanciaPE(numeroPE, tramos);
  if (!distancia) {
    return '-';
  }

  return (distancia / (segundos / 3600)).toFixed(1);
}

function obtenerPenalizacionesPilotoHasta(nroPiloto, peActual, penalizaciones) {
  return penalizaciones.filter((penalizacion) => {
    const nroMatch = String(penalizacion.nro).trim() === String(nroPiloto).trim();
    const peOcurrido = parseInt(penalizacion.peocurrido, 10) || 0;
    return nroMatch && peOcurrido <= peActual;
  });
}

function calcularTotalPenalizaciones(nroPiloto, peActual, penalizaciones) {
  return obtenerPenalizacionesPilotoHasta(nroPiloto, peActual, penalizaciones)
    .reduce((total, penalizacion) => total + convertirASegundos(penalizacion.tiempo), 0);
}

function calcularPenalizacionesEtapa2(nroPiloto, pesEtapa2, penalizaciones) {
  return obtenerPenalizacionesPilotoHasta(nroPiloto, Math.max(...pesEtapa2, 0), penalizaciones)
    .filter((penalizacion) => pesEtapa2.includes(parseInt(penalizacion.peocurrido, 10) || 0))
    .reduce((total, penalizacion) => total + convertirASegundos(penalizacion.tiempo), 0);
}

function calcularTiempoNetoHastaPE(piloto, pes) {
  return pes.reduce((total, pe) => {
    const tiempo = piloto[`pe${pe}`];
    if (!tiempo || tiempo === '-' || tiempo === '') {
      return total;
    }
    return total + convertirASegundos(tiempo);
  }, 0);
}

function pilotoCompletoEnPEs(piloto, pes) {
  return pes.every((pe) => {
    const tiempo = piloto[`pe${pe}`];
    return tiempo && tiempo !== '-' && tiempo !== '';
  });
}

function agruparPorClaseConCopaRC2(tiempos) {
  const grupos = {};

  tiempos.forEach((piloto) => {
    const claseOriginal = piloto.clase || 'Sin clase';
    const claseNormalizada = claseOriginal.toLowerCase().trim();
    const esCopaRC2 = claseNormalizada.includes('rc2') && claseNormalizada.includes('copa');
    const esRC2Puro = /\brc2\b(?!\w)/i.test(claseNormalizada);

    if (esCopaRC2) {
      grupos['Copa RC2'] = grupos['Copa RC2'] || [];
      grupos['RC2'] = grupos['RC2'] || [];
      grupos['Copa RC2'].push(piloto);
      grupos['RC2'].push(piloto);
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

function construirTramo(peActual, tramos) {
  const tramo = tramos.find((item) => parseInt(item.pe, 10) === peActual);
  if (!tramo) {
    return {
      pe: peActual,
      nombre: 'Tramo',
      kms: '-',
      hora: '-',
      etapa: '-',
      estado: '-'
    };
  }

  const nombre = tramo.hasta && String(tramo.hasta).trim() !== ''
    ? `${tramo.desde || 'Tramo'} - ${tramo.hasta}`
    : (tramo.desde || 'Tramo');

  const desdeNormalizado = String(tramo.desde || '').toLowerCase();
  const hastaNormalizado = String(tramo.hasta || '').toLowerCase();

  return {
    pe: tramo.pe,
    nombre,
    kms: tramo.kms || '-',
    hora: tramo.hora || '-',
    etapa: tramo.etapa || '-',
    estado: tramo.estado || '-',
    power_stage: desdeNormalizado.includes('power stage') || hastaNormalizado.includes('power stage')
  };
}

function obtenerNacionalidades(inscriptos, nro) {
  const inscripto = inscriptos.find((item) => String(item.nro) === String(nro));
  const valores = String(inscripto?.nac || '').trim().split(/\s+/).filter(Boolean);
  const piloto = (valores[0] || 'ARG').toLowerCase();
  const navegante = (valores[1] || valores[0] || 'ARG').toLowerCase();
  return {
    piloto,
    navegante
  };
}

function construirFilaBase(piloto) {
  const vehiculo = piloto.vehiculo || '-';
  const marcaData = obtenerRutaMarca(vehiculo);

  return {
    nro: piloto.nro,
    piloto: piloto.piloto,
    navegante: piloto.navegante,
    clase: normalizarClaseGeneral(piloto.clase),
    vehiculo,
    marca: marcaData.marca,
    logo_marca: marcaData.logo
  };
}

function construirClasificacionPE(tiempos, peActual, tramos) {
  const clavePE = `pe${peActual}`;
  const pilotosPE = tiempos
    .filter((piloto) => {
      const tiempo = piloto[clavePE];
      return tiempo && tiempo !== '-' && tiempo !== '';
    })
    .sort((a, b) => convertirASegundos(a[clavePE]) - convertirASegundos(b[clavePE]));

  const mejorTiempo = pilotosPE.length ? pilotosPE[0][clavePE] : null;

  return pilotosPE.map((piloto, index) => ({
    posicion: index + 1,
    ...construirFilaBase(piloto),
    tiempo_pe: segundosATiempo(convertirASegundos(piloto[clavePE])),
    diferencia_primero: calcularDiferencia(
      convertirASegundos(piloto[clavePE]),
      convertirASegundos(mejorTiempo)
    ),
    promedio_kmh: calcularVelocidadPromedioPE(piloto[clavePE], peActual, tramos)
  }));
}

function construirClasificacionGeneral(tiempos, peActual, tramos, penalizaciones) {
  const pesValidos = obtenerPEsValidosHasta(peActual, tramos);
  const pesPrevios = obtenerPEsValidosHasta(peActual - 1, tramos);
  const rankingPrevio = peActual > 1
    ? tiempos
      .filter((piloto) => pilotoCompletoEnPEs(piloto, pesPrevios))
      .map((piloto) => ({
        nro: piloto.nro,
        totalSegundos: calcularTiempoNetoHastaPE(piloto, pesPrevios) +
          calcularTotalPenalizaciones(piloto.nro, peActual - 1, penalizaciones)
      }))
      .sort((a, b) => a.totalSegundos - b.totalSegundos)
    : [];

  const pilotosGeneral = tiempos
    .filter((piloto) => pilotoCompletoEnPEs(piloto, pesValidos))
    .map((piloto) => {
      const tiempoNetoSegundos = calcularTiempoNetoHastaPE(piloto, pesValidos);
      const penalizacionSegundos = calcularTotalPenalizaciones(piloto.nro, peActual, penalizaciones);
      return {
        piloto,
        tiempoNetoSegundos,
        penalizacionSegundos,
        totalSegundos: tiempoNetoSegundos + penalizacionSegundos
      };
    })
    .sort((a, b) => a.totalSegundos - b.totalSegundos);

  const mejorTotal = pilotosGeneral.length ? pilotosGeneral[0].totalSegundos : 0;

  return pilotosGeneral.map((entrada, index) => {
    const anterior = index > 0 ? pilotosGeneral[index - 1].totalSegundos : entrada.totalSegundos;
    const posicionPrevia = rankingPrevio.findIndex((item) => String(item.nro) === String(entrada.piloto.nro));
    const cambioPosicion = posicionPrevia === -1 ? 0 : (posicionPrevia + 1) - (index + 1);

    const distancia = pesValidos.reduce((total, pe) => total + obtenerDistanciaPE(pe, tramos), 0);
    const promedioGeneral = entrada.totalSegundos && distancia
      ? (distancia / (entrada.totalSegundos / 3600)).toFixed(1)
      : '-';

    return {
      posicion: index + 1,
      cambio_posicion: cambioPosicion,
      ...construirFilaBase(entrada.piloto),
      tiempo_neto: segundosATiempo(entrada.tiempoNetoSegundos),
      penalizacion: entrada.penalizacionSegundos > 0 ? segundosATiempo(entrada.penalizacionSegundos) : '-',
      tiempo_total: segundosATiempo(entrada.totalSegundos),
      diferencia_primero: calcularDiferencia(entrada.totalSegundos, mejorTotal),
      diferencia_anterior: calcularDiferencia(entrada.totalSegundos, anterior),
      promedio_general_kmh: promedioGeneral
    };
  });
}

function construirClasificacionEtapa2(tiempos, peActual, tramos, penalizaciones, inscriptos) {
  const pesEtapa2 = obtenerPEsEtapa2Hasta(peActual, tramos);
  const grupos = agruparPorClaseConCopaRC2(tiempos);

  return ordenarCategorias(Object.keys(grupos)).map((clase) => {
    const pilotosGeneral = grupos[clase]
      .filter((piloto) => pilotoCompletoEnPEs(piloto, pesEtapa2))
      .map((piloto) => {
        const tiempoNetoSegundos = calcularTiempoNetoHastaPE(piloto, pesEtapa2);
        const penalizacionSegundos = calcularPenalizacionesEtapa2(piloto.nro, pesEtapa2, penalizaciones);
        return {
          piloto,
          tiempoNetoSegundos,
          penalizacionSegundos,
          totalSegundos: tiempoNetoSegundos + penalizacionSegundos
        };
      })
      .sort((a, b) => a.totalSegundos - b.totalSegundos);

    const mejorTotal = pilotosGeneral.length ? pilotosGeneral[0].totalSegundos : 0;
    const distanciaEtapa = pesEtapa2.reduce((total, pe) => total + obtenerDistanciaPE(pe, tramos), 0);
    const peAnteriorIndex = pesEtapa2.findIndex((valor) => valor === peActual) - 1;
    const peAnterior = peAnteriorIndex >= 0 ? pesEtapa2[peAnteriorIndex] : null;
    const pesPrevios = peAnterior ? obtenerPEsEtapa2Hasta(peAnterior, tramos) : [];
    const rankingPrevio = peAnterior
      ? grupos[clase]
        .filter((piloto) => pilotoCompletoEnPEs(piloto, pesPrevios))
        .map((piloto) => ({
          nro: piloto.nro,
          totalSegundos: calcularTiempoNetoHastaPE(piloto, pesPrevios) +
            calcularPenalizacionesEtapa2(piloto.nro, pesPrevios, penalizaciones)
        }))
        .sort((a, b) => a.totalSegundos - b.totalSegundos)
      : [];

    return {
      clase,
      nombre_mostrar: obtenerNombreCategoria(clase),
      clasificacion_general: pilotosGeneral.map((entrada, index) => {
        const anterior = index > 0 ? pilotosGeneral[index - 1].totalSegundos : entrada.totalSegundos;
        const posicionPrevia = rankingPrevio.findIndex((item) => String(item.nro) === String(entrada.piloto.nro));
        const cambioPosicion = posicionPrevia === -1 ? 0 : (posicionPrevia + 1) - (index + 1);
        const nacionalidades = obtenerNacionalidades(inscriptos, entrada.piloto.nro);
        const promedioGeneral = entrada.totalSegundos && distanciaEtapa
          ? (distanciaEtapa / (entrada.totalSegundos / 3600)).toFixed(1)
          : '-';

        return {
          posicion: index + 1,
          cambio_posicion: cambioPosicion,
          ...construirFilaBase(entrada.piloto),
          nacionalidades,
          tiempo_neto: segundosATiempo(entrada.tiempoNetoSegundos),
          penalizacion: entrada.penalizacionSegundos > 0 ? segundosATiempo(entrada.penalizacionSegundos) : '-',
          tiempo_total: segundosATiempo(entrada.totalSegundos),
          diferencia_primero: calcularDiferencia(entrada.totalSegundos, mejorTotal),
          diferencia_anterior: calcularDiferencia(entrada.totalSegundos, anterior),
          promedio_general_kmh: promedioGeneral
        };
      })
    };
  }).filter((categoria) => categoria.clasificacion_general.length > 0);
}

function construirClasificacionPorClases(tiempos, peActual, tramos, penalizaciones) {
  const grupos = agruparPorClaseConCopaRC2(tiempos);
  const pesValidos = obtenerPEsValidosHasta(peActual, tramos);
  const tramo = construirTramo(peActual, tramos);

  return ordenarCategorias(Object.keys(grupos)).map((clase) => {
    const pilotos = grupos[clase];
    const clavePE = `pe${peActual}`;
    const pilotosPE = pilotos
      .filter((piloto) => {
        const tiempo = piloto[clavePE];
        return tiempo && tiempo !== '-' && tiempo !== '';
      })
      .sort((a, b) => convertirASegundos(a[clavePE]) - convertirASegundos(b[clavePE]));

    const mejorPE = pilotosPE.length ? pilotosPE[0][clavePE] : null;

    const pilotosGeneral = pilotos
      .filter((piloto) => pilotoCompletoEnPEs(piloto, pesValidos))
      .map((piloto) => {
        const tiempoNetoSegundos = calcularTiempoNetoHastaPE(piloto, pesValidos);
        const penalizacionSegundos = calcularTotalPenalizaciones(piloto.nro, peActual, penalizaciones);
        return {
          piloto,
          tiempoNetoSegundos,
          penalizacionSegundos,
          totalSegundos: tiempoNetoSegundos + penalizacionSegundos
        };
      })
      .sort((a, b) => a.totalSegundos - b.totalSegundos);

    const mejorTotal = pilotosGeneral.length ? pilotosGeneral[0].totalSegundos : 0;
    const pesPrevios = obtenerPEsValidosHasta(peActual - 1, tramos);
    const rankingPrevio = peActual > 1
      ? pilotos
        .filter((piloto) => pilotoCompletoEnPEs(piloto, pesPrevios))
        .map((piloto) => ({
          nro: piloto.nro,
          totalSegundos: calcularTiempoNetoHastaPE(piloto, pesPrevios) +
            calcularTotalPenalizaciones(piloto.nro, peActual - 1, penalizaciones)
        }))
        .sort((a, b) => a.totalSegundos - b.totalSegundos)
      : [];

    const distanciaGeneral = pesValidos.reduce((total, pe) => total + obtenerDistanciaPE(pe, tramos), 0);

    return {
      clase,
      nombre_mostrar: obtenerNombreCategoria(clase),
      power_stage: tramo.power_stage,
      clasificacion_pe: pilotosPE.map((piloto, index) => ({
        posicion: index + 1,
        ...construirFilaBase(piloto),
        tiempo_pe: segundosATiempo(convertirASegundos(piloto[clavePE])),
        diferencia_primero: calcularDiferencia(
          convertirASegundos(piloto[clavePE]),
          convertirASegundos(mejorPE)
        ),
        promedio_kmh: calcularVelocidadPromedioPE(piloto[clavePE], peActual, tramos)
      })),
      clasificacion_general: pilotosGeneral.map((entrada, index) => {
        const anterior = index > 0 ? pilotosGeneral[index - 1].totalSegundos : entrada.totalSegundos;
        const posicionPrevia = rankingPrevio.findIndex((item) => String(item.nro) === String(entrada.piloto.nro));
        const cambioPosicion = posicionPrevia === -1 ? 0 : (posicionPrevia + 1) - (index + 1);
        const promedioGeneral = entrada.totalSegundos && distanciaGeneral
          ? (distanciaGeneral / (entrada.totalSegundos / 3600)).toFixed(1)
          : '-';

        return {
          posicion: index + 1,
          cambio_posicion: cambioPosicion,
          ...construirFilaBase(entrada.piloto),
          tiempo_neto: segundosATiempo(entrada.tiempoNetoSegundos),
          penalizacion: entrada.penalizacionSegundos > 0 ? segundosATiempo(entrada.penalizacionSegundos) : '-',
          tiempo_total: segundosATiempo(entrada.totalSegundos),
          diferencia_primero: calcularDiferencia(entrada.totalSegundos, mejorTotal),
          diferencia_anterior: calcularDiferencia(entrada.totalSegundos, anterior),
          promedio_general_kmh: promedioGeneral
        };
      })
    };
  }).filter((categoria) => categoria.clasificacion_pe.length > 0 || categoria.clasificacion_general.length > 0);
}

async function obtenerContextoTiempos() {
  const [tiempos, tramos, penalizaciones, inscriptos] = await Promise.all([
    obtenerColeccionPublica('tiempos'),
    obtenerColeccionPublica('tramos'),
    obtenerColeccionPublica('penalizaciones'),
    obtenerColeccionPublica('inscriptos')
  ]);

  return { tiempos, tramos, penalizaciones, inscriptos };
}

async function obtenerVistaGeneralPorPE(peActual) {
  const contexto = await obtenerContextoTiempos();

  return {
    pe: peActual,
    tramo: construirTramo(peActual, contexto.tramos),
    clasificacion_pe: construirClasificacionPE(contexto.tiempos, peActual, contexto.tramos),
    clasificacion_general: construirClasificacionGeneral(
      contexto.tiempos,
      peActual,
      contexto.tramos,
      contexto.penalizaciones
    )
  };
}

async function obtenerVistaClasesPorPE(peActual) {
  const contexto = await obtenerContextoTiempos();

  return {
    pe: peActual,
    tramo: construirTramo(peActual, contexto.tramos),
    categorias: construirClasificacionPorClases(
      contexto.tiempos,
      peActual,
      contexto.tramos,
      contexto.penalizaciones
    )
  };
}

async function obtenerVistaEtapa2PorPE(peActual) {
  const contexto = await obtenerContextoTiempos();

  return {
    pe: peActual,
    tramo: construirTramo(peActual, contexto.tramos),
    categorias: construirClasificacionEtapa2(
      contexto.tiempos,
      peActual,
      contexto.tramos,
      contexto.penalizaciones,
      contexto.inscriptos
    )
  };
}

export {
  convertirASegundos,
  corregirFormatoTiempo,
  estaTramoCancelado,
  obtenerVistaGeneralPorPE,
  obtenerVistaClasesPorPE,
  obtenerVistaEtapa2PorPE
};
