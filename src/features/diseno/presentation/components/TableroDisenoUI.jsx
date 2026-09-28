import { useState, useMemo } from 'react';
import LiquidStateSelector from './LiquidStateSelector';
import { SlideConfirm } from "./SlideConfirm";
import "./SlideConfirm.css";

function StyledInput({ icon, ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '18px' }}>{icon}</span>
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

function StyledSelect({ children, ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative w-full">
            <select
                style={{
                    width: '100%', height: '44px',
                    background: focused ? 'var(--color-surface-container)' : 'var(--color-surface-container-low)',
                    border: '1px solid transparent',
                    borderRadius: '0.5rem',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px',
                    padding: '0 40px 0 12px',
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

const ESTADO_PROGRESO = {
    'Por Hacer': 0,
    'En Proceso': 50,
    'Revisión': 75,
    'Finalizado': 100
};

function getStatusStyle(estado) {
    const map = {
        'Finalizado': { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', icon: 'check_circle', bar: '#10b981' },
        'Revisión':    { bg: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5', icon: 'rate_review', bar: '#6366f1' },
        'En Proceso':  { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', icon: 'sync', bar: '#3b82f6' },
        'Por Hacer':   { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'pending', bar: 'var(--color-outline)' },
    };
    return map[estado] || { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'pending', bar: 'var(--color-outline)' };
}

const COLORES_AVATAR = [
    'from-emerald-600 to-teal-600',
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-pink-600 to-rose-600',
    'from-cyan-600 to-blue-600',
];

function obtenerIniciales(nombre) {
    if (!nombre) return 'AG';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function TableroDisenoUI({ tareas = [], cargando, alCambiarCampo, alGuardar }) {
    const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState(null);
    const [vistaModo, setVistaModo] = useState('agentes'); // 'agentes' | 'todos'
    const [busqueda, setBusqueda] = useState('');
    const [tarjetasBloqueadas, setTarjetasBloqueadas] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('bloqueadas_diseno') || '{}');
            } catch (e) {
                return {};
            }
        }
        return {};
    });

    const actualizarBloqueo = (idTarea, bloqueado) => {
        setTarjetasBloqueadas(prev => {
            const nuevo = { ...prev, [idTarea]: bloqueado };
            try {
                localStorage.setItem('bloqueadas_diseno', JSON.stringify(nuevo));
            } catch (e) {}
            return nuevo;
        });
    };

    // Agrupar tareas de diseño por agente
    const agentes = useMemo(() => {
        const mapa = {};

        tareas.forEach((item) => {
            const id = String(item.usuarios?.id_usuario || item.id_agente || 'sin-asignar');
            const nombre = item.usuarios?.nombre || (item.id_agente ? `Agente #${item.id_agente}` : 'General / Sin Agente');

            if (!mapa[id]) {
                const hash = (id + nombre).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const colorGradiente = COLORES_AVATAR[hash % COLORES_AVATAR.length];

                mapa[id] = {
                    id,
                    nombre,
                    iniciales: obtenerIniciales(nombre),
                    colorGradiente,
                    requerimientos: [],
                    enProceso: 0,
                    revision: 0,
                    finalizadas: 0,
                    porHacer: 0,
                };
            }

            mapa[id].requerimientos.push(item);

            const estado = item.tareas_diseno?.[0]?.estado || 'Por Hacer';
            if (estado === 'En Proceso') mapa[id].enProceso++;
            else if (estado === 'Revisión') mapa[id].revision++;
            else if (estado === 'Finalizado') mapa[id].finalizadas++;
            else mapa[id].porHacer++;
        });

        return Object.values(mapa).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [tareas]);

    const agenteActivo = useMemo(() => {
        if (!agenteSeleccionadoId) return null;
        return agentes.find((a) => a.id === agenteSeleccionadoId) || null;
    }, [agentes, agenteSeleccionadoId]);

    const requerimientosAMostrar = useMemo(() => {
        if (agenteActivo) {
            return agenteActivo.requerimientos.filter((item) =>
                item.nombre_propiedad?.toLowerCase().includes(busqueda.toLowerCase())
            );
        }
        return tareas.filter((item) => {
            const coincidePropiedad = item.nombre_propiedad?.toLowerCase().includes(busqueda.toLowerCase());
            const coincideAgente = item.usuarios?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            return coincidePropiedad || coincideAgente;
        });
    }, [agenteActivo, tareas, busqueda]);

    const agentesFiltrados = useMemo(() => {
        if (!busqueda) return agentes;
        const q = busqueda.toLowerCase();
        return agentes.filter(
            (a) =>
                a.nombre.toLowerCase().includes(q) ||
                a.requerimientos.some((r) => r.nombre_propiedad?.toLowerCase().includes(q))
        );
    }, [agentes, busqueda]);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--color-surface-container-high)', borderTopColor: 'var(--color-secondary)' }} />
                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>Cargando tareas de diseño...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <section className="rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                        style={{ background: 'var(--color-secondary-container)' }}>
                        <span className="material-symbols-outlined text-[22px] sm:text-[26px]" style={{ color: 'var(--color-on-secondary-container)' }}>palette</span>
                    </div>
                    <div>
                        <h1 className="font-headline-md font-bold text-lg sm:text-xl" style={{ color: 'var(--color-on-surface)' }}>Tablero de Diseño</h1>
                        <p className="font-body-sm text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                            Supervisión y entrega de artes publicitarios separados por agente inmobiliario
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="px-3 py-1.5 sm:py-2 rounded-xl border text-xs flex items-center gap-2"
                        style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-secondary)' }}>person</span>
                        <span><strong>{agentes.length}</strong> Agentes</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full font-label-sm text-[11px]"
                        style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-secondary)' }} />
                        Isac — Diseñador
                    </div>
                </div>
            </section>

            {/* Barra de Navegación / Menú de Agentes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)' }}>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {agenteActivo ? (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setAgenteSeleccionadoId(null)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shrink-0"
                                style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                            >
                                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                <span>Directorio</span>
                            </button>
                            <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                                <select
                                    value={agenteSeleccionadoId || ''}
                                    onChange={(e) => setAgenteSeleccionadoId(e.target.value || null)}
                                    className="w-full px-3 py-2 pr-8 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none"
                                    style={{
                                        background: 'var(--color-surface-container-low)',
                                        borderColor: 'var(--color-surface-container)',
                                        color: 'var(--color-on-surface)'
                                    }}
                                >
                                    {agentes.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nombre} ({a.requerimientos.length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-0.5 rounded-lg border w-full sm:w-auto"
                            style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container)' }}>
                            <button
                                type="button"
                                onClick={() => { setVistaModo('agentes'); setAgenteSeleccionadoId(null); }}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    vistaModo === 'agentes'
                                        ? 'bg-primary-container text-on-primary shadow-xs'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">group</span>
                                <span>Por Agentes ({agentes.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setVistaModo('todos'); setAgenteSeleccionadoId(null); }}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    vistaModo === 'todos'
                                        ? 'bg-primary-container text-on-primary shadow-xs'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                                <span>Tareas ({tareas.length})</span>
                            </button>
                        </div>
                    )}

                    {agenteActivo && (
                        <div className="relative">
                            <select
                                value={agenteSeleccionadoId || ''}
                                onChange={(e) => setAgenteSeleccionadoId(e.target.value || null)}
                                className="px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none"
                                style={{
                                    background: 'var(--color-surface-container-low)',
                                    borderColor: 'var(--color-surface-container)',
                                    color: 'var(--color-on-surface)'
                                }}
                            >
                                {agentes.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre} ({a.requerimientos.length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Buscador */}
                <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none material-symbols-outlined text-[18px]"
                        style={{ color: 'var(--color-outline)' }}>
                        search
                    </span>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={agenteActivo ? `Buscar en ${agenteActivo.nombre}...` : "Buscar propiedad o agente..."}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                        style={{
                            background: 'var(--color-surface-container-low)',
                            borderColor: 'var(--color-surface-container)',
                            color: 'var(--color-on-surface)'
                        }}
                    />
                </div>
            </div>

            {/* ── VISTA 1: Directorio / Menú de Agentes ── */}
            {!agenteActivo && vistaModo === 'agentes' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-outline)' }}>
                            <span className="material-symbols-outlined text-[16px]">badge</span>
                            Directorio de Agentes ({agentesFiltrados.length})
                        </h2>
                        <span className="text-xs" style={{ color: 'var(--color-outline)' }}>
                            Haz clic en un agente para ver sus tareas de diseño
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {agentesFiltrados.map((agente) => (
                            <div
                                key={agente.id}
                                onClick={() => setAgenteSeleccionadoId(agente.id)}
                                className="rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 border"
                                style={{
                                    background: 'var(--color-surface-container-lowest)',
                                    borderColor: 'var(--color-surface-container)'
                                }}
                            >
                                <div>
                                    <div className="flex items-start gap-3.5 mb-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agente.colorGradiente} text-white flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0`}>
                                            {agente.iniciales}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors truncate"
                                                style={{ color: 'var(--color-on-surface)' }}>
                                                {agente.nombre}
                                            </h3>
                                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-outline)' }}>
                                                <span className="material-symbols-outlined text-[14px]">palette</span>
                                                <span>Artes & Banners</span>
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                                            style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                                            {agente.requerimientos.length} req.
                                        </span>
                                    </div>

                                    {/* Estadísticas de Diseño */}
                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center text-xs mb-3"
                                        style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container-low)' }}>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>En Proceso</span>
                                            <strong className="text-blue-600 font-bold">{agente.enProceso}</strong>
                                        </div>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Revisión</span>
                                            <strong className="text-purple-600 font-bold">{agente.revision}</strong>
                                        </div>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Finalizado</span>
                                            <strong className="text-emerald-600 font-bold">{agente.finalizadas}</strong>
                                        </div>
                                    </div>

                                    {/* Preview de requerimientos */}
                                    <div className="space-y-1 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-outline)' }}>
                                            Propiedades en diseño:
                                        </span>
                                        {agente.requerimientos.slice(0, 3).map((r) => (
                                            <div key={r.id_requerimiento} className="text-xs truncate flex items-center gap-1.5"
                                                style={{ color: 'var(--color-on-surface-variant)' }}>
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-outline)' }}></span>
                                                <span className="truncate">{r.nombre_propiedad}</span>
                                            </div>
                                        ))}
                                        {agente.requerimientos.length > 3 && (
                                            <span className="text-[11px] font-medium block italic" style={{ color: 'var(--color-outline)' }}>
                                                +{agente.requerimientos.length - 3} propiedad(es) más...
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex items-center justify-between text-xs font-semibold group-hover:underline"
                                    style={{ borderColor: 'var(--color-surface-container-low)', color: 'var(--color-primary-container)' }}>
                                    <span>Ingresar a tareas de diseño</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        ))}

                        {agentesFiltrados.length === 0 && (
                            <div className="col-span-3 text-center py-12" style={{ color: 'var(--color-outline)' }}>
                                <span className="material-symbols-outlined text-4xl block mb-2">person_search</span>
                                <p>No se encontraron agentes con ese criterio de búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VISTA 2: Requerimientos del Agente Seleccionado ── */}
            {agenteActivo && (
                <div className="space-y-5">
                    {/* Perfil del Agente */}
                    <div className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                            background: 'linear-gradient(to right, rgba(209, 250, 229, 0.3), var(--color-surface-container-lowest), var(--color-surface-container-lowest))',
                            borderColor: 'var(--color-surface-container)'
                        }}>
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${agenteActivo.colorGradiente} text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl shadow-md shrink-0`}>
                                {agenteActivo.iniciales}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                                        Agente Inmobiliario
                                    </span>
                                    <span className="text-xs truncate" style={{ color: 'var(--color-outline)' }}>• ID: {agenteActivo.id}</span>
                                </div>
                                <h2 className="font-display font-bold text-lg sm:text-xl truncate" style={{ color: 'var(--color-on-surface)' }}>
                                    {agenteActivo.nombre}
                                </h2>
                                <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {agenteActivo.requerimientos.length} requerimientos de diseño gráfico y banners
                                </p>
                            </div>
                        </div>

                        {/* Badges del Agente */}
                        <div className="flex flex-wrap items-center gap-2">
                            {agenteActivo.porHacer > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    {agenteActivo.porHacer} Por Hacer
                                </span>
                            )}
                            {agenteActivo.enProceso > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}>
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    {agenteActivo.enProceso} En Proceso
                                </span>
                            )}
                            {agenteActivo.revision > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'rgba(219,225,255,0.6)', color: 'var(--color-on-primary-fixed-variant)' }}>
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    {agenteActivo.revision} Revisión
                                </span>
                            )}
                            {agenteActivo.finalizadas > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {agenteActivo.finalizadas} Finalizado
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Grid de Tareas de Diseño de este Agente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {requerimientosAMostrar.map((item) => renderTarjetaDiseno(item))}

                        {requerimientosAMostrar.length === 0 && (
                            <div className="col-span-2 text-center py-12 rounded-2xl border"
                                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                <span className="material-symbols-outlined text-4xl block mb-2">palette</span>
                                <p>Este agente no tiene requerimientos de diseño que coincidan con la búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VISTA 3: Todas las Tareas (Modo Global) ── */}
            {!agenteActivo && vistaModo === 'todos' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-outline)' }}>
                            <span className="material-symbols-outlined text-[16px]">palette</span>
                            Todas las Tareas de Diseño ({requerimientosAMostrar.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {requerimientosAMostrar.map((item) => renderTarjetaDiseno(item))}

                        {requerimientosAMostrar.length === 0 && (
                            <div className="col-span-2 text-center py-12 rounded-2xl border"
                                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                <p>No se encontraron tareas de diseño.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );

    function renderTarjetaDiseno(item) {
        const tarea = item.tareas_diseno?.[0] || {};
        const agente = item.usuarios?.nombre || 'Sin agente';
        const s = getStatusStyle(tarea.estado);
        const progreso = ESTADO_PROGRESO[tarea.estado] ?? (tarea.progreso_porcentaje ?? 0);
        const estaBloqueada = Boolean(tarjetasBloqueadas[tarea.id_tarea] ?? (tarea.estado === 'Finalizado'));

        return (
            <div key={tarea.id_tarea || item.id_requerimiento}
                className={`rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md border ${
                    estaBloqueada ? 'ring-1 ring-emerald-500/30' : ''
                }`}
                style={{ 
                    background: estaBloqueada ? 'rgba(16, 185, 129, 0.06)' : 'var(--color-surface-container-lowest)', 
                    borderColor: estaBloqueada ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-surface-container)',
                    boxShadow: estaBloqueada ? '0 4px 20px -2px rgba(16, 185, 129, 0.12)' : 'none'
                }}>

                <div>
                    {/* Card header */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-start justify-between gap-3 border-b"
                        style={{ 
                            background: estaBloqueada ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-container-low)', 
                            borderColor: estaBloqueada ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-surface-container)' 
                        }}>
                        <div className="min-w-0">
                            <h3 className="font-title-md truncate font-semibold" style={{ color: 'var(--color-on-surface)', fontSize: '15px' }}>
                                {item.nombre_propiedad}
                            </h3>
                            <p className="font-body-sm mt-0.5 text-xs" style={{ color: 'var(--color-outline)' }}>
                                Agente: <strong>{agente}</strong> · {item.tipo} · {item.categoria}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {estaBloqueada && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                    Bloqueada
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px] flex-shrink-0 font-medium"
                                style={{ background: s.bg, color: s.color }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
                                {tarea.estado || 'Por Hacer'}
                            </span>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="px-4 sm:px-5 py-3 space-y-1.5 font-body-sm border-b text-xs"
                        style={{ borderColor: 'var(--color-surface-container-low)', background: 'var(--color-surface-container-low)' }}>
                        <p style={{ color: 'var(--color-on-surface-variant)' }}>
                            <span style={{ color: 'var(--color-outline)' }}>Ubicación:</span> {item.ubicacion || 'No especificada'}
                        </p>
                        {item.elemento_destacar && (
                            <p style={{ color: 'var(--color-on-surface-variant)' }}>
                                <span style={{ color: 'var(--color-outline)' }}>Hook:</span> {item.elemento_destacar}
                            </p>
                        )}
                        {item.descripcion_propiedad && (
                            <p className="line-clamp-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                                <span style={{ color: 'var(--color-outline)' }}>Descripción:</span> {item.descripcion_propiedad}
                            </p>
                        )}
                    </div>

                    {/* Progress Bar vinculada al Estado */}
                    <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b" style={{ borderColor: 'var(--color-surface-container-low)' }}>
                        <div className="flex justify-between font-label-sm text-[11px] mb-2">
                            <span style={{ color: 'var(--color-outline)' }}>Avance ({tarea.estado || 'Por Hacer'})</span>
                            <span style={{ color: s.bar || 'var(--color-secondary)', fontWeight: 700 }}>{progreso}%</span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: '7px', background: 'var(--color-surface-container)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%`, background: s.bar || 'var(--color-secondary)' }} />
                        </div>
                    </div>
                </div>

                {/* Controls: Estado y SlideConfirm / Desbloquear */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3"
                    style={{ background: estaBloqueada ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-container-low/20)' }}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="font-label-sm text-xs font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Estado de la Tarea
                            </label>
                            {estaBloqueada ? (
                                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                    Guardado y bloqueado
                                </span>
                            ) : (
                                <span className="text-[10px] text-outline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">touch_app</span>
                                    Arrastra o clica
                                </span>
                            )}
                        </div>
                        <div className={estaBloqueada ? 'pointer-events-none opacity-80' : ''}>
                            <LiquidStateSelector 
                                estadoActual={tarea.estado || 'Por Hacer'}
                                alCambiarEstado={(nuevoEstado) => {
                                    alCambiarCampo(tarea.id_tarea, 'estado', nuevoEstado);
                                    if (nuevoEstado === 'Finalizado') {
                                        actualizarBloqueo(tarea.id_tarea, true);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {estaBloqueada ? (
                        <div className="pt-1 flex flex-col gap-2.5">
                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <span className="material-symbols-outlined text-[17px]">verified</span>
                                <span>Tarea finalizada y bloqueada</span>
                            </div>
                            <div className="flex justify-center">
                                <SlideConfirm
                                    corner={28}
                                    speed={50}
                                    width={280}
                                    text="Desliza para desbloquear"
                                    confirmedText="¡Desbloqueado!"
                                    icon="lock_open"
                                    confirmedIcon="lock_open"
                                    onConfirm={() => {
                                        actualizarBloqueo(tarea.id_tarea, false);
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="pt-1 flex items-center justify-between text-[11px] px-1">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                                Auto-guardado activo
                            </span>
                            <span className="text-[10px] text-outline font-medium">
                                Arrastra o clica para cambiar
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}