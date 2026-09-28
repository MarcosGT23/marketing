import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id_tarea, estado, progreso_porcentaje, fecha_limite } = body;

    if (!id_tarea) {
      return new Response(JSON.stringify({ error: 'id_tarea es requerido' }), { status: 400 });
    }

    const updateFields = {};
    if (estado !== undefined) updateFields.estado = estado;
    if (progreso_porcentaje !== undefined) updateFields.progreso_porcentaje = progreso_porcentaje;
    if (fecha_limite !== undefined) updateFields.fecha_limite = fecha_limite || null;

    const { data, error } = await supabaseServer
      .from('tareas_diseno')
      .update(updateFields)
      .eq('id_tarea', id_tarea)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ mensaje: 'Tarea de diseño actualizada con éxito', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error actualizando tarea de diseño' }), { status: 500 });
  }
}
