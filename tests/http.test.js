import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerJson } from '../src/core/utils/http.js';

test('una consulta fallida no se interpreta como una lista vacía', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Sin conexión a datos' }), { status: 500 }));
  await assert.rejects(obtenerJson('/api/requerimientos'), /Sin conexión a datos/);
});

test('las consultas correctas devuelven datos y evitan la caché', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.equal(opciones.cache, 'no-store');
    return new Response(JSON.stringify([{ id: 1 }]));
  });
  assert.deepEqual(await obtenerJson('/api/requerimientos'), [{ id: 1 }]);
});
