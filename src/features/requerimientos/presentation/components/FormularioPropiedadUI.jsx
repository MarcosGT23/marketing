import { useState, useCallback } from 'react';

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
    border: '1px solid transparent',
    color: 'var(--color-on-surface)',
    fontSize: '14px',
    height: '44px',
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'all 0.15s',
    width: '100%',
};

function StyledInput({ icon, prefix, children, ...rest }) {
    const [focused, setFocused] = useState(false);
    const style = {
        ...inputBase,
        background: focused ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
        boxShadow: focused ? '0 0 0 2px rgba(37,99,235,0.25)' : 'none',
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
                border: '1px solid transparent',
                borderRadius: '0.5rem',
                color: 'var(--color-on-surface)',
                fontSize: '14px',
                padding: '10px 14px',
                outline: 'none',
                boxShadow: focused ? '0 0 0 2px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.15s',
                resize: 'vertical',
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
        />
    );
}

/* ─── Checkbox Card ─── */
function CheckboxCard({ icon, iconColor, label, sub, checked, onChange }) {
    return (
        <label
            className="relative flex flex-col p-4 rounded-xl cursor-pointer select-none transition-all"
            style={{
                background: checked ? 'rgba(219,225,255,0.4)' : 'var(--color-surface-container-low)',
                boxShadow: checked ? '0 0 0 2px var(--color-primary-container)' : '0 0 0 1px transparent',
            }}
        >
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: iconColor }}>{icon}</span>
                <div className="w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{
                        background: checked ? 'var(--color-primary-container)' : 'var(--color-surface-container-high)',
                    }}>
                    <svg viewBox="0 0 12 12" fill="none" style={{ width: '12px', height: '12px', opacity: checked ? 1 : 0 }}>
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            <span className="font-title-md" style={{ color: 'var(--color-on-surface)', fontSize: '14px', fontWeight: 600 }}>{label}</span>
            <span className="font-body-sm mt-1" style={{ color: 'var(--color-outline)', fontSize: '11px', lineHeight: '1.4' }}>{sub}</span>
        </label>
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
export default function FormularioPropiedadUI({ datos, alCambiarDato, alCambiarCheckbox, alEnviar, cargando, agentes = [] }) {
    const [descLen, setDescLen] = useState(0);
    const [submitted, setSubmitted] = useState(false);



    const handleSubmit = async (e) => {
        setSubmitted(true);
        await alEnviar(e);
        setSubmitted(false);
    };

    const AV_TASKS = [
        { key: 'req_guion',    icon: 'description', iconColor: 'var(--color-primary)',           label: 'Guion Técnico',   sub: 'Storyline & estructura de ganchos' },
        { key: 'req_fotos',    icon: 'photo_camera', iconColor: 'var(--color-secondary)',         label: 'Sesión de Fotos', sub: 'HDR, gran angular y detalles' },
        { key: 'req_grabacion',icon: 'videocam',     iconColor: 'var(--color-tertiary)',           label: 'Grabación Reel',  sub: 'Tomas verticales + Drone 4K' },
        { key: 'req_edicion',  icon: 'movie_edit',   iconColor: 'var(--color-primary-container)', label: 'Postproducción',  sub: 'Cortes dinámicos, sound fx' },
        { key: 'req_voz_off',  icon: 'mic',          iconColor: 'var(--color-outline)',            label: 'Voz en Off',      sub: 'Locución profesional neutra' },
    ];

    return (
        <div className="w-full flex flex-col gap-0">

            {/* ── Stepper ── */}
            <div className="w-full max-w-4xl mx-auto mb-6">
                <div className="rounded-2xl p-3 sm:p-4 shadow-sm border border-surface-container" style={{ background: 'var(--color-surface-container-lowest)' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {STEPS.map((s) => {
                            const { bg, text } = stepBg[s.color] || stepBg.primary;
                            return (
                                <a key={s.id} href={`#${s.id}`}
                                    className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl transition-all"
                                    style={{ background: s.num === 1 ? 'rgba(219,225,255,0.4)' : 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
                                    onMouseLeave={e => e.currentTarget.style.background = s.num === 1 ? 'rgba(219,225,255,0.4)' : 'transparent'}
                                >
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-label-md text-xs sm:text-sm flex-shrink-0"
                                        style={{ background: bg, color: text }}>
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

            {/* ── Form ── */}
            <form id="requerimiento-form" onSubmit={handleSubmit}
                className="w-full max-w-4xl mx-auto flex flex-col gap-6">

                {/* ── Card 1: Campaña ── */}
                <section id="sec-campana" className="rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm transition-all hover:shadow-md border border-surface-container"
                    style={{ background: 'var(--color-surface-container-lowest)' }}>
                    <SectionHeader num="1" title="Registro de Campaña" color="primary"
                        subtitle="Datos de control interno y asignación del requerimiento mensual."
                        tag="Requerido" tagIcon="flag" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agente */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                    Agente Solicitante <span style={{ color: 'var(--color-error)' }}>*</span>
                                </label>
                                <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Rol: Responsable</span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                                        style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
                                        {agentes.find(a => a.id_usuario === datos.id_agente)?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AG'}
                                    </div>
                                </div>
                                <StyledSelect
                                    style={{ ...inputBase, paddingLeft: '44px', paddingRight: '40px', appearance: 'none', cursor: 'pointer' }}
                                    value={datos.id_agente ? String(datos.id_agente) : ''}
                                    onChange={(e) => alCambiarDato('id_agente', e.target.value ? parseInt(e.target.value, 10) : '')}
                                >
                                    <option value="">Seleccionar Agente</option>
                                    {agentes.map(ag => (
                                        <option key={ag.id_usuario} value={String(ag.id_usuario)}>{ag.nombre}</option>
                                    ))}
                                </StyledSelect>
                            </div>
                        </div>

                        {/* Periodo */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-label-sm" style={{ color: 'var(--color-on-surface)' }}>
                                    Periodo Mensual <span style={{ color: 'var(--color-error)' }}>*</span>
                                </label>
                                <span className="font-body-sm text-[11px]" style={{ color: 'var(--color-outline)' }}>Ciclo operativo</span>
                            </div>
                            <StyledInput icon="event_repeat" value={datos.periodo_mensual}
                                onChange={(e) => alCambiarDato('periodo_mensual', e.target.value)}
                                placeholder="Ej: Septiembre 2026" required>
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center material-symbols-outlined"
                                    style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>check_circle</span>
                            </StyledInput>
                        </div>
                    </div>
                </section>

                {/* ── Card 2: Propiedad ── */}
                <section id="sec-propiedad" className="rounded-xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md"
                    style={{ background: 'var(--color-surface-container-lowest)' }}>
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

                {/* 3. Formatos y Requerimientos de Producción */}
                <section id="sec-audiovisual" className="bg-surface-container-lowest p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm transition-all hover:shadow-md border border-surface-container space-y-6">
                  
                  {/* Cabecera idéntica a la imagen */}
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

                  {/* Tarjetas de Tareas Técnicas (Captura de Imagen) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'req_guion', label: 'Guion Técnico', desc: 'Storyline & estructura de ganchos' },
                      { id: 'req_fotos', label: 'Sesión de Fotos', desc: 'HDR, gran angular y detalles' },
                      { id: 'req_reel', label: 'Grabación Reel', desc: 'Tomas verticales + Drone 4K' },
                      { id: 'req_edicion', label: 'Postproducción', desc: 'Cortes dinámicos, sound fx' },
                      { id: 'req_voz_off', label: 'Voz en Off', desc: 'Locución profesional neutra' }
                    ].map(card => (
                      <div 
                        key={card.id} 
                        onClick={() => alCambiarCheckbox(card.id, !datos[card.id])}
                        className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all min-h-[125px] ${
                          datos[card.id] 
                            ? 'bg-primary-fixed/20 border-primary-container/40 shadow-xs ring-1 ring-primary-container/20' 
                            : 'bg-surface-container-low/40 border-surface-container hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex justify-end items-start">
                          <input 
                            type="checkbox" 
                            checked={Boolean(datos[card.id])} 
                            onChange={(e) => { e.stopPropagation(); alCambiarCheckbox(card.id, e.target.checked); }}
                            className="w-4 h-4 rounded text-primary-container focus:ring-0 cursor-pointer"
                          />
                        </div>
                        <div className="mt-3">
                          <p className="font-display font-semibold text-xs text-on-surface leading-tight">{card.label}</p>
                          <p className="text-[11px] text-outline mt-1 leading-snug">{card.desc}</p>
                        </div>
                      </div>
                    ))}
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
                <section id="sec-pauta" className="rounded-xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md"
                    style={{ background: 'var(--color-surface-container-lowest)' }}>
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

                {/* ── Sticky Action Bar ── */}
                <div className="sticky bottom-4 z-40 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-surface-container/60"
                    style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' }}>
                    <div className="hidden sm:flex items-center gap-2" style={{ color: 'var(--color-outline)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>verified_user</span>
                        <span className="font-body-sm text-[13px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Guardado automático en borrador
                        </span>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button type="button"
                            className="w-full sm:w-auto font-label-md transition-all active:scale-95 text-center flex items-center justify-center"
                            style={{
                                padding: '10px 20px', height: '42px', borderRadius: '0.75rem',
                                background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)',
                                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                            }}
                            onClick={() => window.location.href = '/agente/dashboard'}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 font-label-md font-semibold transition-all active:scale-95 text-center"
                            style={{
                                padding: '10px 24px', height: '42px', borderRadius: '0.75rem',
                                background: submitted ? 'var(--color-secondary)' : 'var(--color-primary-container)',
                                color: 'var(--color-on-primary)',
                                border: 'none', cursor: cargando ? 'not-allowed' : 'pointer',
                                opacity: cargando ? 0.8 : 1,
                                fontSize: '14px', fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                            }}>
                            <span className={`material-symbols-outlined ${cargando ? 'animate-spin' : ''}`}
                                style={{ fontSize: '19px' }}>
                                {cargando ? 'progress_activity' : 'rocket_launch'}
                            </span>
                            <span>{cargando ? 'Procesando...' : 'Crear Campaña Completa'}</span>
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}