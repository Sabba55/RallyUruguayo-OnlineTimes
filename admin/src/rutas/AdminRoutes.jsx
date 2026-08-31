import { useEffect, useMemo, useState } from 'react';
import { LogoutButton } from '../componentes/auth/LogoutButton.jsx';
import { PaginaRally } from '../paginas/Rally/PaginaRally.jsx';
import { PaginaInscriptos } from '../paginas/Inscriptos/PaginaInscriptos.jsx';
import { PaginaTramos } from '../paginas/Tramos/PaginaTramos.jsx';
import { PaginaHorarios } from '../paginas/Horarios/PaginaHorarios.jsx';
import { PaginaPenalizaciones } from '../paginas/Penalizaciones/PaginaPenalizaciones.jsx';
import { PaginaShakedown } from '../paginas/Shakedown/PaginaShakedown.jsx';
import { PaginaTiempos } from '../paginas/Tiempos/PaginaTiempos.jsx';

const SECCIONES = [
  { id: 'rally', etiqueta: 'Rally', habilitada: true },
  { id: 'tramos', etiqueta: 'Tramos', habilitada: true },
  { id: 'inscriptos', etiqueta: 'Inscriptos', habilitada: true },
  { id: 'horarios', etiqueta: 'Horarios', habilitada: true },
  { id: 'penalizaciones', etiqueta: 'Penalizaciones', habilitada: true },
  { id: 'shakedown', etiqueta: 'Shakedown', habilitada: true },
  { id: 'tiempos', etiqueta: 'Tiempos', habilitada: true }
];

const CLAVE_SECCION_ACTIVA = 'admin.seccionActiva';

export function AdminRoutes({ usuario, onLogout }) {
  const [seccionActiva, setSeccionActiva] = useState(() => {
    const seccionGuardada = window.localStorage.getItem(CLAVE_SECCION_ACTIVA);
    return SECCIONES.some((seccion) => seccion.id === seccionGuardada) ? seccionGuardada : 'rally';
  });
  const [sidebarContraido, setSidebarContraido] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_SECCION_ACTIVA, seccionActiva);
  }, [seccionActiva]);

  const vistaActiva = useMemo(() => {
    switch (seccionActiva) {
      case 'rally':
        return <PaginaRally />;
      case 'inscriptos':
        return <PaginaInscriptos />;
      case 'tramos':
        return <PaginaTramos />;
      case 'horarios':
        return <PaginaHorarios />;
      case 'penalizaciones':
        return <PaginaPenalizaciones />;
      case 'shakedown':
        return <PaginaShakedown />;
      case 'tiempos':
        return <PaginaTiempos />;
      default:
        return <PaginaRally />;
    }
  }, [seccionActiva]);

  return (
    <div className={`admin-shell ${sidebarContraido ? 'admin-shell--contraido' : ''}`}>
      <aside className={`sidebar ${sidebarContraido ? 'sidebar--contraido' : ''}`}>
        <div className="sidebar__brand">
          <button
            type="button"
            className="sidebar__toggle"
            onClick={() => setSidebarContraido((valor) => !valor)}
            aria-label={sidebarContraido ? 'Expandir menu lateral' : 'Contraer menu lateral'}
          >
            {sidebarContraido ? '>>' : '<<'}
          </button>
          <h1>Rally Uruguayo</h1>
          {!sidebarContraido && usuario?.nombre && (
            <p className="sidebar__caption">Usuario: {usuario.nombre}</p>
          )}
        </div>

        <nav className="sidebar__nav" aria-label="Secciones del panel">
          {SECCIONES.map((seccion) => (
            <button
              key={seccion.id}
              type="button"
              className={`sidebar__link ${seccionActiva === seccion.id ? 'sidebar__link--activa' : ''}`}
              onClick={() => setSeccionActiva(seccion.id)}
              title={seccion.etiqueta}
            >
              <span>{seccion.etiqueta}</span>
              {!sidebarContraido && !seccion.habilitada && <small>Proximo</small>}
            </button>
          ))}
        </nav>

        {!sidebarContraido && (
          <LogoutButton onLogout={onLogout} />
        )}
      </aside>

      <main className="main-content">
        {vistaActiva}
      </main>
    </div>
  );
}
