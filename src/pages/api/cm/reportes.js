// src/pages/api/cm/reportes.js
// GET: Lista todos los reportes de Meta Ads cargados por CSV, con sus anuncios
// y la propiedad/agente asociados, para el submenú de reportes del panel de CM.
import { supabaseServer } from '../../../core/lib/supabaseServer';
import { normalizarAnunciosMeta } from '../../../features/cm/utils/anunciosMeta';

export const prerender = false;

export async function GET() {
  try {
    const { data: reportes, error } = await supabaseServer
      .from('reportes_meta_cm')
      .select(`
        id_reporte,
        id_requerimiento,
        periodo_mensual,
        fecha_reporte,
        leads,
        costo_por_lead,
        inversion,
        alcance,
        ctr_clics,
        reportes_meta_anuncios (
          id_anuncio,
          nombre_anuncio,
          leads,
          costo_por_lead,
          inversion,
          alcance,
          ctr_clics
        )
      `)
      .order('fecha_reporte', { ascending: false })
      .order('id_reporte', { ascending: false });

    if (error) throw error;

    const idsRequerimiento = [...new Set((reportes || []).map((r) => r.id_requerimiento).filter(Boolean))];
    let propiedadesPorId = new Map();

    if (idsRequerimiento.length > 0) {
      const { data: propiedades, error: errorPropiedades } = await supabaseServer
        .from('requerimientos_propiedad')
        .select(`
          id_requerimiento,
          nombre_propiedad,
          periodo_mensual,
          id_agente,
          usuarios!id_agente (id_usuario, nombre)
        `)
        .in('id_requerimiento', idsRequerimiento);

      if (errorPropiedades) throw errorPropiedades;

      propiedadesPorId = new Map((propiedades || []).map((p) => {
        const agente = Array.isArray(p.usuarios) ? p.usuarios[0] || null : p.usuarios;
        return [p.id_requerimiento, {
          id_requerimiento: p.id_requerimiento,
          nombre_propiedad: p.nombre_propiedad,
          periodo_mensual: p.periodo_mensual,
          id_agente: p.id_agente,
          agente: agente ? { id_usuario: agente.id_usuario, nombre: agente.nombre } : null
        }];
      }));
    }

    const respuesta = (reportes || []).map((reporte) => ({
      ...reporte,
      reportes_meta_anuncios: normalizarAnunciosMeta(reporte.reportes_meta_anuncios),
      propiedad: propiedadesPorId.get(reporte.id_requerimiento) || null
    }));

    return new Response(JSON.stringify(respuesta), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error al consultar reportes de CM' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
