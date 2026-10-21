import { useState, useEffect, useCallback } from 'react';
import DashboardUI from './components/DashboardUI';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';
import { esCampanaActivada } from '../../../core/utils/campanaUtils';
import { normalizarPeriodo, obtenerPeriodoActual } from '../../../core/utils/dateUtils';

export default function DashboardContainer() {
    const [campanas, setCampanas] = useState([]);
    const [periodos, setPeriodos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodo, setPeriodo] = useState('');
    const [periodoResuelto, setPeriodoResuelto] = useState(false);

    const cargarDatos = useCallback(async (periodoFiltro, silent = false) => {
        if (!silent) setCargando(true);
        try {
            const url = periodoFiltro
                ? `/api/requerimientos?periodo=${encodeURIComponent(periodoFiltro)}`
                : '/api/requerimientos';
            const res = await fetch(url, { cache: 'no-store' });
            const json = await res.json();

            if (!res.ok || json?.error) {
                console.error("Error API dashboard:", json);
                if (!silent) alert(json?.error || 'Error cargando datos del dashboard');
                return;
            }

            setCampanas(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error('[DashboardContainer] Error:', err);
            if (!silent) alert('Error cargando datos del dashboard: ' + err.message);
        } finally {
            if (!silent) setCargando(false);
        }
    }, []);

    // Periodos mensuales disponibles en la base de datos (con campañas activadas por periodo)
    const cargarPeriodos = useCallback(async () => {
        try {
            const res = await fetch('/api/periodos', { cache: 'no-store' });
            const json = await res.json();

            if (!res.ok || json?.error) {
                console.error("Error API periodos:", json);
                return [];
            }

            return Array.isArray(json) ? json : [];
        } catch (err) {
            console.error('[DashboardContainer] Error cargando periodos:', err);
            return [];
        }
    }, []);

    // Carga inicial: se resuelve el periodo por defecto antes de pedir las campañas
    useEffect(() => {
        let cancelado = false;

        (async () => {
            const lista = await cargarPeriodos();
            if (cancelado) return;

            setPeriodos(lista);

            // Se prioriza el periodo en curso; si no existe en la base de datos,
            // se usa el periodo más reciente disponible y, si no hay ninguno, todos.
            const actual = obtenerPeriodoActual();
            const existeActual = lista.some(p => normalizarPeriodo(p.periodo) === normalizarPeriodo(actual));
            setPeriodo(existeActual ? actual : (lista[0]?.periodo || ''));
            setPeriodoResuelto(true);
        })();

        return () => { cancelado = true; };
    }, [cargarPeriodos]);

    // Carga de campañas al cambiar el periodo
    useEffect(() => {
        if (!periodoResuelto) return;
        cargarDatos(periodo, false);
    }, [periodo, periodoResuelto, cargarDatos]);

    // Sincronización en tiempo real ante cualquier cambio directo en Supabase
    useRealtimeSync(() => {
        cargarDatos(periodo, true);
        cargarPeriodos().then(lista => {
            if (lista.length > 0) setPeriodos(lista);
        });
    }, ['requerimientos_propiedad', 'tareas_diseno', 'tareas_video', 'tareas_cm']);

    const getEstado = (t) => (Array.isArray(t) ? t[0]?.estado : t?.estado);

    const metricas = {
        total: campanas.length,
        activas: campanas.filter(esCampanaActivada).length,
        disenosTerminados: campanas.filter(c => getEstado(c.tareas_diseno) === 'Finalizado').length,
        videosTerminados: campanas.filter(c => getEstado(c.tareas_video) === 'Finalizado').length,
        pautasActivas: campanas.filter(c => getEstado(c.tareas_cm) === 'Campaña Activa').length
    };

    return (
        <DashboardUI
            metricas={metricas}
            campanas={campanas}
            periodos={periodos}
            cargando={cargando}
            periodoSeleccionado={periodo}
            alCambiarPeriodo={setPeriodo}
        />
    );
}
