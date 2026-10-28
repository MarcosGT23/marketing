import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ModalEditarRequerimiento from './ModalEditarRequerimiento';
import VolumenDemandaUI from './VolumenDemandaUI';
import BotonExportarExcel from '../../../../core/ui/BotonExportarExcel';
import { exportarDashboardExcel } from '../../utils/dashboardExcelMapper';
import {
    ESTADO_ENTREGADO,
    ESTADO_EN_PROCESO,
    ESTADO_SIN_INICIAR,
    ESTADOS_REQUERIMIENTO,
    PRIORIDADES,
    RESPONSABLES_PRODUCCION,
    TIPOS_CONTENIDO,
    obtenerEstadoRequerimiento,
    obtenerTarea,
    obtenerTiposContenido,
    tienePauta,
} from '../../utils/dashboardMetrics';

const ESTILOS_TIPO = {
    arte: { bg: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' },
    carrusel: { bg: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)' },
    reel: { bg: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' },
    historias: { bg: 'rgba(245,158,11,0.16)', color: '#92400e' },
    pauta: { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' },
    diseno_interno: { bg: 'rgba(125,76,231,0.12)', color: 'var(--color-tertiary)' },
};

const ESTILOS_ESTADO = {
    [ESTADO_ENTREGADO]: { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', icon: 'task_alt' },
    [ESTADO_EN_PROCESO]: { bg: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', icon: 'sync' },
    [ESTADO_SIN_INICIAR]: { bg: 'rgba(245,158,11,0.16)', color: '#92400e', icon: 'pending' },
};

const ESTILOS_PRIORIDAD = {
    Alta: { bg: 'var(--color-error-container)', color: 'var(--color-on-error-container)', icon: 'priority_high' },
    Media: { bg: 'rgba(245,158,11,0.16)', color: '#92400e', icon: 'schedule' },
    Baja: { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'low_priority' },
};

const ESTILOS_STATUS = {
    'Finalizado': { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', icon: 'check_circle' },
    'En Proceso': { bg: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)', icon: 'sync' },
    'Revisión': { bg: 'rgba(219,225,255,0.6)', color: 'var(--color-on-primary-fixed-variant)', icon: 'rate_review' },
    'Campaña Activa': { bg: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', icon: 'campaign' },
    'Grabando': { bg: 'var(--color-error-container)', color: 'var(--color-on-error-container)', icon: 'videocam' },
    'En Edición': { bg: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)', icon: 'movie' },
    'Sin Pauta': { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'block' },
};

const LIMITE_TABLA = 10;

const VISTAS = [
    { id: 'resumen', label: 'Resumen general', icon: 'dashboard' },
    { id: 'volumen', label: 'Volumen y demanda', icon: 'bar_chart' },
];

function periodoCorto(periodo) {
    if (!periodo) return '';
    const [mes, ano] = periodo.split(' ');
    return `${(mes || '').slice(0, 3)} ${ano || ''}`.trim();
}

function iniciales(nombre) {
    if (!nombre) return 'AG';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function paginasVisibles(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1);

    const paginas = [1];
    if (actual > 3) paginas.push('...');

    const desde = Math.max(2, actual - 1);
    const hasta = Math.min(total - 1, actual + 1);
    for (let pagina = desde; pagina <= hasta; pagina += 1) paginas.push(pagina);

    if (actual < total - 2) paginas.push('...');
    paginas.push(total);
    return paginas;
}

/* ─── Shared styled select ─── */
function SelectField({ label, icon, children, compact = false, className = '', ...rest }) {
    const [focused, setFocused] = useState(false);

    return (
        <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
            {label && (
                <span className="font-label-sm uppercase tracking-wider text-[10px]" style={{ color: 'var(--color-outline)' }}>
                    {label}
                </span>
            )}
            <div className="relative min-w-0">
                {icon && (
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                        style={{ color: focused ? 'var(--color-primary-container)' : 'var(--color-outline)', fontSize: '18px' }}>
                        {icon}
                    </span>
                )}
                <select
                    {...rest}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full appearance-none cursor-pointer"
                    style={{
                        height: compact ? '38px' : '42px',
                        background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                        border: `1px solid ${focused ? 'var(--color-primary-container)' : 'var(--color-surface-container)'}`,
                        borderRadius: '0.75rem',
                        color: 'var(--color-on-surface)',
                        fontSize: compact ? '12px' : '13px',
                        paddingLeft: icon ? '38px' : '12px',
                        paddingRight: '32px',
                        outline: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                        transition: 'all 0.15s',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontWeight: 500,
                    }}
                >
                    {children}
                </select>
                <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '18px' }}>unfold_more</span>
            </div>
        </label>
    );
}

function AreaStatusBadge({ label, icon, status }) {
    const s = ESTILOS_STATUS[status] || { bg: 'var(--color-surface-container)', color: 'var(--color-outline)' };

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[10px] whitespace-nowrap"
            style={{ background: s.bg, color: s.color }} title={`${label}: ${status}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>{icon}</span>
            <span style={{ opacity: 0.72, fontWeight: 700 }}>{label}</span>
            <span>{status}</span>
        </span>
    );
}

function ProduccionCell({ diseno, video, cm }) {
    const areas = [
        diseno ? { label: 'Diseño', icon: 'palette', status: diseno } : null,
        video ? { label: 'Video', icon: 'movie', status: video } : null,
        cm ? { label: 'Pauta', icon: 'campaign', status: cm } : null,
    ].filter(Boolean);

    if (areas.length === 0) {
        return <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>—</span>;
    }

    return (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
            {areas.map((area) => (
                <AreaStatusBadge key={area.label} {...area} />
            ))}
        </div>
    );
}

function EstadoBadge({ estado }) {
    const s = ESTILOS_ESTADO[estado] || ESTILOS_ESTADO[ESTADO_SIN_INICIAR];
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-[11px] whitespace-nowrap"
            style={{ background: s.bg, color: s.color }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
            {estado}
        </span>
    );
}

function PrioridadBadge({ prioridad = 'Baja' }) {
    const s = ESTILOS_PRIORIDAD[prioridad] || ESTILOS_PRIORIDAD.Baja;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px] whitespace-nowrap"
            style={{ background: s.bg, color: s.color }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
            {prioridad}
        </span>
    );
}

function TiposContenido({ requerimiento }) {
    const tipos = obtenerTiposContenido(requerimiento);

    if (tipos.length === 0) {
        return <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>—</span>;
    }

    return (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
            {tipos.map((id) => {
                const tipo = TIPOS_CONTENIDO.find(t => t.id === id);
                const estilo = ESTILOS_TIPO[id] || ESTILOS_TIPO.arte;
                return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: estilo.bg, color: estilo.color }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>{tipo?.icon || 'label'}</span>
                        {tipo?.label || id}
                    </span>
                );
            })}
        </div>
    );
}

function DeltaChip({ actual, anterior, periodo, invertir = false }) {
    if (anterior === null || anterior === undefined) return null;

    const diff = actual - anterior;

    if (diff === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{ background: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                = vs {periodoCorto(periodo)}
            </span>
        );
    }

    const favorable = invertir ? diff < 0 : diff > 0;
    const color = favorable ? 'var(--color-secondary)' : 'var(--color-error)';
    const bg = favorable ? 'var(--color-secondary-container)' : 'var(--color-error-container)';
    const pct = anterior > 0 ? Math.round((diff / anterior) * 100) : null;

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
            style={{ background: bg, color }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {diff > 0 ? 'trending_up' : 'trending_down'}
            </span>
            {diff > 0 ? '+' : ''}{diff}{pct !== null ? ` (${pct > 0 ? '+' : ''}${pct}%)` : ''}
            <span style={{ color: 'var(--color-outline)', fontWeight: 500 }}>vs {periodoCorto(periodo)}</span>
        </span>
    );
}

function KpiCard({ label, value, description, icon, accent, bg, delta, extra }) {
    return (
        <div className="rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between relative overflow-hidden group"
            style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
                style={{ background: bg }} />
            <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-label-sm uppercase tracking-wider text-[10px] sm:text-[11px]" style={{ color: 'var(--color-outline)' }}>
                            {label}
                        </p>
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                            <span className="font-stat-metric" style={{ fontSize: '34px', lineHeight: 1, color: accent }}>{value}</span>
                            {delta}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '21px', color: accent }}>{icon}</span>
                    </div>
                </div>
                <p className="font-body-sm text-[12px] mt-3 leading-snug" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {description}
                </p>
            </div>
            {extra && (
                <div className="relative z-10 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
                    {extra}
                </div>
            )}
        </div>
    );
}

function ComparisonRow({ label, icon, accent, base, comparacion, periodoBase, periodoComparacion, invertir = false }) {
    const max = Math.max(base, comparacion, 1);
    const diff = base - comparacion;
    const favorable = diff === 0 ? null : (invertir ? diff < 0 : diff > 0);
    const diffColor = diff === 0 ? 'var(--color-outline)' : favorable ? 'var(--color-secondary)' : 'var(--color-error)';
    const pct = comparacion > 0 ? Math.round((diff / comparacion) * 100) : null;

    const filas = [
        { valor: base, periodo: periodoBase, color: accent },
        { valor: comparacion, periodo: periodoComparacion, color: 'var(--color-outline)' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_auto] gap-3 lg:gap-5 items-center p-3 rounded-xl"
            style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-surface-container)' }}>
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-container-lowest)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: accent }}>{icon}</span>
                </div>
                <span className="font-title-md text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{label}</span>
            </div>

            <div className="space-y-1.5 min-w-0">
                {filas.map((fila) => (
                    <div key={fila.periodo} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-[10px] font-semibold uppercase" style={{ color: 'var(--color-outline)' }}>
                            {periodoCorto(fila.periodo)}
                        </span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container-high)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${(fila.valor / max) * 100}%`, background: fila.color }} />
                        </div>
                        <strong className="w-8 text-right text-[12px]" style={{ color: 'var(--color-on-surface)' }}>{fila.valor}</strong>
                    </div>
                ))}
            </div>

            <div className="flex lg:flex-col items-center lg:items-end justify-between gap-0.5">
                <span className="font-display font-bold text-lg" style={{ color: diffColor }}>{diff > 0 ? '+' : ''}{diff}</span>
                <span className="text-[10px] font-semibold" style={{ color: diffColor }}>
                    {pct === null ? (diff === 0 ? 'sin cambios' : 'sin base') : `${pct > 0 ? '+' : ''}${pct}%`}
                </span>
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className="rounded-lg px-2 py-1.5" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <span className="block text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{label}</span>
            <strong className="block text-[14px]" style={{ color: color || 'var(--color-on-surface)' }}>{value}</strong>
        </div>
    );
}

