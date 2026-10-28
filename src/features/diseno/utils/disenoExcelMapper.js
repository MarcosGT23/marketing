// src/features/diseno/utils/disenoExcelMapper.js
import { exportarExcel } from '../../../core/utils/excelExporter';

/**
 * Exporta las tareas de diseño a un archivo .xlsx estilizado.
 * 
 * @param {Array} tareas - Lista de requerimientos con tareas de diseño
 * @param {Object} contexto - Filtros aplicados
 */
export async function exportarDisenoExcel(tareas = [], contexto = {}) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Diseno_${contexto.agenteNombre ? contexto.agenteNombre.replace(/\s+/g, '_') : 'General'}_${fechaHoy}.xlsx`;

  const columnas = [
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'Propiedad / Proyecto', key: 'propiedad', width: 32 },
    { header: 'Agente Inmobiliario', key: 'agente', width: 25 },
    { header: 'Tipo de Pieza', key: 'tipoPieza', width: 22 },
    { header: 'Prioridad', key: 'prioridad', width: 12, align: 'center' },
    { header: 'Estado', key: 'estado', width: 16, align: 'center' },
    { header: 'Progreso (%)', key: 'progreso', width: 14, align: 'center', numFmt: '0"%"' },
    { header: 'Fecha Límite', key: 'fechaLimite', width: 15, align: 'center' },
    { header: 'Formatos Solicitados', key: 'formatos', width: 24 },
    { header: 'Enlace de Entrega', key: 'enlaceEntrega', width: 35 }
  ];

  const filas = tareas.map((t) => {
    const td = Array.isArray(t.tareas_diseno) ? t.tareas_diseno[0] : (t.tareas_diseno || {});

    const formatos = [];
    if (t.req_arte_estatico) formatos.push('Arte Estático');
    if (t.req_carrusel) formatos.push('Carrusel');
    if (t.categoria === 'Diseño Interno') formatos.push('Diseño Interno');

    return {
      id: t.id_requerimiento,
      propiedad: t.nombre_propiedad || `Proyecto #${t.id_requerimiento}`,
      agente: t.usuarios?.nombre || (t.id_agente ? `Agente #${t.id_agente}` : 'General / Sin Agente'),
      tipoPieza: td.categoria_diseno || t.categoria || 'Arte Digital',
      prioridad: t.prioridad || td.prioridad || 'Media',
      estado: td.estado || 'Por Hacer',
      progreso: td.progreso_porcentaje !== undefined && td.progreso_porcentaje !== null ? td.progreso_porcentaje : 0,
      fechaLimite: td.fecha_limite ? new Date(td.fecha_limite).toLocaleDateString('es-ES') : 'Sin fecha',
      formatos: formatos.join(', ') || 'Pieza Estándar',
      enlaceEntrega: td.enlace_entrega || t.enlace_materiales || ''
    };
  });

  const subtitulo = contexto.agenteNombre 
    ? `Filtrado por Agente: ${contexto.agenteNombre} (${filas.length} piezas)`
    : `Total: ${filas.length} tareas de diseño gráfico`;

  await exportarExcel({
    nombreArchivo,
    hojas: [
      {
        nombre: 'Tareas Diseño',
        titulo: 'REMAX BLACK • Tablero de Diseño Gráfico',
        subtitulo,
        columnas,
        filas,
        totales: {
          id: 'TOTAL',
          propiedad: `${filas.length} tareas de diseño`
        }
      }
    ]
  });
}
