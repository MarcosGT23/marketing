import test from 'node:test';
import assert from 'node:assert/strict';
import { apiHarness } from './helpers/apiHarness.js';

test('dashboard cuenta la activación guardada y no marca entregados sin tareas', async () => {
  const { exports: metricas } = await apiHarness('src/features/requerimientos/utils/dashboardMetrics.js');
  const resultado = metricas.calcularMetricas([
    { id_agente: 1, estado_general: 'Activo' },
    { id_agente: 2, estado_general: 'Inactivo', tareas_diseno: { estado: 'Finalizado' } },
    { id_agente: 1, estado_general: 'Activo', tareas_video: { estado: 'Grabando' } }
  ]);
  assert.equal(resultado.activas, 2);
  assert.equal(resultado.entregados, 1);
  assert.equal(resultado.sinIniciar, 1);
  assert.equal(resultado.enProceso, 1);
  assert.equal(resultado.agentesActivos, 2);
});

test('filtros de responsable, prioridad, agente y estado se combinan', async () => {
  const { exports: metricas } = await apiHarness('src/features/requerimientos/utils/dashboardMetrics.js');
  const datos = [
    { id_requerimiento: 1, id_agente: 1, prioridad: 'Alta', req_carrusel: true, tareas_diseno: { estado: 'Por Hacer' } },
    { id_requerimiento: 2, id_agente: 2, prioridad: 'Baja', req_carrusel: true, tareas_diseno: { estado: 'Finalizado' } }
  ];
  const filtrados = metricas.filtrarRequerimientos(datos, { agente: '1', prioridad: 'Alta', responsable: 'diseno', tipo: 'carrusel', estado: 'Sin iniciar' });
  assert.equal(filtrados.length, 1);
  assert.equal(filtrados[0].id_requerimiento, 1);
});

test('una pauta retirada no se cuenta por su categoría antigua', async () => {
  const { exports: metricas } = await apiHarness('src/features/requerimientos/utils/dashboardMetrics.js');
  assert.equal(metricas.tienePauta({ categoria: 'Meta Ads', tareas_cm: { estado: 'Sin Pauta' } }), false);
});

test('períodos y series agrupan variantes de noviembre sin mezclar octubre', async () => {
  const { exports: metricas } = await apiHarness('src/features/requerimientos/utils/dashboardMetrics.js');
  const datos = [{ periodo_mensual: 'Noviembre 2026' }, { periodo_mensual: 'noviembre de 2026' }, { periodo_mensual: 'Octubre 2026' }];
  const periodos = metricas.obtenerPeriodos(datos);
  assert.equal(periodos.join(','), 'Noviembre 2026,Octubre 2026');
  const serie = metricas.calcularSerieMensual(datos, periodos);
  assert.equal(serie[0].total, 1);
  assert.equal(serie[1].total, 2);
});
