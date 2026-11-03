import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

async function cargarComponente(archivo) {
  const resultado = await build({ entryPoints: [archivo], bundle: true, platform: 'node', format: 'cjs', write: false, jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const modulo = { exports: {} };
  vm.runInNewContext(resultado.outputFiles[0].text, { module: modulo, exports: modulo.exports, require: createRequire(import.meta.url), console });
  return modulo.exports.default;
}

test('las opciones solicitadas son información de solo lectura', async () => {
  const Componente = await cargarComponente('src/features/requerimientos/presentation/components/OpcionesSolicitadas.jsx');
  const html = renderToStaticMarkup(React.createElement(Componente, { requerimiento: {
    req_reel: true, req_carrusel: true, tareas_video: [{ req_guion: true, req_voz_off: true, actividades_completadas: { req_fotos: true } }],
  } }));
  assert.match(html, /Grabación Reel/);
  assert.match(html, /Carrusel/);
  assert.match(html, /Guion \/ Storyboard/);
  assert.match(html, /Voz en off \/ Locución/);
  assert.doesNotMatch(html, /<button|<input|Sesión fotográfica/);
});

test('una nota o público objetivo largo se puede desplegar aunque no exista descripción', async () => {
  const Componente = await cargarComponente('src/features/requerimientos/presentation/components/InformacionRequerimiento.jsx');
  const html = renderToStaticMarkup(React.createElement(Componente, { requerimiento: {
    notas_produccion: 'Instrucciones de producción extensas. '.repeat(8),
    publico_objetivo: 'Familias que buscan su nuevo hogar. '.repeat(8),
  } }));
  assert.match(html, /Mostrar información completa: notas de producción/);
  assert.match(html, /Mostrar información completa: público objetivo/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls=/);
});

test('un texto breve no se recorta ni necesita botón adicional', async () => {
  const Componente = await cargarComponente('src/core/ui/TextoExpandible.jsx');
  const html = renderToStaticMarkup(React.createElement(Componente, { texto: 'Texto completo.' }));
  assert.match(html, /Texto completo\./);
  assert.doesNotMatch(html, /line-clamp|<button/);
});
