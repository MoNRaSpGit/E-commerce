// src/components/ConfirmActionModal.jsx
import "../styles/confirmLoginModal.css";

export default function ConfirmActionModal({
  open,
  title = "Confirmar acción",
  text = "¿Querés continuar?",
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  danger = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>

        <p className="modal-text">{text}</p>

        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onCancel} type="button">
            {cancelText}
          </button>

          <button
            className={`modal-btn ${danger ? "danger" : "primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
