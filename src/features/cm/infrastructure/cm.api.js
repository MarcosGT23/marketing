export async function actualizarTareaCm(id_tarea, campos) {
  const res = await fetch('/api/tareas/cm', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tarea, ...campos })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar tarea de CM');
  return data;
}

// Guarda métricas en reportes_meta_cm y array de anuncios individuales en reportes_meta_anuncios
export async function registrarReporteMeta({ id_requerimiento, id_agente, periodo_mensual, metricas, anuncios }) {
  const res = await fetch('/api/cm/importar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_requerimiento, id_agente, periodo_mensual, metricas, anuncios })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar reporte de Meta');
  return data;
}