import { obtenerColeccionPublica } from '../infraestructura/datosPublicos.js';
import { convertirASegundos } from './tiemposProcesados.js';

function formatearTitleCase(texto) {
  if (!texto) {
    return '';
  }

  return String(texto)
    .toLowerCase()
    .split(' ')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

function eliminarPowerStageDelNombre(texto) {
  if (!texto) {
    return '';
  }

  return String(texto).replace(/power stage/gi, '').trim();
}

function esPowerStage(tramo) {
  const desdeNormalizado = String(tramo.desde || '').toLowerCase();
  const hastaNormalizado = String(tramo.hasta || '').toLowerCase();
  return desdeNormalizado.includes('power stage') || hastaNormalizado.includes('power stage');
}

function esShakedown(tramo) {
  const nombreCompleto = `${tramo.desde || ''} - ${tramo.hasta || ''}`.toLowerCase();
  return nombreCompleto.includes('shakedown');
}

function procesarNombreTramo(tramo, todosLosTramos) {
  const desdeFormateado = formatearTitleCase(eliminarPowerStageDelNombre(tramo.desde));
  const hastaFormateado = formatearTitleCase(eliminarPowerStageDelNombre(tramo.hasta));

  const nombreBase = tramo.hasta && String(tramo.hasta).trim() !== ''
    ? `${desdeFormateado} - ${hastaFormateado}`
    : desdeFormateado;

  if (nombreBase.toLowerCase().includes('shakedown')) {
    return 'Shakedown';
  }

  const indiceActual = todosLosTramos.findIndex((item) => String(item.pe) === String(tramo.pe));
  const tramosHastaAhora = todosLosTramos.slice(0, indiceActual + 1);
  const ocurrencias = tramosHastaAhora.filter((item) => {
    const nombre = item.hasta && String(item.hasta).trim() !== ''
      ? `${formatearTitleCase(eliminarPowerStageDelNombre(item.desde))} - ${formatearTitleCase(eliminarPowerStageDelNombre(item.hasta))}`
      : formatearTitleCase(eliminarPowerStageDelNombre(item.desde));

    return nombre === nombreBase;
  }).length;

  const numerosRomanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return `${nombreBase} (${numerosRomanos[ocurrencias - 1] || 'I'})`;
}

function estaCancelado(estado) {
  if (!estado) {
    return false;
  }

  const normalizado = String(estado).toLowerCase().trim();
  return normalizado === 'cancelado' || normalizado === 'cancelada';
}

function obtenerColorEstado(estado) {
  if (!estado || estado === '-') {
    return '#6c757d';
  }

  const normalizado = String(estado).toLowerCase().trim();

  if (normalizado === 'en carrera') {
    return '#28a745';
  }

  if (
    normalizado === 'cancelado' ||
    normalizado === 'cancelada' ||
    normalizado === 'suspendido' ||
    normalizado === 'suspendida' ||
    normalizado === 'interrumpido' ||
    normalizado === 'interrumpida'
  ) {
    return '#dc3545';
  }

  if (normalizado === 'finalizado' || normalizado === 'finalizada') {
    return '#1a1a1a';
  }

  return '#6c757d';
}

function deberiaMostrarGanador(estado) {
  if (!estado) {
    return false;
  }

  const normalizado = String(estado).toLowerCase().trim();
  return (
    normalizado === 'finalizado' ||
    normalizado === 'finalizada' ||
    normalizado === 'suspendido' ||
    normalizado === 'suspendida' ||
    normalizado === 'interrumpido' ||
    normalizado === 'interrumpida'
  );
}

function truncarAUnaDecimal(tiempoStr) {
  if (!tiempoStr) {
    return '-';
  }

  const indicePunto = String(tiempoStr).lastIndexOf('.');
  if (indicePunto === -1) {
    return tiempoStr;
  }

  return String(tiempoStr).substring(0, indicePunto + 2);
}

function determinarEstadoAutomatico(tramo, tiempos) {
  if (tramo.estado && String(tramo.estado).trim() !== '' && tramo.estado !== '-') {
    return tramo.estado;
  }

  const clavePE = `pe${tramo.pe}`;
  const hayTiempos = tiempos.some((piloto) => {
    const tiempo = piloto[clavePE];
    return tiempo && tiempo !== '-' && String(tiempo).trim() !== '';
  });

  return hayTiempos ? 'en carrera' : (tramo.estado || '-');
}

function obtenerCategoriaPiloto(tiempos, nombrePiloto) {
  const piloto = tiempos.find((item) => item.piloto === nombrePiloto);
  if (!piloto) {
    return null;
  }

  if (piloto.copa_rc2 === 'SI' || piloto.copa_rc2 === 'Sí') {
    return { clase: 'RC2', esRC2: true };
  }

  return { clase: piloto.clase || '-', esRC2: false };
}

function obtenerCategoriaShakedown(shakedownDatos, nombrePiloto) {
  const piloto = shakedownDatos.find((item) => item.piloto === nombrePiloto);
  if (!piloto) {
    return null;
  }

  if (piloto.copa_rc2 === 'SI' || piloto.copa_rc2 === 'Sí') {
    return { clase: 'RC2', esRC2: true };
  }

  return { clase: piloto.clase || '-', esRC2: false };
}

function obtenerGanadorPE(numeroPE, tiempos) {
  const clavePE = `pe${numeroPE}`;
  const pilotosConTiempo = tiempos.filter((piloto) => {
    const tiempo = piloto[clavePE];
    return tiempo && tiempo !== '-' && String(tiempo).trim() !== '';
  });

  if (pilotosConTiempo.length === 0) {
    return null;
  }

  let mejorPiloto = null;
  let mejorTiempoSegundos = Infinity;

  pilotosConTiempo.forEach((piloto) => {
    const tiempoSegundos = convertirASegundos(piloto[clavePE]);
    if (tiempoSegundos && tiempoSegundos < mejorTiempoSegundos) {
      mejorTiempoSegundos = tiempoSegundos;
      mejorPiloto = piloto;
    }
  });

  if (!mejorPiloto) {
    return null;
  }

  return {
    piloto: mejorPiloto.piloto,
    tiempo: mejorPiloto[clavePE]
  };
}

function obtenerGanadorShakedown(shakedownDatos) {
  if (!shakedownDatos?.length) {
    return null;
  }

  const pilotosConTiempo = shakedownDatos.filter((piloto) => {
    return ['v1', 'v2', 'v3'].some((campo) => piloto[campo] && String(piloto[campo]).trim() !== '');
  });

  if (pilotosConTiempo.length === 0) {
    return null;
  }

  let mejorPiloto = null;
  let mejorTiempoSegundos = Infinity;

  pilotosConTiempo.forEach((piloto) => {
    const tiempos = ['v1', 'v2', 'v3']
      .map((campo) => convertirASegundos(piloto[campo]))
      .filter((valor) => valor > 0);

    if (!tiempos.length) {
      return;
    }

    const mejorTiempoPiloto = Math.min(...tiempos);
    if (mejorTiempoPiloto < mejorTiempoSegundos) {
      mejorTiempoSegundos = mejorTiempoPiloto;
      mejorPiloto = piloto;
    }
  });

  if (!mejorPiloto) {
    return null;
  }

  const minutos = Math.floor(mejorTiempoSegundos / 60);
  const segundos = (mejorTiempoSegundos % 60).toFixed(1);

  return {
    piloto: mejorPiloto.piloto,
    tiempo: `${minutos}:${segundos.padStart(4, '0')}`
  };
}

function agruparPorEtapa(tramos) {
  const etapas = {};

  tramos.forEach((tramo) => {
    const etapa = String(tramo.etapa || '1');
    etapas[etapa] = etapas[etapa] || [];
    etapas[etapa].push(tramo);
  });

  Object.keys(etapas).forEach((etapa) => {
    etapas[etapa].sort((a, b) => parseInt(a.pe, 10) - parseInt(b.pe, 10));
  });

  return etapas;
}

function construirGanadorFila(tramo, tiempos, shakedownDatos, estadoFinal) {
  const shakedown = esShakedown(tramo);

  if (!deberiaMostrarGanador(estadoFinal)) {
    return null;
  }

  if (shakedown) {
    const ganador = obtenerGanadorShakedown(shakedownDatos);
    if (!ganador) {
      return null;
    }

    return {
      ...ganador,
      tiempo: ganador.tiempo,
      categoria: obtenerCategoriaShakedown(shakedownDatos, ganador.piloto)?.clase || '-'
    };
  }

  const ganador = obtenerGanadorPE(tramo.pe, tiempos);
  if (!ganador) {
    return null;
  }

  return {
    ...ganador,
    tiempo: truncarAUnaDecimal(ganador.tiempo),
    categoria: obtenerCategoriaPiloto(tiempos, ganador.piloto)?.clase || '-'
  };
}

async function obtenerVistaTramosCarrera() {
  const [tramos, tiempos, shakedownDatos] = await Promise.all([
    obtenerColeccionPublica('tramos'),
    obtenerColeccionPublica('tiempos'),
    obtenerColeccionPublica('shakedown')
  ]);

  const etapas = agruparPorEtapa(tramos);
  const filas = Object.keys(etapas)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((etapa) => ({
      etapa,
      tramos: etapas[etapa].map((tramo) => {
        const estadoFinal = determinarEstadoAutomatico(tramo, tiempos);
        const ganador = construirGanadorFila(tramo, tiempos, shakedownDatos, estadoFinal);

        return {
          pe: tramo.pe,
          etapa: String(etapa),
          nombre: procesarNombreTramo(tramo, tramos),
          kms: tramo.kms,
          hora: tramo.hora,
          estado: estadoFinal ? String(estadoFinal).toLowerCase() : '-',
          color_estado: obtenerColorEstado(estadoFinal),
          cancelado: estaCancelado(estadoFinal),
          power_stage: esPowerStage(tramo),
          shakedown: esShakedown(tramo),
          ganador
        };
      })
    }));

  return {
    etapas: filas,
    actualizacion: {
      ultima_sincronizacion: null,
      hace_minutos: null
    }
  };
}

export { obtenerVistaTramosCarrera };
