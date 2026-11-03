import test from 'node:test';
import assert from 'node:assert/strict';
import { esVisibleEnPanelCm } from '../src/features/cm/utils/requerimientosCm.js';

test('incluye todos los requerimientos de noviembre pendientes de configurar plataforma', () => {
  const requerimientos = [null, '', '   ', 'Facebook / Instagram'].map((plataforma, i) => ({
    id_requerimiento: i + 1,
    periodo_mensual: 'Noviembre 2026',
    tareas_cm: [{ estado: 'Por Hacer', plataforma }],
  }));
  requerimientos.push(
    { id_requerimiento: 5, periodo_mensual: 'Noviembre 2026', tareas_cm: [] },
    { id_requerimiento: 6, periodo_mensual: 'Noviembre 2026', tareas_cm: null },
    { id_requerimiento: 7, periodo_mensual: 'Noviembre 2026', tareas_cm: { estado: 'Por Hacer', plataforma: null } },
  );

  assert.deepEqual(requerimientos.filter(esVisibleEnPanelCm).map(r => r.id_requerimiento), [1, 2, 3, 4, 5, 6, 7]);
});

test('quitar pauteo sigue ocultando el requerimiento con relación de objeto o lista', () => {
  const tarea = { estado: 'Sin Pauta', plataforma: 'Facebook / Instagram' };
  assert.equal(esVisibleEnPanelCm({ tareas_cm: tarea }), false);
  assert.equal(esVisibleEnPanelCm({ tareas_cm: [tarea] }), false);
});

test('mantiene visibles campañas activas y finalizadas sin plataforma', () => {
  for (const estado of ['Campaña Activa', 'Finalizado']) {
    assert.equal(esVisibleEnPanelCm({ tareas_cm: { estado, plataforma: null } }), true);
  }
});
