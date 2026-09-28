import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const LIQUID = {
  type: "spring",
  stiffness: 260,
  damping: 18,
  mass: 0.5,
};

function useGoo(blur = 2.4, cut = 26) {
  const rawId = useId().replace(/:/g, "");
  const id = `goo-${rawId}`;
  const goo = (
    <svg
      className="liq-defs"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter
          id={id}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="smear" />
          <feColorMatrix
            in="smear"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${cut} ${-(cut / 2)}`}
          />
        </filter>
      </defs>
    </svg>
  );
  return { id, url: `url(#${id})`, goo };
}

const ESTADOS = [
  { id: 'Por Hacer', label: 'Por Hacer', short: 'Hacer', pct: 0, icon: 'pending', tint: '#64748b' },
  { id: 'En Proceso', label: 'En Proceso', short: 'Diseño', pct: 50, icon: 'autorenew', tint: '#2563eb' },
  { id: 'Revisión', label: 'Revisión', short: 'Revisar', pct: 75, icon: 'rate_review', tint: '#7c3aed' },
  { id: 'Finalizado', label: 'Finalizado', short: 'Listo', pct: 100, icon: 'task_alt', tint: '#10b981' },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function LiquidStateSelector({ estadoActual = 'Por Hacer', alCambiarEstado }) {
  const containerRef = useRef(null);
  const grabRef = useRef(null);

  const activeIndex = useMemo(() => {
    const idx = ESTADOS.findIndex(e => e.id === estadoActual);
    return idx >= 0 ? idx : 0;
  }, [estadoActual]);

  const [held, setHeld] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const { url: gooUrl, goo } = useGoo(2.5, 26);

  // Motion values para física líquida
  const x = useMotionValue(0);
  const vel = useMotionValue(0);
  const squash = useTransform(vel, (v) => 1 + clamp(Math.abs(v) * 0.12, 0, 0.35));
  const wide = useTransform(squash, (q) => 1 / q);
  const tilt = useTransform(vel, (v) => clamp(v * 2.8, -10, 10));

  // Cálculo simétrico exacto del ancho de ranura considerando los 4px de padding interno (inset-1)
  const getMetrics = () => {
    if (!containerRef.current) return { slotW: 70, innerW: 280, pad: 4 };
    const pad = 4; // p-1 = 4px
    const totalW = containerRef.current.clientWidth;
    const innerW = Math.max(0, totalW - pad * 2);
    const slotW = innerW / ESTADOS.length;
    return { slotW, innerW, pad };
  };

  // Posicionar la cápsula cuando cambia activeIndex o se redimensiona
  useEffect(() => {
    if (held) return;
    const { slotW } = getMetrics();
    animate(x, activeIndex * slotW, LIQUID);
  }, [activeIndex, held]);

  // ResizeObserver para mantener simetría matemática ante cualquier cambio de pantalla o grid
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      if (held) return;
      const { slotW } = getMetrics();
      x.set(activeIndex * slotW);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [activeIndex, held, x]);

  // Selección directa por clic
  const handleSelectSlot = (index) => {
    const { slotW } = getMetrics();
    animate(x, index * slotW, LIQUID);
    if (alCambiarEstado && ESTADOS[index].id !== estadoActual) {
      alCambiarEstado(ESTADOS[index].id);
    }
  };

  // Pointer Handlers con discriminación precisa de Clic vs Arrastre
  const onPointerDown = (e) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const { slotW, pad, innerW } = getMetrics();
    const pointerRelativeX = clamp(e.clientX - rect.left - pad, 0, innerW - 1);
    const clickedSlot = clamp(Math.floor(pointerRelativeX / slotW), 0, ESTADOS.length - 1);

    grabRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialBlobX: x.get(),
      clickedSlot,
      isDragging: false,
      lastX: e.clientX,
      at: performance.now(),
    };
    vel.set(0);
  };

  const onPointerMove = (e) => {
    const g = grabRef.current;
    if (!g || !containerRef.current) return;

    const distMoved = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);

    // Si se mueve más de 4px, entra en modo arrastre (drag)
    if (!g.isDragging && distMoved > 4) {
      g.isDragging = true;
      setHeld(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch { }
    }

    if (!g.isDragging) return;

    const { slotW } = getMetrics();
    const maxDrag = slotW * (ESTADOS.length - 1);

    const deltaX = e.clientX - g.startX;
    const nextX = clamp(g.initialBlobX + deltaX, 0, maxDrag);
    x.set(nextX);

    const now = performance.now();
    const dt = Math.max(8, now - g.at);
    const speed = ((e.clientX - g.lastX) / dt) * 16;
    vel.set(clamp(speed, -3, 3));
    g.lastX = e.clientX;
    g.at = now;

    const hoverIndex = clamp(Math.round(nextX / slotW), 0, ESTADOS.length - 1);
    setHoveredIdx(hoverIndex);
  };

  const onPointerUp = (e) => {
    const g = grabRef.current;
    if (!g) return;

    const { slotW } = getMetrics();

    // 1. Caso CLIC directo (sin arrastre)
    if (!g.isDragging) {
      const targetIndex = g.clickedSlot;
      grabRef.current = null;
      setHeld(false);
      vel.set(0);
      setHoveredIdx(null);
      handleSelectSlot(targetIndex);
      return;
    }

    // 2. Caso ARRASTRE
    const currentX = x.get();
    const targetIndex = clamp(Math.round(currentX / slotW), 0, ESTADOS.length - 1);

    grabRef.current = null;
    setHeld(false);
    vel.set(0);
    setHoveredIdx(null);

    animate(x, targetIndex * slotW, LIQUID);

    if (alCambiarEstado && ESTADOS[targetIndex].id !== estadoActual) {
      alCambiarEstado(ESTADOS[targetIndex].id);
    }
  };

  const activeColor = ESTADOS[activeIndex]?.tint || '#2563eb';

  return (
    <div className="w-full select-none">
      {goo}

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-12 w-full rounded-2xl p-1 overflow-hidden cursor-pointer touch-none select-none transition-all shadow-inner border border-surface-container"
        style={{
          background: 'var(--color-surface-container-low)',
        }}
      >
        {/* Capa 1: Blob metaball líquido con filtro SVG goo perfectamente delimitado por inset-1 */}
        <div
          className="absolute inset-1 pointer-events-none"
          aria-hidden="true"
          style={{ filter: gooUrl }}
        >
          <motion.div
            className="h-full rounded-xl shadow-sm"
            style={{
              x,
              width: `${100 / ESTADOS.length}%`,
              background: activeColor,
              scaleX: wide,
              scaleY: squash,
              skewX: tilt,
            }}
            animate={{
              scale: held ? 1.04 : 1,
              filter: held ? 'brightness(1.08)' : 'brightness(1)',
            }}
            transition={LIQUID}
          />
        </div>

        {/* Capa 2: 4 Ranuras proporcionales y simétricas en mobile y desktop */}
        <div className="absolute inset-1 z-10 grid grid-cols-4 h-full w-full">
          {ESTADOS.map((est, idx) => {
            const isSelected = activeIndex === idx;
            const isHovered = held && hoveredIdx === idx;

            return (
              <button
                key={est.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSlot(idx);
                }}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-0.5 sm:px-1 rounded-xl cursor-pointer transition-colors duration-200 outline-none select-none active:scale-95 ${isSelected || isHovered
                  ? 'text-white font-bold drop-shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                title={`${est.label} (${est.pct}%)`}
              >
                <span
                  className="material-symbols-outlined text-[16px] sm:text-[17px] transition-transform duration-200 pointer-events-none leading-none flex-shrink-0"
                  style={{
                    transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  {est.icon}
                </span>

                <div className="flex items-center gap-1 pointer-events-none leading-none min-w-0">
                  <span className="hidden sm:inline truncate text-[11px] font-semibold">
                    {est.label}
                  </span>
                  <span className="inline sm:hidden truncate text-[10px] font-semibold">
                    {est.short}
                  </span>

                  <span
                    className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.2 rounded-full font-mono transition-opacity ${isSelected ? 'bg-black/25 text-white' : 'opacity-65 text-outline'
                      }`}
                  >
                    {est.pct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
