import "../styles/confirmLoginModal.css";

export default function ConfirmLoginModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h3 className="modal-title">Iniciar sesión requerido</h3>

        <p className="modal-text">
          Para agregar productos al carrito tenés que estar logueado.
        </p>

        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="modal-btn primary" onClick={onConfirm} type="button">
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
}
 