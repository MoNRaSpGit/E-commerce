import { ShieldCheck, Wrench, User } from "lucide-react";

export default function DemoLoginButtons({
  demoUsers,
  disabled,
  onQuickLogin,
}) {
  const ICONS = {
    admin: <ShieldCheck size={18} />,
    operario: <Wrench size={18} />,
    cliente: <User size={18} />,
  };

  return (
    <div className="demo-login-buttons">
      {Object.entries(demoUsers).map(([role, user]) => (
        <button
          key={role}
          className={`login-demo-btn ${role}`}
          disabled={disabled}
          onClick={() => onQuickLogin(role)}
        >
          <span className="demo-login-icon">{ICONS[role]}</span>
          <span>{user.label}</span>
        </button>
      ))}
    </div>
  );
}
