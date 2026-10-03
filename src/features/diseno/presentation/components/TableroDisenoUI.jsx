import { useState, useMemo } from 'react';
import LiquidStateSelector from './LiquidStateSelector';
import { SlideConfirm } from "./SlideConfirm";
import "./SlideConfirm.css";
import ModalEditarRequerimiento from '../../../requerimientos/presentation/components/ModalEditarRequerimiento';

function StyledInput({ icon, ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: focused ? 'var(--color-primary-container)' : 'var(--color-outline)', fontSize: '18px', transition: 'color 0.15s ease' }}>{icon}</span>
            )}
            <input
                style={{
                    width: '100%',
                    height: '42px',
                    background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                    border: focused ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
                    borderRadius: '0.625rem',
                    color: 'var(--color-on-surface)',
                    fontSize: '13px',
                    paddingLeft: icon ? '38px' : '12px',
                    paddingRight: '12px',
                    outline: 'none',
                    boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                    transition: 'all 0.15s ease',
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
                    width: '100%',
                    height: '42px',
                    background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                    border: focused ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
                    borderRadius: '0.625rem',
                    color: 'var(--color-on-surface)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '0 36px 0 12px',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...rest}
            >
                {children}
            </select>
            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none material-symbols-outlined"
                style={{ color: 'var(--color-outline)', fontSize: '18px' }}>expand_more</span>
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

export default function TableroDisenoUI({ 
    tareas = [], 
    agentes: listaAgentes = [],
    cargando, 
    alCambiarCampo, 
    alGuardar,
    modalAbierto = false,
    setModalAbierto = () => {},
    tareaInterna = { titulo: '', descripcion: '', prioridad: 'Media', fecha_limite: '', id_agente: '', categoria_diseno: 'Artes estáticos' },
    setTareaInterna = () => {},
    manejarCrearInterna
}) {
    const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState(null);
    const [vistaModo, setVistaModo] = useState('agentes'); // 'agentes' | 'todos'
    const [busqueda, setBusqueda] = useState('');
    const [tarjetasExpandidas, setTarjetasExpandidas] = useState({});
    const [menuOpcionesId, setMenuOpcionesId] = useState(null);
    const [requerimientoAEditar, setRequerimientoAEditar] = useState(null);

    const toggleExpandir = (id) => {
        setTarjetasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

            const estado = (Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0]?.estado : item.tareas_diseno?.estado) || 'Por Hacer';
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
            <section className="rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
                style={{
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl -mr-20 -mt-20"
                    style={{ background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)' }} />

                <div className="flex items-center gap-3.5 relative z-10">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                        style={{ background: 'var(--color-secondary-container)' }}>
                        <span className="material-symbols-outlined text-[24px] sm:text-[28px]" style={{ color: 'var(--color-on-secondary-container)' }}>palette</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-headline-md font-bold text-lg sm:text-xl" style={{ color: 'var(--color-on-surface)' }}>Tablero de Diseño</h1>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                                Creatividad
                            </span>
                        </div>
                        <p className="font-body-sm text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                            Supervisión y entrega de artes publicitarios separados por agente inmobiliario
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
                    <button 
                        type="button"
                        onClick={() => setModalAbierto(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-95 active:scale-90 cursor-pointer"
                        style={{
                            background: 'var(--color-secondary)',
                            color: 'var(--color-on-secondary)'
                        }}
                    >
                        <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                        <span>Añadir Tarea</span>
                    </button>
                    <div className="px-3 py-1.5 sm:py-2 rounded-xl text-xs flex items-center gap-2 font-medium"
                        style={{
                            background: 'var(--color-surface-container-low)',
                            border: '1px solid var(--color-outline-variant)',
                            color: 'var(--color-on-surface)'
                        }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-secondary)' }}>person</span>
                        <span><strong>{agentes.length}</strong> Agentes</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full font-label-sm text-[11px] font-semibold shadow-xs"
                        style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-secondary)' }} />
                        Panel de Diseño
                    </div>
                </div>
            </section>

            {/* Barra de Navegación / Menú de Agentes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl"
                style={{
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {agenteActivo ? (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setAgenteSeleccionadoId(null)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                                style={{
                                    background: 'var(--color-surface-container-low)',
                                    border: '1px solid var(--color-outline-variant)',
                                    color: 'var(--color-on-surface)'
                                }}
                            >
                                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                <span>Directorio</span>
                            </button>
                            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                                <select
                                    value={agenteSeleccionadoId || ''}
                                    onChange={(e) => setAgenteSeleccionadoId(e.target.value || null)}
                                    className="w-full px-3 py-2 pr-8 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none transition-all"
                                    style={{
                                        background: 'var(--color-surface-container-low)',
                                        border: '1px solid var(--color-outline-variant)',
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
                        <div className="flex items-center gap-1 p-1 rounded-xl w-full sm:w-auto"
                            style={{
                                background: 'var(--color-surface-container-low)',
                                border: '1px solid var(--color-outline-variant)'
                            }}>
                            <button
                                type="button"
                                onClick={() => { setVistaModo('agentes'); setAgenteSeleccionadoId(null); }}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                                style={{
                                    background: vistaModo === 'agentes' ? 'var(--color-primary-container)' : 'transparent',
                                    color: vistaModo === 'agentes' ? 'white' : 'var(--color-on-surface-variant)',
                                    boxShadow: vistaModo === 'agentes' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
                                }}
                            >
                                <span className="material-symbols-outlined text-[16px]">group</span>
                                <span>Por Agentes ({agentes.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setVistaModo('todos'); setAgenteSeleccionadoId(null); }}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                                style={{
                                    background: vistaModo === 'todos' ? 'var(--color-primary-container)' : 'transparent',
                                    color: vistaModo === 'todos' ? 'white' : 'var(--color-on-surface-variant)',
                                    boxShadow: vistaModo === 'todos' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
                                }}
                            >
                                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                                <span>Tareas ({tareas.length})</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Buscador */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined text-[18px]"
                        style={{ color: 'var(--color-outline)' }}>
                        search
                    </span>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={agenteActivo ? `Buscar en ${agenteActivo.nombre}...` : "Buscar propiedad o agente..."}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs focus:outline-none transition-all"
                        style={{
                            background: 'var(--color-surface-container-low)',
                            border: '1px solid var(--color-outline-variant)',
                            color: 'var(--color-on-surface)'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary-container)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                            e.currentTarget.style.background = 'var(--color-surface-container-lowest)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'var(--color-surface-container-low)';
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
                                className="rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
                                style={{
                                    background: 'var(--color-surface-container-lowest)',
                                    border: '1px solid var(--color-outline-variant)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div>
                                    <div className="flex items-start gap-3.5 mb-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agente.colorGradiente} text-white flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0`}>
                                            {agente.iniciales}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-display font-bold text-base transition-colors truncate"
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
                                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center text-xs mb-3"
                                        style={{
                                            background: 'var(--color-surface-container-low)',
                                            border: '1px solid var(--color-outline-variant)'
                                        }}>
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
                                    style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-primary-container)' }}>
                                    <span>Ingresar a tareas de diseño</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        ))}

                        {agentesFiltrados.length === 0 && (
                            <div className="col-span-3 text-center py-12 rounded-2xl"
                                style={{
                                    background: 'var(--color-surface-container-lowest)',
                                    border: '1px solid var(--color-outline-variant)',
                                    color: 'var(--color-outline)'
                                }}>
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
                    <div className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                            background: 'linear-gradient(to right, rgba(209, 250, 229, 0.25), var(--color-surface-container-lowest), var(--color-surface-container-lowest))',
                            border: '1px solid var(--color-outline-variant)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
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
                            <div className="col-span-2 text-center py-12 rounded-2xl"
                                style={{
                                    background: 'var(--color-surface-container-lowest)',
                                    border: '1px solid var(--color-outline-variant)',
                                    color: 'var(--color-outline)'
                                }}>
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
                            <div className="col-span-2 text-center py-12 rounded-2xl"
                                style={{
                                    background: 'var(--color-surface-container-lowest)',
                                    border: '1px solid var(--color-outline-variant)',
                                    color: 'var(--color-outline)'
                                }}>
                                <p>No se encontraron tareas de diseño.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL PARA TAREAS INTERNAS */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                    <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            background: 'var(--color-surface-container-lowest)',
                            borderColor: 'var(--color-outline-variant)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                        
                        {/* Franja de gradiente superior */}
                        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary-container), var(--color-tertiary-container))' }} />

                        {/* Cabecera del modal */}
                        <div className="p-5 sm:p-6 border-b flex items-start justify-between gap-3"
                            style={{
                                background: 'linear-gradient(to right, rgba(238, 230, 255, 0.45), var(--color-surface-container-lowest))',
                                borderColor: 'var(--color-outline-variant)'
                            }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                                    style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                                    <span className="material-symbols-outlined text-[24px]">palette</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-sm font-bold text-base sm:text-lg" style={{ color: 'var(--color-on-surface)' }}>
                                        Nuevo Requerimiento de Diseño
                                    </h3>
                                    <p className="font-body-sm text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                                        Crea una nueva pieza publicitaria o requerimiento interno
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
                                aria-label="Cerrar modal"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        {/* Formulario */}
                        <form onSubmit={manejarCrearInterna} className="p-5 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>person</span>
                                        <span>Solicitante (Agente)</span>
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={tareaInterna.id_agente || ''} 
                                            onChange={(e) => setTareaInterna({...tareaInterna, id_agente: e.target.value})} 
                                            className="w-full h-11 px-3.5 pr-9 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer outline-none appearance-none"
                                            style={{ 
                                                background: 'var(--color-surface-container-low)', 
                                                color: 'var(--color-on-surface)', 
                                                border: '1px solid var(--color-outline-variant)' 
                                            }}
                                        >
                                            <option value="">🏢 Trabajo Interno</option>
                                            {listaAgentes.map(ag => (
                                                <option key={ag.id_usuario} value={ag.id_usuario}>{ag.nombre}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-[18px]" style={{ color: 'var(--color-outline)' }}>
                                            expand_more
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>brush</span>
                                        <span>Tipo de Arte</span>
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={tareaInterna.categoria_diseno || 'Artes estáticos'} 
                                            onChange={(e) => setTareaInterna({...tareaInterna, categoria_diseno: e.target.value})} 
                                            className="w-full h-11 px-3.5 pr-9 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer outline-none appearance-none"
                                            style={{ 
                                                background: 'var(--color-surface-container-low)', 
                                                color: 'var(--color-on-surface)', 
                                                border: '1px solid var(--color-outline-variant)' 
                                            }}
                                        >
                                            <option value="Comunicados">📢 Comunicados</option>
                                            <option value="Artes salutaciones">🎉 Artes salutaciones</option>
                                            <option value="Tops internos">🏆 Tops internos</option>
                                            <option value="Diplomas y/o certificados">📜 Diplomas y/o certificados</option>
                                            <option value="Tops nacionales">🥇 Tops nacionales</option>
                                            <option value="Edición de fotos">🖼️ Edición de fotos</option>
                                            <option value="Historias">📱 Historias</option>
                                            <option value="Artes estáticos">🎨 Artes estáticos</option>
                                            <option value="Invitaciones">💌 Invitaciones</option>
                                            <option value="Otros">✨ Otros</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-[18px]" style={{ color: 'var(--color-outline)' }}>
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>title</span>
                                    <span>Título de la Pieza / Tarea</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={tareaInterna.titulo || ''} 
                                    onChange={(e) => setTareaInterna({...tareaInterna, titulo: e.target.value})} 
                                    className="w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm transition-all outline-none" 
                                    style={{ 
                                        background: 'var(--color-surface-container-low)', 
                                        color: 'var(--color-on-surface)', 
                                        border: '1px solid var(--color-outline-variant)' 
                                    }}
                                    placeholder="Ej: Flyer Capacitación Zoom"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>notes</span>
                                    <span>Instrucciones / Texto a incluir</span>
                                </label>
                                <textarea 
                                    rows="3" 
                                    value={tareaInterna.descripcion || ''} 
                                    onChange={(e) => setTareaInterna({...tareaInterna, descripcion: e.target.value})} 
                                    className="w-full p-3 rounded-xl text-xs sm:text-sm transition-all outline-none resize-none" 
                                    style={{ 
                                        background: 'var(--color-surface-container-low)', 
                                        color: 'var(--color-on-surface)', 
                                        border: '1px solid var(--color-outline-variant)' 
                                    }}
                                    placeholder="Detalles sobre colores, textos obligatorios, especificaciones..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>flag</span>
                                        <span>Prioridad</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                                        {['Baja', 'Media', 'Alta'].map((p) => {
                                            const activa = (tareaInterna.prioridad || 'Media') === p;
                                            const colors = {
                                                Baja: { dot: '#10b981', color: '#059669' },
                                                Media: { dot: '#f59e0b', color: '#d97706' },
                                                Alta: { dot: '#ef4444', color: '#dc2626' }
                                            }[p];
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setTareaInterna({...tareaInterna, priority: p, prioridad: p})}
                                                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                        activa ? 'shadow-xs scale-[1.02]' : 'text-outline hover:text-on-surface'
                                                    }`}
                                                    style={{
                                                        background: activa ? 'var(--color-surface-container-lowest)' : 'transparent',
                                                        color: activa ? colors.color : 'inherit'
                                                    }}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                                                    <span>{p}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-secondary)' }}>calendar_today</span>
                                        <span>Fecha Entrega</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        value={tareaInterna.fecha_limite || ''} 
                                        onChange={(e) => setTareaInterna({...tareaInterna, fecha_limite: e.target.value})} 
                                        className="w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm transition-all outline-none" 
                                        style={{ 
                                            background: 'var(--color-surface-container-low)', 
                                            color: 'var(--color-on-surface)', 
                                            border: '1px solid var(--color-outline-variant)' 
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setModalAbierto(false)} 
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-surface-container-low cursor-pointer"
                                    style={{ color: 'var(--color-on-surface-variant)' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                                    style={{ 
                                        background: 'linear-gradient(135deg, var(--color-secondary), #7c3aed)', 
                                        color: 'white' 
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[17px]">add_task</span>
                                    <span>Crear Tarea</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal para Modificar Requerimiento Completo */}
            <ModalEditarRequerimiento
                abierto={Boolean(requerimientoAEditar)}
                requerimiento={requerimientoAEditar}
                alCerrar={() => setRequerimientoAEditar(null)}
                alGuardarExitoso={() => {
                    setRequerimientoAEditar(null);
                    if (alGuardar) alGuardar();
                }}
                agentes={listaAgentes}
            />

        </div>
    );

    function renderTarjetaDiseno(item) {
        const tarea = (Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno) || {};
        const agente = item.usuarios?.nombre || 'Sin agente';
        const s = getStatusStyle(tarea.estado);
        const progreso = ESTADO_PROGRESO[tarea.estado] ?? (tarea.progreso_porcentaje ?? 0);
        const estaBloqueada = Boolean(tarjetasBloqueadas[tarea.id_tarea] ?? (tarea.estado === 'Finalizado'));
        const idTarjeta = item.id_requerimiento;
        const estaExpandida = Boolean(tarjetasExpandidas[idTarjeta]);
        const menuAbierto = menuOpcionesId === idTarjeta;

        // Entregables para diseño
        const tieneArte = Boolean(item.req_arte_estatico);
        const tieneCarrusel = Boolean(item.req_carrusel);
        const esDisenoInterno = item.categoria === 'Diseño Interno';

        return (
            <div key={tarea.id_tarea || item.id_requerimiento}
                className={`rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md ${
                    item.prioridad === 'Alta' 
                        ? 'border-l-[4px] border-l-error' 
                        : (item.prioridad === 'Media' ? 'border-l-[4px] border-l-amber-500' : '')
                }`}
                style={{ 
                    background: estaBloqueada ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-container-lowest)', 
                    border: estaBloqueada ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--color-outline-variant)',
                    boxShadow: estaBloqueada ? '0 4px 20px -2px rgba(16, 185, 129, 0.12)' : '0 1px 4px rgba(0,0,0,0.05)'
                }}>

                <div>
                    {/* Card header */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-start justify-between gap-3 border-b"
                        style={{ 
                            background: estaBloqueada ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-container-low)', 
                            borderColor: estaBloqueada ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-outline-variant)' 
                        }}>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-title-md truncate font-semibold" style={{ color: 'var(--color-on-surface)', fontSize: '15px' }}>
                                    {item.nombre_propiedad}
                                </h3>
                                {item.prioridad === 'Alta' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                        <span className="material-symbols-outlined text-[11px] text-rose-700">priority_high</span>
                                        Urgente
                                    </span>
                                )}
                                {item.prioridad === 'Media' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        <span className="material-symbols-outlined text-[11px] text-amber-700">schedule</span>
                                        Media
                                    </span>
                                )}
                            </div>

                            {/* Tags de tipo de entregable con color distintivo y alto contraste */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                {tieneArte && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
                                        <span className="material-symbols-outlined text-[12px] text-sky-700">image</span>
                                        Arte Estático
                                    </span>
                                )}
                                {tieneCarrusel && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                                        <span className="material-symbols-outlined text-[12px] text-purple-700">view_carousel</span>
                                        Carrusel
                                    </span>
                                )}
                                {esDisenoInterno && item.categoria_diseno && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                        <span className="material-symbols-outlined text-[12px] text-amber-700">brush</span>
                                        {item.categoria_diseno}
                                    </span>
                                )}
                                {!tieneArte && !tieneCarrusel && (!esDisenoInterno || !item.categoria_diseno) && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                        <span className="material-symbols-outlined text-[12px] text-emerald-700">palette</span>
                                        Diseño Gráfico
                                    </span>
                                )}
                                <span className="text-[11px] text-outline ml-1">
                                    • Agente: <strong className="text-on-surface">{agente}</strong>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {estaBloqueada && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <span className="material-symbols-outlined text-[12px] text-emerald-700">lock</span>
                                    Bloqueada
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px] flex-shrink-0 font-medium"
                                style={{ background: s.bg, color: s.color }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{s.icon}</span>
                                {tarea.estado || 'Por Hacer'}
                            </span>

                            {/* Botón de 3 puntitos con menú contextual */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpcionesId(menuAbierto ? null : idTarjeta);
                                    }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                                    title="Modificar requerimiento"
                                >
                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                </button>

                                {menuAbierto && (
                                    <div 
                                        className="absolute right-0 top-8 z-30 w-48 py-1 rounded-xl shadow-xl border bg-surface-container-lowest animate-fadeIn"
                                        style={{ borderColor: 'var(--color-outline-variant)' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpcionesId(null);
                                                setRequerimientoAEditar(item);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-surface-container text-on-surface cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-primary-container">edit_note</span>
                                            <span>Modificar requerimiento</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ficha técnica estructurada de la propiedad */}
                    <div className="px-4 sm:px-5 py-3 space-y-2.5 font-body-sm border-b text-xs"
                        style={{ borderColor: 'var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
                        
                        {/* Grid de especificaciones: Ubicación, Habitaciones, Superficie, Categoría, Tipo de operación */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Categoría</span>
                                <span className="font-semibold text-on-surface truncate block">{item.categoria || 'Propiedad'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Operación</span>
                                <span className="font-semibold text-primary-container truncate block">{item.tipo || 'Venta'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Habitaciones</span>
                                <span className="font-semibold text-on-surface block">{item.habitaciones ? `${item.habitaciones} hab.` : '—'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Superficie</span>
                                <span className="font-semibold text-on-surface block">{item.superficie || '—'}</span>
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[15px] text-outline shrink-0">location_on</span>
                            <span className="truncate">{item.ubicacion || 'Ubicación no especificada'}</span>
                        </div>

                        {/* Descripción con soporte para expandir si es larga */}
                        {item.descripcion_propiedad && (
                            <div className="pt-1 border-t border-surface-container/60 space-y-1">
                                <p className={`text-on-surface-variant transition-all ${estaExpandida ? '' : 'line-clamp-2'}`}>
                                    <span className="font-bold text-outline">Descripción: </span>
                                    {item.descripcion_propiedad}
                                </p>
                                {item.descripcion_propiedad.length > 90 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleExpandir(idTarjeta)}
                                        className="text-[11px] font-semibold text-primary-container hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                                    >
                                        <span>{estaExpandida ? 'Ver menos' : 'Ver más detalles'}</span>
                                        <span className="material-symbols-outlined text-[15px]">
                                            {estaExpandida ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Datos adicionales al expandir */}
                        {estaExpandida && (
                            <div className="pt-2 border-t border-surface-container/60 space-y-1.5 text-[11px] animate-fadeIn">
                                {item.elemento_destacar && (
                                    <p className="text-on-surface-variant">
                                        <strong className="text-primary-container">Hook / Elemento a destacar:</strong> {item.elemento_destacar}
                                    </p>
                                )}
                                {item.precio && (
                                    <p className="text-on-surface-variant">
                                        <strong className="text-outline">Precio:</strong> {item.precio}
                                    </p>
                                )}
                                {item.publico_objetivo && (
                                    <p className="text-on-surface-variant">
                                        <strong className="text-outline">Público objetivo:</strong> {item.publico_objetivo}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar vinculada al Estado */}
                    <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
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
                    style={{ background: estaBloqueada ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface-container-low)' }}>
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