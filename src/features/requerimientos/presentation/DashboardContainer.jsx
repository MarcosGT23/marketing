import { useState, useEffect, useCallback } from 'react';
import DashboardUI from './components/DashboardUI';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function DashboardContainer() {
    const [campanas, setCampanas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodo, setPeriodo] = useState('Septiembre 2026');

    const cargarDatos = useCallback(async (periodoFiltro, silent = false) => {
        if (!silent) setCargando(true);
        try {
            const url = periodoFiltro
                ? `/api/requerimientos?periodo=${encodeURIComponent(periodoFiltro)}`
                : '/api/requerimientos';
            const res = await fetch(url);
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

    // Carga inicial al montar o al cambiar período
    useEffect(() => {
        cargarDatos(periodo, false);
    }, [periodo, cargarDatos]);

    // Sincronización en tiempo real ante cualquier cambio directo en Supabase
    useRealtimeSync(() => {
        cargarDatos(periodo, true);
    }, ['requerimientos_propiedad', 'tareas_diseno', 'tareas_video', 'tareas_cm']);

    const getEstado = (t) => (Array.isArray(t) ? t[0]?.estado : t?.estado);

    const metricas = {
        activas: campanas.length,
        disenosTerminados: campanas.filter(c => getEstado(c.tareas_diseno) === 'Finalizado').length,
        videosTerminados: campanas.filter(c => getEstado(c.tareas_video) === 'Finalizado').length,
        pautasActivas: campanas.filter(c => getEstado(c.tareas_cm) === 'Campaña Activa').length
    };

    return (
        <DashboardUI
            metricas={metricas}
            campanas={campanas}
            cargando={cargando}
            periodoSeleccionado={periodo}
            alCambiarPeriodo={setPeriodo}
        />
    );
}