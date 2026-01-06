
import { useEffect, useState } from "react";


export default function ServerColdStartModal({ open, onClose }) {

  const SABIAS_QUE = [
    "Esta demo está construida con React + Node/Express + MySQL ⚙️",

    "Si tenés PC + celular, podés entrar como Cliente y Operario y ver el flujo en vivo 📱💻",

    "Cada rol tiene sun funciones  bien difinidas 🧑‍🔧👑",

    "Con el botón Demo podés acceder como Cliente, Operario o Admin sin necesidad de registrarte ✨",

    
  ];

  const [sqIndex, setSqIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const id = setInterval(() => {
      setSqIndex((i) => (i + 1) % SABIAS_QUE.length);
    }, 6000);

    return () => clearInterval(id);
  }, [open, SABIAS_QUE.length]);


  if (!open) return null;

  return (
    <div
      className="eco-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="eco-modal">
        <div className="eco-modal-head">
          <span className="eco-modal-title">Estamos preparando el servidor</span>
        </div>

        <div className="eco-modal-body">
          <p>
            Esta aplicación está desplegada en <b>Render (plan Free)💸🚫</b>.
          </p>

          <p>
            Cuando pasa un tiempo sin uso, el servidor se apaga y necesita unos segundos
            para volver a iniciar. ⏳
          </p>

          <p>
            Por eso, puede haber un pequeño retraso en la carga de los productos.
          </p>

          <p>
            Gracias por la paciencia 🙌 En breve se podran ver los productos.
          </p>


        </div>

        <div className="eco-sq">
          <div className="eco-sq-title">¿Sabías que…?</div>

          <div className="eco-sq-text">
            {SABIAS_QUE[sqIndex]}
          </div>

          <div className="eco-sq-dots">
            {SABIAS_QUE.map((_, i) => (
              <span
                key={i}
                className={`eco-sq-dot ${i === sqIndex ? "active" : ""}`}
                onClick={() => setSqIndex(i)}
              />
            ))}
          </div>
        </div>




        <div className="eco-modal-actions">
          <button
            type="button"
            className="eco-modal-btn"
            onClick={() => onClose?.()}
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
