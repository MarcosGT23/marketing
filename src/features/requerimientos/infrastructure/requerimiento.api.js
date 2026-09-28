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