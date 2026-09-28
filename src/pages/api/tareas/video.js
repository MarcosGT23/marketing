import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id_tarea, req_guion, req_fotos, req_grabacion, req_edicion, req_voz_off, estado, progreso_porcentaje } = body;

    if (!id_tarea) {
      return new Response(JSON.stringify({ error: 'id_tarea es requerido' }), { status: 400 });
    }

    const updateFields = {};
    if (req_guion !== undefined) updateFields.req_guion = Boolean(req_guion);
    if (req_fotos !== undefined) updateFields.req_fotos = Boolean(req_fotos);
    if (req_grabacion !== undefined) updateFields.req_grabacion = Boolean(req_grabacion);
    if (req_edicion !== undefined) updateFields.req_edicion = Boolean(req_edicion);
    if (req_voz_off !== undefined) updateFields.req_voz_off = Boolean(req_voz_off);
    if (estado !== undefined) updateFields.estado = estado;
    if (progreso_porcentaje !== undefined) updateFields.progreso_porcentaje = progreso_porcentaje;

    const { data, error } = await supabaseServer
      .from('tareas_video')
      .update(updateFields)
      .eq('id_tarea', id_tarea)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ mensaje: 'Tarea de video actualizada con éxito', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error actualizando tarea de video' }), { status: 500 });
  }
}
