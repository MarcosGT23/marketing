// src/features/cm/utils/reportesMeta.js
export function idAgenteDeReporte(reporte) {
  const agente = reporte?.propiedad?.agente;
  if (agente?.id_usuario != null) return String(agente.id_usuario);
  if (reporte?.propiedad?.id_agente != null) return String(reporte.propiedad.id_agente);
  return 'sin-asignar';
}

export function nombreAgenteDeReporte(reporte) {
  const agente = reporte?.propiedad?.agente;
  if (agente?.nombre) return agente.nombre;
  if (reporte?.propiedad?.id_agente != null) return `Agente #${reporte.propiedad.id_agente}`;
  return 'General / Sin Agente';
}
