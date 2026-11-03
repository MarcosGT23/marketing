import test from 'node:test';
import assert from 'node:assert/strict';
import { completarActividad, normalizarTareaVideo, serializarProgresoVideo } from '../src/features/video/utils/videoProgress.js';
import { obtenerOpcionesSolicitadas } from '../src/features/requerimientos/utils/opcionesSolicitadas.js';
import { apiHarness } from './helpers/apiHarness.js';

const tareaInicial = () => ({
  id_tarea: 10, id_requerimiento: 1, estado: 'Por Hacer', progreso_porcentaje: 0,
  req_guion: true, req_fotos: true, req_grabacion: false, req_edicion: true, req_voz_off: false,
  Descripcion: 'Conservar las instrucciones de la sesión.',
});

test('las opciones marcadas en la solicitud no completan pendientes', () => {
  const tarea = normalizarTareaVideo(tareaInicial());
  assert.equal(tarea.req_guion, true);
  assert.equal(tarea.req_edicion, true);
  assert.equal(Object.values(tarea.actividades_completadas).some(Boolean), false);
  assert.equal(tarea.progreso_porcentaje, 0);
});

test('completar o desmarcar una actividad no modifica las opciones solicitadas', () => {
  const tarea = normalizarTareaVideo(tareaInicial());
  const requerimiento = { req_reel: true, tareas_video: [tarea] };
  const solicitadas = obtenerOpcionesSolicitadas(requerimiento);
  const completada = completarActividad(tarea, 'req_grabacion', true);
  assert.equal(completada.req_grabacion, false);
  assert.equal(completada.actividades_completadas.req_grabacion, true);
  assert.equal(completada.progreso_porcentaje, 20);
  assert.deepEqual(obtenerOpcionesSolicitadas({ ...requerimiento, tareas_video: completada }), solicitadas);
  assert.equal(completarActividad(completada, 'req_grabacion', false).estado, 'Por Hacer');
});

test('serialización conserva descripción y avance de manera independiente', () => {
  const tarea = tareaInicial();
  const serializado = serializarProgresoVideo(tarea.Descripcion, { req_fotos: true });
  const resultado = normalizarTareaVideo({ ...tarea, Descripcion: serializado });
  assert.equal(resultado.Descripcion, tarea.Descripcion);
  assert.equal(resultado.actividades_completadas.req_fotos, true);
  assert.equal(resultado.actividades_completadas.req_guion, false);
  const jsonUsuario = '{"descripcion":"Texto JSON del usuario"}';
  assert.equal(normalizarTareaVideo({ ...tarea, Descripcion: jsonUsuario }).Descripcion, jsonUsuario);
});

test('PATCH de progreso conserva requisitos e instrucciones y devuelve el avance separado', async () => {
  const api = await apiHarness('src/pages/api/tareas/video.js', { tareas_video: [tareaInicial()] });
  const res = await api.llamar('PATCH', {
    id_tarea: 10, actividades_completadas: { req_grabacion: true },
    estado: 'Grabando', progreso_porcentaje: 20,
    req_guion: false, req_edicion: false,
  });
  assert.equal(res.status, 200);
  assert.equal(api.tablas.tareas_video[0].req_guion, true);
  assert.equal(api.tablas.tareas_video[0].req_edicion, true);
  assert.equal(api.tablas.tareas_video[0].req_grabacion, false);
  assert.equal(res.body.data.Descripcion, tareaInicial().Descripcion);
  assert.equal(res.body.data.actividades_completadas.req_grabacion, true);

  const editada = await api.llamar('PATCH', { id_tarea: 10, Descripcion: 'Nueva instrucción.' });
  assert.equal(editada.body.data.actividades_completadas.req_grabacion, true);
  assert.equal(editada.body.data.Descripcion, 'Nueva instrucción.');

  const vuelta = await api.llamar('PATCH', { id_tarea: 10, actividades_completadas: { req_grabacion: false } });
  assert.equal(vuelta.body.data.actividades_completadas.req_grabacion, false);
  assert.equal(vuelta.body.data.Descripcion, 'Nueva instrucción.');
  assert.equal(vuelta.body.data.req_grabacion, false);
});

test('GET normaliza el avance guardado sin exponer el formato de almacenamiento', async () => {
  const tarea = { ...tareaInicial(), Descripcion: serializarProgresoVideo('Texto visible', { req_fotos: true }) };
  const api = await apiHarness('src/pages/api/requerimientos/index.js', {
    requerimientos_propiedad: [{ id_requerimiento: 1, req_reel: true, tareas_video: [tarea] }],
  });
  const res = await api.llamar('GET');
  assert.equal(res.body[0].tareas_video.Descripcion, 'Texto visible');
  assert.equal(res.body[0].tareas_video.actividades_completadas.req_fotos, true);
  assert.equal(res.body[0].tareas_video.req_edicion, true);
});

test('las opciones solo se editan desde el requerimiento y conservan el avance', async () => {
  const tarea = { ...tareaInicial(), Descripcion: serializarProgresoVideo('Instrucciones', { req_fotos: true }) };
  const api = await apiHarness('src/pages/api/requerimientos/index.js', {
    requerimientos_propiedad: [{ id_requerimiento: 1, nombre_propiedad: 'Casa' }], tareas_video: [tarea],
  });
  assert.equal((await api.llamar('PUT', { id_requerimiento: 1, panel: 'video', req_guion: false })).status, 200);
  assert.equal(api.tablas.tareas_video[0].req_guion, false);
  assert.equal(normalizarTareaVideo(api.tablas.tareas_video[0]).actividades_completadas.req_fotos, true);
});

test('finalizar y volver a pendientes sincroniza avances sin cambiar solicitudes', async () => {
  const api = await apiHarness('src/pages/api/tareas/video.js', { tareas_video: [tareaInicial()] });
  const final = await api.llamar('PATCH', { id_tarea: 10, estado: 'Finalizado', progreso_porcentaje: 100 });
  assert.equal(Object.values(final.body.data.actividades_completadas).every(Boolean), true);
  assert.equal(final.body.data.req_voz_off, false);
  const pendiente = await api.llamar('PATCH', { id_tarea: 10, estado: 'Por Hacer', progreso_porcentaje: 0 });
  assert.equal(Object.values(pendiente.body.data.actividades_completadas).some(Boolean), false);
  assert.equal(pendiente.body.data.req_guion, true);
});

test('rechaza avances mal formados y cambios de requisitos desde el checklist', async () => {
  const api = await apiHarness('src/pages/api/tareas/video.js', { tareas_video: [tareaInicial()] });
  assert.equal((await api.llamar('PATCH', { id_tarea: 10, actividades_completadas: [] })).status, 400);
  assert.equal((await api.llamar('PATCH', { id_tarea: 10, req_guion: false })).status, 400);
  assert.equal(api.tablas.tareas_video[0].req_guion, true);
});
