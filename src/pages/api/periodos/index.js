// src/pages/api/periodos/index.js
// Endpoint de solo lectura: lista los periodos mensuales de la base de datos
// junto con la cantidad de campañas registradas y cuántas de ellas están activadas
// (requerimientos_propiedad.estado_general = 'Activo').
import { supabaseServer } from '../../../core/lib/supabaseServer';
import { normalizarPeriodo, periodoAFecha } from '../../../core/utils/dateUtils';
import { esCampanaActivada } from '../../../core/utils/campanaUtils';

export const prerender = false;

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('requerimientos_propiedad')
      .select('periodo_mensual, estado_general');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    const mapa = new Map();

    (data || []).forEach(row => {
      const periodo = normalizarPeriodo(row.periodo_mensual);
      if (!periodo) return;

      if (!mapa.has(periodo)) {
        mapa.set(periodo, { periodo, total: 0, activas: 0 });
      }

      const item = mapa.get(periodo);
      item.total += 1;
      if (esCampanaActivada(row)) item.activas += 1;
    });

    const periodos = Array.from(mapa.values()).sort((a, b) => {
      const fa = periodoAFecha(a.periodo)?.getTime() ?? 0;
      const fb = periodoAFecha(b.periodo)?.getTime() ?? 0;
      return fb - fa;
    });

    return new Response(JSON.stringify(periodos), {
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
