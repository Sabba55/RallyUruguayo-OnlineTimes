import crypto from 'crypto';
import { obtenerUsuarioAdminPorId, obtenerUsuarioAdminPorUsername } from '../../infraestructura/usuariosAdminRepo.js';
import { verificarPassword } from '../../infraestructura/password.js';

const NOMBRE_COOKIE_SESION = 'admin_session';
const DURACION_SESION_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 12);

function obtenerSecretoAuth() {
  if (process.env.ADMIN_AUTH_SECRET) {
    return process.env.ADMIN_AUTH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta ADMIN_AUTH_SECRET para autenticar el panel admin en produccion.');
  }

  return 'admin-dev-secret-cambiar-en-produccion';
}

function decodificarBase64Url(texto) {
  return Buffer.from(texto, 'base64url').toString('utf8');
}

function firmarPayload(payloadCodificado) {
  return crypto
    .createHmac('sha256', obtenerSecretoAuth())
    .update(payloadCodificado)
    .digest('base64url');
}

function serializarUsuarioAdmin(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    username: usuario.username,
    activo: usuario.activo,
    created_at: usuario.created_at,
    updated_at: usuario.updated_at
  };
}

export function obtenerNombreCookieSesionAdmin() {
  return NOMBRE_COOKIE_SESION;
}

export function crearCookieSesionAdmin(usuario) {
  const payload = {
    sub: usuario.id,
    username: usuario.username,
    exp: Date.now() + DURACION_SESION_MS
  };

  const payloadCodificado = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firma = firmarPayload(payloadCodificado);
  return `${payloadCodificado}.${firma}`;
}

export function leerCookies(request) {
  const header = request.headers.cookie || '';
  return header
    .split(';')
    .map((parte) => parte.trim())
    .filter(Boolean)
    .reduce((acc, parte) => {
      const indice = parte.indexOf('=');
      if (indice === -1) {
        return acc;
      }

      const clave = parte.slice(0, indice).trim();
      const valor = parte.slice(indice + 1).trim();
      acc[clave] = decodeURIComponent(valor);
      return acc;
    }, {});
}

export async function autenticarUsuarioAdmin(username, password) {
  const usernameTexto = String(username || '').trim();
  const passwordTexto = String(password || '');

  if (!usernameTexto || !passwordTexto) {
    const error = new Error('Usuario y password son obligatorios.');
    error.statusCode = 400;
    throw error;
  }

  const usuario = await obtenerUsuarioAdminPorUsername(usernameTexto);
  if (!usuario || !usuario.activo) {
    const error = new Error('Credenciales invalidas.');
    error.statusCode = 401;
    throw error;
  }

  const passwordOk = await verificarPassword(passwordTexto, usuario.password_hash);
  if (!passwordOk) {
    const error = new Error('Credenciales invalidas.');
    error.statusCode = 401;
    throw error;
  }

  return serializarUsuarioAdmin(usuario);
}

export async function validarSesionAdmin(tokenSesion) {
  const token = String(tokenSesion || '').trim();
  if (!token) {
    return null;
  }

  const [payloadCodificado, firma] = token.split('.');
  if (!payloadCodificado || !firma) {
    return null;
  }

  const firmaEsperada = firmarPayload(payloadCodificado);
  const firmaActual = Buffer.from(firma, 'utf8');
  const firmaValida = Buffer.from(firmaEsperada, 'utf8');

  if (firmaActual.length !== firmaValida.length || !crypto.timingSafeEqual(firmaActual, firmaValida)) {
    return null;
  }

  let payload = null;
  try {
    payload = JSON.parse(decodificarBase64Url(payloadCodificado));
  } catch {
    return null;
  }

  if (!payload?.sub || !payload?.exp || Number(payload.exp) <= Date.now()) {
    return null;
  }

  const usuario = await obtenerUsuarioAdminPorId(Number(payload.sub));
  if (!usuario || !usuario.activo) {
    return null;
  }

  return serializarUsuarioAdmin(usuario);
}
