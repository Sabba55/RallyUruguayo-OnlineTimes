import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { guardarLoteShakedownAdmin, obtenerShakedownAdmin } from '../../servicios/adminApi.js';
import { useAutoClearFeedback } from '../../hooks/useAutoClearFeedback.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { BadgeNro } from '../../componentes/comunes/BadgeNro.jsx';
import { ToastAdmin } from '../../componentes/comunes/ToastAdmin.jsx';
import { manejarEnterEnTabla } from '../../utilidades/navegacionTabla.js';

const VUELTAS = [1, 2, 3];
const CLAVE_CATEGORIAS_OCULTAS_SHAKEDOWN = 'admin-shakedown-categorias-ocultas';

function crearFilaEditable(fila) {
  return {
    ...fila,
    hlv1: fila.hlv1 || '',
    tv1: fila.tv1 || '',
    v1: fila.v1 || '',
    hlv2: fila.hlv2 || '',
    tv2: fila.tv2 || '',
    v2: fila.v2 || '',
    hlv3: fila.hlv3 || '',
    tv3: fila.tv3 || '',
    v3: fila.v3 || ''
  };
}

function construirMapaOriginales(filasOriginales) {
  return new Map(filasOriginales.map((fila) => [String(fila.nro), fila]));
}

function formatearHlv(valor) {
  const texto = String(valor || '').replace(/[^\d:]/g, '');
  const partes = texto.split(':');
  const horas = (partes[0] || '').replace(/[^\d]/g, '').slice(0, 2);

  if (partes.length === 1) {
    return horas;
  }

  const minutos = (partes[1] || '').replace(/[^\d]/g, '').slice(0, 2);
  return `${horas}:${minutos}`.slice(0, 5);
}

function formatearTv(valor) {
  const texto = String(valor || '').replace(/[^\d:.]/g, '');
  const partes = texto.split(':');
  const horas = (partes[0] || '').replace(/[^\d]/g, '').slice(0, 2);

  if (partes.length === 1) {
    return horas;
  }

  const minutos = (partes[1] || '').replace(/[^\d]/g, '').slice(0, 2);
  if (partes.length === 2) {
    return `${horas}:${minutos}`.slice(0, 5);
  }

  const resto = partes.slice(2).join(':');
  const segmentosSegundos = resto.split('.');
  const segundos = (segmentosSegundos[0] || '').replace(/[^\d]/g, '').slice(0, 2);
  const decima = (segmentosSegundos[1] || '').replace(/[^\d]/g, '').slice(0, 1);

  let resultado = `${horas}:${minutos}:${segundos}`;
  if (resto.includes('.')) {
    resultado += `.${decima}`;
  }

  return resultado.slice(0, 10);
}

function parsearHlv(valor) {
  const coincidencia = String(valor || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!coincidencia) {
    return null;
  }

  const [, horas, minutos] = coincidencia;
  return (Number(horas) * 3600 + Number(minutos) * 60) * 1000;
}

function parsearTv(valor) {
  const coincidencia = String(valor || '').trim().match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d)$/);
  if (!coincidencia) {
    return null;
  }

  const [, horas, minutos, segundos, decima] = coincidencia;
  return (
    (Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos)) * 1000 +
    Number(decima) * 100
  );
}

function formatearVuelta(milisegundosTotales) {
  if (!Number.isInteger(milisegundosTotales) || milisegundosTotales < 0) {
    return '';
  }

  const minutos = Math.floor(milisegundosTotales / 60000);
  const segundos = Math.floor((milisegundosTotales % 60000) / 1000);
  const decima = Math.floor((milisegundosTotales % 1000) / 100);
  return `${minutos}:${String(segundos).padStart(2, '0')}.${decima}`;
}

