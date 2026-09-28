export async function actualizarTareaVideo(id_tarea, campos) {
  const res = await fetch('/api/tareas/video', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tarea, ...campos })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar video');
  return data;
}
