import { useEffect, useMemo, useRef, useState } from 'react';
import {
  eliminarAbandonoTiempoAdmin,
  guardarLoteTiemposAdmin,
  obtenerHorariosAdmin,
  obtenerTiemposAdmin,
  registrarAbandonoTiempoAdmin
} from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { BadgeNro } from '../../componentes/comunes/BadgeNro.jsx';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';
import { ModalAbandonosTiempos } from '../../componentes/tiempos/ModalAbandonosTiempos.jsx';
import { manejarEnterEnTabla } from '../../utilidades/navegacionTabla.js';

const CLAVE_ORDEN_TIEMPOS = 'admin-tiempos-orden';
const CLAVE_VISIBILIDAD_ETAPAS_TIEMPOS = 'admin-tiempos-etapas-ocultas';
const CLAVE_PILOTOS_OCULTOS_TIEMPOS = 'admin-tiempos-pilotos-ocultos';
const CLAVE_FILTRO_ABANDONOS_TIEMPOS = 'admin-tiempos-filtro-abandonos';

function esEstadoManual(estado) {
  const valor = String(estado || '').trim().toLowerCase();
  return valor === 'demorado' || valor === 'interrumpido' || valor === 'suspendido';
}

function esEstadoCancelado(estado) {
  return String(estado || '').trim().toLowerCase() === 'cancelado';
}

function normalizarTpeParaGuardado(valor) {
  const texto = String(valor || '').trim();
  if (!texto) {
    return '';
  }

  const coincidencia = texto.match(/^(\d{1,2}:\d{2}:\d{2})\.(\d{1,3})$/);
  if (!coincidencia) {
    return texto;
  }

  const [, base, decimales] = coincidencia;
  return `${base}.${decimales.padEnd(3, '0')}`;
}

function normalizarPeParaGuardado(valor) {
  const texto = String(valor || '').trim();
  if (!texto) {
    return '';
  }

  const coincidencia = texto.match(/^(\d{1,2}:\d{2})\.(\d{1,3})$/);
  if (!coincidencia) {
    return texto;
  }

  const [, base, decimales] = coincidencia;
  return `${base}.${decimales.padEnd(3, '0')}`;
}

function formatearTpeParaVista(valor) {
  const texto = normalizarTpeParaGuardado(valor);
  const coincidencia = texto.match(/^(\d{1,2}:\d{2}:\d{2})\.(\d{3})$/);
  if (!coincidencia) {
    return texto;
  }

  const [, base, decimales] = coincidencia;
  const visibles = decimales.replace(/0+$/, '') || '0';
  return `${base}.${visibles}`;
}

function formatearPeParaVista(valor) {
  return normalizarPeParaGuardado(valor);
}

function sanitizarHlpeInput(valor) {
  return String(valor || '').replace(/[^\d:]/g, '').slice(0, 5);
}

function sanitizarTpeInput(valor) {
  return String(valor || '').replace(/[^\d:.]/g, '').slice(0, 12);
}

function sanitizarPeInput(valor) {
  return String(valor || '').replace(/[^\d:.]/g, '').slice(0, 9);
}

function esHlpeValido(valor) {
  if (!String(valor || '').trim()) {
    return true;
  }

  const texto = String(valor).trim();
  const coincidencia = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (!coincidencia) {
    return false;
  }

  const digitos = texto.replace(/[^\d]/g, '').length;
  return digitos === 3 || digitos === 4;
}

function esTpeValido(valor) {
  if (!String(valor || '').trim()) {
    return true;
  }

  const texto = String(valor).trim();
  if (!/^\d{1,2}:\d{2}:\d{2}\.\d{1,3}$/.test(texto)) {
    return false;
  }

  const digitos = texto.replace(/[^\d]/g, '').length;
  return digitos >= 6 && digitos <= 7;
}

function esPeValido(valor) {
  if (!String(valor || '').trim()) {
    return true;
  }

  return /^\d{1,2}:\d{2}\.\d{1,3}$/.test(String(valor).trim());
}

function parsearHoraLargada(valor) {
  const coincidencia = String(valor || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!coincidencia) {
    return null;
  }

  const [, horas, minutos] = coincidencia;
  return (Number(horas) * 3600 + Number(minutos) * 60) * 1000;
}

function parsearTaqueo(valor) {
  const normalizado = normalizarTpeParaGuardado(valor);
  const coincidencia = normalizado.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!coincidencia) {
    return null;
  }

  const [, horas, minutos, segundos, milisegundos] = coincidencia;
  return (
    (Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos)) * 1000 +
    Number(milisegundos)
  );
}

function formatearTiempoPE(milisegundosTotales) {
  if (!Number.isInteger(milisegundosTotales) || milisegundosTotales < 0) {
    return '';
  }

  const minutos = Math.floor(milisegundosTotales / 60000);
  const resto = milisegundosTotales % 60000;
  const segundos = Math.floor(resto / 1000);
  const milisegundos = resto % 1000;

  return `${minutos}:${String(segundos).padStart(2, '0')}.${String(milisegundos).padStart(3, '0')}`;
}

function parsearHoraOrden(valor) {
  const coincidencia = String(valor || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!coincidencia) {
    return null;
  }

  const [, horas, minutos] = coincidencia;
  return (Number(horas) * 60) + Number(minutos);
}

