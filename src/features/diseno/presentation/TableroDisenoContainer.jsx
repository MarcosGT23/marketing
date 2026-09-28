import { useState, useEffect } from 'react';
import TableroDisenoUI from './components/TableroDisenoUI';
import { actualizarTareaDiseno } from '../infrastructure/diseno.api';

export default function TableroDisenoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRequerimientos = async () => {
        try {
            const res = await fetch('/api/requerimientos');
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Diseño:", json);
                alert(json?.error || 'Error cargando tareas de diseño');
                setDatos([]);
                return;
            }
            // Solo mostrar si tiene tarea de diseño creada por el trigger
            const porcentajesPorEstado = {
                'Por Hacer': 0,
                'En Proceso': 50,
                'Revisión': 75,
                'Finalizado': 100
            };

            const tareasFiltradas = (Array.isArray(json) ? json : [])
                .filter(item => item.tareas_diseno && item.tareas_diseno.length > 0)
                .map(item => {
                    const td = item.tareas_diseno[0];
                    const pctEsperado = porcentajesPorEstado[td.estado];
                    if (pctEsperado !== undefined && (td.progreso_porcentaje === undefined || td.progreso_porcentaje === null || (td.estado === 'Finalizado' && td.progreso_porcentaje !== 100))) {
                        return {
                            ...item,
                            tareas_diseno: [{ ...td, progreso_porcentaje: pctEsperado }]
                        };
                    }
                    return item;
                });

            setDatos(tareasFiltradas);
        } catch (err) {
            console.error(err);
            alert('Error cargando tareas de diseño: ' + err.message);
            setDatos([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRequerimientos();
    }, []);

    const manejarCambioCampo = async (idTarea, campo, valor) => {
        let datosActualizados = null;

        setDatos(prev => prev.map(item => {
            const td = item.tareas_diseno?.[0];
            if (td && td.id_tarea === idTarea) {
                const actualizado = { ...td, [campo]: valor };
                if (campo === 'estado') {
                    const porcentajes = {
                        'Por Hacer': 0,
                        'En Proceso': 50,
                        'Revisión': 75,
                        'Finalizado': 100
                    };
                    if (porcentajes[valor] !== undefined) {
                        actualizado.progreso_porcentaje = porcentajes[valor];
                    }
                }
                datosActualizados = { item, tareaActualizada: actualizado };
                return {
                    ...item,
                    tareas_diseno: [actualizado]
                };
            }
            return item;
        }));

        // Auto-guardado instantáneo a Supabase e historial
        if (datosActualizados) {
            const { item, tareaActualizada } = datosActualizados;
            try {
                await actualizarTareaDiseno(idTarea, {
                    estado: tareaActualizada.estado,
                    progreso_porcentaje: tareaActualizada.progreso_porcentaje,
                    fecha_limite: tareaActualizada.fecha_limite,
                    id_requerimiento: item.id_requerimiento,
                    usuario: 'Isaac (Diseño)'
                });
            } catch (err) {
                console.error("Error auto-guardando diseño:", err);
            }
        }
    };

    return (
        <TableroDisenoUI
            tareas={datos}
            cargando={cargando}
            alCambiarCampo={manejarCambioCampo}
        />
    );
}