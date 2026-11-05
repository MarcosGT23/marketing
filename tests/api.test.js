import test from 'node:test';
import assert from 'node:assert/strict';
import { apiHarness } from './helpers/apiHarness.js';

const ruta = 'src/pages/api/requerimientos/index.js';
const inicial = () => ({
  requerimientos_propiedad: [{ id_requerimiento: 1, nombre_propiedad: 'Casa', periodo_mensual: 'Noviembre 2026' }],
  tareas_video: [{ id_tarea: 10, id_requerimiento: 1, req_guion: true, req_fotos: true, req_grabacion: true, req_edicion: true, req_voz_off: true, Descripcion: 'Sesión de fotos' }],
  tareas_diseno: [{ id_tarea: 11, id_requerimiento: 1, fecha_limite: '2026-11-15' }],
  tareas_cm: [{ id_tarea: 12, id_requerimiento: 1, estado: 'Sin Pauta', plataforma: null, presupuesto: 50, moneda: 'BOB' }]
});

test('GET conserva la descripción de video y normaliza las relaciones', async () => {
  const base = inicial();
  base.requerimientos_propiedad[0].tareas_video = base.tareas_video;
  const api = await apiHarness(ruta, base);
  const res = await api.llamar('GET');
  assert.equal(res.status, 200);
  assert.equal(res.body[0].tareas_video.Descripcion, 'Sesión de fotos');
});

test('POST valida nombre antes de escribir y crea tareas de diseño, fotos y pauta', async () => {
  const api = await apiHarness(ruta);
  assert.equal((await api.llamar('POST', { nombre_propiedad: ' ' })).status, 400);
  assert.equal(api.operaciones.length, 0);
  assert.equal((await api.llamar('POST', { nombre_propiedad: 'Casa', periodo_mensual: 'noviembre de 2026', req_fotos: true, req_carrusel: true, plataforma: 'Instagram' })).status, 201);
  assert.equal(api.tablas.requerimientos_propiedad[0].periodo_mensual, 'Noviembre 2026');
  assert.equal(api.tablas.tareas_video[0].req_fotos, true);
  assert.equal(api.tablas.tareas_diseno.length, 1);
  assert.equal(api.tablas.tareas_cm[0].plataforma, 'Instagram');
});

test('las altas y ediciones de pauta conservan fechas dentro del límite de Supabase', async () => {
  const rechazarExceso = ({ tabla, accion, valores }) => {
    const duracion = (Array.isArray(valores) ? valores[0] : valores)?.periodo_pauta;
    return tabla === 'tareas_cm' && ['insert', 'update'].includes(accion) && duracion?.length > 20;
  };
  const api = await apiHarness(ruta, {}, rechazarExceso);
  const ciclo = 'Mes (28 Dic 2026 - 28 Ene 2027)';
  const alta = await api.llamar('POST', { nombre_propiedad: 'Casa', periodo_pauta: ciclo });
  assert.equal(alta.status, 201);
  const requerimiento = api.tablas.requerimientos_propiedad[0];
  requerimiento.tareas_cm = api.tablas.tareas_cm;
  assert.equal((await api.llamar('GET')).body[0].tareas_cm.periodo_pauta, ciclo);

  const rango = '7 días (29/12/2026 - 04/01/2027)';
  const editar = { id_requerimiento: requerimiento.id_requerimiento, panel: 'cm', periodo_pauta: rango };
  assert.equal((await api.llamar('PUT', editar)).status, 200);
  assert.equal((await api.llamar('GET')).body[0].tareas_cm.periodo_pauta, rango);

  const cm = await apiHarness('src/pages/api/tareas/cm.js', { tareas_cm: api.tablas.tareas_cm }, rechazarExceso);
  const parche = await cm.llamar('PATCH', { id_requerimiento: editar.id_requerimiento, periodo_pauta: ciclo });
  assert.equal(parche.status, 200);
  assert.equal(parche.body.data.periodo_pauta, ciclo);
});

