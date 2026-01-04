export default function ServerColdStartModal({ open }) {
  if (!open) return null;

  return (
    <div className="eco-modal-backdrop" role="dialog" aria-modal="true">
      <div className="eco-modal">
        <div className="eco-modal-head">
          <span className="eco-modal-title">Estamos preparando el servidor</span>
        </div>

        <div className="eco-modal-body">
          <p>
            Este proyecto está desplegado en <b>Render (plan gratuito)</b>.
            Si pasó un tiempo sin uso, el servidor puede tardar en iniciar.
          </p>
          <p>
            Gracias por la paciencia 🙌 En breve vas a ver los productos.
          </p>
        </div>

        <div className="eco-modal-actions">
          <button type="button" className="eco-modal-btn" disabled>
            Cargando...
          </button>
        </div>
      </div>
    </div>
  );
}
