import { guardarTarea, registrarHistorial, json, estadoValido } from '../../../core/lib/taskStore';

export const prerender = false;

const ESTADOS = ['Por Hacer', 'Grabando', 'En Edición', 'Finalizado'];
const COLUMNAS = 'id_tarea, id_requerimiento, estado, progreso_porcentaje, req_guion, req_fotos, req_grabacion, req_edicion, req_voz_off, Descripcion';

export async function PATCH({ request }) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body JSON inválido' }, 400);
    }

    const {
      id_tarea,
      id_requerimiento,
      req_guion,
      req_fotos,
      req_grabacion,
      req_edicion,
      req_voz_off,
      estado,
      progreso_porcentaje,
      Descripcion,
      descripcion
    } = body;

    if (!id_tarea && !id_requerimiento) {
      return json({ error: 'id_tarea o id_requerimiento es requerido' }, 400);
    }

    if (!estadoValido(estado, ESTADOS)) {
      return json({ error: `Estado inválido: ${estado}` }, 400);
    }

    const campos = {};
    if (req_guion !== undefined) campos.req_guion = Boolean(req_guion);
    if (req_fotos !== undefined) campos.req_fotos = Boolean(req_fotos);
    if (req_grabacion !== undefined) campos.req_grabacion = Boolean(req_grabacion);
    if (req_edicion !== undefined) campos.req_edicion = Boolean(req_edicion);
    if (req_voz_off !== undefined) campos.req_voz_off = Boolean(req_voz_off);
    if (estado !== undefined) campos.estado = estado;
    if (progreso_porcentaje !== undefined) {
      const porcentaje = Number(progreso_porcentaje);
      campos.progreso_porcentaje = Number.isFinite(porcentaje)
        ? Math.max(0, Math.min(100, Math.round(porcentaje)))
        : 0;
    }
    if (Descripcion !== undefined) campos.Descripcion = Descripcion;
    else if (descripcion !== undefined) campos.Descripcion = descripcion;

    const resultado = await guardarTarea({
      tabla: 'tareas_video',
      idTarea: id_tarea,
      idRequerimiento: id_requerimiento,
      campos,
      valoresIniciales: {
        estado: 'Por Hacer',
        progreso_porcentaje: 0,
        req_guion: false,
        req_fotos: false,
        req_grabacion: false,
        req_edicion: false,
        req_voz_off: false
      },
      columnas: COLUMNAS
    });

    if (resultado.error) {
      console.error('[PATCH /api/tareas/video] Error de base de datos:', resultado.error);
      return json({ error: resultado.error.message }, 500);
    }

    if (resultado.noEncontrada) {
      return json({ error: 'Tarea de video no encontrada' }, 404);
    }

    const data = resultado.data;

    if (data?.id_requerimiento) {
      const checks = [];
      if (data.req_guion) checks.push('Guion');
      if (data.req_fotos) checks.push('Fotos');
      if (data.req_grabacion) checks.push('Grabación');
      if (data.req_edicion) checks.push('Edición');
      if (data.req_voz_off) checks.push('Voz en Off');

      const progreso = data.progreso_porcentaje ?? progreso_porcentaje ?? 0;
      await registrarHistorial({
        id_requerimiento: data.id_requerimiento,
        departamento: 'Video',
        usuario: body.usuario || 'Área Audiovisual',
        accion: `Video actualizado a "${data.estado || estado}" (${progreso}%)`,
        comentario: body.comentario || (checks.length > 0 ? `Checklist: ${checks.join(', ')}` : 'Sin checks activos'),
        fecha_registro: new Date().toISOString()
      });
    }

    return json({ mensaje: 'Tarea de video actualizada con éxito', data });
  } catch (err) {
    console.error('[PATCH /api/tareas/video] Error inesperado:', err);
    return json({ error: err?.message || 'Error actualizando tarea de video' }, 500);
  }
}
