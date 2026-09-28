import { useState, useMemo } from 'react';
import { SlideConfirm } from '../../../diseno/presentation/components/SlideConfirm';
import '../../../diseno/presentation/components/SlideConfirm.css';
import { ChecklistRequerimientos } from './ChecklistRequerimientos';

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

/* Checkbox card — same style as form page */
function CheckCard({ icon, iconColor, label, checked, onChange }) {
    return (
        <label className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer select-none transition-all"
            style={{
                background: checked ? 'rgba(219,225,255,0.4)' : 'var(--color-surface-container-low)',
                boxShadow: checked ? '0 0 0 2px var(--color-primary-container)' : '0 0 0 1px transparent',
            }}>
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: iconColor }}>{icon}</span>
            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: checked ? 'var(--color-primary-container)' : 'var(--color-surface-container-high)' }}>
                <svg viewBox="0 0 12 12" fill="none" style={{ width: '10px', height: '10px', opacity: checked ? 1 : 0 }}>
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="font-label-md text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{label}</span>
        </label>
    );
}

function getStatusStyle(estado) {
    const map = {
        'Finalizado': { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', icon: 'check_circle' },
        'Grabando':   { bg: 'var(--color-error-container)', color: 'var(--color-on-error-container)', icon: 'videocam' },
        'En Edición': { bg: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)', icon: 'movie_edit' },
    };
    return map[estado] || { bg: 'var(--color-surface-container)', color: 'var(--color-outline)', icon: 'hourglass_empty' };
}

const AV_CHECKS = [
    { key: 'req_guion',    icon: 'description', color: 'var(--color-primary)', label: 'Guion' },
    { key: 'req_fotos',    icon: 'photo_camera', color: 'var(--color-secondary)', label: 'Fotos' },
    { key: 'req_grabacion',icon: 'videocam',     color: 'var(--color-tertiary)', label: 'Grabación' },
    { key: 'req_edicion',  icon: 'movie_edit',   color: 'var(--color-primary-container)', label: 'Edición' },
    { key: 'req_voz_off',  icon: 'mic',          color: 'var(--color-outline)', label: 'Voz en Off' },
];

const COLORES_AVATAR = [
    'from-rose-600 to-red-600',
    'from-amber-500 to-orange-600',
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-purple-600 to-violet-600',
    'from-cyan-600 to-blue-600',
];

function obtenerIniciales(nombre) {
    if (!nombre) return 'AG';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function PanelVideoUI({ tareas = [], cargando, alCambiarCheck, alCambiarCampo, alGuardar }) {
    const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState(null);
    const [vistaModo, setVistaModo] = useState('agentes'); // 'agentes' | 'todos'
    const [busqueda, setBusqueda] = useState('');
    const [tarjetasBloqueadas, setTarjetasBloqueadas] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('bloqueadas_video') || '{}');
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
                localStorage.setItem('bloqueadas_video', JSON.stringify(nuevo));
            } catch (e) {}
            return nuevo;
        });
    };

    // Agrupar requerimientos por agente
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
                    grabando: 0,
                    enEdicion: 0,
                    finalizadas: 0,
                    porHacer: 0,
                };
            }

            mapa[id].requerimientos.push(item);

            const estado = item.tareas_video?.[0]?.estado || 'Por Hacer';
            if (estado === 'Grabando') mapa[id].grabando++;
            else if (estado === 'En Edición') mapa[id].enEdicion++;
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
                    style={{ borderColor: 'var(--color-surface-container-high)', borderTopColor: 'var(--color-tertiary)' }} />
                <p className="font-body-md" style={{ color: 'var(--color-outline)' }}>Cargando producciones audiovisuales...</p>
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
                        style={{ background: 'var(--color-tertiary-fixed)' }}>
                        <span className="material-symbols-outlined text-[22px] sm:text-[26px]" style={{ color: 'var(--color-on-tertiary-fixed-variant)' }}>movie</span>
                    </div>
                    <div>
                        <h1 className="font-headline-md font-bold text-lg sm:text-xl" style={{ color: 'var(--color-on-surface)' }}>Panel Audiovisual</h1>
                        <p className="font-body-sm text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                            Planificación de rodaje, edición y locución separada por agente inmobiliario
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="px-3 py-1.5 sm:py-2 rounded-xl border text-xs flex items-center gap-2"
                        style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-tertiary)' }}>person</span>
                        <span><strong>{agentes.length}</strong> Agentes</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full font-label-sm text-[11px]"
                        style={{ background: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-tertiary)' }} />
                        Sebas & Marco — Video
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
                                <span>Producciones ({tareas.length})</span>
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
                            Haz clic en un agente para ver sus requerimientos de video
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
                                                <span className="material-symbols-outlined text-[14px]">videocam</span>
                                                <span>Producciones Asignadas</span>
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                                            style={{ background: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)' }}>
                                            {agente.requerimientos.length} req.
                                        </span>
                                    </div>

                                    {/* Estadísticas de Video */}
                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center text-xs mb-3"
                                        style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container-low)' }}>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Rodaje</span>
                                            <strong className="text-red-600 font-bold">{agente.grabando}</strong>
                                        </div>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Edición</span>
                                            <strong className="text-indigo-600 font-bold">{agente.enEdicion}</strong>
                                        </div>
                                        <div>
                                            <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Finalizado</span>
                                            <strong className="text-emerald-600 font-bold">{agente.finalizadas}</strong>
                                        </div>
                                    </div>

                                    {/* Preview de requerimientos */}
                                    <div className="space-y-1 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-outline)' }}>
                                            Propiedades en video:
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
                                    <span>Ingresar a producciones</span>
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
                            background: 'linear-gradient(to right, rgba(254, 215, 226, 0.3), var(--color-surface-container-lowest), var(--color-surface-container-lowest))',
                            borderColor: 'var(--color-surface-container)'
                        }}>
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${agenteActivo.colorGradiente} text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl shadow-md shrink-0`}>
                                {agenteActivo.iniciales}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-tertiary)' }}>
                                        Agente Inmobiliario
                                    </span>
                                    <span className="text-xs truncate" style={{ color: 'var(--color-outline)' }}>• ID: {agenteActivo.id}</span>
                                </div>
                                <h2 className="font-display font-bold text-lg sm:text-xl truncate" style={{ color: 'var(--color-on-surface)' }}>
                                    {agenteActivo.nombre}
                                </h2>
                                <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {agenteActivo.requerimientos.length} producciones audiovisuales asignadas
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
                            {agenteActivo.grabando > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    {agenteActivo.grabando} Rodaje
                                </span>
                            )}
                            {agenteActivo.enEdicion > 0 && (
                                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{ background: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)' }}>
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    {agenteActivo.enEdicion} Edición
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

                    {/* Grid de Producciones de este Agente */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {requerimientosAMostrar.map((item) => renderTarjetaVideo(item))}

                        {requerimientosAMostrar.length === 0 && (
                            <div className="col-span-2 text-center py-12 rounded-2xl border"
                                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                <span className="material-symbols-outlined text-4xl block mb-2">movie</span>
                                <p>Este agente no tiene producciones que coincidan con la búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VISTA 3: Todas las Producciones (Modo Global) ── */}
            {!agenteActivo && vistaModo === 'todos' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-outline)' }}>
                            <span className="material-symbols-outlined text-[16px]">movie</span>
                            Todas las Producciones ({requerimientosAMostrar.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {requerimientosAMostrar.map((item) => renderTarjetaVideo(item))}

                        {requerimientosAMostrar.length === 0 && (
                            <div className="col-span-2 text-center py-12 rounded-2xl border"
                                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container)', color: 'var(--color-outline)' }}>
                                <p>No se encontraron producciones audiovisuales.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );

    function renderTarjetaVideo(item) {
        const video = item.tareas_video?.[0] || {};
        const agente = item.usuarios?.nombre || 'Sin agente';
        const s = getStatusStyle(video.estado);
        const progreso = video.progreso_porcentaje ?? 0;
        const estaBloqueada = Boolean(tarjetasBloqueadas[video.id_tarea] ?? (video.estado === 'Finalizado'));

        return (
            <div key={video.id_tarea || item.id_requerimiento}
                className={`rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-all hover:shadow-md border ${
                    estaBloqueada
                        ? 'border-emerald-500/30 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                        : 'border-surface-container'
                }`}
                style={{ background: estaBloqueada ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-container-lowest)' }}>

                <div>
                    {/* Header */}
                    <div className="px-5 py-4 flex items-start justify-between gap-3 border-b"
                        style={{
                            background: estaBloqueada ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-container-low)',
                            borderColor: estaBloqueada ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-surface-container)'
                        }}>
                        <div className="min-w-0">
                            <h3 className="font-title-md truncate font-semibold" style={{ color: 'var(--color-on-surface)', fontSize: '15px' }}>
                                {item.nombre_propiedad}
                            </h3>
                            <p className="font-body-sm mt-0.5 text-xs" style={{ color: 'var(--color-outline)' }}>
                                Agente: <strong>{agente}</strong> · {item.ubicacion || 'Ubicación pendiente'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {estaBloqueada && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25">
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                    Bloqueada
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px]"
                                style={{ background: s.bg, color: s.color }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
                                {video.estado || 'Por Hacer'}
                            </span>
                        </div>
                    </div>

                    {/* Brief */}
                    {(item.descripcion_propiedad || item.elemento_destacar) && (
                        <div className="px-5 py-3 space-y-1 font-body-sm border-b text-xs"
                            style={{ borderColor: 'var(--color-surface-container-low)', background: 'var(--color-surface-container-low)' }}>
                            {item.descripcion_propiedad && (
                                <p style={{ color: 'var(--color-on-surface-variant)' }}>
                                    <span style={{ color: 'var(--color-outline)' }}>Descripción:</span> {item.descripcion_propiedad}
                                </p>
                            )}
                            {item.elemento_destacar && (
                                <p style={{ color: 'var(--color-on-surface-variant)' }}>
                                    <span style={{ color: 'var(--color-outline)' }}>Hook:</span> {item.elemento_destacar}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Checklist & Progress */}
                    <div className={estaBloqueada ? 'pointer-events-none opacity-80' : ''}>
                        {/* Checklist */}
                        <div className="p-4 border-b" style={{ borderColor: 'var(--color-surface-container-low)' }}>
                            <ChecklistRequerimientos
                                valores={{
                                    req_guion: Boolean(video.req_guion),
                                    req_fotos: Boolean(video.req_fotos),
                                    req_grabacion: Boolean(video.req_grabacion),
                                    req_edicion: Boolean(video.req_edicion),
                                    req_voz_off: Boolean(video.req_voz_off),
                                }}
                                alCambiar={(campo, activo) => alCambiarCheck(video.id_tarea, campo, activo)}
                                deshabilitado={estaBloqueada}
                            />
                        </div>

                        {/* Progress */}
                        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-surface-container-low)' }}>
                            <div className="flex justify-between font-label-sm text-[11px] mb-2">
                                <span style={{ color: 'var(--color-outline)' }}>Progreso de producción</span>
                                <span style={{ color: 'var(--color-tertiary)', fontWeight: 600 }}>{progreso}%</span>
                            </div>
                            <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--color-surface-container)' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progreso}%`, background: 'var(--color-tertiary)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3"
                    style={{ background: estaBloqueada ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-container-low/20)' }}>
                    <div className={estaBloqueada ? 'pointer-events-none opacity-80' : ''}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-sm text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Fase</label>
                                <StyledSelect value={video.estado || 'Por Hacer'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        alCambiarCampo(video.id_tarea, 'estado', val);
                                        if (val === 'Finalizado') {
                                            actualizarBloqueo(video.id_tarea, true);
                                        }
                                    }}>
                                    <option value="Por Hacer">Por Hacer (0%)</option>
                                    <option value="Grabando">🎥 Grabando (40%)</option>
                                    <option value="En Edición">💻 En Edición (75%)</option>
                                    <option value="Finalizado">✅ Finalizado (100%)</option>
                                </StyledSelect>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-sm text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Progreso (%)</label>
                                <StyledInput type="number" min="0" max="100" icon="percent"
                                    value={video.progreso_porcentaje ?? 0}
                                    onChange={(e) => alCambiarCampo(video.id_tarea, 'progreso_porcentaje', parseInt(e.target.value, 10) || 0)} />
                            </div>
                        </div>
                    </div>

                    {estaBloqueada ? (
                        <div className="pt-1 flex flex-col gap-2.5">
                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <span className="material-symbols-outlined text-[17px]">verified</span>
                                <span>Producción finalizada y bloqueada</span>
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
                                        actualizarBloqueo(video.id_tarea, false);
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
                                Cambios sincronizados
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}