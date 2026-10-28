import test from 'node:test';
import assert from 'node:assert/strict';
import { decodificarCsv } from '../src/features/cm/utils/leerCsv.js';
import { repararMojibake, tieneMojibake } from '../src/features/cm/utils/mojibake.js';

const utf8 = (texto) => new TextEncoder().encode(texto);

test('decodifica UTF-8 con BOM', () => {
  const bytes = new Uint8Array([0xEF, 0xBB, 0xBF, ...utf8('Nombre del anuncio,Resultados\nCampaña A,5')]);
  const lectura = decodificarCsv(bytes);

  assert.equal(lectura.encoding, 'UTF-8 con BOM');
  assert.equal(lectura.texto.startsWith('Nombre del anuncio'), true);
  assert.equal(lectura.texto.includes('Campaña A'), true);
  assert.equal(lectura.reparado, false);
});

test('detecta Windows-1252 cuando el UTF-8 no es válido', () => {
  const bytes = new Uint8Array([
    ...utf8('Nombre del anuncio,Resultados\n'),
    0x43, 0x61, 0x6D, 0x70, 0x61, 0xF1, 0x61, 0x2C, 0x35 // Campaña,5
  ]);
  const lectura = decodificarCsv(bytes);

  assert.equal(lectura.encoding, 'Windows-1252');
  assert.equal(lectura.texto.includes('Campaña'), true);
});

test('decodifica UTF-16 LE con BOM', () => {
  const texto = 'Nombre del anuncio,Resultados\nAñadido,7';
  const bytes = new Uint8Array(2 + texto.length * 2);
  bytes[0] = 0xFF;
  bytes[1] = 0xFE;
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    bytes[2 + i * 2] = codigo & 0xFF;
    bytes[3 + i * 2] = codigo >> 8;
  }

  const lectura = decodificarCsv(bytes);
  assert.equal(lectura.encoding, 'UTF-16 LE');
  assert.equal(lectura.texto.includes('Añadido'), true);
});

test('repara UTF-8 leído como Windows-1252 (mojibake)', () => {
  const original = 'Nombre del anuncio,Resultados\nCampaña Ñandú,5';
  const mojibake = Buffer.from(original, 'utf8').toString('latin1');

  assert.equal(tieneMojibake(mojibake), true);
  const { texto, reparado } = repararMojibake(mojibake);
  assert.equal(reparado, true);
  assert.equal(texto, original);
});

test('deja intacto el texto sin mojibake', () => {
  const { texto, reparado } = repararMojibake('Campaña Ñandú');
  assert.equal(reparado, false);
  assert.equal(texto, 'Campaña Ñandú');
});
