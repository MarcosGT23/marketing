import { json } from '../../../core/lib/taskStore';
import { HOJA_PRODUCCION, leerProduccionCsv } from '../../../features/calendario/domain/produccion';

export const prerender = false;

export async function GET() {
  try {
    const respuesta = await fetch(HOJA_PRODUCCION.csv, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!respuesta.ok || !respuesta.headers.get('content-type')?.includes('text/csv')) {
      return json({ error: 'No se pudo leer CALENDARIO PRODUCCIÓN. Revisa el acceso al archivo compartido.' }, 502);
    }
    const datos = leerProduccionCsv(await respuesta.text());
    return json({ ...datos, actualizado: new Date().toISOString() });
  } catch (error) {
    return json({ error: error.name === 'TimeoutError' ? 'Google tardó demasiado en responder. Vuelve a sincronizar las anotaciones.' : error.message || 'No se pudieron cargar las anotaciones de producción.' }, 502);
  }
}
