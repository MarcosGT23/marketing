import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BurbujasRequerimientos from './BurbujasRequerimientos';
import SelectorPeriodoAirbnb from './SelectorPeriodoAirbnb';
import SelectorAgenteAirbnb from './SelectorAgenteAirbnb';
import SelectorDuracionPauta from './SelectorDuracionPauta';

/* ─── Stepper ─── */
const STEPS = [
    { id: 'sec-campana',    num: 1, label: 'Campaña',      sub: 'Datos de control',    color: 'primary' },
    { id: 'sec-propiedad',  num: 2, label: 'Propiedad',    sub: 'Ficha comercial',     color: 'secondary' },
    { id: 'sec-audiovisual',num: 3, label: 'Video & Foto', sub: 'Video y Fotografía',   color: 'tertiary' },
    { id: 'sec-pauta',      num: 4, label: 'Pauta Digital',sub: 'Campañas Meta Ads',   color: 'green' },
];

const stepBg = {
    primary:   { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary)', ring: 'var(--color-primary-fixed)' },
    secondary: { bg: 'var(--color-secondary-fixed-dim)', text: 'var(--color-on-secondary-fixed)', ring: 'var(--color-secondary-fixed)' },
    tertiary:  { bg: 'var(--color-tertiary-fixed)', text: 'var(--color-on-tertiary-fixed-variant)', ring: 'var(--color-tertiary-fixed-dim)' },
    green:     { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)', ring: 'rgba(108,248,187,0.3)' },
};

/* ─── Requerimientos Técnicos Audiovisuales ─── */
const REQS_AUDIOVISUAL = [
    { key: 'req_guion', label: 'Guion / Storyboard', icono: 'description', desc: 'Estructura y narrativa' },
    { key: 'req_fotos', label: 'Sesión Fotográfica', icono: 'camera_alt', desc: 'Tomas de detalle' },
    { key: 'req_grabacion', label: 'Grabación en Locación', icono: 'videocam', desc: 'Rodaje con equipo' },
    { key: 'req_edicion', label: 'Edición y Efectos', icono: 'movie_edit', desc: 'Montaje dinámico' },
    { key: 'req_voz_off', label: 'Voz en Off / Locución', icono: 'mic', desc: 'Audio profesional' }
];

/* ─── Categorías de Inmuebles (Slide interactivo) ─── */
const CATEGORIAS_INMUEBLE = [
    { 
        id: 'Departamento', 
        label: 'Departamento', 
        sub: 'Suite / Flat', 
        icon: 'apartment',
        color: 'text-blue-600',
        activeStyle: 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/25 shadow-md'
    },
    { 
        id: 'Casa', 
        label: 'Casa / Villa', 
        sub: 'Condominio', 
        icon: 'cottage',
        color: 'text-emerald-600',
        activeStyle: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/25 shadow-md'
    },
    { 
        id: 'Penthouse', 
        label: 'Penthouse', 
        sub: 'Lujo & Vista', 
        icon: 'domain_add',
        color: 'text-amber-600',
        activeStyle: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/25 shadow-md'
    },
    { 
        id: 'Terreno', 
        label: 'Terreno', 
        sub: 'Lote / Solar', 
        icon: 'landscape',
        color: 'text-teal-600',
        activeStyle: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/25 shadow-md'
    },
    { 
        id: 'Comercial', 
        label: 'Comercial', 
        sub: 'Oficina / Local', 
        icon: 'storefront',
        color: 'text-purple-600',
        activeStyle: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/25 shadow-md'
    }
];

/* ─── Shared input style ─── */
const inputBase = {
    background: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    color: 'var(--color-on-surface)',
    fontSize: '14px',
    height: '44px',
    borderRadius: '0.625rem',
    outline: 'none',
    transition: 'all 0.18s ease',
    width: '100%',
};

function StyledInput({ icon, prefix, children, ...rest }) {
    const [focused, setFocused] = useState(false);
    const style = {
        ...inputBase,
        background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
        border: focused ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
        paddingLeft: icon || prefix ? (prefix ? '44px' : '40px') : '12px',
        paddingRight: '12px',
    };
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '19px' }}>{icon}</span>
            )}
            {prefix && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-label-sm font-semibold"
                    style={{ color: 'var(--color-outline)', fontSize: '13px' }}>{prefix}</span>
            )}
            <input
                style={style}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...rest}
            />
            {children}
        </div>
    );
}

function StyledSelect({ icon, children, ...rest }) {
    const [focused, setFocused] = useState(false);
    const style = {
        ...inputBase,
        background: focused ? 'var(--color-surface-container)' : 'var(--color-surface-container-low)',
        border: focused ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
        paddingLeft: icon ? '40px' : '12px',
        paddingRight: '40px',
        appearance: 'none',
        cursor: 'pointer',
    };
    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined"
                    style={{ color: 'var(--color-outline)', fontSize: '19px' }}>{icon}</span>
            )}
            <select
                style={style}
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

