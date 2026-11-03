import { normalizarPeriodo, resumirPeriodos } from './dateUtils.js';

export const SIN_PERIODO_EXPORTACION = '__sin_periodo__';

export function idAgenteExportacion(item) {
  return String(item.propiedad?.agente?.id_usuario ?? item.propiedad?.id_agente ?? item.usuarios?.id_usuario ?? item.id_agente ?? 'sin-asignar');
}

export function nombreAgenteExportacion(item) {
  return item.propiedad?.agente?.nombre || item.usuarios?.nombre || 'General / Sin Agente';
}

export function idCampanaExportacion(item) {
  return String(item.id_requerimiento);
}

export function nombreCampanaExportacion(item) {
  return item.propiedad?.nombre_propiedad || item.nombre_propiedad || `Requerimiento #${item.id_requerimiento}`;
}

export function obtenerPeriodosExportacion(registros, referencia = []) {
  const resumen = resumirPeriodos([...registros, ...referencia]);
  const conteos = resumirPeriodos(registros);
  return [
    ...resumen.periodos.map(periodo => ({ valor: periodo, nombre: periodo, cantidad: conteos.conteos.get(periodo) || 0 })),
    ...(resumen.sinPeriodo ? [{ valor: SIN_PERIODO_EXPORTACION, nombre: 'Sin período', cantidad: conteos.sinPeriodo }] : [])
  ];
}

export function filtrarExportacion(registros, { periodo, agente = '', campana = '' }) {
  return registros.filter(item => {
    const mes = normalizarPeriodo(item.periodo_mensual);
    return (periodo === SIN_PERIODO_EXPORTACION ? !mes : mes === normalizarPeriodo(periodo)) &&
      (!agente || idAgenteExportacion(item) === String(agente)) &&
      (!campana || idCampanaExportacion(item) === String(campana));
  });
}

// Mantener el contexto del panel sin limitar la exportación al mes visible.
export function filtrarContextoExportacion(registros, { agente, busqueda = '', categoria = '' } = {}) {
  const texto = busqueda.trim().toLowerCase();
  return registros.filter(item =>
    (!agente || idAgenteExportacion(item) === String(agente)) &&
    (!categoria || item.categoria === categoria) &&
    (!texto || [nombreCampanaExportacion(item), nombreAgenteExportacion(item), item.ubicacion]
      .some(valor => valor?.toLowerCase().includes(texto)))
  );
}

export function sufijoPeriodoExportacion(periodo) {
  return (periodo || 'Todos_los_meses').replace(/[^\p{L}\p{N}]+/gu, '_');
}
