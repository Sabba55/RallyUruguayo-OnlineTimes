export function ProtectedRoute({ autenticado, cargando, fallback = null, children }) {
  if (cargando) {
    return fallback;
  }

  if (!autenticado) {
    return fallback;
  }

  return children;
}
