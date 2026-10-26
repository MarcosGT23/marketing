import { useState, useEffect, useCallback, useRef } from 'react';
import PanelVideoUI from './components/PanelVideoUI';
import { actualizarTareaVideo } from '../infrastructure/video.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';
import { encolar, debePreservar, tienePendientes, esperarCola } from '../../../core/utils/serialQueue';
import { notificarError } from '../../../core/ui/notifications';

export default function PanelVideoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Referencia para blindar mutaciones optimistas recientes contra sobreescritura de peticiones concurrentes
    const mutacionesRecientesRef = useRef(new Map());
    const timerGuardadoRef = useRef({});
    const datosRef = useRef(datos);
    useEffect(() => {
        datosRef.current = datos;
    }, [datos]);

    const cargarRequerimientos = useCallback(async (silent = false) => {
        if (!silent) setCargando(true);
        try {
            const res = await fetch('/api/requerimientos?t=' + Date.now(), { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Video:", json);
                if (!silent) notificarError(json?.error || 'No se pudieron cargar las producciones de video.');
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

                    // Preservar el estado optimista mientras haya guardados pendientes o recién confirmados
                    const mutacionReciente = mutacionesRecientesRef.current.get(item.id_requerimiento);
                    if (mutacionReciente && (debePreservar(item.id_requerimiento) || ahora - mutacionReciente.timestamp < 2000)) {
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
            if (!silent) notificarError('No se pudieron cargar las producciones de video. Intenta de nuevo.');
        } finally {
            if (!silent) setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarRequerimientos(false);
    }, [cargarRequerimientos]);

    useEffect(() => {
        return () => {
            Object.values(timerGuardadoRef.current).forEach(clearTimeout);
        };
    }, []);

    // Sincronización en tiempo real desde Supabase para tareas de video y requerimientos
    useRealtimeSync(() => {
        cargarRequerimientos(true);
    }, ['requerimientos_propiedad', 'tareas_video']);

    const dispararAutoGuardado = (idRequerimiento) => {
        encolar(idRequerimiento, async () => {
            const item = datosRef.current.find(p => p.id_requerimiento === idRequerimiento);
            const tv = item?.tareas_video?.[0];
            if (!tv) return;

            try {
                const resultado = await actualizarTareaVideo(tv.id_tarea || null, {
                    req_guion: tv.req_guion,
                    req_fotos: tv.req_fotos,
                    req_grabacion: tv.req_grabacion,
                    req_edicion: tv.req_edicion,
                    req_voz_off: tv.req_voz_off,
                    estado: tv.estado,
                    progreso_porcentaje: tv.progreso_porcentaje,
                    Descripcion: tv.Descripcion ?? tv.descripcion ?? null,
                    id_requerimiento: idRequerimiento,
                    usuario: 'Área Audiovisual'
                });

                if (resultado?.data?.id_tarea && !tv.id_tarea) {
                    const nuevoId = resultado.data.id_tarea;
                    const mut = mutacionesRecientesRef.current.get(idRequerimiento);
                    if (mut) mut.tareaActualizada.id_tarea = nuevoId;

                    setDatos(prev => prev.map(p => {
                        if (p.id_requerimiento !== idRequerimiento) return p;
                        return {
                            ...p,
                            tareas_video: [{ ...p.tareas_video?.[0], id_tarea: nuevoId }]
                        };
                    }));
                }
            } catch (err) {
                console.error("Error auto-guardando video:", err);
                esperarCola(idRequerimiento).then(() => {
                    if (!tienePendientes(idRequerimiento)) {
                        mutacionesRecientesRef.current.delete(idRequerimiento);
                        cargarRequerimientos(true);
                    }
                });
            }
        });
    };

    const cancelarTimerGuardado = (idRequerimiento) => {
        if (timerGuardadoRef.current[idRequerimiento]) {
            clearTimeout(timerGuardadoRef.current[idRequerimiento]);
            delete timerGuardadoRef.current[idRequerimiento];
        }
    };

    // Actualiza la referencia y el estado de forma síncrona antes de encolar el guardado
    const actualizarTareaLocal = (idTarea, idRequerimiento, transformar) => {
        const actual = datosRef.current;
        const indice = actual.findIndex(item => {
            const tv = item.tareas_video?.[0];
            return (idTarea && tv?.id_tarea === idTarea) || (idRequerimiento && item.id_requerimiento === idRequerimiento);
        });
        if (indice === -1) return null;

        const item = actual[indice];
        const tv = item.tareas_video?.[0];
        if (!tv) return null;

        const actualizado = transformar(tv);
        const nuevaLista = actual.map((p, i) => i === indice ? { ...p, tareas_video: [actualizado] } : p);
        datosRef.current = nuevaLista;
        setDatos(nuevaLista);

        mutacionesRecientesRef.current.set(item.id_requerimiento, {
            timestamp: Date.now(),
            tareaActualizada: actualizado
        });

        return { idRequerimiento: item.id_requerimiento, actualizado };
    };

    const manejarCambioCheck = (idTarea, campo, checked, idRequerimiento) => {
        const resultado = actualizarTareaLocal(idTarea, idRequerimiento, (tv) => {
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

            return actualizado;
        });

        if (!resultado) return;
        cancelarTimerGuardado(resultado.idRequerimiento);
        dispararAutoGuardado(resultado.idRequerimiento);
    };

    const manejarCambioCampo = (idTarea, campo, valor, idRequerimiento) => {
        const resultado = actualizarTareaLocal(idTarea, idRequerimiento, (tv) => {
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
            return actualizado;
        });

        if (!resultado) return;
        const reqKey = resultado.idRequerimiento;
        cancelarTimerGuardado(reqKey);
        if (campo === 'Descripcion' || campo === 'descripcion') {
            timerGuardadoRef.current[reqKey] = setTimeout(() => {
                delete timerGuardadoRef.current[reqKey];
                dispararAutoGuardado(reqKey);
            }, 400);
        } else {
            dispararAutoGuardado(reqKey);
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