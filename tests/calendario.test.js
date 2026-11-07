import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { diasDelMes, fechaBolivia, haySolape, validarEvento } from '../src/features/calendario/domain/eventos.js';
import { consultarSheets } from '../src/features/calendario/infrastructure/googleSheets.js';
import { apiHarness } from './helpers/apiHarness.js';

const reserva = (campos = {}) => ({ id: 'reserva-1', title: 'Rodaje Urubó', agent: 'Equipo Interno', type: 'grabacion', date: '2026-11-10', start: 9, duration: 2, exceptionReason: '', ...campos });

test('el mes omite domingos, conserva los sábados y usa la fecha de Bolivia', () => {
  const dias = diasDelMes(2026, 10);
  assert.equal(dias[0].fecha, '2026-11-02');
  assert.equal(dias.length % 6, 0);
  assert.ok(dias.some(dia => dia.fecha === '2026-11-07'));
  assert.ok(!dias.some(dia => dia.fecha === '2026-11-08'));
  assert.equal(fechaBolivia(new Date('2026-11-08T02:00:00Z')), '2026-11-07');
});

test('reservas validan fechas reales, intervalos, cierre y excepciones de edición', () => {
  assert.equal(validarEvento(reserva()), null);
  for (const cambio of [{ date: '2026-02-30' }, { date: '2026-11-08' }, { start: 18.5, duration: 1 }, { duration: 0 }, { start: 9.25 }, { type: '__proto__' }, { date: '2026-11-09' }]) assert.ok(validarEvento(reserva(cambio)));
  assert.equal(validarEvento(reserva({ date: '2026-11-09', exceptionReason: 'Rodaje solicitado por el cliente' })), null);
  assert.equal(validarEvento(reserva({ date: '2026-11-09', type: 'edicion' })), null);
});

test('solo se considera solape el tiempo compartido de la misma persona', () => {
  const primero = reserva();
  assert.ok(haySolape(primero, reserva({ id: 'otra', start: 10.5, agent: ' equipo interno ' })));
  assert.ok(!haySolape(primero, reserva({ id: 'otra', start: 11 })));
  assert.ok(!haySolape(primero, reserva({ id: 'otra', agent: 'Otra persona' })));
});

test('API rechaza datos inválidos y propaga un conflicto de Sheets', async () => {
  const peticiones = [];
  const api = await apiHarness('src/pages/api/events.json.js', {}, undefined, {
    'googleSheets.js': { consultarSheets: async operacion => {
      peticiones.push(operacion);
      if (!operacion) return [reserva()];
      throw Object.assign(new Error('Horario ocupado.'), { status: 409, code: 'CONFLICT' });
    } }
  });
  assert.equal((await api.llamar('POST', { action: 'add', ...reserva({ date: '2026-11-08' }) })).status, 400);
  assert.equal(peticiones.length, 0);
  const conflicto = await api.llamar('POST', { action: 'add', ...reserva(), token: 'no-transmitir' });
  assert.equal(conflicto.status, 409);
  assert.equal(peticiones[0].token, undefined);
  assert.equal((await api.llamar('GET')).body.length, 1);
});

