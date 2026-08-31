export function LogoutButton({ onLogout }) {
  async function manejarClick() {
    const confirmar = window.confirm('¿Querés cerrar la sesión del panel admin?');
    if (!confirmar) {
      return;
    }

    await onLogout();
  }

  return (
    <button
      type="button"
      className="sidebar__logout"
      onClick={manejarClick}
    >
      Cerrar sesion
    </button>
  );
}
