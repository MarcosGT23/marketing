// src/pages/api/cm/anuncios.js
// GET: Consulta el reporte de Meta Ads y sus anuncios para una propiedad específica
import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function GET({ url }) {
  try {
    const id_requerimiento = url.searchParams.get('id_requerimiento');

    if (!id_requerimiento) {
      return new Response(JSON.stringify({ error: 'id_requerimiento es requerido' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('reportes_meta_cm')
      .select(`
        *,
        reportes_meta_anuncios (*)
      `)
      .eq('id_requerimiento', id_requerimiento)
      .order('fecha_importacion', { ascending: false });

    if (error) {
      console.warn('Error consultando reportes_meta_cm:', error.message);
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reporteActual = data && data.length > 0 ? data[0] : null;

    return new Response(JSON.stringify(reporteActual), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify(null), { status: 200 });
  }
}
