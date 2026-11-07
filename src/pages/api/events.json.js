import { json } from '../../core/lib/taskStore';
import { validarEvento } from '../../features/calendario/domain/eventos';
import { consultarSheets } from '../../features/calendario/infrastructure/googleSheets';

export const prerender = false;

function respuestaError(error) {
  return json({ error: error.message || 'No se pudo sincronizar el calendario.', code: error.code }, error.status || 500);
}

export async function GET() {
  try {
    return json(await consultarSheets());
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Los datos enviados no son válidos.' }, 400); }
  if (!body || !['add', 'delete'].includes(body.action)) return json({ error: 'Acción de calendario no válida.' }, 400);
  let operacion;
  if (body.action === 'add') {
    const error = validarEvento(body);
    if (error) return json({ error }, 400);
    const { id, title, agent, type, date, start, duration, exceptionReason } = body;
    operacion = { action: 'add', event: { id, title: title.trim(), agent: agent.trim(), type, date, start, duration, exceptionReason: (exceptionReason || '').trim() } };
  } else {
    if (typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.id)) return json({ error: 'Selecciona un evento válido.' }, 400);
    operacion = { action: 'delete', id: body.id };
  }
  try {
    return json(await consultarSheets(operacion));
  } catch (error) {
    return respuestaError(error);
  }
}
