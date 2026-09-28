import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

// GET: Obtener requerimientos con sus tareas asociadas
export async function GET({ url }) {
  try {
    const periodo = url.searchParams.get('periodo');

    let consulta = supabaseServer
      .from('requerimientos_propiedad')
      .select(`
        *,
        usuarios (id_usuario, nombre),
        tareas_diseno (*),
        tareas_video (*),
        tareas_cm (*)
      `)
      .order('fecha_creacion', { ascending: false });

    if (periodo) {
      consulta = consulta.eq('periodo_mensual', periodo);
    }

    const { data, error } = await consulta;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error al consultar requerimientos' }), { status: 500 });
  }
}

// POST: Registrar nuevo requerimiento del agente
export async function POST({ request }) {
  try {
    const body = await request.json();

    // 1. Validar campos mínimos obligatorios
    if (!body.nombre_propiedad) {
      return new Response(
        JSON.stringify({ error: 'El nombre de la propiedad es requerido' }), 
        { status: 400 }
      );
    }

    // 2. Insertar en la tabla maestra
    const periodoActual = body.periodo_mensual || new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const { data: requerimiento, error: errorReq } = await supabaseServer
      .from('requerimientos_propiedad')
      .insert([
        {
          id_agente: (body.id_agente && !isNaN(Number(body.id_agente))) ? parseInt(body.id_agente, 10) : null,
          periodo_mensual: periodoActual,
          nombre_propiedad: body.nombre_propiedad,
          categoria: body.categoria,
          ubicacion: body.ubicacion,
          tipo: body.tipo,
          precio: body.precio,
          descripcion_propiedad: body.descripcion_propiedad,
          elemento_destacar: body.elemento_destacar,
          publico_objetivo: body.publico_objetivo,
          superficie: body.superficie,
          habitaciones: body.habitaciones ? parseInt(body.habitaciones, 10) : null
        }
      ])
      .select()
      .single();

    if (errorReq) {
      return new Response(JSON.stringify({ error: errorReq.message }), { status: 500 });
    }

    const idReq = requerimiento.id_requerimiento;

    // 3. Actualizar configuraciones específicas generadas por el Trigger
    // Actualizar Video (checklist específico)
    await supabaseServer
      .from('tareas_video')
      .update({
        req_guion: Boolean(body.req_guion),
        req_fotos: Boolean(body.req_fotos),
        req_grabacion: Boolean(body.req_grabacion),
        req_edicion: Boolean(body.req_edicion),
        req_voz_off: Boolean(body.req_voz_off)
      })
      .eq('id_requerimiento', idReq);

    // Actualizar CM (plataforma y presupuesto)
    await supabaseServer
      .from('tareas_cm')
      .update({
        plataforma: body.plataforma || null,
        presupuesto: body.presupuesto || null
      })
      .eq('id_requerimiento', idReq);

    return new Response(
      JSON.stringify({ 
        mensaje: 'Requerimiento y tareas generados con éxito',
        id_requerimiento: idReq 
      }), 
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error("Error en POST /api/requerimientos:", err);
    return new Response(JSON.stringify({ error: err.message || 'Error procesando la solicitud' }), { status: 500 });
  }
}