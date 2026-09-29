// src/pages/api/cm/importar.js
// Guarda los datos del CSV de Meta Ads:
// 1. Totales en 'reportes_meta_cm'
// 2. Anuncios individuales en 'reportes_meta_anuncios' (enlazados por id_reporte)
import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { id_requerimiento, periodo_mensual, metricas = {}, anuncios = [] } = body;

    if (!id_requerimiento) {
      return new Response(JSON.stringify({ error: 'id_requerimiento es requerido' }), { status: 400 });
    }

    const periodo = periodo_mensual || 'Septiembre 2026';
    const fecha = new Date().toISOString().split('T')[0];

    // 1. Eliminar reportes anteriores del mismo período para este requerimiento
    // (Por FK con CASCADE, también elimina sus reportes_meta_anuncios hijos)
    await supabaseServer
      .from('reportes_meta_cm')
      .delete()
      .eq('id_requerimiento', id_requerimiento)
      .eq('periodo_mensual', periodo);

    // 2. Guardar el reporte padre con los totales en 'reportes_meta_cm'
    const { data: reportePadre, error: errorPadre } = await supabaseServer
      .from('reportes_meta_cm')
      .insert([{
        id_requerimiento,
        periodo_mensual: periodo,
        fecha_reporte: fecha,
        leads: Math.round(Number(metricas.leads) || 0),
        costo_por_lead: Math.round(Number(metricas.costo_por_lead) || 0),
        inversion: Math.round(Number(metricas.inversion) || 0),
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
          costo_por_lead: Math.round(Number(a.costo_por_lead) || 0),
          inversion: Math.round(Number(a.inversion) || 0),
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

      anunciosGuardados = (dataAnuncios || []).map(a => {
        const match = (a.nombre_anuncio || '').match(/^\[([^\]]+)\]\s*(.*)$/);
        return {
          ...a,
          nombre_anuncio: match ? match[2].trim() : a.nombre_anuncio,
          activo: !match,
          estado_texto: match ? match[1].trim() : 'En circulación'
        };
      });
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