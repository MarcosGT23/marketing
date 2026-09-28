import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

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

  const thumbSize = 42;
  const padding = 4;

  const x = useMotionValue(0);

  // Calcular el ancho útil de deslizamiento
  const maxDrag = Math.max(0, trackWidth - thumbSize - padding * 2);

  // Progreso de 0 a 1
  const progress = useTransform(x, [0, maxDrag || 1], [0, 1]);

  // Opacidad del texto al deslizar
  const textOpacity = useTransform(x, [0, (maxDrag || 1) * 0.6], [1, 0.1]);

  // Fondo que se llena a medida que se desliza
  const fillWidth = useTransform(x, (val) => val + thumbSize + padding);

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

  const handleDragEnd = () => {
    if (disabled || confirmed) return;

    const currentX = x.get();
    // Umbral de confirmación: 75% del recorrido
    if (currentX >= maxDrag * 0.75) {
      // Snap to end
      animate(x, maxDrag, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
      setConfirmed(true);
      if (onConfirm) {
        onConfirm();
      }
    } else {
      // Volver al inicio con rebote elástico
      animate(x, 0, {
        type: "spring",
        stiffness: Math.max(150, speed * 6),
        damping: 20,
      });
    }
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
            <span className="flex items-center justify-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">{confirmedIcon}</span>
              {confirmedText}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide text-on-surface-variant">
              <span>{text}</span>
              <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">
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
