const API_BASE = 'http://localhost:5000/api/auth';

function notificarAuthRequerida() {
  window.dispatchEvent(new CustomEvent('admin-auth-required'));
}

async function procesarRespuesta(respuesta, { permitir401 = false } = {}) {
  let data = {};

  try {
    data = await respuesta.json();
  } catch {
    data = {};
  }

  if (permitir401 && respuesta.status === 401) {
    return null;
  }

  if (!respuesta.ok || data.exito === false) {
    if (respuesta.status === 401) {
      notificarAuthRequerida();
    }

    throw new Error(data.mensaje || 'La solicitud de autenticacion fallo.');
  }

  return data.datos;
}

export async function loginAdmin(username, password) {
  const respuesta = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  return procesarRespuesta(respuesta);
}

export async function logoutAdmin() {
  const respuesta = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  try {
    return await procesarRespuesta(respuesta, { permitir401: true });
  } finally {
    notificarAuthRequerida();
  }
}

export async function obtenerSesionAdmin() {
  const respuesta = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  return procesarRespuesta(respuesta, { permitir401: true });
}
