import { notificarCambioLocal } from '../../../core/hooks/useRealtimeSync';

export async function actualizarTareaCm(id_tarea, campos) {
  const res = await fetch('/api/tareas/cm', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tarea, ...campos })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar tarea de CM');
  notificarCambioLocal({ tipo: 'tarea_cm_actualizada', id_tarea, campos });
  return data;
}

// Guarda métricas en reportes_meta_cm y array de anuncios individuales en reportes_meta_anuncios
export async function registrarReporteMeta({ id_requerimiento, id_agente, periodo_mensual, metricas, anuncios, nivel_csv }) {
  const res = await fetch('/api/cm/importar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_requerimiento, id_agente, periodo_mensual, metricas, anuncios, nivel_csv })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar reporte de Meta');
  notificarCambioLocal({ tipo: 'reporte_cm_creado', id_requerimiento });
  return data;
}

export async function quitarPautaCm(id_requerimiento, id_tarea) {
  const res = await fetch('/api/tareas/cm', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_requerimiento,
      id_tarea,
      quitar_pauta: true,
      usuario: 'Área de Pauta & CM',
      comentario: 'Pauta publicitaria retirada del panel de CM'
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al quitar pauta');
  notificarCambioLocal({ tipo: 'tarea_cm_actualizada', id_requerimiento, campos: { plataforma: null, estado: 'Sin Pauta' } });
  return data;
}