import {
  autenticarUsuarioAdmin,
  crearCookieSesionAdmin,
  obtenerNombreCookieSesionAdmin
} from '../../servicios/internos/auth/authService.js';

function obtenerOpcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 12)
  };
}

export async function loginAdmin(req, res, next) {
  try {
    const usuario = await autenticarUsuarioAdmin(req.body?.username, req.body?.password);
    const tokenSesion = crearCookieSesionAdmin(usuario);

    res.cookie(obtenerNombreCookieSesionAdmin(), tokenSesion, obtenerOpcionesCookie());

    return res.json({
      exito: true,
      mensaje: 'Login correcto.',
      datos: usuario
    });
  } catch (error) {
    return next(error);
  }
}

export async function logoutAdmin(req, res) {
  res.clearCookie(obtenerNombreCookieSesionAdmin(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  return res.json({
    exito: true,
    mensaje: 'Sesion cerrada correctamente.'
  });
}

export async function obtenerSesionAdmin(req, res) {
  return res.json({
    exito: true,
    datos: req.usuarioAdmin
  });
}