test('POST rechaza una duración demasiado larga y desconocida antes de escribir', async () => {
  const api = await apiHarness(ruta);
  const res = await api.llamar('POST', { nombre_propiedad: 'Casa', periodo_pauta: 'Duración de pauta sin fechas reconocibles' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /duración de la pauta/);
  assert.equal(api.operaciones.length, 0);
});

test('PUT parcial de video conserva los otros checks y la fecha de diseño', async () => {
  const api = await apiHarness(ruta, inicial());
  const res = await api.llamar('PUT', { id_requerimiento: 1, panel: 'video', req_edicion: false });
  assert.equal(res.status, 200);
  assert.equal(api.tablas.tareas_video[0].req_edicion, false);
  assert.equal(api.tablas.tareas_video[0].req_guion, true);
  assert.equal(api.tablas.tareas_video[0].req_voz_off, true);
  assert.equal(api.tablas.tareas_diseno[0].fecha_limite, '2026-11-15');
});

test('PUT crea video al pedir solo fotos o voz en off sin reel', async () => {
  for (const campo of ['req_fotos', 'req_voz_off', 'req_grabacion', 'req_edicion']) {
    const base = inicial(); base.tareas_video = [];
    const api = await apiHarness(ruta, base);
    assert.equal((await api.llamar('PUT', { id_requerimiento: 1, panel: 'video', [campo]: true })).status, 200);
    assert.equal(api.tablas.tareas_video[0][campo], true);
  }
});

test('PUT general no crea tareas de video o diseño cuando no fueron solicitadas', async () => {
  const api = await apiHarness(ruta, { requerimientos_propiedad: inicial().requerimientos_propiedad });
  await api.llamar('PUT', { id_requerimiento: 1, req_reel: false, req_fotos: false, req_guion: false, fecha_limite: '', req_arte_estatico: false });
  assert.equal(api.tablas.tareas_video.length, 0);
  assert.equal(api.tablas.tareas_diseno.length, 0);
});

test('PUT de diseño sin fecha no borra la fecha límite existente', async () => {
  const api = await apiHarness(ruta, inicial());
  await api.llamar('PUT', { id_requerimiento: 1, panel: 'diseno', req_carrusel: true });
  assert.equal(api.tablas.tareas_diseno[0].fecha_limite, '2026-11-15');
});

test('PUT permite quitar y volver a habilitar pauta, conservando cambios parciales', async () => {
  const api = await apiHarness(ruta, inicial());
  await api.llamar('PUT', { id_requerimiento: 1, panel: 'cm', habilitar_pauta: true, plataforma: 'Instagram' });
  assert.equal(api.tablas.tareas_cm[0].estado, 'Por Hacer');
  assert.equal(api.tablas.tareas_cm[0].presupuesto, 50);
  assert.equal(api.tablas.tareas_cm[0].moneda, 'BOB');
  await api.llamar('PUT', { id_requerimiento: 1, panel: 'cm', quitar_pauta: true });
  assert.equal(api.tablas.tareas_cm[0].estado, 'Sin Pauta');
});

test('PUT rechaza panel desconocido sin escribir', async () => {
  const api = await apiHarness(ruta, inicial());
  assert.equal((await api.llamar('PUT', { id_requerimiento: 1, panel: 'otro' })).status, 400);
  assert.equal(api.operaciones.length, 0);
});

test('POST y PUT reportan fallos de tareas asociadas', async () => {
  for (const metodo of ['POST', 'PUT']) {
    const api = await apiHarness(ruta, inicial(), op => op.tabla === 'tareas_video' && ['insert', 'update'].includes(op.accion));
    const res = await api.llamar(metodo, { id_requerimiento: 1, nombre_propiedad: 'Casa', req_fotos: true });
    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'Fallo simulado');
    if (metodo === 'POST') assert.equal(api.tablas.requerimientos_propiedad.length, 1, 'revierte la solicitud nueva y conserva la original');
  }
});

