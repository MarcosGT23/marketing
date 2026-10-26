import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EVENTO_NOTIFICACION } from './notifications';

const MAX_VISIBLES = 4;

const TIPOS = {
  exito: {
    icon: 'check_circle',
    color: 'var(--color-secondary)',
    fondo: 'var(--color-secondary-container)',
    etiqueta: 'Éxito',
  },
  error: {
    icon: 'error',
    color: 'var(--color-error)',
    fondo: 'var(--color-error-container)',
    etiqueta: 'Error',
  },
  aviso: {
    icon: 'warning',
    color: '#b45309',
    fondo: 'rgba(245, 158, 11, 0.16)',
    etiqueta: 'Aviso',
  },
  info: {
    icon: 'info',
    color: 'var(--color-primary-container)',
    fondo: 'var(--color-primary-fixed)',
    etiqueta: 'Información',
  },
};

function TarjetaNotificacion({ notificacion, alCerrar }) {
  const { tipo = 'info', titulo, mensaje, duracion = 4200 } = notificacion;
  const estilo = TIPOS[tipo] || TIPOS.info;
  const reducirMovimiento = useReducedMotion();
  const [pausada, setPausada] = useState(false);

  const temporizador = useRef(null);
  const restante = useRef(duracion);
  const inicio = useRef(0);

  const programar = useCallback(() => {
    window.clearTimeout(temporizador.current);
    inicio.current = Date.now();
    temporizador.current = window.setTimeout(() => alCerrar(notificacion.id), restante.current);
  }, [alCerrar, notificacion.id]);

  useEffect(() => {
    programar();
    return () => window.clearTimeout(temporizador.current);
  }, [programar]);

  const pausar = () => {
    window.clearTimeout(temporizador.current);
    restante.current = Math.max(600, restante.current - (Date.now() - inicio.current));
    setPausada(true);
  };

  const reanudar = () => {
    if (!pausada) return;
    setPausada(false);
    programar();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 28, scale: 0.96 }}
      transition={reducirMovimiento
        ? { duration: 0 }
        : { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-label={`${estilo.etiqueta}: ${[titulo, mensaje].filter(Boolean).join('. ')}`}
      onMouseEnter={pausar}
      onMouseLeave={reanudar}
      onFocus={pausar}
      onBlur={reanudar}
      className="toast-surface group pointer-events-auto relative w-full overflow-hidden"
      style={{
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 12px 36px rgba(11, 28, 48, 0.16), 0 2px 6px rgba(11, 28, 48, 0.06)',
      }}
    >
      <div className="flex items-start gap-3 p-3.5 pr-10">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: estilo.fondo, color: estilo.color }}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {estilo.icon}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          {titulo && (
            <p className="text-[13px] font-semibold leading-5" style={{ color: 'var(--color-on-surface)' }}>
              {titulo}
            </p>
          )}
          {mensaje && (
            <p
              className={`text-[12px] leading-[17px] ${titulo ? 'mt-0.5' : 'mt-0.5 text-[13px] font-medium'}`}
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {mensaje}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => alCerrar(notificacion.id)}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-container)]"
        style={{ color: 'var(--color-outline)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-container)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Cerrar notificación"
        title="Cerrar"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
      </button>

      <span
        className="toast-progress pointer-events-none absolute bottom-0 left-0 h-[2px] w-full"
        aria-hidden="true"
        style={{
          background: estilo.color,
          animationDuration: `${duracion}ms`,
          opacity: 0.5,
        }}
      />
    </motion.div>
  );
}

export default function ToastHost() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const alNotificar = (evento) => {
      const detalle = evento.detail;
      if (!detalle) return;
      setNotificaciones((previas) => {
        const nueva = { ...detalle };
        return previas.length >= MAX_VISIBLES ? [...previas.slice(1), nueva] : [...previas, nueva];
      });
    };

    window.addEventListener(EVENTO_NOTIFICACION, alNotificar);
    return () => window.removeEventListener(EVENTO_NOTIFICACION, alNotificar);
  }, []);

  const cerrar = useCallback((id) => {
    setNotificaciones((previas) => previas.filter((n) => n.id !== id));
  }, []);

  return (
    <section
      aria-label="Notificaciones del sistema"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 z-[90] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-[380px] sm:items-end"
      style={{ top: '69px' }}
    >
      <AnimatePresence initial={false}>
        {notificaciones.map((notificacion) => (
          <div key={notificacion.id} className="w-full">
            <TarjetaNotificacion notificacion={notificacion} alCerrar={cerrar} />
          </div>
        ))}
      </AnimatePresence>
    </section>
  );
}
