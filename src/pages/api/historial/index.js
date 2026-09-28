// src/pages/api/historial/index.js
// Endpoint para consultar la bitácora histórica de actividades de seguimiento
import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function GET({ url }) {
  try {
    const id_requerimiento = url.searchParams.get('id_requerimiento');
    const departamento = url.searchParams.get('departamento');
    const limite = parseInt(url.searchParams.get('limite') || '100', 10);

    let consulta = supabaseServer
      .from('historial_seguimiento')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .limit(limite);

    if (id_requerimiento) {
      consulta = consulta.eq('id_requerimiento', id_requerimiento);
    }

    if (departamento) {
      consulta = consulta.ilike('departamento', departamento);
    }

    const { data, error } = await consulta;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error consultando historial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
