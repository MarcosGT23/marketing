import { supabaseServer } from '../../../core/lib/supabaseServer';
import { variantesPeriodo, normalizarPeriodo, obtenerPeriodoActual } from '../../../core/utils/dateUtils';
import { ESTADO_CAMPANA_ACTIVO, ESTADO_CAMPANA_INACTIVO } from '../../../core/utils/campanaUtils';
import { guardarTarea, json } from '../../../core/lib/taskStore';
import { PREFIJO_AVANCE_VIDEO, normalizarTareaVideo } from '../../../features/video/utils/videoProgress';
import { ERROR_DURACION_PAUTA, guardarDuracionPauta, mostrarDuracionPauta } from '../../../features/requerimientos/utils/duracionPauta';

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
        estado_general,
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
          req_voz_off,
          Descripcion
        ),
        video_guardado:historial_seguimiento (
          comentario
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
      .order('fecha_creacion', { ascending: false })
      .eq('video_guardado.departamento', 'Video')
      .like('video_guardado.comentario', PREFIJO_AVANCE_VIDEO + '%')
      .order('id_historial', { ascending: false, referencedTable: 'video_guardado' })
      .limit(1, { referencedTable: 'video_guardado' });

    // Filtros dinámicos
    // El periodo se busca por todas sus variantes de escritura ("Octubre 2026" / "octubre de 2026")
    if (periodo) {
      const variantes = variantesPeriodo(periodo);
      consulta = variantes.length
        ? consulta.in('periodo_mensual', variantes)
        : consulta.eq('periodo_mensual', periodo);
    }
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
    const respuestaNormalizada = (data || []).map(({ video_guardado, ...item }) => {
      const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] || null : item.tareas_diseno;
      const tv = normalizarTareaVideo(
        Array.isArray(item.tareas_video) ? item.tareas_video[0] || null : item.tareas_video,
        video_guardado?.[0]?.comentario
      );
      const necesitaDiseno = Boolean(item.req_arte_estatico || item.req_carrusel || item.categoria === 'Diseño Interno');
      const necesitaVideo = Boolean(item.req_reel || item.req_fotos);
      const tcm = Array.isArray(item.tareas_cm) ? item.tareas_cm[0] || null : item.tareas_cm;

      return {
        ...item,
        usuarios: Array.isArray(item.usuarios) ? item.usuarios[0] || null : item.usuarios,
        tareas_diseno: td || (necesitaDiseno ? {
          id_tarea: null,
          id_requerimiento: item.id_requerimiento,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          fecha_limite: item.fecha_rodaje || null
        } : null),
        tareas_video: tv || (necesitaVideo ? {
          id_tarea: null,
          id_requerimiento: item.id_requerimiento,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          req_guion: false,
          req_fotos: Boolean(item.req_fotos),
          req_grabacion: false,
          req_edicion: false,
          req_voz_off: false,
          Descripcion: null
        } : null),
        tareas_cm: tcm ? { ...tcm, periodo_pauta: mostrarDuracionPauta(tcm.periodo_pauta) } : {
          id_tarea: null,
          id_requerimiento: item.id_requerimiento,
          estado: 'Por Hacer',
          plataforma: null,
          presupuesto: null,
          moneda: 'USD',
          periodo_pauta: 'Mes',
          descripcion_pauta: null
        },
        reportes_meta_cm: Array.isArray(item.reportes_meta_cm) ? item.reportes_meta_cm[0] || null : item.reportes_meta_cm
      };
    });

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
  let idCreado = null;
  let etapa = 'requerimiento';
  try {
    const body = await request.json();
    if (!body || typeof body.nombre_propiedad !== 'string' || !body.nombre_propiedad.trim()) {
      return json({ error: 'El nombre de la propiedad es obligatorio.' }, 400);
    }
    const duracionPauta = guardarDuracionPauta(body.periodo_pauta);
    if (body.periodo_pauta !== undefined && duracionPauta === undefined) {
      return json({ error: ERROR_DURACION_PAUTA }, 400);
    }

    const { data: requerimiento, error: errorReq } = await supabaseServer
      .from('requerimientos_propiedad')
      .insert([{
        id_agente: body.id_agente || null,
        periodo_mensual: normalizarPeriodo(body.periodo_mensual) || obtenerPeriodoActual(),
        estado_general: body.estado_general || ESTADO_CAMPANA_ACTIVO,
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
    idCreado = idReq;

    // Garantizar tarea de video si se marcó reel o algún flag audiovisual
    const necesitaVideo = Boolean(body.req_reel || body.req_fotos || body.req_guion || body.req_grabacion || body.req_edicion || body.req_voz_off);
    if (necesitaVideo) {
      etapa = 'video';
      const { data: videoExistente, error: errorVideo } = await supabaseServer
        .from('tareas_video')
        .select('id_tarea')
        .eq('id_requerimiento', idReq)
        .maybeSingle();

      if (errorVideo) throw errorVideo;

      const videoData = {
        req_guion: Boolean(body.req_guion),
        req_fotos: Boolean(body.req_fotos),
        req_grabacion: Boolean(body.req_grabacion),
        req_edicion: Boolean(body.req_edicion),
        req_voz_off: Boolean(body.req_voz_off)
      };

      if (videoExistente) {
        const { error } = await supabaseServer.from('tareas_video').update(videoData).eq('id_requerimiento', idReq);
        if (error) throw error;
      } else {
        const { error } = await supabaseServer.from('tareas_video').insert([{
          id_requerimiento: idReq,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          ...videoData
        }]);

        if (error) throw error;
      }
    }

    // Garantizar tarea de CM si tiene plataforma, presupuesto, duración o descripción
    const tienePauta = Boolean(body.plataforma || body.presupuesto || body.periodo_pauta || body.descripcion_pauta);
    if (tienePauta) {
      etapa = 'pauta';
      const { data: cmExistente, error: errorCm } = await supabaseServer
        .from('tareas_cm')
        .select('id_tarea')
        .eq('id_requerimiento', idReq)
        .maybeSingle();

      if (errorCm) throw errorCm;

      const cmData = {
        plataforma: body.plataforma || 'Facebook / Instagram',
        presupuesto: body.presupuesto || null,
        moneda: body.moneda || 'USD',
        periodo_pauta: duracionPauta || 'Mes',
        descripcion_pauta: body.descripcion_pauta || ''
      };

      if (cmExistente) {
        const { error } = await supabaseServer.from('tareas_cm').update(cmData).eq('id_requerimiento', idReq);
        if (error) throw error;
      } else {
        const { error } = await supabaseServer.from('tareas_cm').insert([{
          id_requerimiento: idReq,
          estado: 'Por Hacer',
          ...cmData
        }]);

        if (error) throw error;
      }
    }

    // Asegurar que si requiere diseño se inserte su tarea en tareas_diseno si el trigger no lo hizo
    if (body.req_arte_estatico || body.req_carrusel || body.categoria === 'Diseño Interno') {
      etapa = 'diseño';
      const { data: disenoExistente, error: errorDiseno } = await supabaseServer
        .from('tareas_diseno')
        .select('id_tarea')
        .eq('id_requerimiento', idReq)
        .maybeSingle();

      if (errorDiseno) throw errorDiseno;

      if (!disenoExistente) {
        const { error } = await supabaseServer.from('tareas_diseno').insert([{
          id_requerimiento: idReq,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          fecha_limite: body.fecha_rodaje || null
        }]);

        if (error) throw error;
      }
    }

    return new Response(JSON.stringify(requerimiento), { 
      status: 201, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    console.error('[POST /api/requerimientos] Falló el alta', { etapa, codigo: err?.code || err?.name });
    // Un fallo de tareas no debe dejar una solicitud incompleta que se duplique al reintentar.
    if (idCreado) {
      for (const tabla of ['tareas_diseno', 'tareas_video', 'tareas_cm', 'historial_seguimiento', 'requerimientos_propiedad']) {
        const { error } = await supabaseServer.from(tabla).delete().eq('id_requerimiento', idCreado);
        if (error) {
          return json({ error: `La solicitud #${idCreado} se creó parcialmente. ${err.message}. No se pudo revertir: ${error.message}`, id_requerimiento: idCreado }, 500);
        }
      }
    }
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
    const panel = body.panel || 'general'; // 'diseno' | 'video' | 'cm' | 'general'
    if (!['general', 'diseno', 'video', 'cm'].includes(panel)) {
      return json({ error: 'Panel inválido' }, 400);
    }
    if (body.nombre_propiedad !== undefined && (typeof body.nombre_propiedad !== 'string' || !body.nombre_propiedad.trim())) {
      return json({ error: 'El nombre de la propiedad es obligatorio.' }, 400);
    }

    if (!idReq) {
      return new Response(JSON.stringify({ error: 'id_requerimiento es requerido para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quitarPauta = body.quitar_pauta || body.habilitar_pauta === false;
    const aplicaPauta = panel === 'cm' || panel === 'general';
    const duracionPauta = guardarDuracionPauta(body.periodo_pauta);
    if (aplicaPauta && !quitarPauta && body.periodo_pauta !== undefined && duracionPauta === undefined) {
      return json({ error: ERROR_DURACION_PAUTA }, 400);
    }

    const camposActualizar = {};
    if (body.id_agente !== undefined) camposActualizar.id_agente = body.id_agente || null;
    if (body.periodo_mensual !== undefined) camposActualizar.periodo_mensual = normalizarPeriodo(body.periodo_mensual) || body.periodo_mensual;
    if (body.nombre_propiedad !== undefined) camposActualizar.nombre_propiedad = body.nombre_propiedad;
    if (body.categoria !== undefined) camposActualizar.categoria = body.categoria;
    if (body.ubicacion !== undefined) camposActualizar.ubicacion = body.ubicacion || null;
    if (body.tipo !== undefined) camposActualizar.tipo = body.tipo || null;
    if (body.precio !== undefined) camposActualizar.precio = body.precio || null;
    if (body.descripcion_propiedad !== undefined) camposActualizar.descripcion_propiedad = body.descripcion_propiedad || null;
    if (body.elemento_destacar !== undefined) camposActualizar.elemento_destacar = body.elemento_destacar || null;
    if (body.publico_objetivo !== undefined) camposActualizar.publico_objetivo = body.publico_objetivo || null;
    if (body.superficie !== undefined) camposActualizar.superficie = body.superficie || null;
    if (body.habitaciones !== undefined) camposActualizar.habitaciones = body.habitaciones ? parseInt(body.habitaciones, 10) : null;
    if (body.prioridad !== undefined) camposActualizar.prioridad = body.prioridad;

    // Estado de activación de la campaña (solo desde el panel general)
    if (panel === 'general' && body.estado_general !== undefined) {
      camposActualizar.estado_general = body.estado_general || ESTADO_CAMPANA_INACTIVO;
    }

    // Campos específicos según panel
    if (panel === 'diseno' || panel === 'general') {
      if (body.categoria_diseno !== undefined) camposActualizar.categoria_diseno = body.categoria_diseno || null;
      if (body.req_arte_estatico !== undefined) camposActualizar.req_arte_estatico = Boolean(body.req_arte_estatico);
      if (body.req_carrusel !== undefined) camposActualizar.req_carrusel = Boolean(body.req_carrusel);
    }

    if (panel === 'video' || panel === 'general') {
      if (body.req_reel !== undefined) camposActualizar.req_reel = Boolean(body.req_reel);
      if (body.fecha_rodaje !== undefined) camposActualizar.fecha_rodaje = body.fecha_rodaje || null;
      if (body.notas_produccion !== undefined) camposActualizar.notas_produccion = body.notas_produccion || null;
    }

    const tablaReq = supabaseServer.from('requerimientos_propiedad');
    const consultaReq = Object.keys(camposActualizar).length
      ? tablaReq.update(camposActualizar).select()
      : tablaReq.select();
    const { data: requerimiento, error: errorReq } = await consultaReq.eq('id_requerimiento', idReq).maybeSingle();

    if (errorReq) throw errorReq;
    if (!requerimiento) return json({ error: 'Requerimiento no encontrado.' }, 404);

    // Las ediciones parciales conservan los campos de las otras áreas.
    if (panel === 'video' || panel === 'general') {
      const flags = ['req_guion', 'req_fotos', 'req_grabacion', 'req_edicion', 'req_voz_off'];
      const campos = Object.fromEntries(flags.filter(campo => body[campo] !== undefined)
        .map(campo => [campo, Boolean(body[campo])]));
      if (body.req_reel || Object.keys(campos).length) {
        const { data: existente, error } = await supabaseServer.from('tareas_video')
          .select('id_tarea').eq('id_requerimiento', idReq).maybeSingle();
        if (error) throw error;
        const requerida = body.req_reel || Object.values(campos).some(Boolean);
        if ((existente && Object.keys(campos).length) || (!existente && requerida)) {
          const resultado = await guardarTarea({
            tabla: 'tareas_video', idRequerimiento: idReq,
            campos: Object.keys(campos).length ? campos : { estado: 'Por Hacer' },
            valoresIniciales: { estado: 'Por Hacer', progreso_porcentaje: 0 }
          });
          if (resultado.error) throw resultado.error;
        }
      }
    }

    if (aplicaPauta) {
      const campos = quitarPauta ? {
        plataforma: null, presupuesto: null, estado: 'Sin Pauta', descripcion_pauta: null
      } : Object.fromEntries(
        ['plataforma', 'presupuesto', 'moneda', 'descripcion_pauta']
          .filter(campo => body[campo] !== undefined)
          .map(campo => [campo, body[campo] === '' ? null : body[campo]])
      );
      if (!quitarPauta && duracionPauta !== undefined) campos.periodo_pauta = duracionPauta || null;
      if (Object.keys(campos).length) {
        // Reactivar una pauta retirada solo cuando el formulario lo solicita.
        if (!quitarPauta && (body.habilitar_pauta === true || body.plataforma?.trim())) {
          const { data: tarea, error } = await supabaseServer.from('tareas_cm')
            .select('estado').eq('id_requerimiento', idReq).maybeSingle();
          if (error) throw error;
          if (tarea?.estado === 'Sin Pauta') campos.estado = 'Por Hacer';
        }
        const resultado = await guardarTarea({
          tabla: 'tareas_cm', idRequerimiento: idReq, campos,
          valoresIniciales: { estado: 'Por Hacer', moneda: 'USD', periodo_pauta: 'Mes' }
        });
        if (resultado.error) throw resultado.error;
      }
    }

    if (panel === 'diseno' || panel === 'general') {
      const requiereDiseno = body.req_arte_estatico || body.req_carrusel || body.categoria === 'Diseño Interno';
      if (requiereDiseno || body.fecha_limite !== undefined) {
        const { data: existente, error } = await supabaseServer.from('tareas_diseno')
          .select('id_tarea').eq('id_requerimiento', idReq).maybeSingle();
        if (error) throw error;
        if ((existente && body.fecha_limite !== undefined) || (!existente && requiereDiseno)) {
          const resultado = await guardarTarea({
            tabla: 'tareas_diseno', idRequerimiento: idReq,
            campos: { fecha_limite: body.fecha_limite !== undefined ? body.fecha_limite || null : body.fecha_rodaje || null },
            valoresIniciales: { estado: 'Por Hacer', progreso_porcentaje: 0 }
          });
          if (resultado.error) throw resultado.error;
        }
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

// ============================================================================
// DELETE: Eliminar requerimiento existente y todas sus dependencias en cascada
// ============================================================================
export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const idReq = body.id_requerimiento;

    if (!idReq) {
      return new Response(JSON.stringify({ error: 'id_requerimiento es requerido para eliminar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const tabla of ['reportes_meta_cm', 'tareas_diseno', 'tareas_video', 'tareas_cm', 'historial_seguimiento']) {
      const { error } = await supabaseServer.from(tabla).delete().eq('id_requerimiento', idReq);
      if (error) throw error;
    }

    // 4. Eliminar el requerimiento de propiedad principal
    const { error: errReq } = await supabaseServer
      .from('requerimientos_propiedad')
      .delete()
      .eq('id_requerimiento', idReq);

    if (errReq) throw errReq;

    return new Response(JSON.stringify({ success: true, id_requerimiento: idReq }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    console.error('Error al eliminar requerimiento en DELETE /api/requerimientos:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error al eliminar requerimiento' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}
