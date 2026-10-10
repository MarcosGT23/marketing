import { notificarCambioLocal } from '../../../core/hooks/useRealtimeSync';

export async function crearRequerimiento(datosFormulario) {
  const respuesta = await fetch('/api/requerimientos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosFormulario)
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || 'Error al guardar el requerimiento');
  }

  notificarCambioLocal({ tipo: 'requerimiento_creado', id: resultado.id_requerimiento });

  return resultado;
}

export async function actualizarRequerimiento(idRequerimiento, datosFormulario, panel = 'general') {
  const respuesta = await fetch('/api/requerimientos', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...datosFormulario, id_requerimiento: idRequerimiento, panel: datosFormulario?.panel || panel })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || 'Error al actualizar el requerimiento');
  }

  notificarCambioLocal({ tipo: 'requerimiento_actualizado', id: idRequerimiento, panel });

  return resultado;
}

export async function eliminarRequerimiento(idRequerimiento) {
  const respuesta = await fetch('/api/requerimientos', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_requerimiento: idRequerimiento })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || 'Error al eliminar el requerimiento');
  }

  notificarCambioLocal({ tipo: 'requerimiento_eliminado', id: idRequerimiento });

  return resultado;
}