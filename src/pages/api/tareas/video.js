import { guardarTarea, json, estadoValido } from '../../../core/lib/taskStore';
import { supabaseServer } from '../../../core/lib/supabaseServer';
import { CAMPOS_AUDIOVISUALES, PREFIJO_AVANCE_VIDEO, normalizarCompletados, normalizarTareaVideo, serializarProgresoVideo } from '../../../features/video/utils/videoProgress';

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
    const observaciones = Descripcion !== undefined ? Descripcion : descripcion;
    if (observaciones !== undefined && observaciones !== null && typeof observaciones !== 'string') {
      return json({ error: 'Las observaciones deben ser texto.' }, 400);
    }
    if (Object.keys(campos).length === 0 && actividades === undefined && observaciones === undefined) {
      return json({ error: 'Las opciones solicitadas se editan desde Modificar requerimiento.' }, 400);
    }

    let tarea;
    if (id_tarea) {
      const resultado = await supabaseServer.from('tareas_video').select(COLUMNAS).eq('id_tarea', id_tarea).maybeSingle();
      if (resultado.error) throw resultado.error;
      tarea = resultado.data;
    }
    if (!tarea && id_requerimiento) {
      const resultado = await supabaseServer.from('tareas_video').select(COLUMNAS).eq('id_requerimiento', id_requerimiento).maybeSingle();
      if (resultado.error) throw resultado.error;
      tarea = resultado.data;
    }
    if (!tarea && id_requerimiento) {
      const resultado = await guardarTarea({
        tabla: 'tareas_video',
        idRequerimiento: id_requerimiento,
        campos: { id_requerimiento },
        valoresIniciales: {
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          ...normalizarCompletados()
        },
        columnas: COLUMNAS
      });
      if (resultado.error) throw resultado.error;
      tarea = resultado.data;
    }
    if (!tarea?.id_requerimiento) return json({ error: 'Tarea de video no encontrada' }, 404);

    const anterior = await supabaseServer.from('historial_seguimiento')
      .select('comentario')
      .eq('id_requerimiento', tarea.id_requerimiento)
      .eq('departamento', 'Video')
      .like('comentario', PREFIJO_AVANCE_VIDEO + '%')
      .order('id_historial', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (anterior.error) throw anterior.error;

    const actual = normalizarTareaVideo(tarea, anterior.data?.comentario);
    const data = {
      ...actual,
      ...campos,
      Descripcion: observaciones !== undefined ? observaciones : actual.Descripcion,
      actividades_completadas: normalizarCompletados({ ...actual.actividades_completadas, ...actividades })
    };

    const etiquetas = ['Guion', 'Fotos', 'Grabación', 'Edición', 'Voz en Off'];
    const checks = etiquetas.filter((_, indice) => data.actividades_completadas[CAMPOS_AUDIOVISUALES[indice]]);
    const comentario = body.comentario || (checks.length ? `Checklist: ${checks.join(', ')}` : 'Sin checks activos');
    // La bitácora guarda el avance completo en una sola escritura. Descripcion en tareas_video es una fecha.
    const { error } = await supabaseServer.from('historial_seguimiento').insert({
      id_requerimiento: data.id_requerimiento,
      departamento: 'Video',
      usuario: body.usuario || 'Área Audiovisual',
      accion: `Video actualizado a "${data.estado}" (${data.progreso_porcentaje ?? 0}%)`,
      comentario: serializarProgresoVideo(data, comentario),
      fecha_registro: new Date().toISOString()
    });
    if (error) throw error;

    return json({ mensaje: 'Tarea de video actualizada con éxito', data });
  } catch (err) {
    console.error('[PATCH /api/tareas/video] Error inesperado:', err);
    return json({ error: err?.message || 'Error actualizando tarea de video' }, 500);
  }
}
