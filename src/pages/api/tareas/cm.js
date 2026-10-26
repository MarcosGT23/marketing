import { guardarTarea, registrarHistorial, json, estadoValido } from '../../../core/lib/taskStore';

export const prerender = false;

const ESTADOS = ['Por Hacer', 'Configurando', 'Campaña Activa', 'Finalizado', 'Sin Pauta'];
const COLUMNAS = 'id_tarea, id_requerimiento, estado, plataforma, presupuesto, moneda, periodo_pauta, descripcion_pauta';

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
      estado,
      plataforma,
      presupuesto,
      moneda,
      periodo_pauta,
      descripcion_pauta
    } = body;

    if (!id_tarea && !id_requerimiento) {
      return json({ error: 'id_tarea o id_requerimiento es requerido' }, 400);
    }

    if (!body.quitar_pauta && !estadoValido(estado, ESTADOS)) {
      return json({ error: `Estado inválido: ${estado}` }, 400);
    }

    const campos = {};
    if (body.quitar_pauta) {
      campos.plataforma = null;
      campos.presupuesto = null;
      campos.estado = 'Sin Pauta';
      campos.descripcion_pauta = null;
    } else {
      if (estado !== undefined) campos.estado = estado;
      if (plataforma !== undefined) campos.plataforma = plataforma;
      if (presupuesto !== undefined) campos.presupuesto = presupuesto;
      if (moneda !== undefined) campos.moneda = moneda;
      if (periodo_pauta !== undefined) campos.periodo_pauta = periodo_pauta;
      if (descripcion_pauta !== undefined) campos.descripcion_pauta = descripcion_pauta;
    }

    const resultado = await guardarTarea({
      tabla: 'tareas_cm',
      idTarea: id_tarea,
      idRequerimiento: id_requerimiento,
      campos,
      valoresIniciales: { estado: 'Por Hacer' },
      columnas: COLUMNAS
    });

    if (resultado.error) {
      console.error('[PATCH /api/tareas/cm] Error de base de datos:', resultado.error);
      return json({ error: resultado.error.message }, 500);
    }

    if (resultado.noEncontrada) {
      return json({ error: 'Tarea de CM no encontrada' }, 404);
    }

    const data = resultado.data;

    if (data?.id_requerimiento) {
      await registrarHistorial({
        id_requerimiento: data.id_requerimiento,
        departamento: 'CM',
        usuario: body.usuario || 'Área de Pauta & CM',
        accion: `Campaña CM actualizada a "${data.estado || estado}"`,
        comentario: body.comentario || `Plataforma: ${data.plataforma || 'N/A'} | Presupuesto: ${data.presupuesto ? `${data.moneda || 'USD'} ${data.presupuesto}` : 'Sin definir'} | Duración: ${data.periodo_pauta || 'N/A'}`,
        fecha_registro: new Date().toISOString()
      });
    }

    return json({ mensaje: 'Tarea de CM actualizada con éxito', data });
  } catch (err) {
    console.error('[PATCH /api/tareas/cm] Error inesperado:', err);
    return json({ error: err?.message || 'Error actualizando tarea de CM' }, 500);
  }
}
