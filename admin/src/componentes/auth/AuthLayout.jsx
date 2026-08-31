export function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        {children}
      </div>
    </div>
  );
}
