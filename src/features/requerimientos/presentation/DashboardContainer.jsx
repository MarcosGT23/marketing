import { useState, useEffect } from 'react';
import DashboardUI from './components/DashboardUI';

export default function DashboardContainer() {
    const [campanas, setCampanas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodo, setPeriodo] = useState('Septiembre 2026');

    const cargarDatos = async (periodoFiltro) => {
        setCargando(true);
        try {
            const url = periodoFiltro
                ? `/api/requerimientos?periodo=${encodeURIComponent(periodoFiltro)}`
                : '/api/requerimientos';
            const res = await fetch(url);
            const json = await res.json();

            if (!res.ok || json?.error) {
                console.error("Error API dashboard:", json);
                alert(json?.error || 'Error cargando datos del dashboard');
                setCampanas([]);
                return;
            }

            setCampanas(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error(err);
            alert('Error cargando datos del dashboard: ' + err.message);
            setCampanas([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos(periodo);
    }, [periodo]);

    const metricas = {
        activas: campanas.length,
        disenosTerminados: campanas.filter(c => c.tareas_diseno?.[0]?.estado === 'Finalizado').length,
        videosTerminados: campanas.filter(c => c.tareas_video?.[0]?.estado === 'Finalizado').length,
        pautasActivas: campanas.filter(c => c.tareas_cm?.[0]?.estado === 'Campaña Activa').length
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