// src/pages/api/cm/requerimientos.js
// Endpoint exclusivo del panel de Brenda (Community Manager)
// Incluye reportes_meta_cm y reportes_meta_anuncios
import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function GET({ url }) {
  try {
    const periodo = url.searchParams.get('periodo');

    let consulta = supabaseServer
      .from('requerimientos_propiedad')
      .select(`
        *,
        usuarios (id_usuario, nombre),
        tareas_cm (*),
        reportes_meta_cm (
          id_reporte,
          id_requerimiento,
          periodo_mensual,
          leads,
          costo_por_lead,
          inversion,
          alcance,
          ctr_clics
        )
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
    return new Response(JSON.stringify({ error: 'Error al consultar requerimientos de CM' }), { status: 500 });
  }
}