function StyledTextarea({ ...rest }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            style={{
                width: '100%',
                background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                border: focused ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
                borderRadius: '0.625rem',
                color: 'var(--color-on-surface)',
                fontSize: '14px',
                padding: '10px 14px',
                outline: 'none',
                boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                transition: 'all 0.18s ease',
                resize: 'vertical',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: '1.5',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
        />
    );
}

/* ─── Section Header ─── */
function SectionHeader({ num, title, subtitle, color, tag, tagIcon }) {
    const { bg, text } = stepBg[color] || stepBg.primary;
    return (
        <div className="flex items-start justify-between pb-4 mb-6" style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}>
            <div>
                <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center font-headline-md font-bold text-[15px]"
                        style={{ background: bg, color: text }}>{num}</span>
                    <h2 className="font-headline-md" style={{ color: 'var(--color-on-surface)', fontSize: '20px' }}>{title}</h2>
                </div>
                <p className="font-body-md mt-1 ml-10" style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>{subtitle}</p>
            </div>
            {tag && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-[11px]"
                    style={{ background: stepBg[color]?.ring || 'var(--color-surface-container)', color: text }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{tagIcon}</span>
                    {tag}
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function FormularioPropiedadUI({
    datos,
    alCambiarDato,
    alCambiarCheckbox,
    alEnviar,
    cargando,
    agentes = [],
    // Props para soporte de múltiples requerimientos con animación de burbujas:
    requerimientosLista = [],
    editandoIndex = null,
    alAnadirRequerimiento,
    alSeleccionarBurbuja,
    alEliminarBurbuja,
    alCancelarEdicion,
    isCollapsing = false,
    formAnimKey = 1,
    toastMensaje = null,
    progresoEnvio = null,
    totalRequerimientos = 1
}) {
    const [descLen, setDescLen] = useState(datos.descripcion_propiedad?.length || 0);

    // 1. Manejo de Tipo de Operación como Opción Múltiple
    const tiposSeleccionados = useMemo(() => {
        if (!datos.tipo) return [];
        if (Array.isArray(datos.tipo)) return datos.tipo;
        return String(datos.tipo).split(',').map((s) => s.trim()).filter(Boolean);
    }, [datos.tipo]);

    const toggleTipoOperacion = (opId) => {
        let nuevos;
        if (tiposSeleccionados.includes(opId)) {
            nuevos = tiposSeleccionados.filter((t) => t !== opId);
        } else {
            nuevos = [...tiposSeleccionados, opId];
        }
        alCambiarDato('tipo', nuevos.join(', '));
    };

    // 2. Moneda de precio y sincronización con moneda de pauteo
    const monedaPrecioActual = datos.moneda_precio || '$us';

    const cambiarMonedaPrecio = (nuevaMoneda) => {
        alCambiarDato('moneda_precio', nuevaMoneda);
        // Sincronizar automáticamente la moneda del pauteo digital si aplica
        if (nuevaMoneda === '$us') {
            alCambiarDato('moneda', 'USD');
        } else if (nuevaMoneda === 'Bs') {
            alCambiarDato('moneda', 'Bs');
        }
    };

    // 3. Superficie activable: Superficie Terreno y Superficie Construida
    const actualizarSuperficieCombinada = (activaTerreno, valTerreno, activaConstruida, valConstruida) => {
        const partes = [];
        if (activaTerreno && valTerreno && String(valTerreno).trim()) {
            const strT = String(valTerreno).trim().includes('m') ? String(valTerreno).trim() : `${String(valTerreno).trim()} m²`;
            partes.push(`${strT} (Terreno)`);
        }
        if (activaConstruida && valConstruida && String(valConstruida).trim()) {
            const strC = String(valConstruida).trim().includes('m') ? String(valConstruida).trim() : `${String(valConstruida).trim()} m²`;
            partes.push(`${strC} (Construida)`);
        }
        alCambiarDato('superficie', partes.join(' | '));
    };

    const cantidadTotal =
        editandoIndex !== null
            ? requerimientosLista.length
            : requerimientosLista.length + (datos.nombre_propiedad?.trim() ? 1 : 0);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        await alEnviar(e);
    };

    return (
        <div className="w-full flex flex-col gap-0 relative">

            {/* ── Toast de confirmación flotante ── */}
            <AnimatePresence>
                {toastMensaje && (
                    <motion.div
                        initial={{ opacity: 0, y: -25, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.92 }}
                        className="fixed top-5 right-5 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 text-xs sm:text-sm max-w-sm sm:max-w-md"
                    >
                        <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
                            auto_awesome
                        </span>
                        <span className="font-medium">{toastMensaje}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal de Progreso de Envío Múltiple ── */}
            <AnimatePresence>
                {progresoEnvio && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-surface-container-lowest border border-surface-container rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    progresoEnvio.completado
                                        ? 'bg-secondary-container text-on-secondary-container'
                                        : 'bg-primary-fixed text-primary'
                                }`}>
                                    <span className={`material-symbols-outlined text-[26px] ${!progresoEnvio.completado ? 'animate-spin' : ''}`}>
                                        {progresoEnvio.completado ? 'check_circle' : 'progress_activity'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base sm:text-lg text-on-surface">
                                        {progresoEnvio.completado ? '¡Registro completado!' : 'Guardando requerimientos'}
                                    </h3>
                                    <p className="text-xs text-outline">
                                        {progresoEnvio.completado
                                            ? 'Todas las campañas han sido creadas exitosamente'
                                            : `Procesando ${progresoEnvio.actual} de ${progresoEnvio.total}`}
                                    </p>
                                </div>
                            </div>

                            {/* Barra de progreso */}
                            <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300 rounded-full"
                                    style={{
                                        width: `${Math.round((progresoEnvio.actual / progresoEnvio.total) * 100)}%`
                                    }}
                                />
                            </div>

                            {/* Lista de propiedades procesadas */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {progresoEnvio.exitosos?.map((ex, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-surface-container-low text-on-surface">
                                        <span className="truncate font-semibold">{ex.nombre}</span>
                                        <span className="text-[11px] text-secondary font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                            ID #{ex.id}
                                        </span>
                                    </div>
                                ))}
                                {!progresoEnvio.completado && (
                                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-primary-fixed/20 text-on-surface">
                                        <span className="truncate font-medium italic">{progresoEnvio.actualNombre}...</span>
                                        <span className="text-[11px] text-primary animate-pulse font-semibold">Guardando...</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stepper ── */}
            <div className="w-full max-w-4xl mx-auto mb-5">
                <div className="rounded-2xl p-2 sm:p-3 border" style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                        {STEPS.map((s) => {
                            const { bg, text } = stepBg[s.color] || stepBg.primary;
                            return (
                                <a key={s.id} href={`#${s.id}`}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all group select-none"
                                    style={{ textDecoration: 'none' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-label-md text-xs sm:text-sm flex-shrink-0 transition-transform group-hover:scale-105"
                                        style={{ background: bg, color: text, fontWeight: 700 }}>
                                        {s.num}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block font-label-sm text-xs sm:text-sm truncate" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>{s.label}</span>
                                        <span className="hidden sm:block font-body-sm text-[11px] truncate" style={{ color: 'var(--color-outline)' }}>{s.sub}</span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Burbujas de Requerimientos Acumulados ── */}
            <BurbujasRequerimientos
                requerimientos={requerimientosLista}
                editandoIndex={editandoIndex}
                onSeleccionar={alSeleccionarBurbuja}
                onEliminar={alEliminarBurbuja}
                onNuevo={alAnadirRequerimiento}
            />

            {/* ── Banner Informativo si se está editando una burbuja ── */}
            {editandoIndex !== null && (
                <div className="w-full max-w-4xl mx-auto mb-4 p-3.5 sm:p-4 rounded-2xl bg-primary-fixed/20 border border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[22px]">edit_document</span>
                        <div className="text-xs sm:text-sm">
                            <span className="font-bold text-primary">Modificando Requerimiento #{editandoIndex + 1}: </span>
                            <span className="font-semibold text-on-surface">{datos.nombre_propiedad || 'Sin título'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={alAnadirRequerimiento}
                            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[17px]">check</span>
                            <span>Guardar en burbuja</span>
                        </button>
                        <button
                            type="button"
                            onClick={alCancelarEdicion}
                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-medium transition-all cursor-pointer active:scale-95"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Formulario animado (se cierra y colapsa al añadir burbuja) ── */}
            <form id="requerimiento-form" onSubmit={handleSubmit} noValidate
                className="w-full max-w-4xl mx-auto flex flex-col gap-6">

                {/* Contenedor del formulario animado con initial={false} para visibilidad inmediata */}
                <motion.div
                    initial={false}
                    animate={isCollapsing
                        ? { opacity: 0, scale: 0.93, y: -25, filter: 'blur(4px)' }
                        : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
                    }
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex flex-col gap-6"
                >

                            {/* ── Card 1: Campaña ── */}
                            <section id="sec-campana" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <SectionHeader num="1" title="Registro de Campaña" color="primary"
                                    subtitle="Datos de control interno y asignación del requerimiento mensual."
                                    tag="Requerido" tagIcon="flag" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Agente Solicitante con Selector estilo Airbnb */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Agente Solicitante <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Rol: Responsable</span>
                                        </div>
                                        <SelectorAgenteAirbnb
                                            agentes={agentes}
                                            valor={datos.id_agente}
                                            alCambiar={alCambiarDato}
                                        />
                                    </div>

                                    {/* Periodo */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Periodo Mensual <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Ciclo operativo</span>
                                        </div>
                                        <SelectorPeriodoAirbnb
                                            valor={datos.periodo_mensual}
                                            alCambiar={alCambiarDato}
                                        />
                                    </div>

                                    {/* Prioridad con Segmented Chips */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Nivel de Prioridad <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>SLA / Urgencia</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5 h-[44px] p-1 rounded-xl bg-surface-container-low border border-surface-container items-center">
                                            {[
                                                { id: 'Baja', label: 'Baja', icon: 'check_circle', color: 'text-emerald-600', active: 'bg-surface-container-lowest text-emerald-700 shadow-xs border-emerald-300 ring-1 ring-emerald-400/30 font-bold' },
                                                { id: 'Media', label: 'Media', icon: 'schedule', color: 'text-amber-600', active: 'bg-surface-container-lowest text-amber-700 shadow-xs border-amber-300 ring-1 ring-amber-400/30 font-bold' },
                                                { id: 'Alta', label: 'Alta', icon: 'error', color: 'text-rose-600', active: 'bg-surface-container-lowest text-rose-700 shadow-xs border-rose-300 ring-1 ring-rose-400/30 font-bold' }
                                            ].map((p) => {
                                                const isSelected = datos.prioridad === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => alCambiarDato('prioridad', p.id)}
                                                        className={`h-full flex items-center justify-center gap-1.5 px-2 rounded-lg text-xs transition-all border ${
                                                            isSelected 
                                                                ? `${p.active}` 
                                                                : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                                                        }`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[15px] ${isSelected ? p.color : 'text-outline'}`}>
                                                            {p.icon}
                                                        </span>
                                                        <span>{p.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Card 2: Propiedad ── */}
                            <section id="sec-propiedad" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <SectionHeader num="2" title="Datos de la Propiedad" color="secondary"
                                    subtitle="Información base para piezas gráficas, copys de venta y ficha técnica."
                                    tag="Insumo para Diseño" tagIcon="draw" />

                                <div className="space-y-5">
                                    {/* Nombre Comercial */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Nombre Comercial del Inmueble <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Máx 60 caracteres</span>
                                        </div>
                                        <StyledInput icon="apartment" placeholder="Ej: Penthouse Torre Platinum - Vista Panorámica"
                                            value={datos.nombre_propiedad}
                                            onChange={(e) => alCambiarDato('nombre_propiedad', e.target.value)}
                                            maxLength={60} required />
                                    </div>

                                    {/* Slide de Categorías de Inmueble */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <label className="font-label-sm font-semibold text-on-surface">
                                                    Categoría de Inmueble <span style={{ color: 'var(--color-error)' }}>*</span>
                                                </label>
                                                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-container/30 text-primary">
                                                    Tipología
                                                </span>
                                            </div>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>
                                                Selecciona la categoría
                                            </span>
                                        </div>

                                        {/* Slider interactivo de categorías con iconos destacados */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                            {CATEGORIAS_INMUEBLE.map((cat) => {
                                                const isSelected = datos.categoria === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => alCambiarDato('categoria', cat.id)}
                                                        className={`group relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-center ${
                                                            isSelected 
                                                                ? `${cat.activeStyle} scale-[1.02]` 
                                                                : 'bg-surface-container-low/60 hover:bg-surface-container-lowest border-surface-container hover:border-surface-container-high hover:shadow-xs text-on-surface'
                                                        }`}
                                                    >
                                                        {/* Indicador de activo superior derecho */}
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/30 animate-pulse" />
                                                        )}

                                                        {/* Avatar del icono con color distintivo */}
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-200 ${
                                                            isSelected 
                                                                ? 'bg-surface-container-lowest shadow-xs scale-110' 
                                                                : 'bg-surface-container/70 group-hover:bg-surface-container group-hover:scale-105'
                                                        }`}>
                                                            <span className={`material-symbols-outlined text-[24px] ${cat.color}`}>
                                                                {cat.icon}
                                                            </span>
                                                        </div>

                                                        {/* Título de Categoría */}
                                                        <span className="text-xs font-bold leading-tight block">
                                                            {cat.label}
                                                        </span>

                                                        {/* Subtítulo / Detalle */}
                                                        <span className={`text-[10px] mt-0.5 block ${
                                                            isSelected ? 'font-semibold opacity-90' : 'text-outline'
                                                        }`}>
                                                            {cat.sub}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Fila: Tipo de Operación + Precio de Oferta Comercial */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                    Tipo de Operación <span style={{ color: 'var(--color-error)' }}>*</span>
                                                </label>
                                                <span className="font-body-sm text-[11px] font-semibold text-primary">Opción múltiple</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5 h-[44px] p-1 rounded-xl bg-surface-container-low border border-surface-container items-center">
                                                {[
                                                    { id: 'Venta', label: 'Venta', icon: 'sell', color: 'text-blue-600', active: 'bg-surface-container-lowest text-blue-700 shadow-xs border-blue-300 ring-1 ring-blue-400/30 font-bold' },
                                                    { id: 'Alquiler', label: 'Alquiler', icon: 'key', color: 'text-indigo-600', active: 'bg-surface-container-lowest text-indigo-700 shadow-xs border-indigo-300 ring-1 ring-indigo-400/30 font-bold' },
                                                    { id: 'Anticrético', label: 'Anticrético', icon: 'handshake', color: 'text-emerald-600', active: 'bg-surface-container-lowest text-emerald-700 shadow-xs border-emerald-300 ring-1 ring-emerald-400/30 font-bold' }
                                                ].map((op) => {
                                                    const isSelected = tiposSeleccionados.includes(op.id);
                                                    return (
                                                        <button
                                                            key={op.id}
                                                            type="button"
                                                            onClick={() => toggleTipoOperacion(op.id)}
                                                            className={`h-full flex items-center justify-center gap-1.5 px-2 rounded-lg text-xs transition-all border cursor-pointer select-none ${
                                                                isSelected 
                                                                    ? `${op.active}` 
                                                                    : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                                                            }`}
                                                        >
                                                            <span className={`material-symbols-outlined text-[15px] ${isSelected ? op.color : 'text-outline'}`}>
                                                                {isSelected ? 'check_circle' : op.icon}
                                                            </span>
                                                            <span>{op.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                    Precio de Oferta Comercial <span style={{ color: 'var(--color-error)' }}>*</span>
                                                </label>
                                                {/* Selector de moneda vinculado al pauteo */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-outline uppercase font-semibold">Moneda:</span>
                                                    <div className="inline-flex p-0.5 rounded-lg bg-surface-container-low border border-surface-container text-xs font-semibold">
                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarMonedaPrecio('$us')}
                                                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                                                monedaPrecioActual === '$us'
                                                                    ? 'bg-surface-container-lowest text-blue-700 font-bold shadow-xs border border-blue-200'
                                                                    : 'text-outline hover:text-on-surface'
                                                            }`}
                                                        >
                                                            $us
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarMonedaPrecio('Bs')}
                                                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                                                monedaPrecioActual === 'Bs'
                                                                    ? 'bg-surface-container-lowest text-indigo-700 font-bold shadow-xs border border-indigo-200'
                                                                    : 'text-outline hover:text-on-surface'
                                                            }`}
                                                        >
                                                            Bs
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <StyledInput 
                                                prefix={monedaPrecioActual} 
                                                placeholder={monedaPrecioActual === '$us' ? "185,000" : "1,287,600"}
                                                value={datos.precio} 
                                                onChange={(e) => alCambiarDato('precio', e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    {/* Fila: Ubicación Precisa (ancho completo) */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                            Ubicación Precisa <span style={{ color: 'var(--color-error)' }}>*</span>
                                        </label>
                                        <StyledInput icon="location_on" placeholder="Ej: Equipetrol Norte, Calle 7 esq. Cordillera"
                                            value={datos.ubicacion} onChange={(e) => alCambiarDato('ubicacion', e.target.value)} />
                                    </div>

                                    {/* Superficie (Terreno y Construida con diseño directo e intuitivo) + Habitaciones */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        {/* Campo 1: Superficie Terreno */}
                                        <div className={`p-3 rounded-2xl border transition-all ${
                                            datos.tiene_terreno 
                                                ? 'bg-surface-container-lowest border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-xs' 
                                                : 'bg-surface-container-low/40 border-surface-container hover:border-surface-container-high'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined text-[18px] ${datos.tiene_terreno ? 'text-emerald-600' : 'text-outline'}`}>
                                                        landscape
                                                    </span>
                                                    <span className="font-label-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                        Sup. Terreno
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const nuevo = !datos.tiene_terreno;
                                                        alCambiarDato('tiene_terreno', nuevo);
                                                        actualizarSuperficieCombinada(nuevo, datos.superficie_terreno, datos.tiene_construida, datos.superficie_construida);
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                                        datos.tiene_terreno 
                                                            ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30' 
                                                            : 'bg-surface-container text-outline hover:text-on-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${datos.tiene_terreno ? 'bg-emerald-500 animate-pulse' : 'bg-outline/50'}`}></span>
                                                    <span>{datos.tiene_terreno ? 'Activo' : 'Activar'}</span>
                                                </button>
                                            </div>

                                            <StyledInput
                                                icon="straighten"
                                                placeholder={datos.tiene_terreno ? "Ej: 350 m²" : "Ej: 350 m² (Inactivo)"}
                                                value={datos.superficie_terreno || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!datos.tiene_terreno) alCambiarDato('tiene_terreno', true);
                                                    alCambiarDato('superficie_terreno', val);
                                                    actualizarSuperficieCombinada(true, val, datos.tiene_construida, datos.superficie_construida);
                                                }}
                                                onFocus={() => {
                                                    if (!datos.tiene_terreno) {
                                                        alCambiarDato('tiene_terreno', true);
                                                        actualizarSuperficieCombinada(true, datos.superficie_terreno, datos.tiene_construida, datos.superficie_construida);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Campo 2: Superficie Construida */}
                                        <div className={`p-3 rounded-2xl border transition-all ${
                                            datos.tiene_construida 
                                                ? 'bg-surface-container-lowest border-blue-500/40 ring-1 ring-blue-500/20 shadow-xs' 
                                                : 'bg-surface-container-low/40 border-surface-container hover:border-surface-container-high'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined text-[18px] ${datos.tiene_construida ? 'text-blue-600' : 'text-outline'}`}>
                                                        domain
                                                    </span>
                                                    <span className="font-label-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                        Sup. Construida
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const nuevo = !datos.tiene_construida;
                                                        alCambiarDato('tiene_construida', nuevo);
                                                        actualizarSuperficieCombinada(datos.tiene_terreno, datos.superficie_terreno, nuevo, datos.superficie_construida);
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                                        datos.tiene_construida 
                                                            ? 'bg-blue-500/15 text-blue-700 border border-blue-500/30' 
                                                            : 'bg-surface-container text-outline hover:text-on-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${datos.tiene_construida ? 'bg-blue-500 animate-pulse' : 'bg-outline/50'}`}></span>
                                                    <span>{datos.tiene_construida ? 'Activo' : 'Activar'}</span>
                                                </button>
                                            </div>

                                            <StyledInput
                                                icon="home_work"
                                                placeholder={datos.tiene_construida ? "Ej: 180 m²" : "Ej: 180 m² (Inactivo)"}
                                                value={datos.superficie_construida || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!datos.tiene_construida) alCambiarDato('tiene_construida', true);
                                                    alCambiarDato('superficie_construida', val);
                                                    actualizarSuperficieCombinada(datos.tiene_terreno, datos.superficie_terreno, true, val);
                                                }}
                                                onFocus={() => {
                                                    if (!datos.tiene_construida) {
                                                        alCambiarDato('tiene_construida', true);
                                                        actualizarSuperficieCombinada(datos.tiene_terreno, datos.superficie_terreno, true, datos.superficie_construida);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Campo 3: Habitaciones / Ambientes */}
                                        <div className="flex flex-col gap-1.5 pt-1 sm:pt-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-label-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                    Habitaciones
                                                </label>
                                                <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Ambientes</span>
                                            </div>
                                            <StyledInput icon="bed" placeholder="Ej: 3 dorms + dep."
                                                type="number" min="0"
                                                value={datos.habitaciones} onChange={(e) => alCambiarDato('habitaciones', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Descripción Completa del Inmueble</label>
                                            <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>{descLen} / 600 caracteres</span>
                                        </div>
                                        <StyledTextarea rows={4}
                                            placeholder="Detalla ambientes destacados, acabados de primera, orientación solar, cocina equipada, amenidades del edificio..."
                                            value={datos.descripcion_propiedad}
                                            onChange={(e) => { alCambiarDato('descripcion_propiedad', e.target.value); setDescLen(e.target.value.length); }}
                                            maxLength={600} />
                                    </div>

                                    {/* Hook + Público */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm flex items-center gap-1" style={{ color: 'var(--color-on-surface)' }}>
                                                Elemento a Destacar (Hook)
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-tertiary)' }} title="Lo que captará miradas en 3 segundos">info</span>
                                            </label>
                                            <StyledTextarea rows={2}
                                                placeholder="Ej: Churrasquera techada privada con vista despejada a toda la ciudad y 2 parqueos techados."
                                                value={datos.elemento_destacar}
                                                onChange={(e) => alCambiarDato('elemento_destacar', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm flex items-center gap-1" style={{ color: 'var(--color-on-surface)' }}>
                                                Público Objetivo (Buyer Persona)
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-secondary)' }} title="Segmentación de público objetivo">person_search</span>
                                            </label>
                                            <StyledTextarea rows={2}
                                                placeholder="Ej: Familias jóvenes consolidadas (30-48 años), ejecutivos corporativos, inversionistas airbnb."
                                                value={datos.publico_objetivo}
                                                onChange={(e) => alCambiarDato('publico_objetivo', e.target.value)} />
                                        </div>
                                    </div>

                                </div>
                            </section>

                            {/* ── Card 3: Formatos y Requerimientos de Producción ── */}
                            <section id="sec-audiovisual" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all space-y-6"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                              
                              <SectionHeader num="3" title="Formatos y Producción" color="tertiary"
                                  subtitle="Define entregables gráficos y producción audiovisual."
                                  tag="Entregables" tagIcon="movie" />

                              {/* Selector de Entregables Principales */}
                              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-surface-container space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
                                    Tipo de Entregables a Producir <span style={{ color: 'var(--color-error)' }}>*</span>
                                  </span>
                                  <span className="text-[11px] text-outline">Puedes marcar múltiples</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_arte_estatico ? 'bg-secondary-container/25 border-secondary text-on-surface shadow-xs ring-1 ring-secondary/30' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-secondary text-[22px]">image</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Arte Estático</p>
                                        <p className="text-[10px] text-outline">Área de Diseño</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_arte_estatico)} 
                                      onChange={(e) => alCambiarCheckbox('req_arte_estatico', e.target.checked)} 
                                      className="w-4 h-4 rounded text-secondary focus:ring-0 cursor-pointer" 
                                    />
                                  </label>

                                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_carrusel ? 'bg-secondary-container/25 border-secondary text-on-surface shadow-xs ring-1 ring-secondary/30' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-secondary text-[22px]">view_carousel</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Carrusel</p>
                                        <p className="text-[10px] text-outline">Área de Diseño</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_carrusel)} 
                                      onChange={(e) => alCambiarCheckbox('req_carrusel', e.target.checked)} 
                                      className="w-4 h-4 rounded text-secondary focus:ring-0 cursor-pointer" 
                                    />
                                  </label>

                                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_reel ? 'bg-tertiary-fixed/30 border-tertiary text-on-surface shadow-xs ring-1 ring-tertiary/30' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-tertiary text-[22px]">movie</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Grabación Reel</p>
                                        <p className="text-[10px] text-outline">Equipo Audiovisual</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_reel)} 
                                      onChange={(e) => alCambiarCheckbox('req_reel', e.target.checked)} 
                                      className="w-4 h-4 rounded text-tertiary focus:ring-0 cursor-pointer" 
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* 🎬 Especificaciones Técnicas Audiovisuales */}
                              {datos.req_reel && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-4 sm:p-5 rounded-2xl border border-tertiary/30 bg-tertiary-fixed/10 space-y-3.5 transition-all"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                                      </div>
                                      <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
                                          Requerimientos Audiovisuales
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                                            Producción Audiovisual
                                          </span>
                                        </h3>
                                        <p className="text-[11px] text-outline">Marca los componentes de producción audiovisual requeridos</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                                    {REQS_AUDIOVISUAL.map((r) => {
                                      const isChecked = Boolean(datos[r.key]);
                                      return (
                                        <button
                                          key={r.key}
                                          type="button"
                                          onClick={() => alCambiarCheckbox(r.key, !isChecked)}
                                          className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                                            isChecked
                                              ? 'bg-tertiary-fixed/40 border-tertiary text-on-surface shadow-xs ring-1 ring-tertiary/30 font-semibold'
                                              : 'bg-surface-container-lowest border-surface-container text-on-surface-variant hover:bg-surface-container-low'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full mb-1">
                                            <span className={`material-symbols-outlined text-[20px] ${
                                              isChecked ? 'text-tertiary' : 'text-outline'
                                            }`}>
                                              {r.icono}
                                            </span>
                                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                              isChecked ? 'bg-tertiary border-tertiary text-white' : 'border-outline-variant bg-surface-container-low'
                                            }`}>
                                              {isChecked && <span className="material-symbols-outlined text-[13px]">check</span>}
                                            </span>
                                          </div>
                                          <span className="text-xs font-bold truncate block w-full">{r.label}</span>
                                          <span className="text-[10px] text-outline truncate block w-full mt-0.5">{r.desc}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}

                              {/* Inputs Inferiores: Fecha de Rodaje y Notas Técnicas */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="flex flex-col gap-1.5">
                                  <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                    Fecha Tentativa de Rodaje
                                  </label>
                                  <StyledInput 
                                    type="date" 
                                    icon="calendar_today"
                                    value={datos.fecha_rodaje || ''} 
                                    onChange={(e) => alCambiarDato('fecha_rodaje', e.target.value)}
                                  />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                    Notas Técnicas para la Producción
                                  </label>
                                  <StyledInput 
                                    type="text" 
                                    icon="notes"
                                    value={datos.notas_produccion || ''} 
                                    onChange={(e) => alCambiarDato('notas_produccion', e.target.value)}
                                    placeholder="Ej: Pedir llaves en portería con el código 402, mejor luz al atardecer." 
                                  />
                                </div>
                              </div>

                            </section>

                            {/* ── Card 4: Pauta Digital ── */}
                            <section id="sec-pauta" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all space-y-6"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                              <SectionHeader num="4" title="Pauta Digital y Tráfico" color="green"
                                  subtitle="Configuración de presupuesto e inversión publicitaria en redes (Meta Ads & Tráfico)."
                                  tag="Campañas Meta" tagIcon="campaign" />
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Plataforma Publicitaria</label>
                                    <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Canal de pauta</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5 h-[44px] p-1 rounded-xl bg-surface-container-low border border-surface-container items-center">
                                    {[
                                      { id: 'Facebook / Instagram', label: 'Meta (FB/IG)', icon: 'campaign', color: 'text-blue-600', active: 'bg-surface-container-lowest text-blue-700 shadow-xs border-blue-300 ring-1 ring-blue-400/30 font-bold' },
                                      { id: 'TikTok Ads', label: 'TikTok Ads', icon: 'play_circle', color: 'text-pink-600', active: 'bg-surface-container-lowest text-pink-700 shadow-xs border-pink-300 ring-1 ring-pink-400/30 font-bold' },
                                      { id: 'Google Ads', label: 'Google Ads', icon: 'ads_click', color: 'text-amber-600', active: 'bg-surface-container-lowest text-amber-700 shadow-xs border-amber-300 ring-1 ring-amber-400/30 font-bold' }
                                    ].map((plat) => {
                                      const isSelected = datos.plataforma === plat.id;
                                      return (
                                        <button
                                          key={plat.id}
                                          type="button"
                                          onClick={() => alCambiarDato('plataforma', plat.id)}
                                          className={`h-full flex items-center justify-center gap-1.5 px-2 rounded-lg text-xs transition-all border ${
                                            isSelected 
                                              ? `${plat.active}` 
                                              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                                          }`}
                                        >
                                          <span className={`material-symbols-outlined text-[15px] ${isSelected ? plat.color : 'text-outline'}`}>
                                            {plat.icon}
                                          </span>
                                          <span className="truncate">{plat.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Moneda</label>
                                    <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Divisa</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 h-[44px] p-1 rounded-xl bg-surface-container-low border border-surface-container items-center">
                                    {[
                                      { id: 'USD', label: 'USD ($)', icon: 'attach_money', color: 'text-emerald-600', active: 'bg-surface-container-lowest text-emerald-700 shadow-xs border-emerald-300 ring-1 ring-emerald-400/30 font-bold' },
                                      { id: 'Bs', label: 'Bs.', icon: 'payments', color: 'text-indigo-600', active: 'bg-surface-container-lowest text-indigo-700 shadow-xs border-indigo-300 ring-1 ring-indigo-400/30 font-bold' }
                                    ].map((m) => {
                                      const isSelected = datos.moneda === m.id;
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => alCambiarDato('moneda', m.id)}
                                          className={`h-full flex items-center justify-center gap-1 px-1.5 rounded-lg text-xs transition-all border ${
                                            isSelected 
                                              ? `${m.active}` 
                                              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                                          }`}
                                        >
                                          <span className={`material-symbols-outlined text-[15px] ${isSelected ? m.color : 'text-outline'}`}>
                                            {m.icon}
                                          </span>
                                          <span className="truncate">{m.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Presupuesto Estimado</label>
                                    <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Inversión</span>
                                  </div>
                                  <StyledInput 
                                    type="number" 
                                    icon="payments" 
                                    placeholder="Ej: 150" 
                                    value={datos.presupuesto} 
                                    onChange={(e) => alCambiarDato('presupuesto', e.target.value)} 
                                  />
                                </div>
                              </div>

                              <div className="space-y-4 pt-2">
                                <div className="flex flex-col gap-2">
                                  <label className="font-label-sm font-semibold flex items-center justify-between" style={{ color: 'var(--color-on-surface)' }}>
                                    <span>Duración y Calendario de Pauta</span>
                                    <span className="text-[11px] font-normal text-outline">Selecciona días específicos en el calendario o ciclo del 28 al 28</span>
                                  </label>
                                  <SelectorDuracionPauta 
                                    valor={datos.periodo_pauta} 
                                    alCambiar={(nuevoPeriodo) => alCambiarDato('periodo_pauta', nuevoPeriodo)} 
                                  />
                                </div>

                                <div className="flex flex-col gap-1.5 pt-2">
                                  <label className="font-label-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>Descripción y Objetivos de la Pauta</label>
                                  <StyledTextarea 
                                    rows={2} 
                                    value={datos.descripcion_pauta} 
                                    onChange={(e) => alCambiarDato('descripcion_pauta', e.target.value)} 
                                    placeholder="Ej: Generación de leads al WhatsApp inmobiliario, segmentar solo zona equipetrol y norte..."
                                  />
                                </div>
                              </div>
                            </section>

                        </motion.div>

                {/* ── Sticky Action Bar con Botón "+" de Añadir Requerimiento ── */}
                <div className="sticky bottom-4 z-40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
                    style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    
                    {/* Contador / Resumen a la izquierda */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
                        {cantidadTotal > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                                <span className="font-label-md text-xs sm:text-sm font-semibold text-on-surface">
                                    {cantidadTotal} {cantidadTotal === 1 ? 'requerimiento listo' : 'requerimientos listos'}
                                    {requerimientosLista.length > 0 && (
                                        <span className="text-outline font-normal text-xs ml-1.5">
                                            ({requerimientosLista.length} en {requerimientosLista.length === 1 ? 'burbuja' : 'burbujas'}{datos.nombre_propiedad?.trim() && editandoIndex === null ? ' + 1 en formulario' : ''})
                                        </span>
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2" style={{ color: 'var(--color-outline)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>verified_user</span>
                                <span className="font-body-sm text-[13px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Ingresa una propiedad o añade con (+)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción a la derecha */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button type="button"
                            className="font-label-md transition-all active:scale-95 text-center flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high border-none cursor-pointer"
                            onClick={() => window.location.href = '/agente/dashboard'}>
                            Cancelar
                        </button>

                        {/* Botón "+" para añadir requerimiento como burbuja y cerrar formulario */}
                        <button
                            type="button"
                            onClick={alAnadirRequerimiento}
                            disabled={cargando || isCollapsing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-label-md font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer bg-primary-fixed/40 hover:bg-primary-fixed text-on-primary-fixed border border-primary/30 shadow-xs"
                            title="Añadir este requerimiento a las burbujas y limpiar para el siguiente"
                        >
                            <span className="material-symbols-outlined text-[19px]">
                                {editandoIndex !== null ? 'check_circle' : 'add'}
                            </span>
                            <span>
                                {editandoIndex !== null ? 'Actualizar burbuja' : 'Añadir requerimiento (+)'}
                            </span>
                        </button>

                        {/* Botón azul contabilizador de requerimientos y guardado masivo */}
                        <button type="submit" disabled={cargando || isCollapsing || cantidadTotal === 0}
                            className="flex items-center justify-center gap-2.5 font-label-md font-semibold transition-all active:scale-95 text-center px-5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-md bg-primary text-on-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                opacity: cargando ? 0.8 : (cantidadTotal === 0 ? 0.5 : 1),
                                boxShadow: cantidadTotal > 0 ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                            }}
                            title={cantidadTotal === 0 ? 'Completa al menos una propiedad para guardar' : `Guardar ${cantidadTotal} requerimiento${cantidadTotal > 1 ? 's' : ''} en la base de datos`}
                        >
                            <span className={`material-symbols-outlined ${cargando ? 'animate-spin' : ''}`}
                                style={{ fontSize: '19px' }}>
                                {cargando ? 'progress_activity' : 'rocket_launch'}
                            </span>
                            
                            <span>
                                {cargando
                                    ? `Guardando (${cantidadTotal})...`
                                    : cantidadTotal === 0
                                        ? 'Crear Requerimiento'
                                        : cantidadTotal === 1
                                            ? 'Crear 1 Requerimiento'
                                            : `Crear ${cantidadTotal} Requerimientos`}
                            </span>

                            {/* Badge contabilizador numérico visible */}
                            {cantidadTotal > 0 && !cargando && (
                                <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-white text-primary flex items-center justify-center text-[11px] font-bold shadow-xs">
                                    {cantidadTotal}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}