function calcularTiempoPE(hlpe, tpe) {
  const hlpeTexto = String(hlpe || '').trim();
  const tpeTexto = String(tpe || '').trim();

  if (!hlpeTexto || !tpeTexto || hlpeTexto.includes('-') || tpeTexto.includes('-')) {
    return '';
  }

  const inicio = parsearHoraLargada(hlpeTexto);
  const fin = parsearTaqueo(tpeTexto);

  if (inicio === null || fin === null || fin < inicio) {
    return '';
  }

  return formatearTiempoPE(fin - inicio);
}

function crearFilaEditable(fila, columnas) {
  const filaEditable = {
    ...fila,
    finalizo: fila.finalizo || ''
  };

  columnas.forEach((columna) => {
    const pe = columna.pe;
    const cancelado = esEstadoCancelado(columna.estado);

    filaEditable[`hlpe${pe}`] = fila[`hlpe${pe}`] || '';
    filaEditable[`tpe${pe}`] = formatearTpeParaVista(fila[`tpe${pe}`] || '');
    filaEditable[`pe${pe}`] = cancelado
      ? '0:00.000'
      : formatearPeParaVista(fila[`pe${pe}`] || '');
  });

  return filaEditable;
}

function construirPayloadFila(fila, columnas) {
  const payload = {
    nro: Number(fila.nro),
    finalizo: fila.finalizo || ''
  };

  columnas.forEach((columna) => {
    const pe = columna.pe;
    const cancelado = esEstadoCancelado(columna.estado);

    payload[`hlpe${pe}`] = fila[`hlpe${pe}`] || '';
    payload[`tpe${pe}`] = normalizarTpeParaGuardado(fila[`tpe${pe}`] || '');
    payload[`pe${pe}`] = cancelado
      ? '0:00.000'
      : normalizarPeParaGuardado(fila[`pe${pe}`] || '');
  });

  return payload;
}

function construirMapaOriginales(filasOriginales) {
  return new Map(filasOriginales.map((fila) => [String(fila.nro), fila]));
}

function obtenerMapaErrores(filas, columnas) {
  const errores = new Map();

  filas.forEach((fila) => {
    columnas.forEach((columna) => {
      const pe = columna.pe;
      const campoHlpe = `hlpe${pe}`;
      const campoTpe = `tpe${pe}`;
      const campoPe = `pe${pe}`;

      if (!esHlpeValido(fila[campoHlpe])) {
        errores.set(`${fila.nro}:${campoHlpe}`, `HLPE${pe} invalido`);
      }

      if (!esTpeValido(fila[campoTpe])) {
        errores.set(`${fila.nro}:${campoTpe}`, `TPE${pe} invalido`);
      }

      if ((esEstadoManual(columna.estado) || esEstadoCancelado(columna.estado)) && !esPeValido(fila[campoPe])) {
        errores.set(`${fila.nro}:${campoPe}`, `PE${pe} invalido`);
      }
    });
  });

  return errores;
}

function construirMapaAbandonos(abandonos) {
  return new Map(
    abandonos.map((abandono) => [`${abandono.nro}:${abandono.etapa}`, abandono])
  );
}

function getClaveAbandono(nro, etapa) {
  return `${nro}:${etapa}`;
}

function getRegistroAbandono(abandonosPorClave, nro, etapa) {
  return abandonosPorClave.get(getClaveAbandono(nro, etapa)) || null;
}

function filaTieneAbandonoEnEtapa(abandonos, nro, etapa) {
  return abandonos.some((abandono) => (
    String(abandono.nro) === String(nro) &&
    Number(abandono.etapa) === Number(etapa)
  ));
}

function peTieneAlgunaCarga(fila, pe) {
  return Boolean(
    String(fila[`hlpe${pe}`] || '').trim() ||
    String(fila[`tpe${pe}`] || '').trim() ||
    String(fila[`pe${pe}`] || '').trim()
  );
}

function peEstaCompletamenteVacio(fila, pe) {
  return !peTieneAlgunaCarga(fila, pe);
}

function peSiguePendientePorAbandono(fila, pe) {
  return !String(fila[`tpe${pe}`] || '').trim() && !String(fila[`pe${pe}`] || '').trim();
}

function peTieneTiempoCompleto(fila, pe) {
  return Boolean(
    String(fila[`hlpe${pe}`] || '').trim() &&
    String(fila[`tpe${pe}`] || '').trim() &&
    String(fila[`pe${pe}`] || '').trim()
  );
}

function obtenerPesOrdenadosPorEtapa(columnas, etapa) {
  return columnas
    .filter((columna) => Number(columna.etapa) === Number(etapa))
    .map((columna) => Number(columna.pe))
    .sort((a, b) => a - b);
}

function obtenerPeAnteriorEditablePorAbandono(fila, abandono, columnas) {
  const pesPendientes = Array.isArray(abandono?.pes_pendientes) ? abandono.pes_pendientes : [];
  if (!pesPendientes.length) {
    return null;
  }

  const pesEtapa = obtenerPesOrdenadosPorEtapa(columnas, abandono.etapa);
  if (!pesEtapa.length) {
    return null;
  }

  const primerPePendiente = [...pesPendientes].sort((a, b) => a - b)[0];
  const indicePePendiente = pesEtapa.indexOf(Number(primerPePendiente));
  if (indicePePendiente <= 0) {
    return null;
  }

  const peAnterior = pesEtapa[indicePePendiente - 1];
  return peTieneTiempoCompleto(fila, peAnterior) ? peAnterior : null;
}

