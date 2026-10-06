import { useState, useEffect, useCallback, useRef } from 'react';
import PanelVideoUI from './components/PanelVideoUI';
import { actualizarTareaVideo } from '../infrastructure/video.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function PanelVideoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Referencia para blindar mutaciones optimistas recientes contra sobreescritura de peticiones concurrentes
    const mutacionesRecientesRef = useRef(new Map());
    const timerGuardadoRef = useRef({});

    const cargarRequerimientos = useCallback(async (silent = false) => {
        if (!silent) setCargando(true);
        try {
            const res = await fetch('/api/requerimientos?t=' + Date.now(), { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Video:", json);
                if (!silent) alert(json?.error || 'Error cargando producciones de video');
                return;
            }
            
            const porcentajesFase = {
                'Por Hacer': 0,
                'Grabando': 40,
                'En Edición': 75,
                'Finalizado': 100
            };

            const ahora = Date.now();
            const tareasFiltradas = (Array.isArray(json) ? json : [])
                .filter(item => {
                    const tv = Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video;
                    return Boolean(tv && (tv.id_tarea || tv.estado)) || Boolean(item.req_reel || item.req_fotos);
                })
                .map(item => {
                    const tv = Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video;
                    const tareaServidor = tv || {
                        id_tarea: null,
                        id_requerimiento: item.id_requerimiento,
                        estado: 'Por Hacer',
                        progreso_porcentaje: 0,
                        req_guion: false,
                        req_fotos: false,
                        req_grabacion: false,
                        req_edicion: false,
                        req_voz_off: false,
                        Descripcion: null
                    };

                    const pctEsperado = porcentajesFase[tareaServidor.estado];
                    const baseActualizada = (pctEsperado !== undefined && (tareaServidor.progreso_porcentaje === undefined || tareaServidor.progreso_porcentaje === null || (tareaServidor.estado === 'Finalizado' && tareaServidor.progreso_porcentaje !== 100)))
                        ? { ...tareaServidor, progreso_porcentaje: pctEsperado }
                        : tareaServidor;

                    // Si el usuario modificó esta tarea en los últimos 4 segundos, preservar su estado optimista
                    const mutacionReciente = mutacionesRecientesRef.current.get(item.id_requerimiento);
                    if (mutacionReciente && ahora - mutacionReciente.timestamp < 4000) {
                        return {
                            ...item,
                            tareas_video: [{
                                ...baseActualizada,
                                ...mutacionReciente.tareaActualizada,
                                id_tarea: baseActualizada.id_tarea || mutacionReciente.tareaActualizada.id_tarea
                            }]
                        };
                    }

                    return {
                        ...item,
                        tareas_video: [baseActualizada]
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

    const dispararAutoGuardado = async (item, tareaActualizada) => {
        try {
            const resultado = await actualizarTareaVideo(tareaActualizada.id_tarea, {
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

            if (resultado?.data?.id_tarea) {
                const nuevoId = resultado.data.id_tarea;
                const mut = mutacionesRecientesRef.current.get(item.id_requerimiento);
                if (mut) {
                    mut.tareaActualizada.id_tarea = nuevoId;
                }

                if (!tareaActualizada.id_tarea) {
                    setDatos(prev => prev.map(p => {
                        if (p.id_requerimiento === item.id_requerimiento) {
                            return {
                                ...p,
                                tareas_video: [{
                                    ...p.tareas_video?.[0],
                                    id_tarea: nuevoId
                                }]
                            };
                        }
                        return p;
                    }));
                }
            }
        } catch (err) {
            console.error("Error auto-guardando video:", err);
            mutacionesRecientesRef.current.delete(item.id_requerimiento);
        }
    };

    const manejarCambioCheck = (idTarea, campo, checked, idRequerimiento) => {
        let datosActualizados = null;
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            const coincide = (idTarea && tv?.id_tarea === idTarea) || (idRequerimiento && item.id_requerimiento === idRequerimiento);
            if (coincide && tv) {
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

                mutacionesRecientesRef.current.set(item.id_requerimiento, {
                    timestamp: Date.now(),
                    tareaActualizada: actualizado
                });

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

    const manejarCambioCampo = (idTarea, campo, valor, idRequerimiento) => {
        let datosActualizados = null;
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            const coincide = (idTarea && tv?.id_tarea === idTarea) || (idRequerimiento && item.id_requerimiento === idRequerimiento);
            if (coincide && tv) {
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

                mutacionesRecientesRef.current.set(item.id_requerimiento, {
                    timestamp: Date.now(),
                    tareaActualizada: actualizado
                });

                datosActualizados = { item, tareaActualizada: actualizado };
                return {
                    ...item,
                    tareas_video: [actualizado]
                };
            }
            return item;
        }));

        if (datosActualizados) {
            const reqKey = datosActualizados.item.id_requerimiento;
            if (campo === 'Descripcion' || campo === 'descripcion') {
                if (timerGuardadoRef.current[reqKey]) {
                    clearTimeout(timerGuardadoRef.current[reqKey]);
                }
                timerGuardadoRef.current[reqKey] = setTimeout(() => {
                    dispararAutoGuardado(datosActualizados.item, datosActualizados.tareaActualizada);
                }, 400);
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