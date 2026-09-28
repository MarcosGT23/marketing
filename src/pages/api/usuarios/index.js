import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function GET({ url }) {
  try {
    const rol = url.searchParams.get('rol') || 'Agente';

    const { data, error } = await supabaseServer
      .from('usuarios')
      .select('id_usuario, nombre, rol')
      .eq('rol', rol)
      .order('nombre', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error obteniendo usuarios' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}