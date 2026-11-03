import { guardarTarea, registrarHistorial, json, estadoValido } from '../../../core/lib/taskStore';
import { supabaseServer } from '../../../core/lib/supabaseServer';
import { CAMPOS_AUDIOVISUALES, normalizarTareaVideo, serializarProgresoVideo } from '../../../features/video/utils/videoProgress';

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
      actividades_completadas,
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
    if (actividades_completadas !== undefined && (!actividades_completadas || Array.isArray(actividades_completadas) || typeof actividades_completadas !== 'object')) {
      return json({ error: 'El avance de actividades no es válido.' }, 400);
    }
    if (estado !== undefined) campos.estado = estado;
    if (progreso_porcentaje !== undefined) {
      const porcentaje = Number(progreso_porcentaje);
      campos.progreso_porcentaje = Number.isFinite(porcentaje)
        ? Math.max(0, Math.min(100, Math.round(porcentaje)))
        : 0;
    }
    const actividades = actividades_completadas ?? (
      ['Finalizado', 'Por Hacer'].includes(estado)
        ? Object.fromEntries(CAMPOS_AUDIOVISUALES.map(campo => [campo, estado === 'Finalizado']))
        : undefined
    );
    if (actividades !== undefined || Descripcion !== undefined || descripcion !== undefined) {
      let consulta = supabaseServer.from('tareas_video').select(COLUMNAS);
      consulta = id_tarea ? consulta.eq('id_tarea', id_tarea) : consulta.eq('id_requerimiento', id_requerimiento);
      let { data: existente, error } = await consulta.maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!existente && id_tarea && id_requerimiento) {
        const resultado = await supabaseServer.from('tareas_video').select(COLUMNAS).eq('id_requerimiento', id_requerimiento).maybeSingle();
        if (resultado.error) return json({ error: resultado.error.message }, 500);
        existente = resultado.data;
      }
      const actual = normalizarTareaVideo(existente) || {};
      campos.Descripcion = serializarProgresoVideo(
        Descripcion !== undefined ? Descripcion : descripcion !== undefined ? descripcion : actual.Descripcion,
        actividades !== undefined ? { ...actual.actividades_completadas, ...actividades } : actual.actividades_completadas
      );
    }
    if (Object.keys(campos).length === 0) {
      return json({ error: 'Las opciones solicitadas se editan desde Modificar requerimiento.' }, 400);
    }

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

    const data = normalizarTareaVideo(resultado.data);

    if (data?.id_requerimiento) {
      const checks = [];
      if (data.actividades_completadas.req_guion) checks.push('Guion');
      if (data.actividades_completadas.req_fotos) checks.push('Fotos');
      if (data.actividades_completadas.req_grabacion) checks.push('Grabación');
      if (data.actividades_completadas.req_edicion) checks.push('Edición');
      if (data.actividades_completadas.req_voz_off) checks.push('Voz en Off');

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
