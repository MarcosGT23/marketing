const EVENTO_NOTIFICACION = 'panel:notificacion';

// Se despacha por window para que cualquier isla de React pueda notificar
// aunque el host viva en un bundle distinto.
export function notificar({ tipo = 'info', titulo, mensaje, duracion = 4200 } = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIFICACION, {
    detail: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo,
      titulo,
      mensaje,
      duracion,
    },
  }));
}

export function notificarExito(mensaje, titulo = 'Guardado') {
  notificar({ tipo: 'exito', titulo, mensaje });
}

export function notificarError(mensaje, titulo = 'No se pudo completar') {
  notificar({ tipo: 'error', titulo, mensaje, duracion: 6000 });
}

export function notificarAviso(mensaje, titulo = 'Revisa este dato') {
  notificar({ tipo: 'aviso', titulo, mensaje });
}

export function notificarInfo(mensaje, titulo = 'Información') {
  notificar({ tipo: 'info', titulo, mensaje });
}

export { EVENTO_NOTIFICACION };
