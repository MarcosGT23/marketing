import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";

export function SlideConfirm({
  corner = 28,
  speed = 50,
  width = "100%",
  maxWidth = 320,
  onConfirm,
  text = "Desliza para guardar",
  confirmedText = "Guardado con éxito",
  icon = "arrow_forward",
  confirmedIcon = "check_circle",
  disabled = false,
  isConfirmed = false,
}) {
  const trackRef = useRef(null);
  const [confirmed, setConfirmed] = useState(isConfirmed);
  const [trackWidth, setTrackWidth] = useState(0);
  const reducirMovimiento = useReducedMotion();

  const thumbSize = 42;
  const padding = 4;

  const x = useMotionValue(0);

  // Calcular el ancho útil de deslizamiento
  const maxDrag = Math.max(0, trackWidth - thumbSize - padding * 2);

  // Progreso de 0 a 1
  const progress = useTransform(x, [0, maxDrag || 1], [0, 1]);

  // Opacidad del texto al deslizar
  const textOpacity = useTransform(x, [0, (maxDrag || 1) * 0.6], [1, 0.1]);

  // Fondo que se llena a medida que se desliza (termina justo en el borde del thumb)
  const fillWidth = useTransform(x, (val) => val + thumbSize);

  useEffect(() => {
    setConfirmed(isConfirmed);
    if (!isConfirmed && maxDrag > 0) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }, [isConfirmed, maxDrag, x]);

  useEffect(() => {
    const updateSize = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.clientWidth);
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  const confirmar = () => {
    if (disabled || confirmed) return;

    if (reducirMovimiento) {
      x.set(maxDrag);
    } else {
      animate(x, maxDrag, { type: "spring", stiffness: 420, damping: 32 });
    }
    setConfirmed(true);
    navigator.vibrate?.(14);
    if (onConfirm) onConfirm();
  };

  const handleDragEnd = () => {
    if (disabled || confirmed) return;

    const currentX = x.get();
    // Umbral de confirmación: 75% del recorrido
    if (currentX >= maxDrag * 0.75) {
      confirmar();
    } else {
      // Volver al inicio con rebote elástico
      animate(x, 0, {
        type: "spring",
        stiffness: Math.max(150, speed * 6),
        damping: 20,
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    confirmar();
  };

  return (
    <div
      className="slide-confirm-container"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        maxWidth: maxWidth ? `${maxWidth}px` : "100%",
        margin: "0 auto",
      }}
    >
      <div
        ref={trackRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${text}. También puedes confirmar con Enter.`}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        className={`slide-confirm-track ${confirmed ? "is-confirmed" : ""} ${
          disabled ? "is-disabled" : ""
        }`}
        style={{
          borderRadius: `${corner}px`,
          height: `${thumbSize + padding * 2}px`,
          padding: `${padding}px`,
        }}
      >
        {/* Relleno progresivo verde al deslizar */}
        <motion.div
          className="slide-confirm-fill"
          style={{
            width: confirmed ? "100%" : fillWidth,
            borderRadius: `${corner - 2}px`,
          }}
        />

        {/* Texto central */}
        <motion.div
          className="slide-confirm-text"
          style={{ opacity: confirmed ? 1 : textOpacity }}
        >
          {confirmed ? (
            <span className="slide-confirm-check flex items-center justify-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">{confirmedIcon}</span>
              {confirmedText}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide text-on-surface-variant">
              <span>{text}</span>
              <span className="material-symbols-outlined slide-confirm-hint text-[16px] text-primary">
                double_arrow
              </span>
            </span>
          )}
        </motion.div>

        {/* Thumb deslizable */}
        {!confirmed && !disabled && (
          <motion.div
            className="slide-confirm-thumb"
            drag="x"
            dragConstraints={{ left: 0, right: maxDrag }}
            dragElastic={0.06}
            onDragEnd={handleDragEnd}
            style={{
              x,
              width: `${thumbSize}px`,
              height: `${thumbSize}px`,
              borderRadius: `${corner - 4}px`,
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98, cursor: "grabbing" }}
          >
            <span className="material-symbols-outlined text-[20px] text-white pointer-events-none select-none">
              {icon}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
