import { useState } from 'react';
import { AuthLayout } from '../../componentes/auth/AuthLayout.jsx';
import './Login.css';

export function Login({ onLogin, cargando }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(event) {
    event.preventDefault();
    setError('');
    setEnviando(true);

    try {
      await onLogin(username, password);
    } catch (submitError) {
      setError(submitError.message || 'No se pudo iniciar sesion.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <div className="login-panel">
        <div className="login-panel__header">
          <p className="panel__eyebrow">Acceso protegido</p>
          <h1>Panel Admin</h1>
        </div>

        <form className="login-panel__form" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="feedback feedback--error login-panel__error">{error}</p>
          )}

          <div className="acciones">
            <button type="submit" className="boton-principal" disabled={cargando || enviando}>
              {cargando || enviando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
