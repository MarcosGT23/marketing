// src/core/utils/campanaUtils.js
// Helpers sobre el estado de activación de una campaña (requerimiento_propiedad.estado_general)

export const ESTADO_CAMPANA_ACTIVO = 'Activo';
export const ESTADO_CAMPANA_INACTIVO = 'Inactivo';

/**
 * Indica si un requerimiento/campaña está marcado como activado en la base de datos.
 * El estado vive en `requerimientos_propiedad.estado_general`.
 */
export function esCampanaActivada(requerimiento) {
  const estado = String(requerimiento?.estado_general || '').trim().toLowerCase();
  return estado === ESTADO_CAMPANA_ACTIVO.toLowerCase();
}

/**
 * Etiqueta legible del estado de activación.
 */
export function etiquetaEstadoCampana(estado) {
  const normalizado = String(estado || '').trim().toLowerCase();
  if (normalizado === ESTADO_CAMPANA_ACTIVO.toLowerCase()) return 'Activa';
  if (normalizado === ESTADO_CAMPANA_INACTIVO.toLowerCase()) return 'Inactiva';
  return 'Sin estado';
}
