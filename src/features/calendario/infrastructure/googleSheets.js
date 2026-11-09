import { validarEvento } from '../domain/eventos.js';

export class ErrorCalendario extends Error {
  constructor(message, status = 502, code = 'SHEETS_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function consultarSheets(operacion) {
  const urlConfigurada = process.env.GOOGLE_SHEETS_CALENDAR_URL || import.meta.env?.GOOGLE_SHEETS_CALENDAR_URL;
  const token = process.env.GOOGLE_SHEETS_CALENDAR_TOKEN || import.meta.env?.GOOGLE_SHEETS_CALENDAR_TOKEN;
  if (!urlConfigurada || !token) {
    throw new ErrorCalendario('Falta conectar la hoja de Google Sheets del calendario.', 503, 'CALENDAR_NOT_CONFIGURED');
  }
  let url;
  try {
    url = new URL(urlConfigurada);
  } catch {
    throw new ErrorCalendario('La dirección de conexión del calendario no es válida.', 503);
  }
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) {
    throw new ErrorCalendario('Configura la URL publicada de Google Apps Script terminada en /exec.', 503);
  }
  if (!operacion) url.searchParams.set('token', token);

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: operacion ? 'POST' : 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
      ...(operacion ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...operacion, token }) } : {}),
    });
  } catch {
    throw new ErrorCalendario('Google Sheets no respondió. Actualiza el calendario antes de reintentar.', 504);
  }
  if (!respuesta.ok) {
    throw new ErrorCalendario('Google Sheets rechazó la conexión. Revisa la publicación de Apps Script.');
  }
  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorCalendario('La conexión devolvió una página en lugar de datos. Revisa el acceso a Apps Script.');
  }
  if (datos?.ok !== true) {
    const estados = { CONFLICT: 409, INVALID_EVENT: 400, UNAUTHORIZED: 503, NOT_FOUND: 404, ID_CONFLICT: 409 };
    throw new ErrorCalendario(datos?.error || 'No se pudo completar el cambio en Google Sheets.', estados[datos?.code] || 502, datos?.code);
  }
  if (!operacion) {
    if (!Array.isArray(datos.events) || datos.events.some(evento => validarEvento(evento, { exigirMotivo: false }))) {
      throw new ErrorCalendario('Hay filas de calendario incompletas o inválidas en la pestaña Eventos. Revisa sus fechas y horarios.');
    }
    return datos.events;
  }
  if (operacion.action === 'add' && (!datos.event || validarEvento(datos.event) || datos.event.id !== operacion.event.id)) {
    throw new ErrorCalendario('No se pudo confirmar la reserva. Actualiza el calendario antes de reintentar.');
  }
  if (operacion.action === 'delete' && datos.id !== operacion.id) {
    throw new ErrorCalendario('No se pudo confirmar la eliminación. Actualiza el calendario.');
  }
  return datos;
}
