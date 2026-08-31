const API_BASE = 'http://localhost:5000/api/admin';

function notificarAuthRequerida() {
  window.dispatchEvent(new CustomEvent('admin-auth-required'));
}

async function fetchAdmin(url, options = {}) {
  const metodo = String(options.method || 'GET').toUpperCase();
  const configuracion = {
    credentials: 'include',
    ...options
  };

  if (metodo === 'GET') {
    configuracion.cache = 'no-store';
  }

  return fetch(url, configuracion);
}

async function procesarRespuesta(respuesta) {
  const data = await respuesta.json();

  if (!respuesta.ok || data.exito === false) {
    if (respuesta.status === 401) {
      notificarAuthRequerida();
    }
    throw new Error(data.mensaje || 'La solicitud al panel admin falló.');
  }

  return data;
}

export async function obtenerEstadoAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/estado`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerRallyAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/rally`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarRallyAdmin(payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/rally`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerChapaRallyAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/rally/chapa`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarChapaRallyAdmin(imagenBase64) {
  const respuesta = await fetchAdmin(`${API_BASE}/rally/chapa`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imagenBase64 })
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarChapaRallyAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/rally/chapa`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerTiposPdfAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/pdfs`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function descargarPdfAdmin(tipoPdf, payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/pdfs/${tipoPdf}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!respuesta.ok) {
    let mensaje = 'No se pudo generar el PDF.';

    try {
      const data = await respuesta.json();
      mensaje = data.mensaje || mensaje;
    } catch {
      // No-op
    }

    throw new Error(mensaje);
  }

  const nombreHeader = respuesta.headers.get('X-Pdf-Filename') || '';
  const disposition = respuesta.headers.get('Content-Disposition') || '';
  const coincidencia = disposition.match(/filename\*?=(?:UTF-8''|\"?)([^\";]+)/i);
  const nombreArchivo = nombreHeader || coincidencia?.[1] || `${tipoPdf}.pdf`;
  const blob = await respuesta.blob();

  return { blob, nombreArchivo };
}

export async function obtenerInscriptosAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/inscriptos`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarInscriptoAdmin(payload) {
  const metodo = payload.nroOriginal ? 'PUT' : 'POST';
  const url = payload.nroOriginal
    ? `${API_BASE}/inscriptos/${payload.nroOriginal}`
    : `${API_BASE}/inscriptos`;

  const respuesta = await fetchAdmin(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarInscriptoAdmin(nro) {
  const respuesta = await fetchAdmin(`${API_BASE}/inscriptos/${nro}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarTodosLosInscriptosAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/inscriptos`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarLoteInscriptosAdmin(items) {
  const respuesta = await fetchAdmin(`${API_BASE}/inscriptos/lote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerTramosAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/tramos`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarTramoAdmin(payload) {
  const metodo = payload.peOriginal !== null && payload.peOriginal !== undefined ? 'PUT' : 'POST';
  const url = metodo === 'PUT'
    ? `${API_BASE}/tramos/${payload.peOriginal}`
    : `${API_BASE}/tramos`;

  const body = { ...payload };
  delete body.peOriginal;

  const respuesta = await fetchAdmin(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarTramoAdmin(pe) {
  const respuesta = await fetchAdmin(`${API_BASE}/tramos/${pe}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function actualizarEstadoTramoAdmin(payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/tramos/${payload.pe}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerHorariosAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/horarios`);
  const data = await procesarRespuesta(respuesta);
  return {
    datos: data.datos,
    publicados: data.publicados || []
  };
}

export async function guardarHorarioAdmin(payload) {
  const metodo = payload.nroOriginal !== null && payload.nroOriginal !== undefined ? 'PUT' : 'POST';
  const url = metodo === 'PUT'
    ? `${API_BASE}/horarios/etapa/${payload.etapaOriginal}/nro/${payload.nroOriginal}`
    : `${API_BASE}/horarios`;

  const respuesta = await fetchAdmin(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarLoteHorariosAdmin(items, etapa) {
  const respuesta = await fetchAdmin(`${API_BASE}/horarios/lote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items, etapa })
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarHorarioAdmin(etapa, nro) {
  const respuesta = await fetchAdmin(`${API_BASE}/horarios/etapa/${etapa}/nro/${nro}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarHorariosPorEtapaAdmin(etapa) {
  const respuesta = await fetchAdmin(`${API_BASE}/horarios/etapa/${etapa}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function publicarHorariosPorEtapaAdmin(etapa) {
  const respuesta = await fetchAdmin(`${API_BASE}/horarios/publicar/etapa/${etapa}`, {
    method: 'POST'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerPenalizacionesAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/penalizaciones`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarPenalizacionAdmin(payload) {
  const metodo = payload.id_penal ? 'PUT' : 'POST';
  const url = payload.id_penal
    ? `${API_BASE}/penalizaciones/${payload.id_penal}`
    : `${API_BASE}/penalizaciones`;

  const respuesta = await fetchAdmin(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarPenalizacionAdmin(idPenal) {
  const respuesta = await fetchAdmin(`${API_BASE}/penalizaciones/${idPenal}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerInscriptoAdminPorNro(nro) {
  const respuesta = await fetchAdmin(`${API_BASE}/inscriptos/${nro}`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerShakedownAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/shakedown`);
  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarShakedownAdmin(payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/shakedown/${payload.nro}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarLoteShakedownAdmin(items) {
  const respuesta = await fetchAdmin(`${API_BASE}/shakedown/lote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function obtenerTiemposAdmin() {
  const respuesta = await fetchAdmin(`${API_BASE}/tiempos`);
  const data = await procesarRespuesta(respuesta);
  return {
    columnas: data.columnas || [],
    datos: data.datos || [],
    abandonos: data.abandonos || []
  };
}

export async function guardarTiempoAdmin(payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/tiempos/${payload.nro}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function guardarLoteTiemposAdmin(items) {
  const respuesta = await fetchAdmin(`${API_BASE}/tiempos/lote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function registrarAbandonoTiempoAdmin(payload) {
  const respuesta = await fetchAdmin(`${API_BASE}/tiempos/abandonos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}

export async function eliminarAbandonoTiempoAdmin(nro, etapa) {
  const respuesta = await fetchAdmin(`${API_BASE}/tiempos/abandonos/nro/${nro}/etapa/${etapa}`, {
    method: 'DELETE'
  });

  const data = await procesarRespuesta(respuesta);
  return data.datos;
}
