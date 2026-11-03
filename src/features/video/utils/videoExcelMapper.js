import { sufijoPeriodoExportacion } from '../../../core/utils/exportacion';
// src/features/video/utils/videoExcelMapper.js
import { exportarExcel } from '../../../core/utils/excelExporter';
import { OPCIONES_AUDIOVISUALES } from '../../requerimientos/utils/opcionesSolicitadas';

/**
 * Exporta las producciones audiovisuales a un archivo .xlsx estilizado.
 * 
 * @param {Array} tareas - Lista de requerimientos con tareas de video
 * @param {Object} contexto - Filtros aplicados
 */
export async function exportarVideoExcel(tareas = [], contexto = {}) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Video_${contexto.agenteNombre ? contexto.agenteNombre.replace(/\s+/g, '_') : 'General'}_${sufijoPeriodoExportacion(contexto.periodo)}_${fechaHoy}.xlsx`;

  const columnas = [
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'Propiedad / Reel', key: 'propiedad', width: 32 },
    { header: 'Agente Inmobiliario', key: 'agente', width: 25 },
    { header: 'Estado Producción', key: 'estado', width: 18, align: 'center' },
    { header: 'Progreso (%)', key: 'progreso', width: 14, align: 'center', numFmt: '0"%"' },
    { header: 'Fecha de Rodaje', key: 'fechaRodaje', width: 16, align: 'center' },
    { header: 'Guion solicitado', key: 'guion', width: 18, align: 'center' },
    { header: 'Fotos solicitadas', key: 'fotos', width: 18, align: 'center' },
    { header: 'Grabación solicitada', key: 'grabacion', width: 22, align: 'center' },
    { header: 'Edición solicitada', key: 'edicion', width: 20, align: 'center' },
    { header: 'Voz en Off solicitada', key: 'vozOff', width: 22, align: 'center' },
    { header: 'Actividades completadas', key: 'completadas', width: 40 },
    { header: 'Notas / Observaciones', key: 'descripcion', width: 35 },
    { header: 'Enlace Video Final', key: 'enlaceVideo', width: 35 }
  ];

  const filas = tareas.map((t) => {
    const tv = Array.isArray(t.tareas_video) ? t.tareas_video[0] : (t.tareas_video || {});

    return {
      id: t.id_requerimiento,
      propiedad: t.nombre_propiedad || `Producción #${t.id_requerimiento}`,
      agente: t.usuarios?.nombre || (t.id_agente ? `Agente #${t.id_agente}` : 'General / Sin Agente'),
      estado: tv.estado || 'Por Hacer',
      progreso: tv.progreso_porcentaje !== undefined && tv.progreso_porcentaje !== null ? tv.progreso_porcentaje : 0,
      fechaRodaje: tv.fecha_rodaje ? new Date(tv.fecha_rodaje).toLocaleDateString('es-ES') : (t.fecha_rodaje ? new Date(t.fecha_rodaje).toLocaleDateString('es-ES') : 'Pendiente'),
      guion: tv.req_guion ? 'Sí' : 'No',
      fotos: (tv.req_fotos || t.req_fotos) ? 'Sí' : 'No',
      grabacion: tv.req_grabacion ? 'Sí' : 'No',
      edicion: tv.req_edicion ? 'Sí' : 'No',
      vozOff: tv.req_voz_off ? 'Sí' : 'No',
      completadas: OPCIONES_AUDIOVISUALES.filter(opcion => tv.actividades_completadas?.[opcion.campo]).map(opcion => opcion.etiqueta).join(', ') || 'Ninguna',
      descripcion: tv.Descripcion || t.descripcion_video || '',
      enlaceVideo: tv.enlace_video || t.enlace_materiales || ''
    };
  });

  const subtitulo = contexto.agenteNombre 
    ? `Filtrado por Agente: ${contexto.agenteNombre} (${filas.length} producciones)`
    : `Total: ${filas.length} producciones audiovisuales`;

  await exportarExcel({
    nombreArchivo,
    hojas: [
      {
        nombre: 'Producciones Video',
        titulo: 'REMAX BLACK • Panel de Producción Audiovisual',
        subtitulo: `${contexto.periodo || ''} • ${subtitulo}${contexto.campanaNombre ? ` • ${contexto.campanaNombre}` : ''}`,
        columnas,
        filas,
        totales: {
          id: 'TOTAL',
          propiedad: `${filas.length} producciones`
        }
      }
    ]
  });
}
