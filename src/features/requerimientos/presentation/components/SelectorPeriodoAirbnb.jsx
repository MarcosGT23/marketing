import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESES = [
    { num: 1, nombre: 'Enero', corto: 'Ene' },
    { num: 2, nombre: 'Febrero', corto: 'Feb' },
    { num: 3, nombre: 'Marzo', corto: 'Mar' },
    { num: 4, nombre: 'Abril', corto: 'Abr' },
    { num: 5, nombre: 'Mayo', corto: 'May' },
    { num: 6, nombre: 'Junio', corto: 'Jun' },
    { num: 7, nombre: 'Julio', corto: 'Jul' },
    { num: 8, nombre: 'Agosto', corto: 'Ago' },
    { num: 9, nombre: 'Septiembre', corto: 'Sep' },
    { num: 10, nombre: 'Octubre', corto: 'Oct' },
    { num: 11, nombre: 'Noviembre', corto: 'Nov' },
    { num: 12, nombre: 'Diciembre', corto: 'Dic' },
];

export default function SelectorPeriodoAirbnb({ valor, alCambiar }) {
    const [abierto, setAbierto] = useState(false);
    const [tabActivo, setTabActivo] = useState('proximos'); // 'proximos' | '2026' | '2027' | 'flexible'
    const [anoActual, setAnoActual] = useState(2026);
    const contenedorRef = useRef(null);

    // Parsear el valor seleccionado actual (ej: "Septiembre 2026")
    const partes = (valor || 'Septiembre 2026').split(' ');
    const mesSeleccionadoNombre = partes[0] || 'Septiembre';
    const anoSeleccionado = parseInt(partes[1] || '2026', 10);

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

    const seleccionarMes = (nombreMes, ano) => {
        const nuevoPeriodo = `${nombreMes} ${ano}`;
        alCambiar('periodo_mensual', nuevoPeriodo);
        setAbierto(false);
    };

    // Lista de próximos meses dinámicos desde Septiembre 2026
    const proximosMeses = [
        { mes: 'Septiembre', ano: 2026, destacado: 'Mes en curso', q: 'Q3' },
        { mes: 'Octubre', ano: 2026, destacado: 'Próximo', q: 'Q4' },
        { mes: 'Noviembre', ano: 2026, destacado: 'Planificación', q: 'Q4' },
        { mes: 'Diciembre', ano: 2026, destacado: 'Cierre de año', q: 'Q4' },
        { mes: 'Enero', ano: 2027, destacado: 'Nuevo ciclo', q: 'Q1' },
        { mes: 'Febrero', ano: 2027, destacado: 'Verano', q: 'Q1' },
        { mes: 'Marzo', ano: 2027, destacado: 'Otoño', q: 'Q1' },
        { mes: 'Abril', ano: 2027, destacado: 'Q2', q: 'Q2' },
    ];

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
                    <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
                        calendar_month
                    </span>
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-xs sm:text-sm font-bold text-on-surface">
                            {valor || 'Septiembre 2026'}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container/40 text-on-secondary-container">
                            Ciclo Activo
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
                        className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-full sm:w-[480px] bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl p-4 sm:p-6"
                        style={{
                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                        }}
                    >
                        {/* Selector de Pestañas Superior estilo Airbnb (Fechas / Meses / Flexible) */}
                        <div className="flex items-center justify-center mb-5">
                            <div className="inline-flex p-1 rounded-full bg-surface-container-low border border-surface-container/60 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setTabActivo('proximos')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        tabActivo === 'proximos'
                                            ? 'bg-white text-on-surface shadow-xs'
                                            : 'text-outline hover:text-on-surface'
                                    }`}
                                >
                                    Próximos Meses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTabActivo('2026'); setAnoActual(2026); }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        tabActivo === '2026'
                                            ? 'bg-white text-on-surface shadow-xs'
                                            : 'text-outline hover:text-on-surface'
                                    }`}
                                >
                                    Año 2026
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTabActivo('2027'); setAnoActual(2027); }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        tabActivo === '2027'
                                            ? 'bg-white text-on-surface shadow-xs'
                                            : 'text-outline hover:text-on-surface'
                                    }`}
                                >
                                    Año 2027
                                </button>
                            </div>
                        </div>

                        {/* Vista: Próximos Meses (Recomendados para Marketing Inmobiliario) */}
                        {tabActivo === 'proximos' && (
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                                        Campañas en curso y próximas
                                    </span>
                                    <span className="text-[11px] text-outline">
                                        2026 - 2027
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {proximosMeses.map((item) => {
                                        const seleccionado = mesSeleccionadoNombre === item.mes && anoSeleccionado === item.ano;
                                        return (
                                            <button
                                                key={`${item.mes}-${item.ano}`}
                                                type="button"
                                                onClick={() => seleccionarMes(item.mes, item.ano)}
                                                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                                                    seleccionado
                                                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-md scale-[1.02]'
                                                        : 'bg-surface-container-low/60 hover:bg-surface-container-low border-transparent hover:border-surface-container-high text-on-surface'
                                                }`}
                                            >
                                                {/* Círculo indicador estilo Airbnb */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                                    seleccionado
                                                        ? 'bg-white text-neutral-900 shadow-xs'
                                                        : 'bg-surface-container text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary'
                                                }`}>
                                                    {item.mes.slice(0, 3)}
                                                </div>

                                                <span className={`text-xs font-bold capitalize ${seleccionado ? 'text-white' : 'text-on-surface'}`}>
                                                    {item.mes}
                                                </span>
                                                <span className={`text-[10px] mt-0.5 ${seleccionado ? 'text-white/80' : 'text-outline'}`}>
                                                    {item.ano}
                                                </span>

                                                {/* Mini badge descriptivo */}
                                                <span className={`text-[9px] font-semibold mt-1 px-1.5 py-0.2 rounded-full ${
                                                    seleccionado
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-surface-container text-outline'
                                                }`}>
                                                    {item.destacado}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Vista: Año Completo con Navegación de Meses */}
                        {(tabActivo === '2026' || tabActivo === '2027') && (
                            <div>
                                {/* Cabecera de navegación de año con flechas */}
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nuevoAno = anoActual - 1;
                                            setAnoActual(nuevoAno);
                                            setTabActivo(String(nuevoAno));
                                        }}
                                        className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-all cursor-pointer"
                                        title="Año anterior"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                    </button>

                                    <h4 className="font-display font-bold text-sm sm:text-base text-on-surface capitalize">
                                        Año Operativo {anoActual}
                                    </h4>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nuevoAno = anoActual + 1;
                                            setAnoActual(nuevoAno);
                                            setTabActivo(String(nuevoAno));
                                        }}
                                        className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-all cursor-pointer"
                                        title="Año siguiente"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                    </button>
                                </div>

                                {/* Rejilla de los 12 meses */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {MESES.map((m) => {
                                        const seleccionado = mesSeleccionadoNombre === m.nombre && anoSeleccionado === anoActual;
                                        return (
                                            <button
                                                key={m.num}
                                                type="button"
                                                onClick={() => seleccionarMes(m.nombre, anoActual)}
                                                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all cursor-pointer ${
                                                    seleccionado
                                                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm scale-[1.02]'
                                                        : 'bg-surface-container-low/50 hover:bg-surface-container-low border-transparent text-on-surface hover:border-surface-container'
                                                }`}
                                            >
                                                {/* Círculo estilo Airbnb */}
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 ${
                                                    seleccionado
                                                        ? 'bg-white text-neutral-900'
                                                        : 'bg-surface-container text-on-surface-variant'
                                                }`}>
                                                    {m.num}
                                                </div>
                                                <span className="text-xs font-semibold">
                                                    {m.nombre}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pie del desplegable con periodo actual y botón de cierre */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-low text-xs">
                            <span className="text-outline">
                                Seleccionado: <strong className="text-on-surface">{valor || 'Septiembre 2026'}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setAbierto(false)}
                                className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-all cursor-pointer"
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
