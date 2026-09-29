import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BurbujasRequerimientos from './BurbujasRequerimientos';
import SelectorPeriodoAirbnb from './SelectorPeriodoAirbnb';
import SelectorAgenteAirbnb from './SelectorAgenteAirbnb';

/* ─── Stepper ─── */
const STEPS = [
    { id: 'sec-campana',    num: 1, label: 'Campaña',      sub: 'Datos de control',    color: 'primary' },
    { id: 'sec-propiedad',  num: 2, label: 'Propiedad',    sub: 'Ficha comercial',     color: 'secondary' },
    { id: 'sec-audiovisual',num: 3, label: 'Video & Foto', sub: 'Sebas y Marco',       color: 'tertiary' },
    { id: 'sec-pauta',      num: 4, label: 'Pauta Digital',sub: 'Brenda / Meta Ads',   color: 'green' },
];

const stepBg = {
    primary:   { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary)', ring: 'var(--color-primary-fixed)' },
    secondary: { bg: 'var(--color-secondary-fixed-dim)', text: 'var(--color-on-secondary-fixed)', ring: 'var(--color-secondary-fixed)' },
    tertiary:  { bg: 'var(--color-tertiary-fixed)', text: 'var(--color-on-tertiary-fixed-variant)', ring: 'var(--color-tertiary-fixed-dim)' },
    green:     { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)', ring: 'rgba(108,248,187,0.3)' },
};

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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                </div>
                            </section>

                            {/* ── Card 2: Propiedad ── */}
                            <section id="sec-propiedad" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <SectionHeader num="2" title="Datos de la Propiedad" color="secondary"
                                    subtitle="Información base para piezas gráficas, copys de venta y ficha técnica."
                                    tag="Insumo para Isac" tagIcon="draw" />

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

                                    {/* Categoría + Tipo de operación */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Categoría de Inmueble <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <StyledSelect value={datos.categoria} onChange={(e) => alCambiarDato('categoria', e.target.value)}>
                                                <option value="Casa">Casa Independiente / Condominio</option>
                                                <option value="Departamento">Departamento / Suite</option>
                                                <option value="Penthouse">Penthouse de Lujo</option>
                                                <option value="Terreno">Terreno Urbanizado</option>
                                                <option value="Comercial">Oficina Comercial / Local</option>
                                            </StyledSelect>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Tipo de Operación <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--color-surface-container-low)', height: '44px' }}>
                                                {['Venta', 'Alquiler', 'Anticrético'].map(op => (
                                                    <label key={op} className="flex-1 flex items-center justify-center h-full rounded cursor-pointer font-label-sm transition-all"
                                                        style={{
                                                            background: datos.tipo === op ? 'var(--color-primary)' : 'transparent',
                                                            color: datos.tipo === op ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                                                            fontSize: '12px', fontWeight: 500,
                                                        }}>
                                                        <input type="radio" name="tipo_operacion" value={op} checked={datos.tipo === op}
                                                            onChange={() => alCambiarDato('tipo', op)} className="sr-only" />
                                                        {op}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ubicación + Precio */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Ubicación Precisa <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <StyledInput icon="location_on" placeholder="Ej: Equipetrol Norte, Calle 7 esq. Cordillera"
                                                value={datos.ubicacion} onChange={(e) => alCambiarDato('ubicacion', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Precio de Oferta Comercial <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <StyledInput prefix="$us" placeholder="185,000"
                                                value={datos.precio} onChange={(e) => alCambiarDato('precio', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Superficie + Habitaciones */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Superficie Total</label>
                                            <StyledInput icon="straighten" placeholder="Ej: 210 m²"
                                                value={datos.superficie} onChange={(e) => alCambiarDato('superficie', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>Habitaciones / Ambientes</label>
                                            <StyledInput icon="bed" placeholder="Ej: 3 dormitorios + dependencia"
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
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-secondary)' }} title="Segmentación para Brenda">person_search</span>
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
                            <section id="sec-audiovisual" className="p-5 sm:p-6 md:p-8 rounded-2xl transition-all space-y-6"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center font-bold text-sm">
                                    3
                                  </span>
                                  <div>
                                    <h2 className="font-display font-bold text-lg text-on-surface">Formatos y Requerimientos de Producción</h2>
                                    <p className="text-xs text-outline">
                                      Define el tipo de entregable para asignar automáticamente a Diseño (Isac) y/o Video (Sebas y Marco).
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {(datos.req_arte_estatico || datos.req_carrusel) && (
                                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">palette</span> Isac
                                    </span>
                                  )}
                                  {datos.req_reel && (
                                    <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">videocam</span> Sebas / Marco
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Selector de Entregables Principales */}
                              <div className="p-4 bg-surface-container-low/60 rounded-xl border border-surface-container space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
                                  Tipo de Entregables a Producir *
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_arte_estatico ? 'bg-secondary-container/20 border-secondary text-on-surface shadow-xs' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-secondary text-[20px]">image</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Arte Estático</p>
                                        <p className="text-[10px] text-outline">Asignado a Isac</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_arte_estatico)} 
                                      onChange={(e) => alCambiarCheckbox('req_arte_estatico', e.target.checked)} 
                                      className="w-4 h-4 rounded text-secondary focus:ring-0" 
                                    />
                                  </label>

                                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_carrusel ? 'bg-secondary-container/20 border-secondary text-on-surface shadow-xs' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-secondary text-[20px]">view_carousel</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Carrusel</p>
                                        <p className="text-[10px] text-outline">Asignado a Isac</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_carrusel)} 
                                      onChange={(e) => alCambiarCheckbox('req_carrusel', e.target.checked)} 
                                      className="w-4 h-4 rounded text-secondary focus:ring-0" 
                                    />
                                  </label>

                                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    datos.req_reel ? 'bg-tertiary-fixed/30 border-tertiary text-on-surface shadow-xs' : 'bg-surface-container-lowest border-surface-container text-outline hover:bg-surface-container-low'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="material-symbols-outlined text-tertiary text-[20px]">movie</span>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">Grabación Reel</p>
                                        <p className="text-[10px] text-outline">Asignado a Sebas / Marco</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={Boolean(datos.req_reel)} 
                                      onChange={(e) => alCambiarCheckbox('req_reel', e.target.checked)} 
                                      className="w-4 h-4 rounded text-tertiary focus:ring-0" 
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Inputs Inferiores: Fecha de Rodaje y Notas Técnicas */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-outline mb-1.5">Fecha Tentativa de Rodaje</label>
                                  <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">calendar_today</span>
                                    <input 
                                      type="text" 
                                      value={datos.fecha_rodaje || ''} 
                                      onChange={(e) => alCambiarDato('fecha_rodaje', e.target.value)}
                                      placeholder="Ej: Jueves 17 Sept, 16:30 hrs" 
                                      className="w-full pl-10 pr-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container border-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-outline mb-1.5">Notas Técnicas para la Producción</label>
                                  <input 
                                    type="text" 
                                    value={datos.notas_produccion || ''} 
                                    onChange={(e) => alCambiarDato('notas_produccion', e.target.value)}
                                    placeholder="Ej: Pedir llaves en portería con el código 402, mejor luz al atardecer." 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container border-none"
                                  />
                                </div>
                              </div>

                            </section>

                            {/* ── Card 4: Pauta Digital ── */}
                            <section id="sec-pauta" className="rounded-2xl p-5 sm:p-6 md:p-8 transition-all"
                                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <SectionHeader num="4" title="Pauta Digital y Distribución" color="green"
                                    subtitle="Parámetros de distribución publicitaria, alcance proyectado y canales con Brenda."
                                    tag="Community Manager" tagIcon="campaign" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Canales - multi-selección */}
                                    <div className="md:col-span-2 flex flex-col gap-1.5">
                                        <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                            Canales de Tráfico & Ads <span style={{ color: 'var(--color-error)' }}>*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'Facebook / Instagram', label: 'Meta (IG / FB)', icon: 'thumb_up' },
                                                { value: 'TikTok', label: 'TikTok Ads', icon: 'music_note' },
                                            ].map(({ value, label, icon }) => {
                                                const canales = Array.isArray(datos.canales) ? datos.canales : [];
                                                const active = canales.includes(value);
                                                const toggleCanal = () => {
                                                    const next = active
                                                        ? canales.filter(c => c !== value)
                                                        : [...canales, value];
                                                    alCambiarDato('canales', next);
                                                };
                                                return (
                                                    <label key={value}
                                                        className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all font-label-md"
                                                        style={{
                                                            background: active ? 'rgba(219,225,255,0.5)' : 'var(--color-surface-container-low)',
                                                            boxShadow: active ? '0 0 0 2px var(--color-primary-container)' : '0 0 0 1px transparent',
                                                            color: 'var(--color-on-surface)',
                                                            fontSize: '13px',
                                                            transition: 'all 0.15s',
                                                        }}>
                                                        <input type="checkbox" checked={active} onChange={toggleCanal} className="sr-only" />
                                                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                                            style={{ background: active ? 'var(--color-primary-container)' : 'var(--color-surface-container-high)', transition: 'background 0.15s' }}>
                                                            {active && <svg viewBox="0 0 12 12" fill="none" style={{ width: '10px', height: '10px' }}>
                                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>}
                                                        </div>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: active ? 'var(--color-primary)' : 'var(--color-outline)' }}>{icon}</span>
                                                        {label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {Array.isArray(datos.canales) && datos.canales.length > 0 && (
                                            <p className="font-body-sm text-[11px] mt-1" style={{ color: 'var(--color-secondary)' }}>
                                                {datos.canales.length} canal{datos.canales.length > 1 ? 'es' : ''} seleccionado{datos.canales.length > 1 ? 's' : ''}: {datos.canales.join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Presupuesto */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                                Presupuesto Ads <span style={{ color: 'var(--color-error)' }}>*</span>
                                            </label>
                                            <span className="font-label-sm text-[11px] font-semibold" style={{ color: 'var(--color-secondary)' }}>Recomendado</span>
                                        </div>
                                        <StyledInput prefix="$us" placeholder="120" type="text"
                                            value={datos.presupuesto} onChange={(e) => alCambiarDato('presupuesto', e.target.value)} />
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