export default function DashboardUI({
    metricas,
    metricasComparacion,
    resumenPeriodos = [],
    requerimientosPeriodo = [],
    requerimientosFiltrados = [],
    periodos = [],
    cargando,
    periodoSeleccionado,
    periodoComparacion,
    alCambiarPeriodo,
    alCambiarComparacion,
    filtros = {},
    opcionesAgentes = [],
    alCambiarFiltro,
    alLimpiarFiltros,
    alActualizar,
}) {
    const [requerimientoAEditar, setRequerimientoAEditar] = useState(null);
    const [vistaActiva, setVistaActiva] = useState('resumen');
    const reducirMovimiento = useReducedMotion();
    const [paginaActual, setPaginaActual] = useState(1);
    const totalPaginas = Math.max(1, Math.ceil(requerimientosPeriodo.length / LIMITE_TABLA));

    useEffect(() => {
        setPaginaActual(1);
    }, [periodoSeleccionado, filtros.agente, filtros.tipo, filtros.responsable, filtros.estado, filtros.prioridad]);

    useEffect(() => {
        if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
    }, [paginaActual, totalPaginas]);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--color-surface-container-high)', borderTopColor: 'var(--color-primary-container)' }} />
                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>Calculando indicadores del período...</p>
            </div>
        );
    }

    const comparando = Boolean(periodoComparacion && metricasComparacion);
    const filtrosActivos = Object.values(filtros).filter(Boolean).length;
    const pctEntregados = metricas.total > 0 ? Math.round((metricas.entregados / metricas.total) * 100) : 0;
    const promedioPorAgente = metricas.agentesActivos > 0
        ? Math.round((metricas.total / metricas.agentesActivos) * 10) / 10
        : 0;

    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const indiceInicial = (paginaSegura - 1) * LIMITE_TABLA;
    const propiedadesPagina = requerimientosPeriodo.slice(indiceInicial, indiceInicial + LIMITE_TABLA);
    const rangoDesde = requerimientosPeriodo.length === 0 ? 0 : indiceInicial + 1;
    const rangoHasta = Math.min(indiceInicial + LIMITE_TABLA, requerimientosPeriodo.length);
    const paginas = paginasVisibles(paginaSegura, totalPaginas);

    const irAPagina = (pagina) => {
        const destino = Math.min(Math.max(pagina, 1), totalPaginas);
        setPaginaActual(destino);
        document.getElementById('tabla-propiedades')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleExportarExcel = async () => {
        await exportarDashboardExcel({
            metricas,
            requerimientos: requerimientosPeriodo,
            periodo: periodoSeleccionado
        });
    };

    const kpis = [
        {
            key: 'total',
            label: 'Total de requerimientos',
            value: metricas.total,
            description: `Solicitudes recibidas en ${periodoSeleccionado || 'el período'}.`,
            icon: 'assignment',
            accent: 'var(--color-primary-container)',
            bg: 'rgba(37,99,235,0.10)',
            delta: comparando ? (
                <DeltaChip actual={metricas.total} anterior={metricasComparacion.total} periodo={periodoComparacion} />
            ) : null,
            extra: (
                <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--color-outline)' }}>
                    <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary-container)' }}>campaign</span>
                        {metricas.activas} campañas activas
                    </span>
                    <span>{pctEntregados}% entregado</span>
                </div>
            ),
        },
        {
            key: 'pendientes',
            label: 'Pendientes',
            value: metricas.pendientes,
            description: 'Solicitudes que todavía no se han completado.',
            icon: 'pending_actions',
            accent: '#b45309',
            bg: 'rgba(245,158,11,0.14)',
            delta: comparando ? (
                <DeltaChip actual={metricas.pendientes} anterior={metricasComparacion.pendientes} periodo={periodoComparacion} invertir />
            ) : null,
            extra: (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                        {metricas.sinIniciar} sin iniciar
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                        {metricas.enProceso} en proceso
                    </span>
                </div>
            ),
        },
        {
            key: 'entregados',
            label: 'Entregados',
            value: metricas.entregados,
            description: 'Requerimientos finalizados y entregados al agente.',
            icon: 'task_alt',
            accent: 'var(--color-secondary)',
            bg: 'var(--color-secondary-container)',
            delta: comparando ? (
                <DeltaChip actual={metricas.entregados} anterior={metricasComparacion.entregados} periodo={periodoComparacion} />
            ) : null,
            extra: (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--color-outline)' }}>
                        <span>Tasa de entrega</span>
                        <strong style={{ color: 'var(--color-secondary)' }}>{pctEntregados}%</strong>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container-high)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pctEntregados}%`, background: 'var(--color-secondary)' }} />
                    </div>
                </div>
            ),
        },
        {
            key: 'agentes',
            label: 'Agentes activos',
            value: metricas.agentesActivos,
            description: 'Agentes que realizaron solicitudes en el período.',
            icon: 'groups',
            accent: 'var(--color-tertiary)',
            bg: 'var(--color-tertiary-fixed)',
            delta: comparando ? (
                <DeltaChip actual={metricas.agentesActivos} anterior={metricasComparacion.agentesActivos} periodo={periodoComparacion} />
            ) : null,
            extra: (
                <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                    {promedioPorAgente > 0
                        ? `${promedioPorAgente} solicitudes por agente en promedio`
                        : 'Sin solicitudes de agentes en el período'}
                </p>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">

            {/* Welcome / Command Strip */}
            <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5 rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-tertiary-container))' }}></div>
                <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <h1 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--color-on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Hola, Equipo <span className="inline-block animate-bounce">👋</span>
                        </h1>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-[11px]"
                            style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-secondary)' }} />
                            Sistema en línea
                        </span>
                    </div>
                    <p className="font-body-md text-xs sm:text-sm max-w-xl" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {vistaActiva === 'resumen'
                            ? 'Indicadores de solicitudes, entregas y producción por período, con comparativo mensual.'
                            : 'Volumen de trabajo que ingresa a la agencia y su distribución por tipo, agente y área.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-2.5 sm:gap-3 w-full lg:w-auto relative z-10">
                    <SelectField label="Período base" icon="calendar_month" compact
                        value={periodoSeleccionado} onChange={(e) => alCambiarPeriodo(e.target.value)}
                        className="w-full sm:w-[180px]">
                        {periodos.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                        {periodos.length === 0 && <option value="">Sin períodos</option>}
                    </SelectField>

                    {vistaActiva === 'resumen' && (
                        <SelectField label="Comparar con" icon="compare_arrows" compact
                            value={periodoComparacion} onChange={(e) => alCambiarComparacion(e.target.value)}
                            className="w-full sm:w-[180px]">
                            <option value="">Sin comparación</option>
                            {periodos.filter(p => p !== periodoSeleccionado).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </SelectField>
                    )}

                    <BotonExportarExcel
                        alExportar={handleExportarExcel}
                        etiqueta="Exportar Resumen"
                        colorTema="neutral"
                    />

                    <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 font-label-md transition-all active:scale-95"
                        style={{
                            height: '38px', padding: '0 20px', borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-primary))',
                            color: 'var(--color-on-primary)',
                            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
                        }}
                        onClick={() => window.location.href = '/agente/nuevo'}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.3)'}>
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Registrar Campaña
                    </button>
                </div>
            </section>

            {/* Pestañas del dashboard */}
            <nav className="rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto"
                style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}
                aria-label="Secciones del dashboard">
                {VISTAS.map((vista) => {
                    const activa = vistaActiva === vista.id;
                    return (
                        <button
                            key={vista.id}
                            type="button"
                            onClick={() => setVistaActiva(vista.id)}
                            aria-current={activa ? 'page' : undefined}
                            className="relative flex items-center px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0"
                            style={{
                                color: activa ? 'var(--color-primary-container)' : 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                                background: 'transparent',
                                border: '1px solid transparent',
                            }}>
                            {activa && (
                                <motion.span
                                    layoutId="dashboard-tab-pill"
                                    aria-hidden="true"
                                    className="absolute inset-0 rounded-xl"
                                    transition={reducirMovimiento ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
                                    style={{
                                        background: 'var(--color-surface-container-lowest)',
                                        border: '1px solid var(--color-outline-variant)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{vista.icon}</span>
                                {vista.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Filtros generales */}
            <section className="rounded-2xl p-4 sm:p-5"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-fixed)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: 'var(--color-on-primary-fixed-variant)' }}>filter_alt</span>
                        </div>
                        <div>
                            <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '16px' }}>
                                Filtros generales
                            </h2>
                            <p className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>
                                Se aplican a los indicadores, al comparativo y a la tabla.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {filtrosActivos > 0 && (
                            <span className="px-2.5 py-1 rounded-full font-label-sm text-[10px]"
                                style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                                {filtrosActivos} {filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={alLimpiarFiltros}
                            disabled={filtrosActivos === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                                background: filtrosActivos > 0 ? 'var(--color-surface-container)' : 'transparent',
                                color: filtrosActivos > 0 ? 'var(--color-on-surface)' : 'var(--color-outline)',
                                border: `1px solid ${filtrosActivos > 0 ? 'var(--color-outline-variant)' : 'transparent'}`,
                                cursor: filtrosActivos > 0 ? 'pointer' : 'default',
                                opacity: filtrosActivos > 0 ? 1 : 0.6,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>filter_alt_off</span>
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <SelectField label="Agente" icon="person"
                        value={filtros.agente || ''} onChange={(e) => alCambiarFiltro('agente', e.target.value)}>
                        <option value="">Todos los agentes</option>
                        {opcionesAgentes.map(agente => (
                            <option key={agente.id} value={agente.id}>{agente.nombre}</option>
                        ))}
                    </SelectField>

                    <SelectField label="Tipo de contenido" icon="category"
                        value={filtros.tipo || ''} onChange={(e) => alCambiarFiltro('tipo', e.target.value)}>
                        <option value="">Todos los tipos</option>
                        {TIPOS_CONTENIDO.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                        ))}
                    </SelectField>

                    <SelectField label="Responsable de producción" icon="engineering"
                        value={filtros.responsable || ''} onChange={(e) => alCambiarFiltro('responsable', e.target.value)}>
                        <option value="">Todos los responsables</option>
                        {RESPONSABLES_PRODUCCION.map(responsable => (
                            <option key={responsable.id} value={responsable.id}>{responsable.label}</option>
                        ))}
                    </SelectField>

                    <SelectField label="Estado" icon="flag"
                        value={filtros.estado || ''} onChange={(e) => alCambiarFiltro('estado', e.target.value)}>
                        <option value="">Todos los estados</option>
                        {ESTADOS_REQUERIMIENTO.map(estado => (
                            <option key={estado.id} value={estado.id}>{estado.label}</option>
                        ))}
                    </SelectField>

                    <SelectField label="Prioridad" icon="priority_high"
                        value={filtros.prioridad || ''} onChange={(e) => alCambiarFiltro('prioridad', e.target.value)}>
                        <option value="">Todas las prioridades</option>
                        {PRIORIDADES.map(prioridad => (
                            <option key={prioridad} value={prioridad}>{prioridad}</option>
                        ))}
                    </SelectField>
                </div>
            </section>

            <div key={vistaActiva} className="tab-panel flex flex-col gap-6">
            {vistaActiva === 'resumen' && (
                <>
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {kpis.map(({ key, ...kpi }) => (
                    <KpiCard key={key} {...kpi} />
                ))}
            </section>

            {/* Comparativo mensual */}
            <section className="rounded-2xl p-4 sm:p-5"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-tertiary-fixed)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: 'var(--color-tertiary)' }}>compare_arrows</span>
                        </div>
                        <div>
                            <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '16px' }}>
                                Comparativo mensual
                            </h2>
                            <p className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>
                                {comparando
                                    ? `${periodoSeleccionado} vs ${periodoComparacion} · con los filtros aplicados`
                                    : 'Selecciona un segundo período para medir la variación de cada indicador.'}
                            </p>
                        </div>
                    </div>

                    {comparando && (
                        <span className="px-2.5 py-1 rounded-full font-label-sm text-[10px] w-fit"
                            style={{ background: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)' }}>
                            Variación vs {periodoCorto(periodoComparacion)}
                        </span>
                    )}
                </div>

                {comparando ? (
                    <div className="space-y-2.5">
                        <ComparisonRow label="Total de requerimientos" icon="assignment" accent="var(--color-primary-container)"
                            base={metricas.total} comparacion={metricasComparacion.total}
                            periodoBase={periodoSeleccionado} periodoComparacion={periodoComparacion} />
                        <ComparisonRow label="Pendientes" icon="pending_actions" accent="#b45309" invertir
                            base={metricas.pendientes} comparacion={metricasComparacion.pendientes}
                            periodoBase={periodoSeleccionado} periodoComparacion={periodoComparacion} />
                        <ComparisonRow label="Entregados" icon="task_alt" accent="var(--color-secondary)"
                            base={metricas.entregados} comparacion={metricasComparacion.entregados}
                            periodoBase={periodoSeleccionado} periodoComparacion={periodoComparacion} />
                        <ComparisonRow label="Agentes activos" icon="groups" accent="var(--color-tertiary)"
                            base={metricas.agentesActivos} comparacion={metricasComparacion.agentesActivos}
                            periodoBase={periodoSeleccionado} periodoComparacion={periodoComparacion} />
                    </div>
                ) : (
                    <div className="rounded-xl p-6 flex flex-col items-center text-center gap-3"
                        style={{ background: 'var(--color-surface-container-low)', border: '1px dashed var(--color-outline-variant)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '34px', color: 'var(--color-outline)' }}>compare_arrows</span>
                        <div>
                            <p className="font-title-md text-[14px]" style={{ color: 'var(--color-on-surface)' }}>
                                Aún no hay un período de comparación
                            </p>
                            <p className="font-body-sm text-[12px] mt-1" style={{ color: 'var(--color-outline)' }}>
                                Elige otro mes en “Comparar con” o desde el resumen por período.
                            </p>
                        </div>
                        {periodos.filter(p => p !== periodoSeleccionado).length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {periodos.filter(p => p !== periodoSeleccionado).slice(0, 4).map(p => (
                                    <button key={p} type="button" onClick={() => alCambiarComparacion(p)}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                                        style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', border: 'none', cursor: 'pointer' }}>
                                        Comparar con {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Resumen por período */}
            <section className="rounded-2xl p-4 sm:p-5"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '16px' }}>
                            Resumen por período
                        </h2>
                        <p className="font-body-sm mt-0.5 text-[11px]" style={{ color: 'var(--color-outline)' }}>
                            Elige el período base o el de comparación. Los filtros se aplican a todos los meses.
                        </p>
                    </div>
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: '22px', color: 'var(--color-primary-container)' }}>calendar_month</span>
                </div>

                {resumenPeriodos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {resumenPeriodos.map((item) => {
                            const esBase = item.periodo === periodoSeleccionado;
                            const esComparacion = item.periodo === periodoComparacion;

                            return (
                                <div key={item.periodo} className="rounded-xl p-3.5 transition-all"
                                    style={{
                                        background: esBase
                                            ? 'var(--color-primary-fixed)'
                                            : esComparacion
                                                ? 'var(--color-tertiary-fixed)'
                                                : 'var(--color-surface-container-low)',
                                        border: `1px solid ${esBase
                                            ? 'var(--color-primary-container)'
                                            : esComparacion
                                                ? 'var(--color-tertiary)'
                                                : 'var(--color-outline-variant)'}`,
                                    }}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-title-md font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                                            {item.periodo}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {esBase && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"
                                                    style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary)' }}>
                                                    Base
                                                </span>
                                            )}
                                            {esComparacion && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"
                                                    style={{ background: 'var(--color-tertiary)', color: 'var(--color-on-tertiary)' }}>
                                                    Comparación
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <MiniStat label="Total" value={item.total} color="var(--color-primary-container)" />
                                        <MiniStat label="Entregados" value={item.entregados} color="var(--color-secondary)" />
                                        <MiniStat label="Pendientes" value={item.pendientes} color="#b45309" />
                                        <MiniStat label="Agentes" value={item.agentesActivos} color="var(--color-tertiary)" />
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <button type="button" disabled={esBase} onClick={() => alCambiarPeriodo(item.periodo)}
                                            className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                                            style={{
                                                background: esBase ? 'var(--color-primary-container)' : 'var(--color-surface-container-lowest)',
                                                color: esBase ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                                                border: `1px solid ${esBase ? 'var(--color-primary-container)' : 'var(--color-outline-variant)'}`,
                                                cursor: esBase ? 'default' : 'pointer',
                                            }}>
                                            {esBase ? 'Período base' : 'Ver período'}
                                        </button>
                                        <button type="button" disabled={esBase || esComparacion} onClick={() => alCambiarComparacion(item.periodo)}
                                            className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                                            style={{
                                                background: esComparacion ? 'var(--color-tertiary-container)' : 'var(--color-surface-container-lowest)',
                                                color: esComparacion ? 'var(--color-on-tertiary)' : 'var(--color-on-surface-variant)',
                                                border: `1px solid ${esComparacion ? 'var(--color-tertiary)' : 'var(--color-outline-variant)'}`,
                                                opacity: esBase ? 0.5 : 1,
                                                cursor: esBase || esComparacion ? 'default' : 'pointer',
                                            }}>
                                            {esComparacion ? 'Comparando' : 'Comparar'}
                                        </button>
                                    </div>

                                    <p className="font-body-sm mt-2 text-[10px]" style={{ color: 'var(--color-outline)' }}>
                                        {item.activas} {item.activas === 1 ? 'campaña activa' : 'campañas activas'} de {item.total}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-surface-container-low)' }}>
                        <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '36px', color: 'var(--color-outline)' }}>event_busy</span>
                        <p className="font-body-md text-[13px]" style={{ color: 'var(--color-outline)' }}>
                            No hay períodos con requerimientos registrados.
                        </p>
                    </div>
                )}
            </section>

            {/* Properties Table */}
            <section id="tabla-propiedades" className="rounded-2xl overflow-hidden scroll-mt-4" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}>
                    <div>
                        <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '18px' }}>
                            Propiedades y Flujo de Trabajo
                        </h2>
                        <p className="font-body-sm mt-0.5 text-xs" style={{ color: 'var(--color-outline)' }}>
                            {requerimientosPeriodo.length === 0
                                ? `Sin registros en ${periodoSeleccionado || 'el período'}`
                                : `Mostrando ${rangoDesde}–${rangoHasta} de ${requerimientosPeriodo.length} ${requerimientosPeriodo.length === 1 ? 'registro' : 'registros'} en ${periodoSeleccionado || 'el período'}`}
                            {' · '}{metricas.entregados} entregados · {metricas.pendientes} pendientes
                            {filtrosActivos > 0 ? ` · ${filtrosActivos} ${filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                            href="/agente/requerimientos"
                            className="h-[38px] px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shrink-0"
                            title="Ver listado completo y editar requerimientos"
                        >
                            <span className="material-symbols-outlined text-[17px] text-primary-container">fact_check</span>
                            <span>Ver todos los requerimientos</span>
                        </a>
                        <button style={{
                            height: '38px', padding: '0 16px', borderRadius: '0.5rem',
                            background: 'var(--color-primary-container)', color: 'var(--color-on-primary)',
                            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        }} onClick={() => window.location.href = '/agente/nuevo'} className="shrink-0 active:scale-95 transition-transform">
                            + Nuevo
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1040px]">
                        <thead>
                            <tr style={{ background: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-surface-container-low)' }}>
                                {['Propiedad', 'Agente', 'Contenido', 'Prioridad', 'Estado', 'Producción', 'Acción'].map(h => (
                                    <th key={h} className="px-5 py-3 font-label-sm text-[11px] uppercase tracking-wider whitespace-nowrap"
                                        style={{ color: 'var(--color-outline)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {propiedadesPagina.map((c) => {
                                const diseno = obtenerTarea(c.tareas_diseno)?.estado || null;
                                const video = obtenerTarea(c.tareas_video)?.estado || null;
                                const cm = tienePauta(c) ? (obtenerTarea(c.tareas_cm)?.estado || 'Por Hacer') : null;
                                const agente = c.usuarios?.nombre || (c.id_agente ? `Agente #${c.id_agente}` : 'Sin agente');
                                const estado = obtenerEstadoRequerimiento(c);

                                return (
                                    <tr key={c.id_requerimiento}
                                        className="transition-colors cursor-pointer group"
                                        style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => setRequerimientoAEditar(c)}>
                                        <td className="px-5 py-4">
                                            <p className="font-title-md font-semibold" style={{ color: 'var(--color-on-surface)', fontSize: '14px' }}>
                                                {c.nombre_propiedad}
                                            </p>
                                            <p className="font-body-sm mt-0.5" style={{ color: 'var(--color-outline)', fontSize: '12px' }}>
                                                {c.ubicacion || c.categoria}
                                                {c.periodo_mensual ? ` · ${c.periodo_mensual}` : ''}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center font-label-sm text-[11px] font-bold flex-shrink-0"
                                                    style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                                                    {iniciales(agente)}
                                                </div>
                                                <p className="font-body-md text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{agente}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4"><TiposContenido requerimiento={c} /></td>
                                        <td className="px-5 py-4"><PrioridadBadge prioridad={c.prioridad || 'Baja'} /></td>
                                        <td className="px-5 py-4"><EstadoBadge estado={estado} /></td>
                                        <td className="px-5 py-4"><ProduccionCell diseno={diseno} video={video} cm={cm} /></td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRequerimientoAEditar(c);
                                                }}
                                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container hover:bg-primary-container hover:text-white transition-all flex items-center gap-1 shadow-2xs"
                                                title="Editar requerimiento completo"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                                <span>Editar</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {requerimientosPeriodo.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <span className="material-symbols-outlined block mx-auto mb-3" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>inbox</span>
                                        {filtrosActivos > 0 ? (
                                            <>
                                                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>
                                                    No hay requerimientos en {periodoSeleccionado || 'este período'} que coincidan con los filtros.
                                                </p>
                                                <button className="mt-4 px-6 py-2 rounded-lg font-label-md font-medium transition-all"
                                                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)', cursor: 'pointer', fontSize: '14px' }}
                                                    onClick={alLimpiarFiltros}>
                                                    Limpiar filtros
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>
                                                    No hay requerimientos registrados para {periodoSeleccionado || 'este período'}.
                                                </p>
                                                <button className="mt-4 px-6 py-2 rounded-lg font-label-md font-medium transition-all"
                                                    style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary)', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                                                    onClick={() => window.location.href = '/agente/nuevo'}>
                                                    Registrar primera campaña
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {requerimientosPeriodo.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3"
                        style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
                        <p className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>
                            Página <strong style={{ color: 'var(--color-on-surface)' }}>{paginaSegura}</strong> de <strong style={{ color: 'var(--color-on-surface)' }}>{totalPaginas}</strong>
                            {' · '}{rangoDesde}–{rangoHasta} de {requerimientosPeriodo.length} {requerimientosPeriodo.length === 1 ? 'propiedad' : 'propiedades'}
                        </p>

                        {totalPaginas > 1 && (
                            <nav className="flex items-center gap-1" aria-label="Paginación de propiedades">
                                <button
                                    type="button"
                                    onClick={() => irAPagina(paginaSegura - 1)}
                                    disabled={paginaSegura === 1}
                                    aria-label="Página anterior"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                                    style={{
                                        background: 'var(--color-surface-container-low)',
                                        border: '1px solid var(--color-surface-container)',
                                        color: 'var(--color-on-surface)',
                                        cursor: paginaSegura === 1 ? 'not-allowed' : 'pointer',
                                    }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                                </button>

                                <span className="sm:hidden px-2 text-[12px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    {paginaSegura} / {totalPaginas}
                                </span>

                                <div className="hidden sm:flex items-center gap-1">
                                    {paginas.map((pagina, indice) => pagina === '...' ? (
                                        <span key={`separador-${indice}`} className="w-7 text-center text-[11px]" style={{ color: 'var(--color-outline)' }}>…</span>
                                    ) : (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() => irAPagina(pagina)}
                                            aria-current={pagina === paginaSegura ? 'page' : undefined}
                                            className="w-8 h-8 rounded-lg text-[12px] font-bold transition-all"
                                            style={{
                                                background: pagina === paginaSegura ? 'var(--color-primary-container)' : 'var(--color-surface-container-low)',
                                                color: pagina === paginaSegura ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                                                border: `1px solid ${pagina === paginaSegura ? 'var(--color-primary-container)' : 'var(--color-surface-container)'}`,
                                                cursor: 'pointer',
                                            }}>
                                            {pagina}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => irAPagina(paginaSegura + 1)}
                                    disabled={paginaSegura === totalPaginas}
                                    aria-label="Página siguiente"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                                    style={{
                                        background: 'var(--color-surface-container-low)',
                                        border: '1px solid var(--color-surface-container)',
                                        color: 'var(--color-on-surface)',
                                        cursor: paginaSegura === totalPaginas ? 'not-allowed' : 'pointer',
                                    }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>
                            </nav>
                        )}
                    </div>
                )}
            </section>
                </>
            )}

            {/* Dashboard de volumen y demanda */}
            {vistaActiva === 'volumen' && (
                <VolumenDemandaUI
                    requerimientosPeriodo={requerimientosPeriodo}
                    requerimientosFiltrados={requerimientosFiltrados}
                    periodos={periodos}
                    periodoSeleccionado={periodoSeleccionado}
                    metricas={metricas}
                />
            )}
            </div>

            {/* Modal para Modificar Requerimiento Completo */}
            <ModalEditarRequerimiento
                abierto={Boolean(requerimientoAEditar)}
                requerimiento={requerimientoAEditar}
                panel="general"
                alCerrar={() => setRequerimientoAEditar(null)}
                alGuardarExitoso={() => {
                    setRequerimientoAEditar(null);
                    if (alActualizar) alActualizar();
                }}
            />
        </div>
    );
}
