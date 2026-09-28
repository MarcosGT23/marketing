import { useState } from 'react';
import { Button } from '../../../../core/ui';

/* ─── Shared styled input (same as form page) ─── */
function StyledInput({ icon, ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '19px' }}>{icon}</span>
            )}
            <input
                style={{
                    width: '100%', height: '44px',
                    background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                    border: '1px solid transparent',
                    borderRadius: '0.5rem',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px',
                    paddingLeft: icon ? '40px' : '12px',
                    paddingRight: '12px',
                    outline: 'none',
                    boxShadow: focused ? '0 0 0 2px rgba(37,99,235,0.25)' : 'none',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...rest}
            />
        </div>
    );
}

function StyledSelect({ icon, children, ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '19px' }}>{icon}</span>
            )}
            <select
                style={{
                    width: '100%', height: '44px',
                    background: focused ? 'var(--color-surface-container)' : 'var(--color-surface-container-low)',
                    border: '1px solid transparent',
                    borderRadius: '0.5rem',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px',
                    paddingLeft: icon ? '40px' : '12px',
                    paddingRight: '40px',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...rest}
            >
                {children}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none material-symbols-outlined"
                style={{ color: 'var(--color-outline)', fontSize: '20px' }}>unfold_more</span>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        'Finalizado':     { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', icon: 'check_circle' },
        'En Proceso':     { bg: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)', icon: 'sync' },
        'Revisión':       { bg: 'rgba(219,225,255,0.6)', color: 'var(--color-on-primary-fixed-variant)', icon: 'rate_review' },
        'Campaña Activa': { bg: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', icon: 'campaign' },
        'Grabando':       { bg: 'var(--color-error-container)', color: 'var(--color-on-error-container)', icon: 'videocam' },
        'En Edición':     { bg: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)', icon: 'movie' },
    };
    const s = map[status] || { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'hourglass_empty' };
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-[11px]"
            style={{ background: s.bg, color: s.color }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
            {status || 'Por Hacer'}
        </span>
    );
}

export default function DashboardUI({ metricas, campanas, cargando, periodoSeleccionado, alCambiarPeriodo }) {
    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--color-surface-container-high)', borderTopColor: 'var(--color-primary-container)' }} />
                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>Calculando indicadores y campañas...</p>
            </div>
        );
    }

    const kpis = [
        {
            label: 'Campañas Activas',
            value: metricas.activas ?? 0,
            icon: 'campaign',
            bg: 'rgba(37,99,235,0.08)',
            iconColor: 'var(--color-primary-container)',
            valueColor: 'var(--color-primary-container)',
            sub: `Total en cartera: ${(metricas.activas ?? 0) + 5}`,
            subRight: '74% efectivas',
        },
        {
            label: 'Diseños (Isac)',
            value: metricas.disenosTerminados ?? 0,
            icon: 'palette',
            bg: 'var(--color-secondary-container)',
            iconColor: 'var(--color-on-secondary-container)',
            valueColor: 'var(--color-secondary)',
            tag: 'A tiempo',
            tagBg: 'var(--color-secondary-container)',
            tagColor: 'var(--color-on-secondary-container)',
        },
        {
            label: 'Videos (Sebas / Marco)',
            value: metricas.videosTerminados ?? 0,
            icon: 'movie',
            bg: 'var(--color-tertiary-fixed)',
            iconColor: 'var(--color-on-tertiary-fixed-variant)',
            valueColor: 'var(--color-tertiary)',
            sub: 'Reels / tours producidos',
        },
        {
            label: 'Pautas Ads (Brenda)',
            value: metricas.pautasActivas ?? 0,
            icon: 'ads_click',
            bg: 'var(--color-surface-container-high)',
            iconColor: 'var(--color-on-surface-variant)',
            valueColor: 'var(--color-on-surface)',
            tagLabel: 'Meta & Google',
            tagBg: 'var(--color-primary-fixed)',
            tagColor: 'var(--color-on-primary-fixed-variant)',
        },
    ];

    return (
        <div className="flex flex-col gap-6">

            {/* Welcome / Command Strip */}
            <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 rounded-2xl p-4 sm:p-6 shadow-sm border border-surface-container"
                style={{ background: 'var(--color-surface-container-lowest)' }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <h1 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--color-on-surface)' }}>
                            Hola, Equipo <span className="inline-block animate-bounce">👋</span>
                        </h1>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-[11px]"
                            style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-secondary)' }} />
                            Sistema en línea
                        </span>
                    </div>
                    <p className="font-body-md text-xs sm:text-sm max-w-xl" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Resumen ejecutivo y flujo de avance entre agentes, diseño, video y pauta digital.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl" style={{ background: 'var(--color-surface-container-low)' }}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-primary-container)' }}>calendar_month</span>
                        <StyledSelect value={periodoSeleccionado} onChange={(e) => alCambiarPeriodo(e.target.value)}
                            style={{ height: '36px', fontSize: '13px', border: 'none', background: 'transparent', width: 'auto' }}>
                            <option value="">Todos los periodos</option>
                            <option value="Septiembre 2026">Septiembre 2026</option>
                            <option value="Agosto 2026">Agosto 2026</option>
                        </StyledSelect>
                    </div>
                    <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 font-label-md transition-all active:scale-95"
                        style={{
                            padding: '10px 24px', borderRadius: '0.75rem',
                            background: 'var(--color-primary-container)', color: 'var(--color-on-primary)',
                            border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                        }}
                        onClick={() => window.location.href = '/agente/nuevo'}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary-container)'}>
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Registrar Campaña
                    </button>
                </div>
            </section>

            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label}
                        className="rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border border-surface-container"
                        style={{ background: 'var(--color-surface-container-lowest)' }}>
                        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-xl opacity-40 group-hover:scale-125 transition-transform"
                            style={{ background: kpi.bg }} />
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-label-sm uppercase tracking-wider text-[11px]" style={{ color: 'var(--color-outline)' }}>{kpi.label}</span>
                                    {kpi.tag && (
                                        <span className="px-1.5 py-0.5 rounded-full font-label-sm text-[10px]"
                                            style={{ background: kpi.tagBg, color: kpi.tagColor }}>{kpi.tag}</span>
                                    )}
                                </div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: kpi.bg }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: kpi.iconColor }}>{kpi.icon}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="font-stat-metric" style={{ fontSize: '32px', color: kpi.valueColor }}>{kpi.value}</span>
                                {kpi.tagLabel && (
                                    <span className="font-label-sm text-[11px] px-2 py-0.5 rounded"
                                        style={{ background: kpi.tagBg, color: kpi.tagColor }}>{kpi.tagLabel}</span>
                                )}
                            </div>
                        </div>
                        {kpi.sub && (
                            <p className="mt-4 pt-3 font-body-sm text-[12px]"
                                style={{ color: 'var(--color-outline)', borderTop: '1px solid var(--color-surface-container-low)' }}>
                                {kpi.sub}
                                {kpi.subRight && <strong className="float-right" style={{ color: 'var(--color-primary-container)' }}>{kpi.subRight}</strong>}
                            </p>
                        )}
                    </div>
                ))}
            </section>

            {/* Properties Table */}
            <section className="rounded-2xl shadow-sm overflow-hidden border border-surface-container" style={{ background: 'var(--color-surface-container-lowest)' }}>
                {/* Table header controls */}
                <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}>
                    <div>
                        <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '18px' }}>
                            Propiedades y Flujo de Trabajo
                        </h2>
                        <p className="font-body-sm mt-0.5 text-xs" style={{ color: 'var(--color-outline)' }}>
                            {campanas.length} {campanas.length === 1 ? 'registro activo' : 'registros activos'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-60">
                            <StyledInput icon="search" placeholder="Buscar propiedad..." style={{ width: '100%', height: '38px' }} />
                        </div>
                        <button style={{
                            height: '38px', padding: '0 16px', borderRadius: '0.5rem',
                            background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)',
                            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        }} onClick={() => window.location.href = '/agente/nuevo'} className="shrink-0 active:scale-95 transition-transform">
                            + Nuevo
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[620px]">
                        <thead>
                            <tr style={{ background: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-surface-container-low)' }}>
                                {['Propiedad', 'Agente', 'Diseño (Isac)', 'Video (Sebas)', 'Pauta CM'].map(h => (
                                    <th key={h} className="px-5 py-3 font-label-sm text-[11px] uppercase tracking-wider whitespace-nowrap"
                                        style={{ color: 'var(--color-outline)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {campanas.map((c) => {
                                const diseno = c.tareas_diseno?.[0]?.estado || 'Por Hacer';
                                const video = c.tareas_video?.[0]?.estado || 'Por Hacer';
                                const cm = c.tareas_cm?.[0]?.estado || 'Por Hacer';
                                const agente = c.usuarios?.nombre || 'General';
                                const initials = agente.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                return (
                                    <tr key={c.id_requerimiento}
                                        className="transition-colors cursor-pointer"
                                        style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td className="px-5 py-4">
                                            <p className="font-title-md" style={{ color: 'var(--color-on-surface)', fontSize: '14px' }}>
                                                {c.nombre_propiedad}
                                            </p>
                                            <p className="font-body-sm mt-0.5" style={{ color: 'var(--color-outline)', fontSize: '12px' }}>
                                                {c.ubicacion || c.categoria}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center font-label-sm text-[11px] font-bold flex-shrink-0"
                                                    style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-body-md text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{agente}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={diseno} /></td>
                                        <td className="px-5 py-4"><StatusBadge status={video} /></td>
                                        <td className="px-5 py-4"><StatusBadge status={cm} /></td>
                                    </tr>
                                );
                            })}
                            {campanas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <span className="material-symbols-outlined block mx-auto mb-3" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>inbox</span>
                                        <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>No hay campañas para este periodo.</p>
                                        <button className="mt-4 px-6 py-2 rounded-lg font-label-md font-medium transition-all"
                                            style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary)', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                                            onClick={() => window.location.href = '/agente/nuevo'}>
                                            Registrar primera campaña
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}