function calcularVuelta(hlv, tv) {
  const hlvTexto = String(hlv || '').trim();
  const tvTexto = String(tv || '').trim();

  if (!hlvTexto || !tvTexto || hlvTexto.includes('-') || tvTexto.includes('-')) {
    return '';
  }

  const inicio = parsearHlv(hlvTexto);
  const fin = parsearTv(tvTexto);

  if (inicio === null || fin === null || fin < inicio) {
    return '';
  }

  return formatearVuelta(fin - inicio);
}

function construirPayloadFila(fila) {
  return {
    nro: Number(fila.nro),
    hlv1: fila.hlv1 || '',
    tv1: fila.tv1 || '',
    v1: fila.v1 || '',
    hlv2: fila.hlv2 || '',
    tv2: fila.tv2 || '',
    v2: fila.v2 || '',
    hlv3: fila.hlv3 || '',
    tv3: fila.tv3 || '',
    v3: fila.v3 || ''
  };
}

export function PaginaShakedown() {
  const tablaScrollRef = useRef(null);
  const posicionScrollPendienteRef = useRef(null);
  const [filas, setFilas] = useState([]);
  const [filasOriginales, setFilasOriginales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoTodo, setGuardandoTodo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriasOcultas, setCategoriasOcultas] = useState(() => {
    const valor = window.localStorage.getItem(CLAVE_CATEGORIAS_OCULTAS_SHAKEDOWN);
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
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useAutoClearFeedback({ mensaje, error, setMensaje, setError });

  useEffect(() => {
    cargarFilas();
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
  }, [guardandoTodo, cargando, filas, filasOriginales]);

  useEffect(() => {
    window.localStorage.setItem(
      CLAVE_CATEGORIAS_OCULTAS_SHAKEDOWN,
      JSON.stringify(categoriasOcultas)
    );
  }, [categoriasOcultas]);

  async function cargarFilas() {
    setCargando(true);
    setError('');

    try {
      const datos = await obtenerShakedownAdmin();
      const filasPreparadas = datos.map(crearFilaEditable);
      setFilas(filasPreparadas);
      setFilasOriginales(filasPreparadas);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los registros de Shakedown.');
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(nro, campo, valor) {
    setFilas((actual) => actual.map((fila) => {
      if (String(fila.nro) !== String(nro)) {
        return fila;
      }

      const proximaFila = { ...fila };
      const coincidencia = campo.match(/^(hlv|tv)(\d)$/);

      if (!coincidencia) {
        return fila;
      }

      const [, tipo, vuelta] = coincidencia;
      const campoHlv = `hlv${vuelta}`;
      const campoTv = `tv${vuelta}`;
      const campoV = `v${vuelta}`;

      if (tipo === 'hlv') {
        proximaFila[campoHlv] = formatearHlv(valor);
      }

      if (tipo === 'tv') {
        proximaFila[campoTv] = formatearTv(valor);
      }

      proximaFila[campoV] = calcularVuelta(proximaFila[campoHlv], proximaFila[campoTv]);
      return proximaFila;
    }));
  }

  function esTvValido(valor) {
    if (!String(valor || '').trim()) {
      return true;
    }

    const coincidencia = String(valor).trim().match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d)$/);
    if (!coincidencia) {
      return false;
    }

    const digitos = String(valor).replace(/[^\d]/g, '').length;
    return digitos === 6 || digitos === 7;
  }

  function esHlvValido(valor) {
    if (!String(valor || '').trim()) {
      return true;
    }

    const coincidencia = String(valor).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!coincidencia) {
      return false;
    }

    const digitos = String(valor).replace(/[^\d]/g, '').length;
    return digitos === 3 || digitos === 4;
  }

  function tvEsMayorQueHlv(hlv, tv) {
    const hlvTexto = String(hlv || '').trim();
    const tvTexto = String(tv || '').trim();

    if (!hlvTexto || !tvTexto) {
      return true;
    }

    const inicio = parsearHlv(hlvTexto);
    const fin = parsearTv(tvTexto);

    if (inicio === null || fin === null) {
      return true;
    }

    return fin > inicio;
  }

  function obtenerFilasModificadas() {
    const originalesPorNro = construirMapaOriginales(filasOriginales);

    return filas.filter((fila) => {
      const original = originalesPorNro.get(String(fila.nro));
      if (!original) {
        return true;
      }

      return VUELTAS.some((vuelta) => (
        fila[`hlv${vuelta}`] !== original[`hlv${vuelta}`] ||
        fila[`tv${vuelta}`] !== original[`tv${vuelta}`] ||
        fila[`v${vuelta}`] !== original[`v${vuelta}`]
      ));
    });
  }

  function hayCambiosPendientes() {
    return obtenerFilasModificadas().length > 0;
  }

  const originalesPorNro = useMemo(
    () => construirMapaOriginales(filasOriginales),
    [filasOriginales]
  );

  const erroresPorCelda = useMemo(() => {
    const errores = new Map();

    filas.forEach((fila) => {
      VUELTAS.forEach((vuelta) => {
        const campoHlv = `hlv${vuelta}`;
        const campoTv = `tv${vuelta}`;
        const campoV = `v${vuelta}`;

        if (!esHlvValido(fila[campoHlv])) {
          errores.set(`${fila.nro}:${campoHlv}`, `HLV${vuelta} inválido`);
        }

        if (!esTvValido(fila[campoTv])) {
          errores.set(`${fila.nro}:${campoTv}`, `TV${vuelta} inválido`);
        }

        if (!tvEsMayorQueHlv(fila[campoHlv], fila[campoTv])) {
          errores.set(`${fila.nro}:${campoTv}`, `TV${vuelta} debe ser mayor que HLV${vuelta}`);
          errores.set(`${fila.nro}:${campoV}`, `V${vuelta} no puede calcularse con esos valores`);
        }
      });
    });

    return errores;
  }, [filas]);

  const categoriasDisponibles = useMemo(
    () => [...new Set(filas.map((fila) => String(fila.clase || '').trim()).filter(Boolean))].sort(),
    [filas]
  );

  useEffect(() => {
    const categoriasVigentes = new Set(categoriasDisponibles);
    setCategoriasOcultas((actual) => {
      const depuradas = actual.filter((categoria) => categoriasVigentes.has(categoria));
      return depuradas.length === actual.length ? actual : depuradas;
    });
  }, [categoriasDisponibles]);

  useUnsavedChangesWarning(hayCambiosPendientes());

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

      await guardarLoteShakedownAdmin(modificadas.map((fila) => construirPayloadFila(fila)));
      await cargarFilas();
    } catch (err) {
      posicionScrollPendienteRef.current = null;
      setError(err.message || 'No se pudieron guardar los cambios de Shakedown.');
    } finally {
      setGuardandoTodo(false);
    }
  }

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const filasVisibles = filas.filter((fila) => !categoriasOcultas.includes(String(fila.clase || '').trim()));
    const base = !termino
      ? filasVisibles
      : filasVisibles.filter((fila) => (
          String(fila.nro).includes(termino) ||
          String(fila.piloto || '').toLowerCase().includes(termino)
        ));

    return [...base].sort((a, b) => Number(a.nro) - Number(b.nro));
  }, [busqueda, categoriasOcultas, filas]);

  function alternarCategoriaOculta(categoria) {
    setCategoriasOcultas((actual) => (
      actual.includes(categoria)
        ? actual.filter((item) => item !== categoria)
        : [...actual, categoria].sort()
    ));
  }

  return (
    <section className="panel">
      <div className="panel__encabezado">
        <div>
          <p className="panel__eyebrow">Pruebas previas</p>
          <h1>Shakedown</h1>
        </div>

        <div className="estado-grid">
          <article className="estado-card">
            <span>Total filas</span>
            <strong>{filas.length}</strong>
          </article>
          <article className="estado-card">
            <span>Mostrando</span>
            <strong>{filasFiltradas.length}</strong>
          </article>
        </div>
      </div>

      <div className="panel__contenido panel__contenido--stack">
        <section className="tabla-bloque">
          <div className="tabla-bloque__header">
            <div>
              <h2>Grilla de carga</h2>
              <p>Atajo de guardado: <strong>Ctrl + Alt + S</strong></p>
            </div>

            <div className="tabla-bloque__acciones-superiores">
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
            <div className="feedback feedback--info">Cargando grilla de Shakedown...</div>
          ) : (
            <div className="tabla-scroll" ref={tablaScrollRef}>
              <table className="tabla-admin tabla-admin--grande">
                <thead>
                  <tr>
                    <th className="tabla-admin__sticky tabla-admin__sticky-top">Nº</th>
                    <th className="tabla-admin__sticky-top">Piloto</th>
                    <th className="tabla-admin__sticky-top">Navegante</th>
                    <th className="tabla-admin__sticky-top">Vehiculo</th>
                    <th className="tabla-admin__sticky-top">Clase</th>
                    <th className="tabla-admin__sticky-top">HLV1</th>
                    <th className="tabla-admin__sticky-top">TV1</th>
                    <th className="tabla-admin__sticky-top tabla-admin__columna-v">V1</th>
                    <th className="tabla-admin__sticky-top">HLV2</th>
                    <th className="tabla-admin__sticky-top">TV2</th>
                    <th className="tabla-admin__sticky-top tabla-admin__columna-v">V2</th>
                    <th className="tabla-admin__sticky-top">HLV3</th>
                    <th className="tabla-admin__sticky-top">TV3</th>
                    <th className="tabla-admin__sticky-top tabla-admin__columna-v">V3</th>
                  </tr>
                </thead>
                <tbody>
                  {filasFiltradas.map((fila, indiceFila) => (
                    <tr key={fila.nro}>
                      <td className="tabla-admin__sticky tabla-admin__sticky-columna">
                        <BadgeNro nro={fila.nro} clase={fila.clase} />
                      </td>
                      <td>{fila.piloto}</td>
                      <td>{fila.navegante}</td>
                      <td>{fila.vehiculo}</td>
                      <td>{fila.clase}</td>
                      {VUELTAS.map((vuelta) => (
                        <Fragment key={`${fila.nro}-vuelta-${vuelta}`}>
                          <td>
                            <input
                              className={`input-tabla ${
                                erroresPorCelda.get(`${fila.nro}:hlv${vuelta}`)
                                  ? 'input-tabla--error'
                                  : (fila[`hlv${vuelta}`] || '') !== (originalesPorNro.get(String(fila.nro))?.[`hlv${vuelta}`] || '')
                                    ? 'input-tabla--modificado'
                                    : ''
                              }`.trim()}
                              type="text"
                              inputMode="numeric"
                              placeholder="00:00"
                              value={fila[`hlv${vuelta}`] || ''}
                              data-enter-group={`shakedown-hlv-${vuelta}`}
                              data-enter-row={indiceFila}
                              data-nav-row={indiceFila}
                              data-nav-col={(vuelta - 1) * 3}
                              onChange={(event) => manejarCambio(fila.nro, `hlv${vuelta}`, event.target.value)}
                              onKeyDown={manejarEnterEnTabla}
                              title={erroresPorCelda.get(`${fila.nro}:hlv${vuelta}`) || `HLV${vuelta}`}
                            />
                          </td>
                          <td>
                            <input
                              className={`input-tabla ${
                                erroresPorCelda.get(`${fila.nro}:tv${vuelta}`)
                                  ? 'input-tabla--error'
                                  : (fila[`tv${vuelta}`] || '') !== (originalesPorNro.get(String(fila.nro))?.[`tv${vuelta}`] || '')
                                    ? 'input-tabla--modificado'
                                    : ''
                              }`.trim()}
                              type="text"
                              inputMode="numeric"
                              placeholder="00:00:00.0"
                              value={fila[`tv${vuelta}`] || ''}
                              data-enter-group={`shakedown-tv-${vuelta}`}
                              data-enter-row={indiceFila}
                              data-nav-row={indiceFila}
                              data-nav-col={(vuelta - 1) * 3 + 1}
                              onChange={(event) => manejarCambio(fila.nro, `tv${vuelta}`, event.target.value)}
                              onKeyDown={manejarEnterEnTabla}
                              title={erroresPorCelda.get(`${fila.nro}:tv${vuelta}`) || `TV${vuelta}`}
                            />
                          </td>
                          <td className="tabla-admin__celda-vuelta">
                            <input
                              className={`input-tabla input-tabla--calculado input-tabla--vuelta ${
                                erroresPorCelda.get(`${fila.nro}:v${vuelta}`)
                                  ? 'input-tabla--error'
                                  : (fila[`v${vuelta}`] || '') !== (originalesPorNro.get(String(fila.nro))?.[`v${vuelta}`] || '')
                                    ? 'input-tabla--modificado'
                                    : ''
                              }`.trim()}
                              type="text"
                              readOnly
                              placeholder=""
                              value={fila[`v${vuelta}`] || ''}
                              data-nav-row={indiceFila}
                              data-nav-col={(vuelta - 1) * 3 + 2}
                              onKeyDown={manejarEnterEnTabla}
                              title={erroresPorCelda.get(`${fila.nro}:v${vuelta}`) || `V${vuelta}`}
                            />
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!error && hayCambiosPendientes() && (
            <div className="tabla-bloque__footer-acciones">
              <div className="acciones__grupo">
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => setModalCategoriasAbierto(true)}
                >
                  Ocultar categorias ({categoriasOcultas.length})
                </button>
              </div>
              <div className="feedback feedback--info">
                Hay cambios sin guardar en la grilla de Shakedown.
              </div>
            </div>
          )}

          {!error && !hayCambiosPendientes() && (
            <div className="tabla-bloque__footer-acciones">
              <div className="acciones__grupo">
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => setModalCategoriasAbierto(true)}
                >
                  Ocultar categorias ({categoriasOcultas.length})
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ToastAdmin
        abierto={Boolean(error || mensaje)}
        tipo={error ? 'error' : 'info'}
        mensaje={error || mensaje}
        onClose={() => {
          setMensaje('');
          setError('');
        }}
      />

      {modalCategoriasAbierto && (
        <div className="modal-admin__overlay" onClick={() => setModalCategoriasAbierto(false)}>
          <div className="modal-admin" onClick={(event) => event.stopPropagation()}>
            <div className="modal-admin__header">
              <div>
                <h2>Ocultar categorias</h2>
                <p>Estas categorias se ocultan solo en esta vista del admin y la seleccion queda guardada.</p>
              </div>
              <button
                type="button"
                className="boton-icono"
                onClick={() => setModalCategoriasAbierto(false)}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className="modal-admin__contenido">
              <div className="tabla-bloque tabla-bloque--interna">
                <div className="tabla-bloque__header">
                  <div>
                    <h2>Categorias disponibles</h2>
                    <p>{categoriasOcultas.length} oculta(s) actualmente.</p>
                  </div>
                </div>

                <div className="modal-admin__lista-opciones">
                  {categoriasDisponibles.length ? categoriasDisponibles.map((categoria) => {
                    const oculta = categoriasOcultas.includes(categoria);
                    return (
                      <label key={categoria} className="modal-admin__opcion-check">
                        <input
                          type="checkbox"
                          checked={!oculta}
                          onChange={() => alternarCategoriaOculta(categoria)}
                        />
                        <span>{categoria}</span>
                      </label>
                    );
                  }) : (
                    <p className="modal-admin__texto-vacio">No hay categorias para configurar.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
