export const CAMPOS_AUDIOVISUALES = ['req_guion', 'req_fotos', 'req_grabacion', 'req_edicion', 'req_voz_off'];

export function normalizarCompletados(valores = {}) {
  return Object.fromEntries(CAMPOS_AUDIOVISUALES.map(campo => [campo, valores?.[campo] === true]));
}

// Sobre versionado para persistir el avance separado de los requisitos sin
// exigir una migración de la base existente. La API siempre expone texto limpio.
export function normalizarTareaVideo(tarea) {
  if (!tarea) return tarea;
  let contenido;
  try { contenido = JSON.parse(tarea.Descripcion); } catch { /* Descripción de texto existente. */ }
  const esSobre = contenido?._panel_video_version === 1 &&
    Object.prototype.hasOwnProperty.call(contenido, 'descripcion') &&
    contenido.actividades_completadas && typeof contenido.actividades_completadas === 'object';
  const completados = esSobre ? contenido.actividades_completadas :
    (tarea.actividades_completadas || Object.fromEntries(CAMPOS_AUDIOVISUALES.map(campo => [campo, tarea.estado === 'Finalizado'])));
  return {
    ...tarea,
    Descripcion: esSobre ? contenido.descripcion : tarea.Descripcion,
    actividades_completadas: normalizarCompletados(completados),
  };
}

export function serializarProgresoVideo(descripcion, completados) {
  return JSON.stringify({
    _panel_video_version: 1,
    descripcion: descripcion ?? null,
    actividades_completadas: normalizarCompletados(completados),
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
