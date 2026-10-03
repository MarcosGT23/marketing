import { supabaseServer } from '../../../core/lib/supabaseServer';

export const prerender = false;

export async function GET({ url }) {
  try {
    const rol = url.searchParams.get('rol');

    let consulta = supabaseServer
      .from('usuarios')
      .select('id_usuario, nombre, rol')
      .order('nombre', { ascending: true });

    // Filtrar por rol de manera insensible a mayúsculas/minúsculas (ej: 'agente' o 'Agente')
    if (rol && rol.toLowerCase() !== 'todos' && rol.toLowerCase() !== 'all') {
      consulta = consulta.ilike('rol', rol.trim());
    } else if (!rol) {
      consulta = consulta.ilike('rol', 'Agente');
    }

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

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error obteniendo usuarios' }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }
}