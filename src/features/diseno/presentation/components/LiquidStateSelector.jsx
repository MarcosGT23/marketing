import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const LIQUID = {
  type: "spring",
  stiffness: 240,
  damping: 16,
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
  { id: 'Por Hacer',  label: 'Por Hacer',  short: 'Hacer',  pct: 0,   icon: 'pending',     tint: '#64748b' },
  { id: 'En Proceso', label: 'En Proceso', short: 'Diseño', pct: 50,  icon: 'autorenew',   tint: '#2563eb' },
  { id: 'Revisión',   label: 'Revisión',   short: 'Revisar',pct: 75,  icon: 'rate_review', tint: '#7c3aed' },
  { id: 'Finalizado', label: 'Finalizado', short: 'Listo',  pct: 100, icon: 'task_alt',    tint: '#10b981' },
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

  // Motion values
  const x = useMotionValue(0);
  const vel = useMotionValue(0);
  const squash = useTransform(vel, (v) => 1 + clamp(Math.abs(v) * 0.1, 0, 0.35));
  const wide = useTransform(squash, (q) => 1 / q);
  const tilt = useTransform(vel, (v) => clamp(v * 2.8, -12, 12));

  // Medir el ancho de cada ranura
  const getSlotWidth = () => {
    if (!containerRef.current) return 70;
    const totalWidth = containerRef.current.offsetWidth;
    return totalWidth / ESTADOS.length;
  };

  // Posicionar la cápsula cuando cambia activeIndex o se redimensiona
  useEffect(() => {
    if (held) return;
    const slotW = getSlotWidth();
    animate(x, activeIndex * slotW, LIQUID);
  }, [activeIndex, held]);

  useEffect(() => {
    const handleResize = () => {
      if (held) return;
      const slotW = getSlotWidth();
      x.set(activeIndex * slotW);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, held, x]);

  // Pointer Handlers para Arrastrar (Drag)
  const onPointerDown = (e) => {
    const el = containerRef.current;
    if (!el) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const rect = el.getBoundingClientRect();
    const currentPointerX = e.clientX - rect.left;
    const slotW = getSlotWidth();

    grabRef.current = {
      startX: currentPointerX,
      initialBlobX: x.get(),
      lastX: e.clientX,
      at: performance.now(),
    };

    setHeld(true);
    vel.set(0);
  };

  const onPointerMove = (e) => {
    const g = grabRef.current;
    if (!g || !containerRef.current) return;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const currentPointerX = e.clientX - rect.left;
    const slotW = getSlotWidth();
    const maxDrag = slotW * (ESTADOS.length - 1);

    const deltaX = currentPointerX - g.startX;
    const nextX = clamp(g.initialBlobX + deltaX, 0, maxDrag);
    x.set(nextX);

    const now = performance.now();
    const dt = Math.max(8, now - g.at);
    const speed = ((e.clientX - g.lastX) / dt) * 16;
    vel.set(clamp(speed, -3, 3));
    g.lastX = e.clientX;
    g.at = now;

    // Detectar sobre qué ranura pasa para feedback
    const hoverIndex = clamp(Math.round(nextX / slotW), 0, ESTADOS.length - 1);
    setHoveredIdx(hoverIndex);
  };

  const onPointerUp = (e) => {
    const g = grabRef.current;
    if (!g) return;

    const slotW = getSlotWidth();
    const currentX = x.get();
    const targetIndex = clamp(Math.round(currentX / slotW), 0, ESTADOS.length - 1);

    grabRef.current = null;
    setHeld(false);
    vel.set(0);
    setHoveredIdx(null);

    // Animar a la posición final
    animate(x, targetIndex * slotW, LIQUID);

    if (alCambiarEstado && ESTADOS[targetIndex].id !== estadoActual) {
      alCambiarEstado(ESTADOS[targetIndex].id);
    }
  };

  // Clic directo en una de las ranuras
  const handleSlotClick = (index) => {
    if (held) return;
    const slotW = getSlotWidth();
    animate(x, index * slotW, LIQUID);
    if (alCambiarEstado && ESTADOS[index].id !== estadoActual) {
      alCambiarEstado(ESTADOS[index].id);
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
        className="relative h-11 w-full rounded-xl p-1 overflow-hidden cursor-grab active:cursor-grabbing touch-none transition-all shadow-inner border border-surface-container"
        style={{
          background: 'var(--color-surface-container-low)',
        }}
      >
        {/* Capa 1: Blobs metaballs líquidos (Goo Filter) */}
        <div 
          className="absolute inset-0 pointer-events-none p-1" 
          aria-hidden="true" 
          style={{ filter: gooUrl }}
        >
          <motion.div
            className="h-full rounded-lg shadow-sm"
            style={{
              x,
              width: `${100 / ESTADOS.length}%`,
              background: activeColor,
              scaleX: wide,
              scaleY: squash,
              skewX: tilt,
            }}
            animate={{
              scale: held ? 1.05 : 1,
              filter: held ? 'brightness(1.1)' : 'brightness(1)',
            }}
            transition={LIQUID}
          />
        </div>

        {/* Capa 2: Contenido no filtrado (Texto nítido, iconos y botones cliqueables) */}
        <div className="relative z-10 grid grid-cols-4 h-full w-full">
          {ESTADOS.map((est, idx) => {
            const isSelected = activeIndex === idx;
            const isHovered = held && hoveredIdx === idx;

            return (
              <button
                key={est.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotClick(idx);
                }}
                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-1 py-0.5 rounded-lg text-xs font-semibold transition-colors duration-200 outline-none ${
                  isSelected || isHovered
                    ? 'text-white font-bold drop-shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[15px] sm:text-[16px] transition-transform duration-200"
                  style={{
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {est.icon}
                </span>

                <span className="hidden sm:inline truncate text-[11px] leading-none">
                  {est.label}
                </span>
                <span className="inline sm:hidden truncate text-[10px] leading-none">
                  {est.short}
                </span>

                <span 
                  className={`text-[9px] px-1 py-0.2 rounded-full font-mono transition-opacity ${
                    isSelected ? 'bg-black/20 text-white' : 'opacity-60 text-outline'
                  }`}
                >
                  {est.pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
