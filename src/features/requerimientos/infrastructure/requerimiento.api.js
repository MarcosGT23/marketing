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

  return resultado;
}

export async function actualizarRequerimiento(idRequerimiento, datosFormulario) {
  const respuesta = await fetch('/api/requerimientos', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...datosFormulario, id_requerimiento: idRequerimiento })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || 'Error al actualizar el requerimiento');
  }

  return resultado;
}