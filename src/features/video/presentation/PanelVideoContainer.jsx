import { useState, useEffect } from 'react';
import PanelVideoUI from './components/PanelVideoUI';
import { actualizarTareaVideo } from '../infrastructure/video.api';

export default function PanelVideoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRequerimientos = async () => {
        try {
            const res = await fetch('/api/requerimientos');
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Video:", json);
                alert(json?.error || 'Error cargando producciones de video');
                setDatos([]);
                return;
            }
            // Solo mostrar si tiene tarea de video creada por el trigger
            const porcentajesFase = {
                'Por Hacer': 0,
                'Grabando': 40,
                'En Edición': 75,
                'Finalizado': 100
            };

            const tareasFiltradas = (Array.isArray(json) ? json : [])
                .filter(item => item.tareas_video && item.tareas_video.length > 0)
                .map(item => {
                    const tv = item.tareas_video[0];
                    const pctEsperado = porcentajesFase[tv.estado];
                    if (pctEsperado !== undefined && (tv.progreso_porcentaje === undefined || tv.progreso_porcentaje === null || (tv.estado === 'Finalizado' && tv.progreso_porcentaje !== 100))) {
                        return {
                            ...item,
                            tareas_video: [{ ...tv, progreso_porcentaje: pctEsperado }]
                        };
                    }
                    return item;
                });

            setDatos(tareasFiltradas);
        } catch (err) {
            console.error(err);
            alert('Error cargando producciones de video: ' + err.message);
            setDatos([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRequerimientos();
    }, []);

    const dispararAutoGuardado = async (item, tareaActualizada) => {
        try {
            await actualizarTareaVideo(tareaActualizada.id_tarea, {
                req_guion: tareaActualizada.req_guion,
                req_fotos: tareaActualizada.req_fotos,
                req_grabacion: tareaActualizada.req_grabacion,
                req_edicion: tareaActualizada.req_edicion,
                req_voz_off: tareaActualizada.req_voz_off,
                estado: tareaActualizada.estado,
                progreso_porcentaje: tareaActualizada.progreso_porcentaje,
                id_requerimiento: item.id_requerimiento,
                usuario: 'Marcos (Video)'
            });
        } catch (err) {
            console.error("Error auto-guardando video:", err);
        }
    };

    const manejarCambioCheck = (idTarea, campo, checked) => {
        let datosActualizados = null;
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            if (tv && tv.id_tarea === idTarea) {
                const actualizado = { ...tv, [campo]: checked };
                datosActualizados = { item, tareaActualizada: actualizado };
                return {
                    ...item,
                    tareas_video: [actualizado]
                };
            }
            return item;
        }));

        if (datosActualizados) {
            dispararAutoGuardado(datosActualizados.item, datosActualizados.tareaActualizada);
        }
    };

    const manejarCambioCampo = (idTarea, campo, valor) => {
        let datosActualizados = null;
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            if (tv && tv.id_tarea === idTarea) {
                const actualizado = { ...tv, [campo]: valor };
                if (campo === 'estado') {
                    const porcentajes = {
                        'Por Hacer': 0,
                        'Grabando': 40,
                        'En Edición': 75,
                        'Finalizado': 100
                    };
                    if (porcentajes[valor] !== undefined) {
                        actualizado.progreso_porcentaje = porcentajes[valor];
                    }
                }
                datosActualizados = { item, tareaActualizada: actualizado };
                return {
                    ...item,
                    tareas_video: [actualizado]
                };
            }
            return item;
        }));

        if (datosActualizados) {
            dispararAutoGuardado(datosActualizados.item, datosActualizados.tareaActualizada);
        }
    };

    return (
        <PanelVideoUI
            tareas={datos}
            cargando={cargando}
            alCambiarCheck={manejarCambioCheck}
            alCambiarCampo={manejarCambioCampo}
            alGuardar={manejarGuardar}
        />
    );
}