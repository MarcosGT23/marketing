// src/features/requerimientos/utils/requerimientosExcelMapper.js
import { exportarExcel } from '../../../core/utils/excelExporter';

/**
 * Exporta la lista de requerimientos a un archivo .xlsx estilizado.
 * 
 * @param {Array} requerimientos - Lista de requerimientos (filtrados o totales)
 * @param {Object} contexto - Filtros aplicados para subtítulo del reporte
 */
export async function exportarRequerimientosExcel(requerimientos = [], contexto = {}) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Requerimientos_${contexto.agenteNombre ? contexto.agenteNombre.replace(/\s+/g, '_') : 'General'}_${fechaHoy}.xlsx`;

  const columnas = [
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'Propiedad', key: 'propiedad', width: 32 },
    { header: 'Agente Inmobiliario', key: 'agente', width: 25 },
    { header: 'Operación / Tipo', key: 'operacion', width: 18 },
    { header: 'Ubicación', key: 'ubicacion', width: 22 },
    { header: 'Prioridad', key: 'prioridad', width: 12, align: 'center' },
    { header: 'Período', key: 'periodo', width: 16, align: 'center' },
    { header: 'Artes Solicitados', key: 'formatos', width: 24 },
    { header: 'Estado Diseño', key: 'estadoDiseno', width: 16, align: 'center' },
    { header: 'Estado Video', key: 'estadoVideo', width: 16, align: 'center' },
    { header: 'Estado CM / Pauta', key: 'estadoCm', width: 18, align: 'center' },
    { header: 'Presupuesto Pauta ($)', key: 'presupuesto', width: 20, align: 'right', numFmt: '"$"#,##0' },
    { header: 'Enlace Materiales', key: 'enlace', width: 35 }
  ];

  let sumaPresupuesto = 0;

  const filas = requerimientos.map((r) => {
    const td = Array.isArray(r.tareas_diseno) ? r.tareas_diseno[0] : r.tareas_diseno;
    const tv = Array.isArray(r.tareas_video) ? r.tareas_video[0] : r.tareas_video;
    const tcm = Array.isArray(r.tareas_cm) ? r.tareas_cm[0] : r.tareas_cm;

    const formatos = [];
    if (r.req_arte_estatico) formatos.push('Arte Estático');
    if (r.req_carrusel) formatos.push('Carrusel');
    if (r.req_reel) formatos.push('Reel');
    if (r.req_fotos) formatos.push('Sesión Fotos');
    if (formatos.length === 0 && r.categoria === 'Diseño Interno') formatos.push('Diseño Interno');

    const presup = Number(tcm?.presupuesto) || 0;
    sumaPresupuesto += presup;

    return {
      id: r.id_requerimiento,
      propiedad: r.nombre_propiedad || `Propiedad #${r.id_requerimiento}`,
      agente: r.usuarios?.nombre || (r.id_agente ? `Agente #${r.id_agente}` : 'Sin asignar'),
      operacion: r.tipo_operacion || r.categoria || 'Venta',
      ubicacion: r.ubicacion || 'No especificada',
      prioridad: r.prioridad || 'Media',
      periodo: r.periodo_mensual || 'Sin período',
      formatos: formatos.join(', ') || 'General',
      estadoDiseno: td?.estado || (formatos.some(f => f.includes('Arte') || f.includes('Carrusel')) ? 'Por Hacer' : 'N/A'),
      estadoVideo: tv?.estado || (formatos.some(f => f.includes('Reel') || f.includes('Fotos')) ? 'Por Hacer' : 'N/A'),
      estadoCm: tcm?.estado || (tcm?.plataforma ? 'Pendiente' : 'Sin Pauta'),
      presupuesto: presup > 0 ? presup : null,
      enlace: r.enlace_materiales || r.enlace_drive || r.enlace_propiedad || ''
    };
  });

  const subtitulo = contexto.agenteNombre 
    ? `Filtrado por Agente: ${contexto.agenteNombre} (${filas.length} requerimientos)`
    : `Total: ${filas.length} requerimientos inmobiliarios`;

  await exportarExcel({
    nombreArchivo,
    hojas: [
      {
        nombre: 'Requerimientos',
        titulo: 'REMAX BLACK • Control de Requerimientos Inmobiliarios',
        subtitulo,
        columnas,
        filas,
        totales: {
          id: 'TOTALES',
          propiedad: `${filas.length} registros`,
          presupuesto: sumaPresupuesto
        }
      }
    ]
  });
}
