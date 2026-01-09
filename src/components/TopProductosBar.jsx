export default function TopProductosBar({ items = [] }) {
  if (!items.length) return <p>No hay datos para mostrar.</p>;

  const max = Math.max(...items.map((x) => Number(x.unidades || 0)));

  return (
    <div className="topbar-wrap">
      {items.map((p, i) => {
        const unidades = Number(p.unidades || 0);
        const width = max > 0 ? (unidades / max) * 100 : 0;

        return (
          <div key={p.productoId} className="topbar-row">
            <div className="topbar-rank">#{i + 1}</div>

            <div className="topbar-img">
              {p.image ? <img src={p.image} alt={p.nombre} /> : <div className="no-img">IMG</div>}
            </div>

            <div className="topbar-info">
              <div className="topbar-name">{p.nombre}</div>

              <div className="topbar-bar-bg">
                <div
                  className="topbar-bar-fill"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>

            <div className="topbar-units">
              {unidades} u.
            </div>
          </div>
        );
      })}
    </div>
  );
}
