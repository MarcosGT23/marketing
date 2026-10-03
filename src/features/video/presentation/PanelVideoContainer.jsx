import { useState, useEffect, useCallback } from 'react';
import PanelVideoUI from './components/PanelVideoUI';
import { actualizarTareaVideo } from '../infrastructure/video.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function PanelVideoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRequerimientos = useCallback(async (silent = false) => {
        if (!silent) setCargando(true);
        try {
            const res = await fetch('/api/requerimientos');
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Video:", json);
                if (!silent) alert(json?.error || 'Error cargando producciones de video');
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
                .filter(item => {
                    const tv = Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video;
                    return Boolean(tv && (tv.id_tarea || tv.estado));
                })
                .map(item => {
                    const tv = Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video;
                    const pctEsperado = porcentajesFase[tv.estado];
                    const tareaActualizada = (pctEsperado !== undefined && (tv.progreso_porcentaje === undefined || tv.progreso_porcentaje === null || (tv.estado === 'Finalizado' && tv.progreso_porcentaje !== 100)))
                        ? { ...tv, progreso_porcentaje: pctEsperado }
                        : tv;
                    return {
                        ...item,
                        tareas_video: [tareaActualizada]
                    };
                });

            setDatos(tareasFiltradas);
        } catch (err) {
            console.error('[PanelVideoContainer] Error:', err);
            if (!silent) alert('Error cargando producciones de video: ' + err.message);
        } finally {
            if (!silent) setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarRequerimientos(false);
    }, [cargarRequerimientos]);

    // Sincronización en tiempo real desde Supabase para tareas de video y requerimientos
    useRealtimeSync(() => {
        cargarRequerimientos(true);
    }, ['requerimientos_propiedad', 'tareas_video']);

    const timerGuardadoRef = { current: {} };

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
                Descripcion: tareaActualizada.Descripcion ?? tareaActualizada.descripcion ?? null,
                id_requerimiento: item.id_requerimiento,
                usuario: 'Área Audiovisual'
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

                const esSoloFotos = Boolean(actualizado.req_fotos) &&
                    !actualizado.req_guion &&
                    !actualizado.req_grabacion &&
                    !actualizado.req_edicion &&
                    !actualizado.req_voz_off;

                if (esSoloFotos) {
                    const porcentajesFase = {
                        'Por Hacer': 0,
                        'Grabando': 40,
                        'En Edición': 75,
                        'Finalizado': 100
                    };
                    if (actualizado.estado && porcentajesFase[actualizado.estado] !== undefined && porcentajesFase[actualizado.estado] > 0) {
                        actualizado.progreso_porcentaje = porcentajesFase[actualizado.estado];
                    } else {
                        actualizado.progreso_porcentaje = 20;
                        actualizado.estado = 'Grabando';
                    }
                } else {
                    let totalProgreso = 0;
                    if (actualizado.req_guion) totalProgreso += 20;
                    if (actualizado.req_fotos) totalProgreso += 20;
                    if (actualizado.req_grabacion) totalProgreso += 20;
                    if (actualizado.req_edicion) totalProgreso += 20;
                    if (actualizado.req_voz_off) totalProgreso += 20;

                    actualizado.progreso_porcentaje = totalProgreso;

                    if (totalProgreso === 0) actualizado.estado = 'Por Hacer';
                    else if (totalProgreso <= 40) actualizado.estado = 'Grabando';
                    else if (totalProgreso < 100) actualizado.estado = 'En Edición';
                    else if (totalProgreso === 100) actualizado.estado = 'Finalizado';
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
            if (campo === 'Descripcion' || campo === 'descripcion') {
                if (timerGuardadoRef.current[idTarea]) {
                    clearTimeout(timerGuardadoRef.current[idTarea]);
                }
                timerGuardadoRef.current[idTarea] = setTimeout(() => {
                    dispararAutoGuardado(datosActualizados.item, datosActualizados.tareaActualizada);
                }, 500);
            } else {
                dispararAutoGuardado(datosActualizados.item, datosActualizados.tareaActualizada);
            }
        }
    };

    return (
        <PanelVideoUI
            tareas={datos}
            cargando={cargando}
            alCambiarCheck={manejarCambioCheck}
            alCambiarCampo={manejarCambioCampo}
        />
    );
}