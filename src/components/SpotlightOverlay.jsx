import { useEffect, useState } from "react";
import "../styles/spotlight.css";

export default function SpotlightOverlay({
    open,
    targetRef,
    title = "Atención",
    text = "",
    onClose,
}) {
    const [ready, setReady] = useState(false);
    const [rect, setRect] = useState(null);



    useEffect(() => {
        if (!open) return;

        const update = () => {
            const el = targetRef?.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setRect({
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
            });
        };

        setReady(false);

        update();
        requestAnimationFrame(update);

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);

       const t = setTimeout(() => setReady(true), 650);




        return () => {
            clearTimeout(t);
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, targetRef]);

    if (!open || !rect) return null;

    const padding = 10;

    const focus = {
        top: Math.max(rect.top - padding, 8),
        left: Math.max(rect.left - padding, 8),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
    };

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const tooltipW = 320;
    const tooltipMargin = 12;

    // left: clamp dentro de pantalla
    const tooltipLeft = Math.min(
        Math.max(focus.left, tooltipMargin),
        Math.max(tooltipMargin, viewportW - tooltipW - tooltipMargin)
    );

    // top: si no entra abajo, va arriba
    const tooltipTopBelow = focus.top + focus.height + 14;
    const tooltipTop =
        tooltipTopBelow + 160 < viewportH
            ? tooltipTopBelow
            : Math.max(tooltipMargin, focus.top - 14 - 160);


    return (
        <div
            className={`spotlight-root ${open ? "is-open" : ""}`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="spotlight-overlay top" style={{ height: focus.top }} />

            <div
                className="spotlight-overlay left"
                style={{ top: focus.top, height: focus.height, width: focus.left }}
            />

            <div
                className="spotlight-overlay right"
                style={{
                    top: focus.top,
                    height: focus.height,
                    left: focus.left + focus.width,
                }}
            />

            <div
                className="spotlight-overlay bottom"
                style={{ top: focus.top + focus.height }}
            />

            <div
                className="spotlight-focus"
                style={{
                    top: focus.top,
                    left: focus.left,
                    width: focus.width,
                    height: focus.height,
                }}
            />

            <div
                className={`spotlight-tooltip ${ready ? "show" : ""}`}
                style={{
                    top: tooltipTop,
                    left: tooltipLeft,
                }}
            >
                <div className="spotlight-title">{title}</div>
                <div className="spotlight-text">{text}</div>

                <div className="spotlight-actions">
                    <button type="button" onClick={() => onClose?.()}>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