test('conexión distingue configuración pendiente, HTML, errores de Sheets y confirmación incompleta', async () => {
  const urlAnterior = process.env.GOOGLE_SHEETS_CALENDAR_URL;
  const tokenAnterior = process.env.GOOGLE_SHEETS_CALENDAR_TOKEN;
  const fetchAnterior = globalThis.fetch;
  try {
    delete process.env.GOOGLE_SHEETS_CALENDAR_URL;
    delete process.env.GOOGLE_SHEETS_CALENDAR_TOKEN;
    await assert.rejects(consultarSheets(), error => error.status === 503);
    process.env.GOOGLE_SHEETS_CALENDAR_URL = 'https://script.google.com/macros/s/ejemplo/exec';
    process.env.GOOGLE_SHEETS_CALENDAR_TOKEN = 'clave-de-prueba';
    globalThis.fetch = async () => new Response('<html>Iniciar sesión</html>');
    await assert.rejects(consultarSheets(), /página en lugar de datos/);
    globalThis.fetch = async () => Response.json({ ok: false, code: 'CONFLICT', error: 'Horario ocupado' });
    await assert.rejects(consultarSheets({ action: 'add', event: reserva() }), error => error.status === 409);
    globalThis.fetch = async () => Response.json({ ok: true });
    await assert.rejects(consultarSheets({ action: 'add', event: reserva() }), /confirmar la reserva/);
    globalThis.fetch = async (url, opciones) => {
      assert.equal(url.searchParams.get('token'), 'clave-de-prueba');
      assert.equal(opciones.cache, 'no-store');
      return Response.json({ ok: true, events: [reserva()] });
    };
    assert.equal((await consultarSheets()).length, 1);
  } finally {
    globalThis.fetch = fetchAnterior;
    if (urlAnterior === undefined) delete process.env.GOOGLE_SHEETS_CALENDAR_URL; else process.env.GOOGLE_SHEETS_CALENDAR_URL = urlAnterior;
    if (tokenAnterior === undefined) delete process.env.GOOGLE_SHEETS_CALENDAR_TOKEN; else process.env.GOOGLE_SHEETS_CALENDAR_TOKEN = tokenAnterior;
  }
});

test('Apps Script guarda, evita duplicados, rechaza solapes y elimina la fila por ID', async () => {
  const filas = [];
  let bloqueado = false;
  let liberaciones = 0;
  const hoja = {
    getLastRow: () => filas.length,
    setFrozenRows() {},
    deleteRow(indice) { assert.ok(bloqueado); filas.splice(indice - 1, 1); },
    getRange(fila, columna, alto, ancho) {
      return {
        getValues: () => Array.from({ length: alto }, (_, i) => Array.from({ length: ancho }, (_, j) => filas[fila - 1 + i]?.[columna - 1 + j] ?? '')),
        setNumberFormat() { return this; },
        setValues(valores) { assert.ok(bloqueado); valores.forEach((filaNueva, indice) => { filas[fila - 1 + indice] = filaNueva.map(valor => typeof valor === 'string' && valor.startsWith("'") ? valor.slice(1) : valor); }); return this; }
      };
    }
  };
  const entorno = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: nombre => ({ SPREADSHEET_ID: 'hoja-prueba', CALENDAR_TOKEN: 'clave' })[nombre] }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => hoja }), flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() { bloqueado = true; }, hasLock: () => bloqueado, releaseLock() { bloqueado = false; liberaciones++; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: texto => ({ setMimeType: () => JSON.parse(texto) }) }
  });
  vm.runInContext(await readFile(new URL('../integrations/google-apps-script/Calendario.gs', import.meta.url), 'utf8'), entorno);
  entorno.prepararCalendario();
  const enviar = body => entorno.doPost({ postData: { contents: JSON.stringify({ token: 'clave', ...body }) } });
  assert.equal(enviar({ action: 'add', event: reserva() }).ok, true);
  assert.equal(enviar({ action: 'add', event: reserva() }).ok, true);
  assert.equal(filas.length, 2, 'el reintento conserva una sola fila');
  assert.equal(enviar({ action: 'add', event: reserva({ title: 'Otra reserva' }) }).code, 'ID_CONFLICT');
  assert.equal(enviar({ action: 'add', event: reserva({ id: 'solape', start: 10 }) }).code, 'CONFLICT');
  assert.equal(enviar({ action: 'add', event: reserva({ id: 'domingo', date: '2026-11-08' }) }).code, 'INVALID_EVENT');
  assert.equal(entorno.doGet({ parameter: { token: 'incorrecta' } }).code, 'UNAUTHORIZED');
  assert.equal(entorno.doGet({ parameter: { token: 'clave' } }).events.length, 1);
  filas.splice(1, 0, Array(9).fill(''));
  assert.equal(enviar({ action: 'delete', id: 'reserva-1' }).ok, true);
  assert.equal(enviar({ action: 'delete', id: 'reserva-1' }).ok, true);
  assert.equal(entorno.doGet({ parameter: { token: 'clave' } }).events.length, 0);
  assert.ok(liberaciones >= 10);
});
