// Los anuncios inactivos se guardan con el estado entre corchetes: "[Pausado] Nombre"
const PATRON_ESTADO = /^\[([^\]]+)\]\s*(.*)$/;

export function separarEstadoAnuncio(nombre) {
  const texto = (nombre || '').trim();
  const match = texto.match(PATRON_ESTADO);

  if (!match) {
    return { nombre: texto || 'Sin nombre', activo: true, estado_texto: 'En circulación' };
  }

  return {
    nombre: match[2].trim() || 'Sin nombre',
    activo: false,
    estado_texto: match[1].trim()
  };
}

export function normalizarAnunciosMeta(anuncios) {
  return (Array.isArray(anuncios) ? anuncios : []).map((anuncio) => {
    const { nombre, activo, estado_texto } = separarEstadoAnuncio(anuncio.nombre_anuncio);
    return { ...anuncio, nombre_anuncio: nombre, activo, estado_texto };
  });
}
