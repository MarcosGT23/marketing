import test from 'node:test';
import assert from 'node:assert/strict';
import {
  obtenerPeriodosExportacion, filtrarExportacion, filtrarContextoExportacion,
  SIN_PERIODO_EXPORTACION,
} from '../src/core/utils/exportacion.js';
import { apiHarness } from './helpers/apiHarness.js';

const requerimientos = [
  { id_requerimiento: 1, id_agente: 10, nombre_propiedad: 'Casa A', periodo_mensual: 'Octubre 2026', categoria: 'Casa', usuarios: { nombre: 'Ana' } },
  { id_requerimiento: 2, id_agente: 10, nombre_propiedad: 'Casa B', periodo_mensual: 'noviembre de 2026', categoria: 'Casa', usuarios: { nombre: 'Ana' } },
  { id_requerimiento: 3, id_agente: 20, nombre_propiedad: 'Terreno C', periodo_mensual: 'Noviembre 2026', categoria: 'Terreno', usuarios: { nombre: 'Luis' } },
  { id_requerimiento: 4, periodo_mensual: 'Noviembre 2027' },
  { id_requerimiento: 5, periodo_mensual: null },
];

test('el menú agrupa variantes del mes, separa años y ordena los períodos', () => {
  assert.deepEqual(obtenerPeriodosExportacion(requerimientos), [
    { valor: 'Noviembre 2027', nombre: 'Noviembre 2027', cantidad: 1 },
    { valor: 'Noviembre 2026', nombre: 'Noviembre 2026', cantidad: 2 },
    { valor: 'Octubre 2026', nombre: 'Octubre 2026', cantidad: 1 },
    { valor: SIN_PERIODO_EXPORTACION, nombre: 'Sin período', cantidad: 1 },
  ]);
});

test('exporta solamente el mes y la campaña elegidos', () => {
  const seleccion = filtrarExportacion(requerimientos, { periodo: 'Noviembre 2026', agente: '10', campana: '2' });
  assert.deepEqual(seleccion.map(r => r.id_requerimiento), [2]);
  assert.equal(filtrarExportacion(requerimientos, { periodo: 'Octubre 2026', campana: '2' }).length, 0);
  assert.deepEqual(filtrarExportacion(requerimientos, { periodo: SIN_PERIODO_EXPORTACION }).map(r => r.id_requerimiento), [5]);
});

test('cambiar el mes conserva los filtros de agente, categoría y búsqueda del panel', () => {
  const contexto = filtrarContextoExportacion(requerimientos, { agente: '10', categoria: 'Casa', busqueda: 'Ana' });
  assert.deepEqual(contexto.map(r => r.id_requerimiento), [1, 2]);
  assert.equal(filtrarExportacion(contexto, { periodo: 'Octubre 2026' })[0].id_requerimiento, 1);
  assert.equal(filtrarExportacion(contexto, { periodo: 'Noviembre 2026' })[0].id_requerimiento, 2);
});

test('CM usa el período del reporte aunque la propiedad corresponda a otro mes', () => {
  const reportes = [{ id_requerimiento: 1, periodo_mensual: 'Octubre 2026', propiedad: { periodo_mensual: 'Noviembre 2026', id_agente: 10, agente: { nombre: 'Ana', id_usuario: 10 } } }];
  assert.equal(filtrarExportacion(reportes, { periodo: 'Octubre 2026', agente: '10' }).length, 1);
  assert.equal(filtrarExportacion(reportes, { periodo: 'Noviembre 2026' }).length, 0);
  const meses = obtenerPeriodosExportacion(reportes, requerimientos);
  assert.equal(meses.find(m => m.valor === 'Noviembre 2026').cantidad, 0);
});

for (const [archivo, funcion] of [
  ['diseno/utils/disenoExcelMapper.js', 'exportarDisenoExcel'],
  ['video/utils/videoExcelMapper.js', 'exportarVideoExcel'],
  ['requerimientos/utils/requerimientosExcelMapper.js', 'exportarRequerimientosExcel'],
  ['cm/utils/cmExcelMapper.js', 'exportarReportesCmExcel'],
]) {
  test(`Excel ${funcion}: incluye mes en nombre y encabezado y solo las filas elegidas`, async () => {
    let resultado;
    const api = await apiHarness(`src/features/${archivo}`, {}, () => false, {
      'excelExporter.js': { exportarExcel: async opciones => { resultado = opciones; } },
    });
    const seleccionados = filtrarExportacion(requerimientos, { periodo: 'Noviembre 2026', campana: '2' });
    await api.exports[funcion](seleccionados, { periodo: 'Noviembre 2026', campanaNombre: 'Casa B' });
    assert.match(resultado.nombreArchivo, /Noviembre_2026/);
    assert.match(resultado.hojas[0].subtitulo, /Noviembre 2026/);
    assert.equal(resultado.hojas[0].filas.length, 1);
  });
}
