import test from 'node:test';
import assert from 'node:assert/strict';
import { leerDuracionPauta } from '../src/features/requerimientos/utils/duracionPauta.js';

test('restaura el orden de meses y años de una pauta guardada', () => {
  const pauta = leerDuracionPauta('Mes (28 Nov - 28 Dic 2027)', new Date(2026, 10, 3));
  assert.equal(pauta.inicio.getMonth(), 10);
  assert.equal(pauta.fin.getMonth(), 11);
  assert.equal(pauta.inicio.getFullYear(), 2027);
});

test('conserva un ciclo mensual entre dos años', () => {
  const pauta = leerDuracionPauta('Mes (28 Dic 2026 - 28 Ene 2027)');
  assert.equal(pauta.inicio.getMonth(), 11);
  assert.equal(pauta.inicio.getFullYear(), 2026);
  assert.equal(pauta.fin.getMonth(), 0);
  assert.equal(pauta.fin.getFullYear(), 2027);
});

test('el ciclo actual de enero termina en enero del mismo año', () => {
  const pauta = leerDuracionPauta('Mes', new Date(2027, 0, 3));
  assert.equal(pauta.inicio.getFullYear(), 2026);
  assert.equal(pauta.fin.getFullYear(), 2027);
});

test('restaura rangos por días nuevos y antiguos', () => {
  const pauta = leerDuracionPauta('7 días (29/12/2026 - 04/01/2027)');
  assert.equal(pauta.modo, 'Días');
  assert.equal(pauta.fechaInicio.getFullYear(), 2026);
  assert.equal(pauta.fechaFin.getFullYear(), 2027);
  const anterior = leerDuracionPauta('7 días (29/12 - 04/01)', new Date(2026, 10, 3));
  assert.equal(anterior.fechaFin.getFullYear(), 2027);
});

test('una primera selección de día queda abierta para elegir el final', () => {
  const pauta = leerDuracionPauta('1 día (03/11/2026)');
  assert.equal(pauta.fechaInicio.getDate(), 3);
  assert.equal(pauta.fechaFin, null);
});
