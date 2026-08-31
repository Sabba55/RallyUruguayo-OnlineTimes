import { useMemo, useState } from 'react';
import { BadgeNro } from '../comunes/BadgeNro.jsx';

export function ModalAbandonosTiempos({
  abierto,
  onCerrar,
  filas,
  etapas,
  abandonos,
  onRegistrar,
  onEliminar,
  procesando
}) {
  const [nroSeleccionado, setNroSeleccionado] = useState('');
  const [etapaSeleccionada, setEtapaSeleccionada] = useState(() => String(etapas[0] || '1'));
  const [etapaListado, setEtapaListado] = useState(() => String(etapas[0] || '1'));

  const filasOrdenadas = useMemo(
    () => [...filas].sort((a, b) => Number(a.nro) - Number(b.nro)),
    [filas]
  );

  const pilotoSeleccionado = useMemo(
    () => filasOrdenadas.find((fila) => String(fila.nro) === String(nroSeleccionado)) || null,
    [filasOrdenadas, nroSeleccionado]
  );

  const abandonosFiltrados = useMemo(
    () => abandonos.filter((abandono) => String(abandono.etapa) === String(etapaListado)),
    [abandonos, etapaListado]
  );

  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-admin__overlay" onClick={onCerrar}>
      <div className="modal-admin" onClick={(event) => event.stopPropagation()}>
        <div className="modal-admin__header">
          <div>
            <h2>Gestionar abandonos</h2>
            <p>Marcá abandonos por etapa y revisá los PE pendientes de completar.</p>
          </div>
          <button
            type="button"
            className="boton-icono"
            onClick={onCerrar}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <div className="modal-admin__contenido">
          <div className="campo campo--ancho">
            <label htmlFor="abandono-piloto-select">Numero del piloto</label>
            <select
              id="abandono-piloto-select"
              className="selector-tabla selector-tabla--ancho"
              value={nroSeleccionado}
              onChange={(event) => setNroSeleccionado(event.target.value)}
            >
              <option value="">Seleccionar piloto...</option>
              {filasOrdenadas.map((fila) => (
                <option key={fila.nro} value={fila.nro}>
                  {fila.nro} - {fila.piloto}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-etapas">
            {etapas.map((etapa) => (
              <button
                key={`registro-etapa-${etapa}`}
                type="button"
                className={`selector-etapas__boton ${String(etapaSeleccionada) === String(etapa) ? 'selector-etapas__boton--activo' : ''}`}
                onClick={() => setEtapaSeleccionada(String(etapa))}
              >
                Etapa {etapa}
              </button>
            ))}
          </div>

          <div className="tarjeta-resumen">
            {pilotoSeleccionado ? (
              <>
                <strong>{pilotoSeleccionado.nro} {pilotoSeleccionado.piloto}</strong>
                <span>{pilotoSeleccionado.navegante}</span>
                <small>{pilotoSeleccionado.vehiculo}</small>
              </>
            ) : (
              <>
                <strong>Ningun piloto seleccionado</strong>
                <span>Elegi un numero para ver el resumen.</span>
              </>
            )}
          </div>

          <div className="acciones">
            <button
              type="button"
              className="boton-principal"
              disabled={!pilotoSeleccionado || procesando}
              onClick={() => onRegistrar({
                nro: Number(nroSeleccionado),
                etapa: Number(etapaSeleccionada)
              })}
            >
              Registrar abandono
            </button>
          </div>

          <section className="tabla-bloque tabla-bloque--interna">
            <div className="tabla-bloque__header">
              <div>
                <h2>Abandonos registrados</h2>
                <p>Filtrá por etapa para revisar y eliminar registros.</p>
              </div>
            </div>

            <div className="selector-etapas selector-etapas--bloque">
              {etapas.map((etapa) => (
                <button
                  key={`listado-etapa-${etapa}`}
                  type="button"
                  className={`selector-etapas__boton ${String(etapaListado) === String(etapa) ? 'selector-etapas__boton--activo' : ''}`}
                  onClick={() => setEtapaListado(String(etapa))}
                >
                  Etapa {etapa}
                </button>
              ))}
            </div>

            <div className="tabla-scroll tabla-scroll--modal">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>Nro</th>
                    <th>Piloto</th>
                    <th>Navegante</th>
                    <th>Vehiculo</th>
                    <th>PE faltantes</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {abandonosFiltrados.length ? abandonosFiltrados.map((abandono) => (
                    <tr key={`abandono-${abandono.nro}-${abandono.etapa}`}>
                      <td><BadgeNro nro={abandono.nro} clase={abandono.clase} /></td>
                      <td>{abandono.piloto}</td>
                      <td>{abandono.navegante}</td>
                      <td>{abandono.vehiculo}</td>
                      <td>{abandono.pesPendientesTexto || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="boton-secundario"
                          disabled={!abandono.puedeEliminar || procesando}
                          title={
                            abandono.puedeEliminar
                              ? 'Eliminar abandono'
                              : 'No se puede borrar porque ya tiene tiempos cargados en esos PE.'
                          }
                          onClick={() => onEliminar(abandono.nro, abandono.etapa)}
                        >
                          Borrar abandono
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6">No hay abandonos registrados en esta etapa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
