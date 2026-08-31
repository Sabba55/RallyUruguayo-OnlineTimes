import { Login } from './paginas/Login';
import { ProtectedRoute } from './componentes/auth/ProtectedRoute.jsx';
import { useAuth } from './hooks/useAuth.js';
import { AdminRoutes } from './rutas/AdminRoutes.jsx';

function PantallaCargando() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <div className="feedback feedback--info">Verificando sesion...</div>
      </div>
    </div>
  );
}

export default function App() {
  const { usuario, autenticado, cargando, login, logout } = useAuth();

  if (cargando) {
    return <PantallaCargando />;
  }

  return (
    <ProtectedRoute
      autenticado={autenticado}
      cargando={cargando}
      fallback={<Login onLogin={login} cargando={cargando} />}
    >
      <AdminRoutes usuario={usuario} onLogout={logout} />
    </ProtectedRoute>
  );
}
