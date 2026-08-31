function enfocarElemento(elemento) {
  if (!elemento) {
    return;
  }

  elemento.focus();
  if (typeof elemento.select === 'function') {
    elemento.select();
  }
}

function obtenerElementosPorGrupo(grupo) {
  return Array.from(document.querySelectorAll(`[data-enter-group="${grupo}"]`))
    .filter((elemento) => !elemento.disabled && elemento.offsetParent !== null)
    .sort((a, b) => Number(a.dataset.enterRow) - Number(b.dataset.enterRow));
}

function obtenerElementosPorFila(navRow) {
  return Array.from(document.querySelectorAll(`[data-nav-row="${navRow}"]`))
    .filter((elemento) => !elemento.disabled && elemento.offsetParent !== null)
    .sort((a, b) => Number(a.dataset.navCol) - Number(b.dataset.navCol));
}

function obtenerElementosPorColumna(navCol) {
  return Array.from(document.querySelectorAll(`[data-nav-col="${navCol}"]`))
    .filter((elemento) => !elemento.disabled && elemento.offsetParent !== null)
    .sort((a, b) => Number(a.dataset.navRow) - Number(b.dataset.navRow));
}

function manejarMovimientoVertical(evento, direccion) {
  const navCol = Number(evento.currentTarget.dataset.navCol);
  const navRow = Number(evento.currentTarget.dataset.navRow);

  if (Number.isNaN(navCol) || Number.isNaN(navRow)) {
    return;
  }

  const elementos = obtenerElementosPorColumna(navCol);
  const indiceActual = elementos.findIndex((elemento) => elemento === evento.currentTarget);
  const destino = elementos[indiceActual + direccion];

  if (destino) {
    evento.preventDefault();
    enfocarElemento(destino);
  }
}

function manejarMovimientoHorizontal(evento, direccion) {
  const navCol = Number(evento.currentTarget.dataset.navCol);
  const navRow = Number(evento.currentTarget.dataset.navRow);

  if (Number.isNaN(navCol) || Number.isNaN(navRow)) {
    return;
  }

  const elementos = obtenerElementosPorFila(navRow);
  const indiceActual = elementos.findIndex((elemento) => elemento === evento.currentTarget);
  const destino = elementos[indiceActual + direccion];

  if (destino) {
    evento.preventDefault();
    enfocarElemento(destino);
  }
}

export function manejarEnterEnTabla(evento) {
  if (evento.key === 'Enter') {
    const grupo = evento.currentTarget.dataset.enterGroup;
    const filaActual = Number(evento.currentTarget.dataset.enterRow);

    if (!grupo || Number.isNaN(filaActual)) {
      return;
    }

    evento.preventDefault();

    const elementos = obtenerElementosPorGrupo(grupo);
    const indiceActual = elementos.findIndex((elemento) => elemento === evento.currentTarget);
    const siguiente = elementos[indiceActual + 1];

    enfocarElemento(siguiente);
    return;
  }

  const teclasFlecha = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (!teclasFlecha.includes(evento.key) || !evento.ctrlKey) {
    return;
  }

  if (evento.key === 'ArrowUp') {
    manejarMovimientoVertical(evento, -1);
    return;
  }

  if (evento.key === 'ArrowDown') {
    manejarMovimientoVertical(evento, 1);
    return;
  }

  if (evento.key === 'ArrowLeft') {
    manejarMovimientoHorizontal(evento, -1);
    return;
  }

  if (evento.key === 'ArrowRight') {
    manejarMovimientoHorizontal(evento, 1);
  }
}
