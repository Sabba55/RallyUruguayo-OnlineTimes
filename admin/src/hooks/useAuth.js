import { useCallback, useEffect, useState } from 'react';
import { loginAdmin, logoutAdmin, obtenerSesionAdmin } from '../servicios/authApi.js';

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescarSesion = useCallback(async () => {
    try {
      const sesion = await obtenerSesionAdmin();
      setUsuario(sesion);
      return sesion;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescarSesion().catch(() => {
      setUsuario(null);
    });
  }, [refrescarSesion]);

  useEffect(() => {
    function manejarAuthRequerida() {
      setUsuario(null);
      setCargando(false);
    }

    window.addEventListener('admin-auth-required', manejarAuthRequerida);
    return () => window.removeEventListener('admin-auth-required', manejarAuthRequerida);
  }, []);

  const login = useCallback(async (username, password) => {
    const sesion = await loginAdmin(username, password);
    setUsuario(sesion);
    return sesion;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setUsuario(null);
    }
  }, []);

  return {
    usuario,
    autenticado: Boolean(usuario),
    cargando,
    login,
    logout,
    refrescarSesion
  };
}