function abandonoTienePendientesSinCompletar(fila, abandono) {
  const pes = Array.isArray(abandono?.pes_pendientes) ? abandono.pes_pendientes : [];
  return pes.some((pe) => peSiguePendientePorAbandono(fila, pe));
}

function abandonoTieneAlgunaCarga(fila, abandono) {
  const pes = Array.isArray(abandono?.pes_pendientes) ? abandono.pes_pendientes : [];
  return pes.some((pe) => peTieneAlgunaCarga(fila, pe));
}

function obtenerEstadoVisualAbandonoFila(fila, abandonos, etapasDisponibles) {
  const abandonosFila = abandonos.filter((abandono) => String(abandono.nro) === String(fila.nro));
  if (!abandonosFila.length) {
    return 'ninguno';
  }

  const hayPendientes = abandonosFila.some((abandono) => abandonoTienePendientesSinCompletar(fila, abandono));
  if (hayPendientes) {
    return 'pendiente';
  }

  const hayEtapaAbandonada = etapasDisponibles.some((etapa) =>
    abandonosFila.some((abandono) => Number(abandono.etapa) === Number(etapa))
  );

  return hayEtapaAbandonada ? 'completo' : 'ninguno';
}

export function PaginaTiempos() {
  const tablaScrollRef = useRef(null);
  const posicionScrollPendienteRef = useRef(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [filasOriginales, setFilasOriginales] = useState([]);
  const [abandonos, setAbandonos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoTodo, setGuardandoTodo] = useState(false);
  const [procesandoAbandono, setProcesandoAbandono] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [criterioOrden, setCriterioOrden] = useState(() => (
    window.localStorage.getItem(CLAVE_ORDEN_TIEMPOS) || 'nro'
  ));
  const [etapasOcultas, setEtapasOcultas] = useState(() => {
    const valor = window.localStorage.getItem(CLAVE_VISIBILIDAD_ETAPAS_TIEMPOS);
    if (!valor) {
      return [];
    }

    try {
      const parseado = JSON.parse(valor);
      return Array.isArray(parseado) ? parseado : [];
    } catch {
      return [];
    }
  });
  const [pilotosOcultos, setPilotosOcultos] = useState(() => {
    const valor = window.localStorage.getItem(CLAVE_PILOTOS_OCULTOS_TIEMPOS);
    if (!valor) {
      return [];
    }

    try {
      const parseado = JSON.parse(valor);
      return Array.isArray(parseado) ? parseado.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  });
  const [filtroAbandonoActivo, setFiltroAbandonoActivo] = useState(() => (
    window.localStorage.getItem(CLAVE_FILTRO_ABANDONOS_TIEMPOS) || 'todos'
  ));
  const [modalPilotosOcultosAbierto, setModalPilotosOcultosAbierto] = useState(false);
  const [modalAbandonosAbierto, setModalAbandonosAbierto] = useState(false);
  const [nroPilotoAOcultar, setNroPilotoAOcultar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!posicionScrollPendienteRef.current || cargando) {
      return;
    }

    const contenedor = tablaScrollRef.current;
    const posicion = posicionScrollPendienteRef.current;

    if (!contenedor || !posicion) {
      return;
    }

    requestAnimationFrame(() => {
      contenedor.scrollTop = posicion.top;
      contenedor.scrollLeft = posicion.left;
      posicionScrollPendienteRef.current = null;
    });
  }, [cargando, filas, columnas]);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_ORDEN_TIEMPOS, criterioOrden);
  }, [criterioOrden]);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_VISIBILIDAD_ETAPAS_TIEMPOS, JSON.stringify(etapasOcultas));
  }, [etapasOcultas]);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_PILOTOS_OCULTOS_TIEMPOS, JSON.stringify(pilotosOcultos));
  }, [pilotosOcultos]);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_FILTRO_ABANDONOS_TIEMPOS, filtroAbandonoActivo);
  }, [filtroAbandonoActivo]);

  useEffect(() => {
    if (cargando) {
      return;
    }

    const filasVigentes = new Set(filas.map((fila) => String(fila.nro)));
    setPilotosOcultos((actual) => {
      const depurados = actual.filter((nro) => filasVigentes.has(String(nro)));
      return depurados.length === actual.length ? actual : depurados;
    });
  }, [cargando, filas]);

  useEffect(() => {
    function manejarAtajoGuardar(event) {
      const elementoActivo = document.activeElement;
      const esCampoEditable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(elementoActivo?.tagName);

      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();

        if (!guardandoTodo && !cargando && esCampoEditable) {
          guardarTodo();
        }
      }
    }

    window.addEventListener('keydown', manejarAtajoGuardar);
    return () => window.removeEventListener('keydown', manejarAtajoGuardar);
  }, [guardandoTodo, cargando, filas, filasOriginales, columnas]);

  async function cargarDatos() {
    setCargando(true);
    setError('');

    try {
      const [respuesta, respuestaHorarios] = await Promise.all([
        obtenerTiemposAdmin(),
        obtenerHorariosAdmin()
      ]);
      const columnasActuales = respuesta.columnas || [];
      const filasPreparadas = (respuesta.datos || []).map((fila) => crearFilaEditable(fila, columnasActuales));
      setColumnas(columnasActuales);
      setFilas(filasPreparadas);
      setFilasOriginales(filasPreparadas);
      setAbandonos(respuesta.abandonos || []);
      setHorarios(respuestaHorarios?.datos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tiempos.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(nro, campo, valor) {
    const columna = columnas.find((item) => campo.endsWith(String(item.pe)));

    setFilas((actual) => actual.map((fila) => {
      if (String(fila.nro) !== String(nro)) {
        return fila;
      }

      const proximaFila = {
        ...fila,
        [campo]: valor
      };

      if (columna) {
        const pe = columna.pe;
        const campoPe = `pe${pe}`;
        const campoHlpe = `hlpe${pe}`;
        const campoTpe = `tpe${pe}`;
        const cancelado = esEstadoCancelado(columna.estado);
        const manual = esEstadoManual(columna.estado);

        if (cancelado) {
          proximaFila[campoPe] = '0:00.000';
        } else if (campo === campoHlpe) {
          proximaFila[campoHlpe] = sanitizarHlpeInput(valor);
        } else if (campo === campoTpe) {
          proximaFila[campoTpe] = sanitizarTpeInput(valor);
        } else if (manual && campo === campoPe) {
          proximaFila[campoPe] = sanitizarPeInput(valor);
        }

        if (!cancelado && (campo === campoHlpe || campo === campoTpe)) {
          proximaFila[campoPe] = calcularTiempoPE(
            proximaFila[campoHlpe],
            proximaFila[campoTpe]
          );
        }
      }

      return proximaFila;
    }));
  }

  function obtenerFilasModificadas() {
    const originalesPorNro = construirMapaOriginales(filasOriginales);

    return filas.filter((fila) => {
      const original = originalesPorNro.get(String(fila.nro));
      if (!original) {
        return true;
      }

      if ((fila.finalizo || '') !== (original.finalizo || '')) {
        return true;
      }

      return columnas.some((columna) => {
        const pe = columna.pe;
        return (
          (fila[`hlpe${pe}`] || '') !== (original[`hlpe${pe}`] || '') ||
          (fila[`tpe${pe}`] || '') !== (original[`tpe${pe}`] || '') ||
          (fila[`pe${pe}`] || '') !== (original[`pe${pe}`] || '')
        );
      });
    });
  }

  const hayCambiosPendientes = obtenerFilasModificadas().length > 0;

  const columnasVisibles = useMemo(
    () => columnas.filter((columna) => !etapasOcultas.includes(Number(columna.etapa))),
    [columnas, etapasOcultas]
  );

  const erroresPorCelda = useMemo(
    () => obtenerMapaErrores(filas, columnas),
    [filas, columnas]
  );

  const filasOrdenadasPorNro = useMemo(
    () => [...filas].sort((a, b) => Number(a.nro) - Number(b.nro)),
    [filas]
  );

  const etapasDisponibles = useMemo(
    () => [...new Set(columnas.map((columna) => Number(columna.etapa)))].sort((a, b) => a - b),
    [columnas]
  );

  const abandonosPorClave = useMemo(
    () => construirMapaAbandonos(abandonos),
    [abandonos]
  );

  const opcionesPilotosVisibles = useMemo(
    () => filasOrdenadasPorNro.filter((fila) => !pilotosOcultos.includes(String(fila.nro))),
    [filasOrdenadasPorNro, pilotosOcultos]
  );

  const pilotosOcultosDetalle = useMemo(
    () => filasOrdenadasPorNro.filter((fila) => pilotosOcultos.includes(String(fila.nro))),
    [filasOrdenadasPorNro, pilotosOcultos]
  );

  const pilotoSeleccionadoParaOcultar = useMemo(
    () => opcionesPilotosVisibles.find((fila) => String(fila.nro) === String(nroPilotoAOcultar)) || null,
    [opcionesPilotosVisibles, nroPilotoAOcultar]
  );

  const abandonosDetalle = useMemo(
    () => abandonos
      .map((abandono) => {
        const fila = filasOrdenadasPorNro.find((item) => String(item.nro) === String(abandono.nro));
        if (!fila) {
          return null;
        }

        const pesPendientes = Array.isArray(abandono.pes_pendientes) ? abandono.pes_pendientes : [];
        const pesPendientesTexto = pesPendientes.map((pe) => `PE${pe}`).join(', ');

        return {
          ...abandono,
          piloto: fila.piloto,
          navegante: fila.navegante,
          vehiculo: fila.vehiculo,
          clase: fila.clase,
          pesPendientesTexto,
          puedeEliminar: !abandonoTieneAlgunaCarga(fila, abandono)
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(a.nro) - Number(b.nro)),
    [abandonos, filasOrdenadasPorNro]
  );

  const cantidadesAbandonoPorEtapa = useMemo(
    () => etapasDisponibles.reduce((acc, etapa) => {
      acc[etapa] = abandonosDetalle.filter((abandono) => Number(abandono.etapa) === Number(etapa)).length;
      return acc;
    }, {}),
    [abandonosDetalle, etapasDisponibles]
  );

  const originalesPorNro = useMemo(
    () => construirMapaOriginales(filasOriginales),
    [filasOriginales]
  );

  useEffect(() => {
    if (filtroAbandonoActivo === 'todos') {
      return;
    }

    const etapaExiste = etapasDisponibles.some((etapa) => String(etapa) === String(filtroAbandonoActivo));
    if (!etapaExiste) {
      setFiltroAbandonoActivo('todos');
    }
  }, [etapasDisponibles, filtroAbandonoActivo]);

  useUnsavedChangesWarning(hayCambiosPendientes);

  async function guardarTodo() {
    setGuardandoTodo(true);
    setMensaje('');
    setError('');

    try {
      const contenedor = tablaScrollRef.current;
      posicionScrollPendienteRef.current = contenedor
        ? { top: contenedor.scrollTop, left: contenedor.scrollLeft }
        : null;

      const modificadas = obtenerFilasModificadas();

      if (!modificadas.length) {
        return;
      }

      const primeraCeldaConError = erroresPorCelda.entries().next().value;
      if (primeraCeldaConError) {
        const [clave, mensajeError] = primeraCeldaConError;
        const [nro] = clave.split(':');
        throw new Error(`El auto #${nro} tiene un error: ${mensajeError}.`);
      }

      const items = modificadas.map((fila) => construirPayloadFila(fila, columnas));
      await guardarLoteTiemposAdmin(items);
      await cargarDatos();
    } catch (err) {
      posicionScrollPendienteRef.current = null;
      setError(err.message || 'No se pudieron guardar los cambios de tiempos.');
    } finally {
      setGuardandoTodo(false);
    }
  }

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const filasBaseSinOcultos = filas.filter((fila) => !pilotosOcultos.includes(String(fila.nro)));
    const filasBaseBusqueda = !termino ? filasBaseSinOcultos : filasBaseSinOcultos.filter((fila) => (
      String(fila.nro).includes(termino) ||
      String(fila.piloto || '').toLowerCase().includes(termino)
    ));
    const filasBase = filtroAbandonoActivo === 'todos'
      ? filasBaseBusqueda
      : filasBaseBusqueda.filter((fila) => filaTieneAbandonoEnEtapa(abandonos, fila.nro, filtroAbandonoActivo));

    if (criterioOrden === 'nro') {
      return [...filasBase].sort((a, b) => Number(a.nro) - Number(b.nro));
    }

    const etapaOrden = Number(criterioOrden.replace('etapa-', ''));
    const horariosEtapa = horarios.filter((horario) => Number(horario.etapa) === etapaOrden);
    const ordenPorNro = new Map(
      horariosEtapa.map((horario) => [String(horario.nro), parsearHoraOrden(horario.hora)])
    );

    return [...filasBase].sort((a, b) => {
      const horaA = ordenPorNro.get(String(a.nro));
      const horaB = ordenPorNro.get(String(b.nro));
      const tieneHoraA = Number.isInteger(horaA);
      const tieneHoraB = Number.isInteger(horaB);

      if (tieneHoraA && tieneHoraB && horaA !== horaB) {
        return horaA - horaB;
      }

      if (tieneHoraA && !tieneHoraB) {
        return -1;
      }

      if (!tieneHoraA && tieneHoraB) {
        return 1;
      }

      return Number(a.nro) - Number(b.nro);
    });
  }, [abandonos, busqueda, criterioOrden, filas, filtroAbandonoActivo, horarios, pilotosOcultos]);

  function alternarVisibilidadEtapa(etapa) {
    setEtapasOcultas((actual) => (
      actual.includes(etapa)
        ? actual.filter((item) => item !== etapa)
        : [...actual, etapa].sort((a, b) => a - b)
    ));
  }

  function etapaEstaOculta(etapa) {
    return etapasOcultas.includes(etapa);
  }

  function ocultarPilotoSeleccionado() {
    if (!pilotoSeleccionadoParaOcultar) {
      return;
    }

    setPilotosOcultos((actual) => (
      actual.includes(String(pilotoSeleccionadoParaOcultar.nro))
        ? actual
        : [...actual, String(pilotoSeleccionadoParaOcultar.nro)]
    ));
    setNroPilotoAOcultar('');
  }

  function volverAMostrarPiloto(nro) {
    setPilotosOcultos((actual) => actual.filter((item) => String(item) !== String(nro)));
  }

  async function registrarAbandono(payload) {
    setProcesandoAbandono(true);
    setMensaje('');
    setError('');

    try {
      const abandono = await registrarAbandonoTiempoAdmin(payload);
      setAbandonos((actual) => {
        const filtrados = actual.filter((item) => !(
          String(item.nro) === String(abandono.nro) &&
          String(item.etapa) === String(abandono.etapa)
        ));
        return [...filtrados, abandono].sort((a, b) => (
          Number(a.etapa) - Number(b.etapa) || Number(a.nro) - Number(b.nro)
        ));
      });
    } catch (err) {
      setError(err.message || 'No se pudo registrar el abandono.');
    } finally {
      setProcesandoAbandono(false);
    }
  }

  async function eliminarAbandono(nro, etapa) {
    setProcesandoAbandono(true);
    setMensaje('');
    setError('');

    try {
      await eliminarAbandonoTiempoAdmin(nro, etapa);
      setAbandonos((actual) => actual.filter((item) => !(
        String(item.nro) === String(nro) && String(item.etapa) === String(etapa)
      )));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el abandono.');
    } finally {
      setProcesandoAbandono(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Cronometraje oficial</p>
          <h1>Tiempos</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>PE visibles</span>
            <strong>{columnasVisibles.length}</strong>
          </article>
          <article className="estado-card">
            <span>Autos visibles</span>
            <strong>{filasFiltradas.length}</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido panel__contenido--stack">
        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Grilla de tiempos</h2>
              <p>Atajo de guardado: <strong>Ctrl + Alt + S</strong></p>
            </div>

            <div className="tabla-bloque__acciones-superiores">
              <select
                className="selector-tabla"
                value={criterioOrden}
                onChange={(event) => setCriterioOrden(event.target.value)}
              >
                <option value="nro">Orden por Nro</option>
                <option value="etapa-1">Orden por Horario Etapa 1</option>
                <option value="etapa-2">Orden por Horario Etapa 2</option>
              </select>
              <input
                className="buscador"
                type="text"
                placeholder="Buscar por nro o piloto..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
              <button
                type="button"
                className="boton-principal boton-principal--compacto"
                disabled={guardandoTodo}
                onClick={guardarTodo}
              >
                {guardandoTodo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="feedback feedback--info">Cargando grilla de tiempos...</div>
          ) : (
            <>
              <div className="tabla-scroll" ref={tablaScrollRef}>
                <table className="tabla-admin tabla-admin--tiempos">
                  <thead>
                    <tr>
                      <th rowSpan="2" className="tabla-admin__sticky tabla-admin__sticky-columna tabla-admin__sticky-top">
                        Nº
                      </th>
                      <th rowSpan="2" className="tabla-admin__sticky-top">Piloto</th>
                      <th rowSpan="2" className="tabla-admin__sticky-top">Navegante</th>
                      <th rowSpan="2" className="tabla-admin__sticky-top">Vehiculo</th>
                      <th rowSpan="2" className="tabla-admin__sticky-top">Clase</th>
                      {columnasVisibles.map((columna) => (
                        <th
                          key={`pe-${columna.pe}`}
                          colSpan="3"
                          className="tabla-admin__grupo-pe tabla-admin__sticky-top"
                        >
                          <div className="tabla-admin__grupo-titulo">PE {columna.pe}</div>
                          <small className={obtenerClaseEstadoTramo(columna.estado)}>
                            Etapa {columna.etapa} · {columna.estado || 'Sin estado'}
                          </small>
                        </th>
                      ))}
                      <th rowSpan="2" className="tabla-admin__sticky-top">Finalizo</th>
                    </tr>
                    <tr>
                      {columnasVisibles.map((columna) => (
                        <FragmentTripleta key={`tripleta-${columna.pe}`} etapa={columna.etapa} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasFiltradas.map((fila, indiceFila) => (
                      <tr key={fila.nro}>
                        <td className="tabla-admin__sticky tabla-admin__sticky-columna">
                          <BadgeNro
                            nro={fila.nro}
                            clase={fila.clase}
                            className={obtenerClaseBadgeAbandono(
                              obtenerEstadoVisualAbandonoFila(fila, abandonos, etapasDisponibles)
                            )}
                          />
                        </td>
                        <td>{fila.piloto}</td>
                        <td>{fila.navegante}</td>
                        <td>{fila.vehiculo}</td>
                        <td>{fila.clase}</td>
                        {columnasVisibles.map((columna, indiceColumnaVisible) => (
                          <TripletaEditable
                            key={`${fila.nro}-pe-${columna.pe}`}
                            fila={fila}
                            filaOriginal={originalesPorNro.get(String(fila.nro))}
                            indiceFila={indiceFila}
                            indiceColumnaVisible={indiceColumnaVisible}
                            pe={columna.pe}
                            etapa={columna.etapa}
                            estado={columna.estado}
                            columnas={columnas}
                            abandono={getRegistroAbandono(abandonosPorClave, fila.nro, columna.etapa)}
                            erroresPorCelda={erroresPorCelda}
                            onChange={manejarCambio}
                          />
                        ))}
                        <td>
                          <select
                            className="selector-tabla"
                            value={fila.finalizo || ''}
                            data-enter-group="tiempos-finalizo"
                            data-enter-row={indiceFila}
                            data-nav-row={indiceFila}
                            data-nav-col={columnasVisibles.length * 3}
                            onChange={(event) => manejarCambio(fila.nro, 'finalizo', event.target.value)}
                            onKeyDown={manejarEnterEnTabla}
                          >
                            <option value="">-</option>
                            <option value="si">Si</option>
                            <option value="no">No</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tabla-bloque__footer-acciones">
                <div className="acciones__grupo">
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={() => setModalAbandonosAbierto(true)}
                  >
                    Gestionar abandonos ({abandonos.length})
                  </button>
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={() => setModalPilotosOcultosAbierto(true)}
                  >
                    Ocultar Pilotos ({pilotosOcultosDetalle.length})
                  </button>
                  <select
                    className="selector-tabla"
                    value={filtroAbandonoActivo}
                    onChange={(event) => setFiltroAbandonoActivo(event.target.value)}
                  >
                    <option value="todos">Todos los autos</option>
                    {etapasDisponibles.map((etapa) => (
                      <option key={`filtro-abandono-${etapa}`} value={String(etapa)}>
                        {`Abandonos Etapa ${etapa} (${cantidadesAbandonoPorEtapa[etapa] || 0})`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`selector-etapas__boton ${etapaEstaOculta(1) ? '' : 'selector-etapas__boton--activo'}`}
                    onClick={() => alternarVisibilidadEtapa(1)}
                  >
                    {etapaEstaOculta(1) ? 'Mostrar Etapa 1' : 'Ocultar Etapa 1'}
                  </button>
                  <button
                    type="button"
                    className={`selector-etapas__boton ${etapaEstaOculta(2) ? '' : 'selector-etapas__boton--activo'}`}
                    onClick={() => alternarVisibilidadEtapa(2)}
                  >
                    {etapaEstaOculta(2) ? 'Mostrar Etapa 2' : 'Ocultar Etapa 2'}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {modalPilotosOcultosAbierto && (
        <div className="modal-admin__overlay" onClick={() => setModalPilotosOcultosAbierto(false)}>
          <div className="modal-admin" onClick={(event) => event.stopPropagation()}>
            <div className="modal-admin__header">
              <div>
                <h2>Gestionar pilotos ocultos</h2>
                <p>Ocultan filas solo en esta vista del admin. Los datos siguen guardados.</p>
              </div>
              <button
                type="button"
                className="boton-icono"
                onClick={() => setModalPilotosOcultosAbierto(false)}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className="modal-admin__contenido">
              <div className="campo campo--ancho">
                <label htmlFor="piloto-oculto-select">Numero del piloto</label>
                <select
                  id="piloto-oculto-select"
                  className="selector-tabla selector-tabla--ancho"
                  value={nroPilotoAOcultar}
                  onChange={(event) => setNroPilotoAOcultar(event.target.value)}
                >
                  <option value="">Seleccionar piloto...</option>
                  {opcionesPilotosVisibles.map((fila) => (
                    <option key={fila.nro} value={fila.nro}>
                      {fila.nro} - {fila.piloto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tarjeta-resumen">
                {pilotoSeleccionadoParaOcultar ? (
                  <>
                    <strong>{pilotoSeleccionadoParaOcultar.nro} {pilotoSeleccionadoParaOcultar.piloto}</strong>
                    <span>{pilotoSeleccionadoParaOcultar.navegante}</span>
                    <small>{pilotoSeleccionadoParaOcultar.vehiculo}</small>
                  </>
                ) : (
                  <>
                    <strong>Ningun piloto seleccionado</strong>
                    <span>Elegí un numero para ver el resumen.</span>
                  </>
                )}
              </div>

              <div className="acciones">
                <button
                  type="button"
                  className="boton-principal"
                  disabled={!pilotoSeleccionadoParaOcultar}
                  onClick={ocultarPilotoSeleccionado}
                >
                  Ocultar piloto
                </button>
              </div>

              <section className="tabla-bloque tabla-bloque--interna">
                <div className="tabla-bloque__header">
                  <div>
                    <h2>Pilotos ocultos</h2>
                    <p>{pilotosOcultosDetalle.length} oculto(s) actualmente.</p>
                  </div>
                </div>

                <div className="tabla-scroll tabla-scroll--modal">
                  <table className="tabla-admin">
                    <thead>
                      <tr>
                        <th>Nro</th>
                        <th>Piloto</th>
                        <th>Navegante</th>
                        <th>Vehiculo</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pilotosOcultosDetalle.length ? pilotosOcultosDetalle.map((fila) => (
                        <tr key={`oculto-${fila.nro}`}>
                          <td><BadgeNro nro={fila.nro} clase={fila.clase} /></td>
                          <td>{fila.piloto}</td>
                          <td>{fila.navegante}</td>
                          <td>{fila.vehiculo}</td>
                          <td>
                            <button
                              type="button"
                              className="boton-secundario"
                              onClick={() => volverAMostrarPiloto(fila.nro)}
                            >
                              Volver a mostrar
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5">No hay pilotos ocultos.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <ModalAbandonosTiempos
        abierto={modalAbandonosAbierto}
        onCerrar={() => setModalAbandonosAbierto(false)}
        filas={filasOrdenadasPorNro}
        etapas={etapasDisponibles}
        abandonos={abandonosDetalle}
        onRegistrar={registrarAbandono}
        onEliminar={eliminarAbandono}
        procesando={procesandoAbandono}
      />
      <ToastAdmin
        abierto={Boolean(error || mensaje)}
        tipo={error ? 'error' : 'info'}
        mensaje={error || mensaje}
        onClose={() => {
          setMensaje('');
          setError('');
        }}
      />
    </section>
  );
}

function obtenerClaseEtapaPe(etapa) {
  return Number(etapa) === 2 ? 'tabla-admin__columna-pe--etapa-2' : 'tabla-admin__columna-pe--etapa-1';
}

function obtenerClaseEstadoTramo(estado) {
  const valor = String(estado || '').trim().toLowerCase();

  if (valor === 'cancelado') {
    return 'tabla-admin__estado-tramo tabla-admin__estado-tramo--cancelado';
  }

  if (valor === 'demorado') {
    return 'tabla-admin__estado-tramo tabla-admin__estado-tramo--demorado';
  }

  if (valor === 'en carrera') {
    return 'tabla-admin__estado-tramo tabla-admin__estado-tramo--en-carrera';
  }

  return 'tabla-admin__estado-tramo';
}

function obtenerClaseBadgeAbandono(estadoVisual) {
  if (estadoVisual === 'pendiente') {
    return 'badge-nro--abandono-pendiente';
  }

  if (estadoVisual === 'completo') {
    return 'badge-nro--abandono-completo';
  }

  return '';
}

function FragmentTripleta({ etapa }) {
  const claseEtapaPe = obtenerClaseEtapaPe(etapa);

  return (
    <>
      <th className="tabla-admin__sticky-top tabla-admin__sticky-top--segunda">HLPE</th>
      <th className="tabla-admin__sticky-top tabla-admin__sticky-top--segunda">TPE</th>
      <th className={`tabla-admin__sticky-top tabla-admin__sticky-top--segunda tabla-admin__columna-pe tabla-admin__columna-pe--encabezado ${claseEtapaPe}`}>PE</th>
    </>
  );
}

function TripletaEditable({
  fila,
  filaOriginal,
  indiceFila,
  indiceColumnaVisible,
  pe,
  etapa,
  estado,
  columnas,
  abandono,
  erroresPorCelda,
  onChange
}) {
  const manual = esEstadoManual(estado);
  const cancelado = esEstadoCancelado(estado);
  const claseEtapaPe = obtenerClaseEtapaPe(etapa);
  const campoHlpe = `hlpe${pe}`;
  const campoTpe = `tpe${pe}`;
  const campoPe = `pe${pe}`;
  const errorHlpe = erroresPorCelda.get(`${fila.nro}:${campoHlpe}`);
  const errorTpe = erroresPorCelda.get(`${fila.nro}:${campoTpe}`);
  const errorPe = erroresPorCelda.get(`${fila.nro}:${campoPe}`);
  const modificadoHlpe = (fila[campoHlpe] || '') !== (filaOriginal?.[campoHlpe] || '');
  const modificadoTpe = (fila[campoTpe] || '') !== (filaOriginal?.[campoTpe] || '');
  const modificadoPe = (fila[campoPe] || '') !== (filaOriginal?.[campoPe] || '');
  const abandonoIncluyePe = Array.isArray(abandono?.pes_pendientes) && abandono.pes_pendientes.includes(pe);
  const peAnteriorEditablePorAbandono = obtenerPeAnteriorEditablePorAbandono(fila, abandono, columnas);
  const abandonoPeAnterior = Number(peAnteriorEditablePorAbandono) === Number(pe);
  const abandonoPePendiente = abandonoIncluyePe && peSiguePendientePorAbandono(fila, pe);
  const abandonoPeCompleto = abandonoIncluyePe && !abandonoPePendiente;
  const claseHlpe = `input-tabla ${errorHlpe ? 'input-tabla--error' : modificadoHlpe ? 'input-tabla--modificado' : ''}`.trim();
  const claseTpe = `input-tabla ${errorTpe ? 'input-tabla--error' : modificadoTpe ? 'input-tabla--modificado' : ''}`.trim();
  const clasePeBase = cancelado
    ? 'input-tabla--cancelado'
    : abandonoPeAnterior
      ? 'input-tabla--abandono-anterior'
    : abandonoPePendiente
      ? 'input-tabla--abandono-pendiente'
      : abandonoPeCompleto
        ? 'input-tabla--abandono-completo'
        : manual
          ? 'input-tabla--manual'
          : 'input-tabla--calculado';
  const clasePe = `input-tabla ${clasePeBase} ${errorPe ? 'input-tabla--error' : modificadoPe ? 'input-tabla--modificado' : ''}`.trim();
  const claseCeldaPeAbandono = abandonoPePendiente
    ? 'tabla-admin__celda-pe--abandono-pendiente'
    : abandonoPeCompleto
      ? 'tabla-admin__celda-pe--abandono-completo'
      : '';
  const baseColumna = indiceColumnaVisible * 3;

  return (
    <>
      <td>
        <input
          className={claseHlpe}
          type="text"
          placeholder="00:00"
          value={fila[campoHlpe] || ''}
          maxLength={5}
          data-enter-group={`tiempos-hlpe-${pe}`}
          data-enter-row={indiceFila}
          data-nav-row={indiceFila}
          data-nav-col={baseColumna}
          onChange={(event) => onChange(fila.nro, campoHlpe, event.target.value)}
          onKeyDown={manejarEnterEnTabla}
          title={errorHlpe || 'Horario de largada'}
        />
      </td>
      <td>
        <input
          className={claseTpe}
          type="text"
          placeholder="00:00:00.0"
          value={fila[campoTpe] || ''}
          maxLength={12}
          data-enter-group={`tiempos-tpe-${pe}`}
          data-enter-row={indiceFila}
          data-nav-row={indiceFila}
          data-nav-col={baseColumna + 1}
          onChange={(event) => onChange(fila.nro, campoTpe, event.target.value)}
          onKeyDown={manejarEnterEnTabla}
          title={errorTpe || 'Taqueo de llegada'}
        />
      </td>
      <td className={`tabla-admin__celda-pe ${claseEtapaPe} ${claseCeldaPeAbandono}`.trim()}>
        <input
          className={clasePe}
          type="text"
          placeholder=""
          value={fila[campoPe] || ''}
          readOnly={(!manual && !abandonoIncluyePe && !abandonoPeAnterior) || cancelado}
          maxLength={9}
          data-enter-group={`tiempos-pe-${pe}`}
          data-enter-row={indiceFila}
          data-nav-row={indiceFila}
          data-nav-col={baseColumna + 2}
          onChange={(event) => onChange(fila.nro, campoPe, event.target.value)}
          onKeyDown={manejarEnterEnTabla}
          title={
            errorPe || (
              cancelado
                ? 'En tramos cancelados el tiempo se fija automaticamente en 0:00.000.'
                : abandonoPeAnterior
                  ? 'Editable por abandono registrado: este fue el ultimo PE completado antes del corte.'
                : abandonoIncluyePe
                  ? 'Editable por abandono registrado en esta etapa.'
                : manual
                  ? 'Editable por estado del tramo.'
                  : 'Se calcula automaticamente con HLPE y TPE.'
            )
          }
        />
      </td>
    </>
  );
}
