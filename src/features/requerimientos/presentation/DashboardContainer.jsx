import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardUI from './components/DashboardUI';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';
import { notificarError } from '../../../core/ui/notifications';
import { normalizarPeriodo, obtenerPeriodoActual } from '../../../core/utils/dateUtils';
import {
    calcularMetricas,
    filtrarRequerimientos,
    obtenerOpcionesAgentes,
    obtenerPeriodos,
} from '../utils/dashboardMetrics';

const FILTROS_INICIALES = {
    agente: '',
    tipo: '',
    responsable: '',
    estado: '',
    prioridad: '',
};

export default function DashboardContainer() {
    const [requerimientos, setRequerimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [periodoComparacion, setPeriodoComparacion] = useState('');
    const [periodosResueltos, setPeriodosResueltos] = useState(false);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);

    const cargarDatos = useCallback(async (silent = false) => {
        if (!silent) setCargando(true);
        try {
            const res = await fetch('/api/requerimientos', { cache: 'no-store' });
            const json = await res.json();

            if (!res.ok || json?.error) {
                console.error('Error API dashboard:', json);
                if (!silent) notificarError(json?.error || 'No se pudieron cargar los datos del dashboard.');
                return;
            }

            setRequerimientos(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error('[DashboardContainer] Error:', err);
            if (!silent) notificarError('No se pudieron cargar los datos del dashboard. Intenta de nuevo.');
        } finally {
            if (!silent) setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos(false);
    }, [cargarDatos]);

    const periodos = useMemo(() => obtenerPeriodos(requerimientos), [requerimientos]);

    // Se resuelve una sola vez: período actual (o el más reciente) y el anterior como comparación.
    useEffect(() => {
        if (periodosResueltos || periodos.length === 0) return;

        const actual = obtenerPeriodoActual();
        const indiceActual = periodos.indexOf(actual);
        const base = indiceActual >= 0 ? actual : periodos[0];
        const indiceBase = periodos.indexOf(base);

        setPeriodoSeleccionado(base);
        setPeriodoComparacion(periodos[indiceBase + 1] || '');
        setPeriodosResueltos(true);
    }, [periodos, periodosResueltos]);

    // Mantiene selecciones válidas si los períodos cambian por sincronización.
    useEffect(() => {
        if (!periodosResueltos) return;

        if (periodos.length === 0) {
            if (periodoSeleccionado) setPeriodoSeleccionado('');
            if (periodoComparacion) setPeriodoComparacion('');
            return;
        }

        if (!periodoSeleccionado || !periodos.includes(periodoSeleccionado)) {
            const base = periodos[0];
            setPeriodoSeleccionado(base);
            setPeriodoComparacion(periodos.find(p => p !== base) || '');
            return;
        }

        if (periodoComparacion && (!periodos.includes(periodoComparacion) || periodoComparacion === periodoSeleccionado)) {
            setPeriodoComparacion(periodos.find(p => p !== periodoSeleccionado) || '');
        }
    }, [periodos, periodosResueltos, periodoSeleccionado, periodoComparacion]);

    const alCambiarPeriodo = useCallback((nuevoPeriodo) => {
        setPeriodoSeleccionado(nuevoPeriodo);
        if (periodoComparacion === nuevoPeriodo) {
            setPeriodoComparacion(periodos.find(p => p !== nuevoPeriodo) || '');
        }
    }, [periodoComparacion, periodos]);

    const alCambiarComparacion = useCallback((nuevoPeriodo) => {
        setPeriodoComparacion(nuevoPeriodo === periodoSeleccionado ? '' : nuevoPeriodo);
    }, [periodoSeleccionado]);

    const alCambiarFiltro = useCallback((campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    }, []);

    const alLimpiarFiltros = useCallback(() => {
        setFiltros(FILTROS_INICIALES);
    }, []);

    useRealtimeSync(() => {
        cargarDatos(true);
    }, ['requerimientos_propiedad', 'tareas_diseno', 'tareas_video', 'tareas_cm']);

    const requerimientosFiltrados = useMemo(
        () => filtrarRequerimientos(requerimientos, filtros),
        [requerimientos, filtros]
    );

    const requerimientosPeriodo = useMemo(
        () => requerimientosFiltrados.filter(
            r => normalizarPeriodo(r.periodo_mensual) === periodoSeleccionado
        ),
        [requerimientosFiltrados, periodoSeleccionado]
    );

    const requerimientosComparacion = useMemo(
        () => requerimientosFiltrados.filter(
            r => normalizarPeriodo(r.periodo_mensual) === periodoComparacion
        ),
        [requerimientosFiltrados, periodoComparacion]
    );

    const metricas = useMemo(() => calcularMetricas(requerimientosPeriodo), [requerimientosPeriodo]);

    const metricasComparacion = useMemo(
        () => (periodoComparacion ? calcularMetricas(requerimientosComparacion) : null),
        [periodoComparacion, requerimientosComparacion]
    );

    const resumenPeriodos = useMemo(() => {
        const mapa = new Map(periodos.map(p => [p, []]));

        requerimientosFiltrados.forEach(r => {
            const periodo = normalizarPeriodo(r.periodo_mensual);
            if (mapa.has(periodo)) mapa.get(periodo).push(r);
        });

        return periodos.map(periodo => ({
            periodo,
            ...calcularMetricas(mapa.get(periodo)),
        }));
    }, [periodos, requerimientosFiltrados]);

    const opcionesAgentes = useMemo(
        () => obtenerOpcionesAgentes(requerimientos),
        [requerimientos]
    );

    return (
        <DashboardUI
            metricas={metricas}
            metricasComparacion={metricasComparacion}
            resumenPeriodos={resumenPeriodos}
            requerimientosPeriodo={requerimientosPeriodo}
            requerimientosFiltrados={requerimientosFiltrados}
            periodos={periodos}
            cargando={cargando || (periodos.length > 0 && !periodoSeleccionado)}
            periodoSeleccionado={periodoSeleccionado}
            periodoComparacion={periodoComparacion}
            alCambiarPeriodo={alCambiarPeriodo}
            alCambiarComparacion={alCambiarComparacion}
            filtros={filtros}
            opcionesAgentes={opcionesAgentes}
            alCambiarFiltro={alCambiarFiltro}
            alLimpiarFiltros={alLimpiarFiltros}
            alActualizar={() => cargarDatos(true)}
        />
    );
}
