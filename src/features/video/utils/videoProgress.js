export const CAMPOS_AUDIOVISUALES = ['req_guion', 'req_fotos', 'req_grabacion', 'req_edicion', 'req_voz_off'];
export const PREFIJO_AVANCE_VIDEO = 'PANEL-VIDEO-V1:';

export function normalizarCompletados(valores = {}) {
  return Object.fromEntries(CAMPOS_AUDIOVISUALES.map(campo => [campo, valores?.[campo] === true]));
}

export function leerAvanceVideo(comentario) {
  if (!comentario?.startsWith(PREFIJO_AVANCE_VIDEO)) return null;
  try {
    const datos = JSON.parse(comentario.slice(PREFIJO_AVANCE_VIDEO.length));
    return datos?._panel_video_version === 1 ? datos : null;
  } catch {
    return null;
  }
}

export function normalizarTareaVideo(tarea, comentario) {
  if (!tarea) return tarea;
  let contenido;
  try { contenido = JSON.parse(tarea.Descripcion); } catch { /* Descripción de texto existente. */ }
  const avance = leerAvanceVideo(comentario);
  const esSobre = contenido?._panel_video_version === 1 &&
    Object.prototype.hasOwnProperty.call(contenido, 'descripcion') &&
    contenido.actividades_completadas && typeof contenido.actividades_completadas === 'object';
  const completados = avance?.actividades_completadas ?? (esSobre ? contenido.actividades_completadas :
    (tarea.actividades_completadas || Object.fromEntries(CAMPOS_AUDIOVISUALES.map(campo => [campo, tarea.estado === 'Finalizado']))));
  return {
    ...tarea,
    estado: avance?.estado ?? tarea.estado,
    progreso_porcentaje: avance?.progreso_porcentaje ?? tarea.progreso_porcentaje,
    Descripcion: avance ? avance.descripcion : esSobre ? contenido.descripcion : tarea.Descripcion,
    actividades_completadas: normalizarCompletados(completados),
  };
}

export function serializarProgresoVideo(tarea, comentario) {
  return PREFIJO_AVANCE_VIDEO + JSON.stringify({
    _panel_video_version: 1,
    descripcion: tarea.Descripcion ?? null,
    estado: tarea.estado,
    progreso_porcentaje: tarea.progreso_porcentaje,
    actividades_completadas: normalizarCompletados(tarea.actividades_completadas),
    comentario,
  });
}

export function completarActividad(tarea, campo, completado) {
  if (!CAMPOS_AUDIOVISUALES.includes(campo)) return tarea;
  const actividades = { ...normalizarCompletados(tarea.actividades_completadas), [campo]: Boolean(completado) };
  const progreso = Object.values(actividades).filter(Boolean).length * 20;
  return {
    ...tarea,
    actividades_completadas: actividades,
    progreso_porcentaje: progreso,
    estado: progreso === 0 ? 'Por Hacer' : progreso <= 40 ? 'Grabando' : progreso < 100 ? 'En Edición' : 'Finalizado',
  };
}