test('DELETE detiene la eliminación y devuelve error si falla una dependencia', async () => {
  const api = await apiHarness(ruta, inicial(), op => op.tabla === 'tareas_video' && op.accion === 'delete');
  assert.equal((await api.llamar('DELETE', { id_requerimiento: 1 })).status, 500);
  assert.equal(api.tablas.requerimientos_propiedad.length, 1);
});

test('DELETE elimina el requerimiento y todas sus dependencias', async () => {
  const api = await apiHarness(ruta, inicial());
  assert.equal((await api.llamar('DELETE', { id_requerimiento: 1 })).status, 200);
  for (const filas of Object.values(api.tablas)) assert.equal(filas.length, 0);
});

for (const area of ['diseno', 'video', 'cm']) {
  test(`PATCH ${area}: validación, creación y modificación de tarea`, async () => {
    const api = await apiHarness(`src/pages/api/tareas/${area}.js`);
    assert.equal((await api.llamar('PATCH', {})).status, 400);
    assert.equal((await api.llamar('PATCH', { id_requerimiento: 1, estado: 'Incorrecto' })).status, 400);
    const nuevo = await api.llamar('PATCH', { id_requerimiento: 1, estado: 'Por Hacer', ...(area === 'cm' ? { presupuesto: 0 } : { progreso_porcentaje: 20 }) });
    assert.equal(nuevo.status, 200);
    assert.ok(nuevo.body.data.id_tarea);
    const fin = await api.llamar('PATCH', { id_tarea: nuevo.body.data.id_tarea, estado: 'Finalizado', ...(area === 'cm' ? { presupuesto: 30 } : { progreso_porcentaje: 150 }) });
    assert.equal(fin.status, 200);
    assert.equal(fin.body.data.estado, 'Finalizado');
    assert.equal(fin.body.data[area === 'cm' ? 'presupuesto' : 'progreso_porcentaje'], area === 'cm' ? 30 : 100);
  });
}

const reporteBase = () => ({
  reportes_meta_cm: [{ id_reporte: 1, id_requerimiento: 1, periodo_mensual: 'noviembre de 2026', fecha_reporte: '2026-11-01', inversion: 25 }]
});
const reporteNuevo = { id_requerimiento: 1, periodo_mensual: 'Noviembre 2026', metricas: { inversion: 45.25 }, anuncios: [{ nombre_anuncio: 'Casa', inversion: 45.25 }] };

test('importación conserva el reporte anterior si falla el nuevo reporte o sus anuncios', async () => {
  for (const tabla of ['reportes_meta_cm', 'reportes_meta_anuncios']) {
    const api = await apiHarness('src/pages/api/cm/importar.js', reporteBase(), op => op.tabla === tabla && op.accion === 'insert');
    assert.equal((await api.llamar('POST', reporteNuevo)).status, 500);
    assert.equal(api.tablas.reportes_meta_cm[0].id_reporte, 1);
    assert.equal(api.tablas.reportes_meta_cm[0].inversion, 25);
  }
});

test('importación reemplaza el reporte del período después de guardar anuncios y acepta presupuesto cero', async () => {
  const api = await apiHarness('src/pages/api/cm/importar.js', reporteBase());
  assert.equal((await api.llamar('POST', { ...reporteNuevo, presupuesto: 0, plataforma: 'Instagram' })).status, 200);
  assert.equal(api.tablas.reportes_meta_cm.length, 1);
  assert.equal(api.tablas.reportes_meta_cm[0].inversion, 45.25);
  assert.equal(api.tablas.reportes_meta_anuncios.length, 1);
  assert.equal(api.tablas.tareas_cm[0].presupuesto, 0);
});

test('consulta de anuncios devuelve el último reporte y comunica fallos de lectura', async () => {
  const api = await apiHarness('src/pages/api/cm/anuncios.js', reporteBase());
  assert.equal((await api.llamar('GET')).status, 400);
  assert.equal((await api.llamar('GET', undefined, 'id_requerimiento=1')).body.id_reporte, 1);
  const roto = await apiHarness('src/pages/api/cm/anuncios.js', {}, () => true);
  assert.equal((await roto.llamar('GET', undefined, 'id_requerimiento=1')).status, 500);
});
