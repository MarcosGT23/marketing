// src/core/ui/SubmenuPeriodos.jsx
// Submenú horizontal de períodos: cada pestaña muestra un período y la
// cantidad de actividades asignadas a él. El valor especial SIN_PERIODO
// agrupa las actividades sin período asignado.
export const SIN_PERIODO = '__sin_periodo__';

export default function SubmenuPeriodos({ periodos = [], conteos, sinPeriodo = 0, periodoActivo, alSeleccionar }) {
  if (periodos.length === 0 && sinPeriodo === 0) return null;

  const pestana = (valor, etiqueta, conteo) => {
    const activo = periodoActivo === valor;
    return (
      <button
        key={valor}
        type="button"
        onClick={() => alSeleccionar(valor)}
        aria-pressed={activo}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
        style={{
          background: activo ? 'var(--color-primary-container)' : 'transparent',
          color: activo ? 'white' : 'var(--color-on-surface-variant)',
          boxShadow: activo ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
        }}
      >
        <span>{etiqueta}</span>
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: activo ? 'rgba(255,255,255,0.22)' : 'var(--color-surface-container-high)',
            color: activo ? 'white' : 'var(--color-on-surface-variant)'
          }}
        >
          {conteo}
        </span>
      </button>
    );
  };

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto rounded-xl px-1.5 py-1.5"
      style={{
        background: 'var(--color-surface-container-low)',
        border: '1px solid var(--color-outline-variant)'
      }}
    >
      <span
        className="material-symbols-outlined text-[18px] shrink-0 pl-1 pr-0.5"
        style={{ color: 'var(--color-outline)' }}
      >
        calendar_month
      </span>
      {periodos.map((p) => pestana(p, p, conteos?.get(p) ?? 0))}
      {sinPeriodo > 0 && pestana(SIN_PERIODO, 'Sin período', sinPeriodo)}
    </div>
  );
}
