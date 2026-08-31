export function ToastAdmin({ abierto, tipo = 'info', mensaje, onClose }) {
  if (!abierto || !mensaje) {
    return null;
  }

  return (
    <div className={`toast-admin toast-admin--${tipo}`} role="status" aria-live="polite">
      <span className="toast-admin__mensaje">{mensaje}</span>
      <button
        type="button"
        className="toast-admin__cerrar"
        onClick={onClose}
        aria-label="Cerrar notificacion"
      >
        ×
      </button>
    </div>
  );
}
