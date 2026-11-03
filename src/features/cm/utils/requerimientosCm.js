// Los requerimientos nuevos pueden estar pendientes de configurar la pauta.
// Solo se ocultan cuando el usuario la retira explícitamente.
export function esVisibleEnPanelCm(requerimiento) {
  const tarea = Array.isArray(requerimiento?.tareas_cm)
    ? requerimiento.tareas_cm[0]
    : requerimiento?.tareas_cm;

  return tarea?.estado !== 'Sin Pauta';
}
