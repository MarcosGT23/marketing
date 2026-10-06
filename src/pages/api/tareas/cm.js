import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id_tarea, id_requerimiento, estado, plataforma, presupuesto } = body;

    if (!id_tarea && !id_requerimiento) {
      return new Response(JSON.stringify({ error: 'id_tarea o id_requerimiento es requerido' }), { status: 400 });
    }

    const updateFields = {};
    if (estado !== undefined) updateFields.estado = estado;
    if (plataforma !== undefined) updateFields.plataforma = plataforma;
    if (presupuesto !== undefined) updateFields.presupuesto = presupuesto;

    let registroExistente = null;
    if (id_tarea) {
      const { data } = await supabaseServer.from('tareas_cm').select('*').eq('id_tarea', id_tarea).maybeSingle();
      registroExistente = data;
    }
    if (!registroExistente && id_requerimiento) {
      const { data } = await supabaseServer.from('tareas_cm').select('*').eq('id_requerimiento', id_requerimiento).maybeSingle();
      registroExistente = data;
    }

    let data = null;
    if (registroExistente) {
      const { data: updated, error } = await supabaseServer
        .from('tareas_cm')
        .update(updateFields)
        .eq('id_tarea', registroExistente.id_tarea)
        .select()
        .single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      data = updated;
    } else if (id_requerimiento) {
      const { data: inserted, error } = await supabaseServer
        .from('tareas_cm')
        .insert([{
          id_requerimiento,
          estado: estado || 'Por Hacer',
          ...updateFields
        }])
        .select()
        .single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      data = inserted;
    } else {
      return new Response(JSON.stringify({ error: 'Tarea de CM no encontrada' }), { status: 404 });
    }

    // Registrar en bitácora histórica para reportes completos
    if (data?.id_requerimiento) {
      try {
        await supabaseServer.from('historial_seguimiento').insert({
          id_requerimiento: data.id_requerimiento,
          departamento: 'CM',
          usuario: body.usuario || 'Área de Pauta & CM',
          accion: `Campaña CM actualizada a "${data.estado || estado}"`,
          comentario: body.comentario || `Plataforma: ${data.plataforma || 'N/A'} | Presupuesto: ${data.presupuesto || 'Sin definir'}`,
          fecha_registro: new Date().toISOString()
        });
      } catch (errHist) {
        console.warn('Error registrando en historial_seguimiento:', errHist.message);
      }
    }

    return new Response(JSON.stringify({ mensaje: 'Tarea de CM actualizada con éxito', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error actualizando tarea de CM' }), { status: 500 });
  }
}
