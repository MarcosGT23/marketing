// src/features/requerimientos/utils/dashboardExcelMapper.js
import { exportarExcel } from '../../../core/utils/excelExporter';

/**
 * Exporta el resumen ejecutivo del Dashboard a un archivo .xlsx con hojas múltiples.
 * 
 * @param {Object} params
 * @param {Object} params.metricas - KPIs globales calculados
 * @param {Array} params.requerimientos - Requerimientos del período actual
 * @param {string} params.periodo - Nombre del período (ej. "Octubre 2026")
 */
export async function exportarDashboardExcel({ metricas = {}, requerimientos = [], periodo = '' }) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Ejecutivo_Marketing_${(periodo || 'Periodo_Actual').replace(/\s+/g, '_')}_${fechaHoy}.xlsx`;

  // Hoja 1: Indicadores Clave de Desempeño (KPIs)
  const columnasKpis = [
    { header: 'Indicador / Métrica', key: 'indicador', width: 32 },
    { header: 'Valor', key: 'valor', width: 18, align: 'center' },
    { header: 'Descripción / Contexto', key: 'descripcion', width: 45 }
  ];

  const pctCumplimiento = metricas.total > 0 ? Math.round((metricas.entregados / metricas.total) * 100) : 0;

  const filasKpis = [
    {
      indicador: 'Total de Requerimientos',
      valor: metricas.total || 0,
      descripcion: `Solicitudes de marketing registradas en ${periodo || 'el período actual'}`
    },
    {
      indicador: 'Requerimientos Entregados / Finalizados',
      valor: metricas.entregados || 0,
      descripcion: 'Propiedades con piezas completadas al 100%'
    },
    {
      indicador: 'Tasa de Cumplimiento (%)',
      valor: `${pctCumplimiento}%`,
      descripcion: 'Porcentaje de solicitudes finalizadas vs recibidas'
    },
    {
      indicador: 'En Proceso / Producción',
      valor: metricas.enProceso || 0,
      descripcion: 'Tareas activas en diseño, video o pauta'
    },
    {
      indicador: 'Sin Iniciar / Por Hacer',
      valor: metricas.sinIniciar || 0,
      descripcion: 'Solicitudes en cola inicial'
    },
    {
      indicador: 'Campañas Publicitarias Activas',
      valor: metricas.activas || 0,
      descripcion: 'Pautas en circulación en Meta Ads'
    },
    {
      indicador: 'Agentes Inmobiliarios Activos',
      valor: metricas.agentesActivos || 0,
      descripcion: 'Número de agentes con al menos un requerimiento'
    }
  ];

  // Hoja 2: Detalle de requerimientos del período
  const columnasDetalle = [
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'Propiedad', key: 'propiedad', width: 32 },
    { header: 'Agente', key: 'agente', width: 25 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Prioridad', key: 'prioridad', width: 12, align: 'center' },
    { header: 'Diseño', key: 'estadoDiseno', width: 15, align: 'center' },
    { header: 'Video', key: 'estadoVideo', width: 15, align: 'center' },
    { header: 'Pauta CM', key: 'estadoCm', width: 15, align: 'center' },
    { header: 'Presupuesto ($)', key: 'presupuesto', width: 18, align: 'right', numFmt: '"$"#,##0' }
  ];

  let totalPresupuesto = 0;

  const filasDetalle = requerimientos.map((r) => {
    const td = Array.isArray(r.tareas_diseno) ? r.tareas_diseno[0] : r.tareas_diseno;
    const tv = Array.isArray(r.tareas_video) ? r.tareas_video[0] : r.tareas_video;
    const tcm = Array.isArray(r.tareas_cm) ? r.tareas_cm[0] : r.tareas_cm;
    const presup = Number(tcm?.presupuesto) || 0;
    totalPresupuesto += presup;

    return {
      id: r.id_requerimiento,
      propiedad: r.nombre_propiedad || `Propiedad #${r.id_requerimiento}`,
      agente: r.usuarios?.nombre || (r.id_agente ? `Agente #${r.id_agente}` : 'Sin asignar'),
      categoria: r.categoria || r.tipo_operacion || 'Propiedad',
      prioridad: r.prioridad || 'Media',
      estadoDiseno: td?.estado || (r.req_arte_estatico || r.req_carrusel ? 'Por Hacer' : 'N/A'),
      estadoVideo: tv?.estado || (r.req_reel || r.req_fotos ? 'Por Hacer' : 'N/A'),
      estadoCm: tcm?.estado || (tcm?.plataforma ? 'Pendiente' : 'Sin Pauta'),
      presupuesto: presup > 0 ? presup : null
    };
  });

  await exportarExcel({
    nombreArchivo,
    hojas: [
      {
        nombre: 'Resumen Ejecutivo',
        titulo: `REMAX BLACK • Resumen Ejecutivo de Marketing (${periodo || 'Período'})`,
        subtitulo: `Consolidado de métricas de producción y rendimiento`,
        columnas: columnasKpis,
        filas: filasKpis
      },
      {
        nombre: 'Detalle de Solicitudes',
        titulo: `REMAX BLACK • Solicitudes del Período: ${periodo || 'Actual'}`,
        subtitulo: `Total: ${filasDetalle.length} solicitudes`,
        columnas: columnasDetalle,
        filas: filasDetalle,
        totales: {
          id: 'TOTAL',
          propiedad: `${filasDetalle.length} propiedades`,
          presupuesto: totalPresupuesto
        }
      }
    ]
  });
}
