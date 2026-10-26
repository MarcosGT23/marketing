import { guardarTarea, registrarHistorial, json, estadoValido } from '../../../core/lib/taskStore';

export const prerender = false;

const ESTADOS = ['Por Hacer', 'En Proceso', 'Revisión', 'Finalizado'];
const COLUMNAS = 'id_tarea, id_requerimiento, estado, progreso_porcentaje, fecha_limite';

export async function PATCH({ request }) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body JSON inválido' }, 400);
    }

    const { id_tarea, id_requerimiento, estado, progreso_porcentaje, fecha_limite } = body;

    if (!id_tarea && !id_requerimiento) {
      return json({ error: 'id_tarea o id_requerimiento es requerido' }, 400);
    }

    if (!estadoValido(estado, ESTADOS)) {
      return json({ error: `Estado inválido: ${estado}` }, 400);
    }

    const campos = {};
    if (estado !== undefined) campos.estado = estado;
    if (progreso_porcentaje !== undefined) {
      const porcentaje = Number(progreso_porcentaje);
      campos.progreso_porcentaje = Number.isFinite(porcentaje)
        ? Math.max(0, Math.min(100, Math.round(porcentaje)))
        : 0;
    }
    if (fecha_limite !== undefined) campos.fecha_limite = fecha_limite || null;

    const resultado = await guardarTarea({
      tabla: 'tareas_diseno',
      idTarea: id_tarea,
      idRequerimiento: id_requerimiento,
      campos,
      valoresIniciales: {
        estado: 'Por Hacer',
        progreso_porcentaje: 0,
        fecha_limite: fecha_limite || null
      },
      columnas: COLUMNAS
    });

    if (resultado.error) {
      console.error('[PATCH /api/tareas/diseno] Error de base de datos:', resultado.error);
      return json({ error: resultado.error.message }, 500);
    }

    if (resultado.noEncontrada) {
      return json({ error: 'Tarea de diseño no encontrada' }, 404);
    }

    const data = resultado.data;

    if (data?.id_requerimiento) {
      const progreso = data.progreso_porcentaje ?? progreso_porcentaje ?? 0;
      await registrarHistorial({
        id_requerimiento: data.id_requerimiento,
        departamento: 'Diseño',
        usuario: body.usuario || 'Área de Diseño',
        accion: `Diseño actualizado a "${data.estado || estado}" (${progreso}%)`,
        comentario: body.comentario || `Progreso de diseño confirmado al ${progreso}%`,
        fecha_registro: new Date().toISOString()
      });
    }

    return json({ mensaje: 'Tarea de diseño actualizada con éxito', data });
  } catch (err) {
    console.error('[PATCH /api/tareas/diseno] Error inesperado:', err);
    return json({ error: err?.message || 'Error actualizando tarea de diseño' }, 500);
  }
}
