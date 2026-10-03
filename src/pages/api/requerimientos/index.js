import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

// ============================================================================
// GET: Obtener requerimientos con sus tareas (Optimizado para Escalabilidad)
// Metodologías: Data Minimization, Contratos Explícitos y BFF (Backend For Frontend)
// ============================================================================
export async function GET({ url }) {
  try {
    const periodo = url.searchParams.get('periodo');
    const idAgente = url.searchParams.get('id_agente');

    // PATRÓN: Data Minimization y Contratos Explícitos
    let consulta = supabaseServer
      .from('requerimientos_propiedad')
      .select(`
        id_requerimiento,
        id_agente,
        periodo_mensual,
        nombre_propiedad,
        categoria,
        categoria_diseno,
        tipo,
        ubicacion,
        precio,
        superficie,
        habitaciones,
        descripcion_propiedad,
        elemento_destacar,
        publico_objetivo,
        prioridad,
        req_arte_estatico,
        req_carrusel,
        req_reel,
        fecha_rodaje,
        notas_produccion,
        fecha_creacion,
        usuarios!id_agente (
          id_usuario,
          nombre,
          rol
        ),
        tareas_diseno (
          id_tarea,
          estado,
          progreso_porcentaje,
          fecha_limite
        ),
        tareas_video (
          id_tarea,
          estado,
          progreso_porcentaje,
          req_guion,
          req_fotos,
          req_grabacion,
          req_edicion,
          req_voz_off
        ),
        tareas_cm (
          id_tarea,
          estado,
          plataforma,
          presupuesto,
          moneda,
          periodo_pauta,
          descripcion_pauta
        ),
        reportes_meta_cm!fk_reportes_requerimiento (
          id_reporte,
          periodo_mensual,
          fecha_reporte,
          leads,
          costo_por_lead,
          inversion,
          alcance,
          ctr_clics,
          reportes_meta_anuncios!fk_anuncios_reporte (
            id_anuncio,
            nombre_anuncio,
            leads,
            costo_por_lead,
            inversion,
            alcance,
            ctr_clics
          )
        )
      `)
      .order('fecha_creacion', { ascending: false });

    // Filtros dinámicos
    if (periodo) consulta = consulta.eq('periodo_mensual', periodo);
    if (idAgente) consulta = consulta.eq('id_agente', idAgente);

    const { data, error } = await consulta;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    // PATRÓN: DTO (Data Transfer Object) y BFF (Backend for Frontend)
    // El backend transforma los datos crudos en la estructura exacta que el frontend necesita.
    const respuestaNormalizada = (data || []).map(item => ({
      ...item,
      usuarios: Array.isArray(item.usuarios) ? item.usuarios[0] || null : item.usuarios,
      tareas_diseno: Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] || null : item.tareas_diseno,
      tareas_video: Array.isArray(item.tareas_video) ? item.tareas_video[0] || null : item.tareas_video,
      tareas_cm: Array.isArray(item.tareas_cm) ? item.tareas_cm[0] || null : item.tareas_cm,
      reportes_meta_cm: Array.isArray(item.reportes_meta_cm) ? item.reportes_meta_cm[0] || null : item.reportes_meta_cm
    }));

    return new Response(JSON.stringify(respuestaNormalizada), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), { 
      status: 500, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}

// ============================================================================
// POST: Registrar nuevo requerimiento 
// ============================================================================
export async function POST({ request }) {
  try {
    const body = await request.json();

    const { data: requerimiento, error: errorReq } = await supabaseServer
      .from('requerimientos_propiedad')
      .insert([{
        id_agente: body.id_agente || null,
        periodo_mensual: body.periodo_mensual || 'Septiembre 2026',
        nombre_propiedad: body.nombre_propiedad,
        categoria: body.categoria,
        categoria_diseno: body.categoria_diseno || null,
        ubicacion: body.ubicacion || null,
        tipo: body.tipo || null,
        precio: body.precio || null,
        descripcion_propiedad: body.descripcion_propiedad || null,
        elemento_destacar: body.elemento_destacar || null,
        publico_objetivo: body.publico_objetivo || null,
        superficie: body.superficie || null,
        habitaciones: body.habitaciones ? parseInt(body.habitaciones, 10) : null,
        prioridad: body.prioridad || 'Baja',
        req_arte_estatico: Boolean(body.req_arte_estatico),
        req_carrusel: Boolean(body.req_carrusel),
        req_reel: Boolean(body.req_reel),
        fecha_rodaje: body.fecha_rodaje || null,
        notas_produccion: body.notas_produccion || null
      }])
      .select()
      .single();

    if (errorReq) throw errorReq;
    const idReq = requerimiento.id_requerimiento;

    if (body.req_reel) {
      await supabaseServer.from('tareas_video').update({
        req_guion: Boolean(body.req_guion),
        req_fotos: Boolean(body.req_fotos),
        req_grabacion: Boolean(body.req_grabacion),
        req_edicion: Boolean(body.req_edicion),
        req_voz_off: Boolean(body.req_voz_off)
      }).eq('id_requerimiento', idReq);
    }

    if (body.plataforma) {
      await supabaseServer.from('tareas_cm').update({
        plataforma: body.plataforma,
        presupuesto: body.presupuesto || null,
        moneda: body.moneda || 'USD',
        periodo_pauta: body.periodo_pauta || 'Mes',
        descripcion_pauta: body.descripcion_pauta || ''
      }).eq('id_requerimiento', idReq);
    }

    return new Response(JSON.stringify(requerimiento), { 
      status: 201, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}

// ============================================================================
// PUT: Modificar requerimiento existente y sus tareas asociadas
// ============================================================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    const idReq = body.id_requerimiento;

    if (!idReq) {
      return new Response(JSON.stringify({ error: 'id_requerimiento es requerido para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const camposActualizar = {};
    if (body.id_agente !== undefined) camposActualizar.id_agente = body.id_agente || null;
    if (body.periodo_mensual !== undefined) camposActualizar.periodo_mensual = body.periodo_mensual;
    if (body.nombre_propiedad !== undefined) camposActualizar.nombre_propiedad = body.nombre_propiedad;
    if (body.categoria !== undefined) camposActualizar.categoria = body.categoria;
    if (body.categoria_diseno !== undefined) camposActualizar.categoria_diseno = body.categoria_diseno || null;
    if (body.ubicacion !== undefined) camposActualizar.ubicacion = body.ubicacion || null;
    if (body.tipo !== undefined) camposActualizar.tipo = body.tipo || null;
    if (body.precio !== undefined) camposActualizar.precio = body.precio || null;
    if (body.descripcion_propiedad !== undefined) camposActualizar.descripcion_propiedad = body.descripcion_propiedad || null;
    if (body.elemento_destacar !== undefined) camposActualizar.elemento_destacar = body.elemento_destacar || null;
    if (body.publico_objetivo !== undefined) camposActualizar.publico_objetivo = body.publico_objetivo || null;
    if (body.superficie !== undefined) camposActualizar.superficie = body.superficie || null;
    if (body.habitaciones !== undefined) camposActualizar.habitaciones = body.habitaciones ? parseInt(body.habitaciones, 10) : null;
    if (body.prioridad !== undefined) camposActualizar.prioridad = body.prioridad;
    if (body.req_arte_estatico !== undefined) camposActualizar.req_arte_estatico = Boolean(body.req_arte_estatico);
    if (body.req_carrusel !== undefined) camposActualizar.req_carrusel = Boolean(body.req_carrusel);
    if (body.req_reel !== undefined) camposActualizar.req_reel = Boolean(body.req_reel);
    if (body.fecha_rodaje !== undefined) camposActualizar.fecha_rodaje = body.fecha_rodaje || null;
    if (body.notas_produccion !== undefined) camposActualizar.notas_produccion = body.notas_produccion || null;

    const { data: requerimiento, error: errorReq } = await supabaseServer
      .from('requerimientos_propiedad')
      .update(camposActualizar)
      .eq('id_requerimiento', idReq)
      .select()
      .single();

    if (errorReq) throw errorReq;

    // Actualizar tarea de video si se envían flags de video
    if (body.req_reel !== undefined || body.req_guion !== undefined || body.req_fotos !== undefined) {
      const { data: videoExistente } = await supabaseServer
        .from('tareas_video')
        .select('id_tarea')
        .eq('id_requerimiento', idReq)
        .maybeSingle();

      const videoData = {
        req_guion: Boolean(body.req_guion),
        req_fotos: Boolean(body.req_fotos),
        req_grabacion: Boolean(body.req_grabacion),
        req_edicion: Boolean(body.req_edicion),
        req_voz_off: Boolean(body.req_voz_off)
      };

      if (videoExistente) {
        await supabaseServer.from('tareas_video').update(videoData).eq('id_requerimiento', idReq);
      } else if (body.req_reel) {
        await supabaseServer.from('tareas_video').insert([{
          id_requerimiento: idReq,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          ...videoData
        }]);
      }
    }

    // Actualizar tarea de CM si se envían datos de pauta
    if (body.plataforma !== undefined || body.presupuesto !== undefined || body.periodo_pauta !== undefined || body.descripcion_pauta !== undefined) {
      const { data: cmExistente } = await supabaseServer
        .from('tareas_cm')
        .select('id_tarea')
        .eq('id_requerimiento', idReq)
        .maybeSingle();

      const cmData = {
        plataforma: body.plataforma || 'Facebook / Instagram',
        presupuesto: body.presupuesto || null,
        moneda: body.moneda || 'USD',
        periodo_pauta: body.periodo_pauta || 'Mes',
        descripcion_pauta: body.descripcion_pauta !== undefined ? body.descripcion_pauta : ''
      };

      if (cmExistente) {
        await supabaseServer.from('tareas_cm').update(cmData).eq('id_requerimiento', idReq);
      } else if (body.plataforma) {
        await supabaseServer.from('tareas_cm').insert([{
          id_requerimiento: idReq,
          estado: 'Por Hacer',
          ...cmData
        }]);
      }
    }

    return new Response(JSON.stringify(requerimiento), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}