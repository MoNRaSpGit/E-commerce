export default function DemoLoginButtons({ demoUsers, disabled, onQuickLogin }) {
  return (
    <div className="login-demo">
      <p className="login-demo-title">Accesos rápidos (demo)</p>

      <div className="login-demo-actions">
        {Object.entries(demoUsers).map(([key, u]) => (
          <button
            key={key}
            type="button"
            className={`login-demo-btn ${key}`}
            onClick={() => onQuickLogin(key)}
            disabled={disabled}
          >
            {u.label}
          </button>
        ))}
      </div>

      <div className="login-demo-sep" />
    </div>
  );
}
