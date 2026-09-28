import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id_tarea, estado, plataforma, presupuesto } = body;

    if (!id_tarea) {
      return new Response(JSON.stringify({ error: 'id_tarea es requerido' }), { status: 400 });
    }

    const updateFields = {};
    if (estado !== undefined) updateFields.estado = estado;
    if (plataforma !== undefined) updateFields.plataforma = plataforma;
    if (presupuesto !== undefined) updateFields.presupuesto = presupuesto;

    const { data, error } = await supabaseServer
      .from('tareas_cm')
      .update(updateFields)
      .eq('id_tarea', id_tarea)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ mensaje: 'Tarea de CM actualizada con éxito', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error actualizando tarea de CM' }), { status: 500 });
  }
}
