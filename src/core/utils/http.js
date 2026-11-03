export async function obtenerJson(url, opciones = {}) {
  const respuesta = await fetch(url, { cache: 'no-store', ...opciones });
  const datos = await respuesta.json();
  if (!respuesta.ok || datos?.error) {
    throw new Error(datos?.error || `No se pudo completar la consulta (${respuesta.status}).`);
  }
  return datos;
}
