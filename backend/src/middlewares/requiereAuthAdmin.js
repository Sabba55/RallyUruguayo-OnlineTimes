import {
  leerCookies,
  obtenerNombreCookieSesionAdmin,
  validarSesionAdmin
} from '../servicios/internos/auth/authService.js';

export async function requiereAuthAdmin(req, res, next) {
  try {
    const cookies = leerCookies(req);
    const tokenSesion = cookies[obtenerNombreCookieSesionAdmin()];
    const usuario = await validarSesionAdmin(tokenSesion);

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Sesion admin invalida o expirada.'
      });
    }

    req.usuarioAdmin = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
}
