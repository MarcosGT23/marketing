import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id_tarea, id_requerimiento, estado, progreso_porcentaje, fecha_limite } = body;

    if (!id_tarea && !id_requerimiento) {
      return new Response(JSON.stringify({ error: 'id_tarea o id_requerimiento es requerido' }), { status: 400 });
    }

    const updateFields = {};
    if (estado !== undefined) updateFields.estado = estado;
    if (progreso_porcentaje !== undefined) updateFields.progreso_porcentaje = progreso_porcentaje;
    if (fecha_limite !== undefined) updateFields.fecha_limite = fecha_limite || null;

    let query = supabaseServer.from('tareas_diseno').update(updateFields);
    if (id_tarea) {
      query = query.eq('id_tarea', id_tarea);
    } else {
      query = query.eq('id_requerimiento', id_requerimiento);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Registrar en bitácora histórica para reportes completos
    if (data?.id_requerimiento) {
      try {
        await supabaseServer.from('historial_seguimiento').insert({
          id_requerimiento: data.id_requerimiento,
          departamento: 'Diseño',
          usuario: body.usuario || 'Área de Diseño',
          accion: `Diseño actualizado a "${data.estado || estado}" (${data.progreso_porcentaje ?? progreso_porcentaje}%)`,
          comentario: body.comentario || `Progreso de diseño confirmado al ${data.progreso_porcentaje ?? progreso_porcentaje}%`,
          fecha_registro: new Date().toISOString()
        });
      } catch (errHist) {
        console.warn('Error registrando en historial_seguimiento:', errHist.message);
      }
    }

    return new Response(JSON.stringify({ mensaje: 'Tarea de diseño actualizada con éxito', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error actualizando tarea de diseño' }), { status: 500 });
  }
}
