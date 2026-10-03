import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIA_ICONOS = {
    'Casa': 'home',
    'Departamento': 'apartment',
    'Penthouse': 'domain',
    'Terreno': 'landscape',
    'Comercial': 'storefront'
};

export default function BurbujasRequerimientos({
    requerimientos = [],
    editandoIndex = null,
    onSeleccionar,
    onEliminar,
    onNuevo
}) {
    if (!requerimientos || requerimientos.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto mb-6">
            <div className="rounded-2xl p-4 sm:p-5"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                
                {/* Header de la sección de burbujas */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-surface-container-low">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            layers
                        </span>
                        <h3 className="font-display font-bold text-sm sm:text-base text-on-surface">
                            Requerimientos en cola
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-fixed text-on-primary-fixed">
                            {requerimientos.length} {requerimientos.length === 1 ? 'propiedad' : 'propiedades'}
                        </span>
                    </div>

                    <p className="text-xs text-outline hidden sm:block">
                        Haz clic en una burbuja para editarla o en <strong>+</strong> para sumar otra
                    </p>
                </div>

                {/* Contenedor de burbujas con animación Framer Motion */}
                <div className="flex flex-wrap gap-3 items-stretch">
                    <AnimatePresence mode="popLayout">
                        {requerimientos.map((req, idx) => {
                            const esEditando = editandoIndex === idx;
                            const icono = CATEGORIA_ICONOS[req.categoria] || 'apartment';

                            return (
                                <motion.div
                                    key={req._id || idx}
                                    layout
                                    initial={{ scale: 0.6, opacity: 0, y: 15 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.2 } }}
                                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                                    className={`relative flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer select-none group min-w-[220px] max-w-xs flex-1 sm:flex-initial ${
                                        esEditando
                                            ? 'ring-2 ring-primary/40 shadow-md'
                                            : 'hover:border-primary/30'
                                    }`}
                                    style={{
                                        background: esEditando ? 'rgba(219,225,255,0.3)' : 'var(--color-surface-container-low)',
                                        border: esEditando ? '1px solid var(--color-primary-container)' : '1px solid var(--color-outline-variant)',
                                    }}
                                    onClick={() => onSeleccionar(idx)}
                                    title="Clic para editar este requerimiento"
                                >
                                    {/* Indicador numérico flotante */}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                                        esEditando
                                            ? 'bg-primary text-on-primary'
                                            : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-on-primary-fixed'
                                    }`}>
                                        #{idx + 1}
                                    </div>

                                    {/* Ícono de tipo */}
                                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-primary">
                                        <span className="material-symbols-outlined text-[18px]">
                                            {icono}
                                        </span>
                                    </div>

                                    {/* Datos de la propiedad */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-xs text-on-surface truncate">
                                                {req.nombre_propiedad || 'Sin título'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-outline mt-0.5 truncate">
                                            <span>{req.categoria}</span>
                                            <span>•</span>
                                            <span className="text-secondary font-medium">{req.tipo}</span>
                                            {req.precio && (
                                                <>
                                                    <span>•</span>
                                                    <span>$us {req.precio}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Badges de entregables y características solicitadas */}
                                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                            {req.prioridad === 'Alta' && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                                    Alta
                                                </span>
                                            )}
                                            {req.prioridad === 'Media' && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                                    Media
                                                </span>
                                            )}
                                            {req.categoria_diseno && (req.req_arte_estatico || req.req_carrusel) ? (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 max-w-[130px] truncate" title={`Diseño: ${req.categoria_diseno}`}>
                                                    <span className="material-symbols-outlined text-[11px] text-emerald-700">palette</span>
                                                    <span className="truncate">{req.categoria_diseno}</span>
                                                </span>
                                            ) : (
                                                <>
                                                    {req.req_arte_estatico && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                                                            Arte
                                                        </span>
                                                    )}
                                                    {req.req_carrusel && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                                            Carrusel
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {req.req_reel && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[11px] text-indigo-700">videocam</span>
                                                    Reel
                                                </span>
                                            )}
                                            {req.presupuesto && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                                    Ads ${req.presupuesto}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón eliminar burbuja */}
                                    <button
                                        type="button"
                                        className="opacity-60 hover:opacity-100 hover:bg-error/10 hover:text-error p-1 rounded-lg text-outline transition-all"
                                        title="Eliminar este requerimiento de la cola"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEliminar(idx);
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>

                                    {/* Badge si está en edición */}
                                    {esEditando && (
                                        <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary shadow-xs">
                                            Editando
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Botón "+ Añadir otra propiedad" en la fila de burbujas */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onNuevo}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl font-label-md text-xs font-semibold select-none flex-shrink-0 transition-all"
                        style={{
                            border: '2px dashed var(--color-primary-container)',
                            color: 'var(--color-primary-container)',
                            background: 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(219,225,255,0.3)'; e.currentTarget.style.borderStyle = 'solid'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; }}
                        title="Añadir otro requerimiento"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Añadir otra propiedad</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
