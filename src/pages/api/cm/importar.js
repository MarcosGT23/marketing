// src/pages/api/cm/importar.js
// Guarda los datos del CSV de Meta Ads:
// 1. Totales en 'reportes_meta_cm'
// 2. Anuncios individuales en 'reportes_meta_anuncios' (enlazados por id_reporte)
import { supabaseServer } from '../../../core/lib/supabaseServer';
import { normalizarPeriodo, variantesPeriodo, obtenerPeriodoActual } from '../../../core/utils/dateUtils';
import { ESTADO_CAMPANA_ACTIVO } from '../../../core/utils/campanaUtils';
import { normalizarAnunciosMeta } from '../../../features/cm/utils/anunciosMeta';
import { tieneMojibake } from '../../../features/cm/utils/mojibake.js';

export const prerender = false;

const redondearMoneda = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

export async function POST({ request }) {
  try {
    const body = await request.json();
    let { 
      id_requerimiento, 
      periodo_mensual, 
      metricas = {}, 
      anuncios = [],
      solicitante,
      titulo,
      descripcion,
      fecha: fechaCustom,
      estado,
      plataforma,
      presupuesto,
      moneda,
      id_agente,
      nivel_csv
    } = body;

    // Se aceptan informes por anuncio, conjunto de anuncios o campaña.
    // Cualquier otro valor indica un CSV mal interpretado.
    const NIVELES_VALIDOS = ['anuncio', 'conjunto', 'campana'];
    if (nivel_csv && !NIVELES_VALIDOS.includes(nivel_csv)) {
      return new Response(JSON.stringify({
        error: 'No se pudo validar el nivel del informe. Vuelve a cargar el CSV desde Meta Ads.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (Array.isArray(anuncios) && anuncios.length > 0) {
      const invalido = anuncios.find(a => {
        const nombre = String(a?.nombre_anuncio || '').replace(/^\[[^\]]+\]\s*/, '').trim();
        return !nombre || tieneMojibake(nombre);
      });
      if (invalido) {
        return new Response(JSON.stringify({
          error: 'Hay anuncios sin nombre válido o con caracteres dañados por codificación. Vuelve a exportar el CSV en UTF-8 y cárgalo de nuevo.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const fecha = fechaCustom || new Date().toISOString().split('T')[0];
    const periodo = normalizarPeriodo(periodo_mensual) || obtenerPeriodoActual();

    let finalIdRequerimiento = id_requerimiento;

    // Si no se proporcionó id_requerimiento, crear un registro base en requerimientos_propiedad
    if (!finalIdRequerimiento) {
      let agenteId = id_agente || null;
      if (!agenteId && solicitante) {
        const { data: usuarioExistente } = await supabaseServer
          .from('usuarios')
          .select('id_usuario')
          .ilike('nombre', `%${solicitante.trim()}%`)
          .limit(1)
          .maybeSingle();
        if (usuarioExistente) agenteId = usuarioExistente.id_usuario;
      }

      if (!agenteId) {
        const { data: primerAgente } = await supabaseServer
          .from('usuarios')
          .select('id_usuario')
          .limit(1)
          .maybeSingle();
        if (primerAgente) agenteId = primerAgente.id_usuario;
      }

      const { data: nuevoReq, error: errNuevoReq } = await supabaseServer
        .from('requerimientos_propiedad')
        .insert([{
          nombre_propiedad: titulo || 'Reporte de Campaña Publicitaria',
          id_agente: agenteId,
          periodo_mensual: periodo,
          estado_general: ESTADO_CAMPANA_ACTIVO,
          descripcion_propiedad: descripcion || `Reporte solicitado por: ${solicitante || 'Marketing'}`,
          categoria: 'Meta Ads',
          tipo: 'Pauta Publicitaria',
          prioridad: 'Media'
        }])
        .select()
        .single();

      if (errNuevoReq) {
        return new Response(JSON.stringify({ error: errNuevoReq.message }), { status: 500 });
      }
      finalIdRequerimiento = nuevoReq.id_requerimiento;
    }

    // Actualizar tarea de CM si existen datos operativos
    const monedaNormalizada = typeof moneda === 'string' && moneda.trim()
      ? moneda.trim().toUpperCase().slice(0, 10)
      : null;
    if (estado || plataforma || presupuesto || descripcion || monedaNormalizada) {
      await supabaseServer.from('tareas_cm').update({
        ...(estado ? { estado } : {}),
        ...(plataforma ? { plataforma } : {}),
        ...(presupuesto ? { presupuesto } : {}),
        ...(monedaNormalizada ? { moneda: monedaNormalizada } : {}),
        ...(descripcion ? { descripcion_pauta: descripcion } : {}),
      }).eq('id_requerimiento', finalIdRequerimiento);
    }

    // 1. Eliminar reportes anteriores del mismo período para este requerimiento
    // (Por FK con CASCADE, también elimina sus reportes_meta_anuncios hijos)
    // Se eliminan todas las variantes de escritura del período
    await supabaseServer
      .from('reportes_meta_cm')
      .delete()
      .eq('id_requerimiento', finalIdRequerimiento)
      .in('periodo_mensual', variantesPeriodo(periodo));

    // 2. Guardar el reporte padre con los totales en 'reportes_meta_cm'
    const { data: reportePadre, error: errorPadre } = await supabaseServer
      .from('reportes_meta_cm')
      .insert([{
        id_requerimiento: finalIdRequerimiento,
        periodo_mensual: periodo,
        fecha_reporte: fecha,
        leads: Math.round(Number(metricas.leads) || 0),
        costo_por_lead: redondearMoneda(metricas.costo_por_lead),
        inversion: redondearMoneda(metricas.inversion),
        alcance: Math.round(Number(metricas.alcance) || 0),
        ctr_clics: Math.round(Number(metricas.ctr_clics) || 0)
      }])
      .select()
      .single();

    if (errorPadre) {
      return new Response(JSON.stringify({ error: errorPadre.message }), { status: 500 });
    }

    // 3. Si hay anuncios individuales del CSV, insertarlos en 'reportes_meta_anuncios'
    let anunciosGuardados = [];
    if (Array.isArray(anuncios) && anuncios.length > 0) {
      const payloadAnuncios = anuncios.map(a => {
        const esInactivo = a.activo === false;
        const nombreBase = (a.nombre_anuncio || 'Sin nombre').replace(/^\[[^\]]+\]\s*/, '').trim();
        const etiqueta = (a.estado_texto || 'Pausado').replace(/[\[\]]/g, '').trim();
        const nombreFinal = esInactivo ? `[${etiqueta}] ${nombreBase}` : nombreBase;

        return {
          id_reporte: reportePadre.id_reporte,
          nombre_anuncio: nombreFinal,
          leads: Math.round(Number(a.leads) || 0),
          costo_por_lead: redondearMoneda(a.costo_por_lead),
          inversion: redondearMoneda(a.inversion),
          alcance: Math.round(Number(a.alcance) || 0),
          ctr_clics: Math.round(Number(a.ctr_clics) || 0)
        };
      });

      const { data: dataAnuncios, error: errorAnuncios } = await supabaseServer
        .from('reportes_meta_anuncios')
        .insert(payloadAnuncios)
        .select();

      if (errorAnuncios) {
        return new Response(JSON.stringify({ error: errorAnuncios.message }), { status: 500 });
      }

      anunciosGuardados = normalizarAnunciosMeta(dataAnuncios);
    }

    return new Response(JSON.stringify({
      mensaje: `Reporte y ${anunciosGuardados.length} anuncio(s) sincronizados exitosamente en Supabase.`,
      reporte: reportePadre,
      anuncios: anunciosGuardados
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const msg = err.message || 'Error procesando reporte';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}