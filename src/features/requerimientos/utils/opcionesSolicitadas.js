export const OPCIONES_AUDIOVISUALES = [
  { campo: 'req_guion', etiqueta: 'Guion / Storyboard' },
  { campo: 'req_fotos', etiqueta: 'Sesión fotográfica' },
  { campo: 'req_grabacion', etiqueta: 'Grabación en locación' },
  { campo: 'req_edicion', etiqueta: 'Edición y efectos' },
  { campo: 'req_voz_off', etiqueta: 'Voz en off / Locución' },
];

export function obtenerOpcionesSolicitadas(requerimiento) {
  const video = (Array.isArray(requerimiento.tareas_video) ? requerimiento.tareas_video[0] : requerimiento.tareas_video) || {};
  return [
    requerimiento.req_arte_estatico && 'Arte estático',
    requerimiento.req_carrusel && 'Carrusel',
    requerimiento.req_reel && 'Grabación Reel',
    ...OPCIONES_AUDIOVISUALES.filter(opcion => video[opcion.campo]).map(opcion => opcion.etiqueta),
  ].filter(Boolean);
}
