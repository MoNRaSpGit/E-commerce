import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useOperarioEscaneo } from "../features/escaneo/useOperarioEscaneo";
import { money } from "../features/escaneo/scanFormat";
import "../styles/operarioEscaneo.css";

export default function OperarioEscaneo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // accessToken hoy no es necesario para el escáner (lo dejé por compatibilidad del hook)
  const raw = localStorage.getItem("eco_auth");
  const stored = raw ? JSON.parse(raw) : null;
  const accessToken = stored?.accessToken || null;

  const esc = useOperarioEscaneo({ dispatch, navigate, accessToken });

  return (
    <div style={{ padding: 16 }}>
      <div className="oper-scan__hint">
        Escaneá un código y Enter. Si no existe, lo podés crear.
      </div>

      {/* Scan barcode */}
      <div className="oper-scan__scanbox">
        <input
          ref={esc.inputRef}
          className="oper-scan__input"
          value={esc.code}
          onChange={(e) => esc.setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              esc.onScanEnter();
            }
          }}
          placeholder="Código de barra…"
          autoComplete="off"
          inputMode="numeric"
        />

        <button
          type="button"
          className="oper-scan__btn"
          onClick={esc.onScanEnter}
          disabled={esc.loading || !String(esc.code || "").trim()}
        >
          {esc.loading ? "Buscando…" : "Agregar"}
        </button>
      </div>

      {!!esc.msg && <div className="oper-scan__msg">{esc.msg}</div>}

      {/* Manual simple (temporal) */}
      <div className="oper-scan__scanbox">
        <input
          className="oper-scan__input"
          value={esc.manualPrice}
          onChange={(e) => esc.setManualPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();

              // validación acá porque el hook lo deja simple
              const price = Number(String(esc.manualPrice || "").replace(",", "."));
              if (!Number.isFinite(price) || price <= 0) {
                toast.error("Precio manual inválido");
                esc.focusScan();
                return;
              }

              esc.addManualItem();
            }
          }}
          placeholder="Precio manual…"
          autoComplete="off"
          inputMode="decimal"
        />

        <button
          type="button"
          className="oper-scan__btn"
          onClick={() => {
            const price = Number(String(esc.manualPrice || "").replace(",", "."));
            if (!Number.isFinite(price) || price <= 0) {
              toast.error("Precio manual inválido");
              esc.focusScan();
              return;
            }
            esc.addManualItem();
          }}
          disabled={!String(esc.manualPrice || "").trim()}
        >
          Manual
        </button>
      </div>

      {/* Lista */}
      <div className="oper-scan__list">
        {esc.items.map((it) => {
          const subtotal = Number(it.price || 0) * Number(it.qty || 0);

          return (
            <div key={it.id} className="oper-scan__row">
              <div className="oper-scan__img">
                {it.imageDataUrl ? (
                  <img src={it.imageDataUrl} alt={it.name} />
                ) : (
                  <div className="oper-scan__imgph" />
                )}
              </div>

              <div>
                <div className="oper-scan__name">{it.name}</div>
                <div className="oper-scan__meta">$ {money(it.price)} c/u</div>
              </div>

              <div className="oper-scan__qty">
                Cant: {it.qty || 0}
              </div>

              <div className="oper-scan__sub">$ {money(subtotal)}</div>

              {/* Actualizar (queda) */}
              {Number(it.id) > 0 ? (
                <button
                  type="button"
                  className="oper-scan__upd"
                  onClick={() => esc.openEditModal(it)}
                >
                  Actualizar
                </button>
              ) : (
                <button
                  type="button"
                  className="oper-scan__upd is-disabled"
                  disabled
                  title="Producto manual no existe en base"
                >
                  Actualizar
                </button>
              )}

              {/* ✕ resta 1 y borra en 0 */}
              <button
                type="button"
                className="oper-scan__rm oper-scan__rm--danger"
                onClick={() => esc.removeItem(it.id)}
                title="Restar 1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="oper-scan__total">
        <div>Total</div>
        <div className="oper-scan__totalval">$ {money(esc.total)}</div>
      </div>

      {esc.items.length > 0 && (
        <button type="button" className="oper-scan__pay" onClick={esc.onPagar}>
          Pagar
        </button>
      )}

      {/* Modal: producto no encontrado -> crear */}
      {esc.nfOpen && (
        <div
          className="oper-modal__backdrop"
          onMouseDown={() => {
            esc.setNfOpen(false);
            esc.focusScan();
          }}
        >
          <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="oper-modal__title">Producto no encontrado</h2>

            <div className="oper-modal__field">
              <div className="oper-modal__label">Barcode</div>
              <input className="oper-modal__input" value={esc.nfBarcode} disabled />
            </div>

            <div className="oper-modal__field">
              <label className="oper-modal__label">Nombre</label>
              <input
                ref={esc.nfNameRef}
                className="oper-modal__input"
                value={esc.nfName}
                onChange={(e) => esc.setNfName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="oper-modal__field">
              <label className="oper-modal__label">Precio</label>
              <input
                className="oper-modal__input"
                value={esc.nfPrice}
                onChange={(e) => esc.setNfPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    esc.saveNotFound();
                  }
                }}
                autoComplete="off"
                inputMode="decimal"
              />
            </div>

            <div className="oper-modal__actions">
              <button
                type="button"
                className="oper-modal__btn"
                onClick={() => {
                  esc.setNfOpen(false);
                  esc.focusScan();
                }}
                disabled={esc.nfSaving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="oper-modal__btn oper-modal__btn--primary"
                onClick={esc.saveNotFound}
                disabled={esc.nfSaving}
              >
                {esc.nfSaving ? "Guardando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: editar producto */}
      {esc.edOpen && (
        <div
          className="oper-modal__backdrop"
          onMouseDown={() => {
            esc.setEdOpen(false);
            esc.focusScan();
          }}
        >
          <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="oper-modal__title">Actualizar producto</h2>

            <div className="oper-modal__field">
              <label className="oper-modal__label">Nombre</label>
              <input
                className="oper-modal__input"
                value={esc.edName}
                onChange={(e) => esc.setEdName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="oper-modal__field">
              <label className="oper-modal__label">Precio</label>
              <input
                className="oper-modal__input"
                value={esc.edPrice}
                onChange={(e) => esc.setEdPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    esc.saveEdit();
                  }
                }}
                autoComplete="off"
                inputMode="decimal"
              />
            </div>

            <div className="oper-modal__actions">
              <button
                type="button"
                className="oper-modal__btn"
                onClick={() => {
                  esc.setEdOpen(false);
                  esc.focusScan();
                }}
                disabled={esc.edSaving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="oper-modal__btn oper-modal__btn--primary"
                onClick={esc.saveEdit}
                disabled={esc.edSaving}
              >
                {esc.edSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}