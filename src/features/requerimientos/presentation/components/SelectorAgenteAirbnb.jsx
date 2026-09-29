import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelectorAgenteAirbnb({ agentes = [], valor, alCambiar }) {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [tabActivo, setTabActivo] = useState('todos'); // 'todos' | 'frecuentes'
    const contenedorRef = useRef(null);

    const agenteSeleccionado = agentes.find(
        (a) => String(a.id_usuario) === String(valor)
    );

    // Obtener iniciales del nombre
    const obtenerIniciales = (nombre = '') => {
        return nombre
            .split(' ')
            .filter(Boolean)
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'AG';
    };

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickFuera(e) {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
                setAbierto(false);
            }
        }
        if (abierto) {
            document.addEventListener('mousedown', handleClickFuera);
        }
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, [abierto]);

    const seleccionarAgente = (id) => {
        alCambiar('id_agente', id);
        setAbierto(false);
    };

    // Filtrar agentes según búsqueda y pestaña
    const agentesFiltrados = agentes.filter((ag) => {
        const coincideNombre = ag.nombre.toLowerCase().includes(busqueda.toLowerCase());
        if (!coincideNombre) return false;
        return true;
    });

    return (
        <div className="relative w-full" ref={contenedorRef}>
            
            {/* Input Gatillador estilo Airbnb */}
            <div
                onClick={() => setAbierto(!abierto)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    abierto
                        ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/20 shadow-md'
                        : 'bg-surface-container-low hover:bg-surface-container-lowest border-transparent hover:border-surface-container-high'
                }`}
                style={{ height: '44px' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar circular */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-primary text-on-primary flex-shrink-0 shadow-xs">
                        {agenteSeleccionado ? obtenerIniciales(agenteSeleccionado.nombre) : 'AG'}
                    </div>

                    <div className="flex items-center gap-2 truncate">
                        <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                            {agenteSeleccionado ? agenteSeleccionado.nombre : 'Seleccionar Agente'}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed">
                            Responsable
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-outline">
                    <span className="text-[11px] hidden sm:inline">Cambiar</span>
                    <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${abierto ? 'rotate-180 text-primary' : ''}`}>
                        expand_more
                    </span>
                </div>
            </div>

            {/* Menú Desplegable Flotante estilo Airbnb */}
            <AnimatePresence>
                {abierto && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 mt-2 z-50 w-full sm:w-[460px] bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl p-4 sm:p-6"
                        style={{
                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                        }}
                    >
                        {/* Selector de Pestañas Superior estilo Airbnb */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="inline-flex p-1 rounded-full bg-surface-container-low border border-surface-container/60 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setTabActivo('todos')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        tabActivo === 'todos'
                                            ? 'bg-white text-on-surface shadow-xs'
                                            : 'text-outline hover:text-on-surface'
                                    }`}
                                >
                                    Todos los Agentes ({agentes.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTabActivo('frecuentes')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        tabActivo === 'frecuentes'
                                            ? 'bg-white text-on-surface shadow-xs'
                                            : 'text-outline hover:text-on-surface'
                                    }`}
                                >
                                    Destacados
                                </button>
                            </div>
                        </div>

                        {/* Buscador Integrado estilo Airbnb */}
                        <div className="relative mb-4">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre o apellido..."
                                className="w-full pl-9 pr-8 py-2 bg-surface-container-low focus:bg-surface-container-lowest rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 transition-all"
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    onClick={() => setBusqueda('')}
                                    className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface text-xs"
                                >
                                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                                </button>
                            )}
                        </div>

                        {/* Grid de Agentes estilo Airbnb */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                            {agentesFiltrados.map((ag) => {
                                const seleccionado = String(ag.id_usuario) === String(valor);
                                const iniciales = obtenerIniciales(ag.nombre);

                                return (
                                    <button
                                        key={ag.id_usuario}
                                        type="button"
                                        onClick={() => seleccionarAgente(ag.id_usuario)}
                                        className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer text-left group ${
                                            seleccionado
                                                ? 'bg-neutral-900 border-neutral-900 text-white shadow-md scale-[1.01]'
                                                : 'bg-surface-container-low/60 hover:bg-surface-container-low border-transparent hover:border-surface-container-high text-on-surface'
                                        }`}
                                    >
                                        {/* Avatar Circular estilo Airbnb */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                                            seleccionado
                                                ? 'bg-white text-neutral-900 shadow-xs'
                                                : 'bg-surface-container text-primary group-hover:bg-primary-fixed group-hover:text-primary'
                                        }`}>
                                            {iniciales}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-bold truncate ${seleccionado ? 'text-white' : 'text-on-surface'}`}>
                                                {ag.nombre}
                                            </p>
                                            <p className={`text-[10px] ${seleccionado ? 'text-white/70' : 'text-outline'}`}>
                                                {ag.rol || 'Agente Inmobiliario'}
                                            </p>
                                        </div>

                                        {seleccionado && (
                                            <span className="material-symbols-outlined text-[18px] text-white flex-shrink-0">
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {agentesFiltrados.length === 0 && (
                                <div className="col-span-2 py-6 text-center text-xs text-outline">
                                    No se encontraron agentes con "{busqueda}"
                                </div>
                            )}
                        </div>

                        {/* Pie del desplegable con el agente seleccionado y botón Listo */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-low text-xs">
                            <span className="text-outline truncate max-w-[280px]">
                                Seleccionado: <strong className="text-on-surface">{agenteSeleccionado?.nombre || 'Ninguno'}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setAbierto(false)}
                                className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-all cursor-pointer active:scale-95"
                            >
                                Listo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
