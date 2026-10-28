// src/features/cm/utils/cmExcelMapper.js
import { exportarExcel } from '../../../core/utils/excelExporter';
import { nombreAgenteDeReporte } from './reportesMeta';

const aNumero = (valor) => Number(valor) || 0;
const redondearMonto = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString('es-ES');
}

/**
 * Exporta los reportes CSV de Meta Ads a un archivo .xlsx:
 * una hoja con las métricas consolidadas por propiedad y otra con los anuncios.
 */
export async function exportarReportesCmExcel(reportes = [], contexto = {}) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const sufijoAgente = contexto.agenteNombre
    ? contexto.agenteNombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
    : 'Todos_los_agentes';
  const nombreArchivo = `Reportes_CM_${sufijoAgente}_${fechaHoy}.xlsx`;

  const filasReportes = reportes.map((reporte) => ({
    propiedad: reporte.propiedad?.nombre_propiedad || `Requerimiento #${reporte.id_requerimiento}`,
    agente: nombreAgenteDeReporte(reporte),
    periodo: reporte.periodo_mensual || 'Sin período',
    fecha: formatearFecha(reporte.fecha_reporte),
    leads: aNumero(reporte.leads),
    costo_por_lead: aNumero(reporte.costo_por_lead),
    inversion: aNumero(reporte.inversion),
    alcance: aNumero(reporte.alcance),
    ctr_clics: aNumero(reporte.ctr_clics),
    anuncios: Array.isArray(reporte.reportes_meta_anuncios) ? reporte.reportes_meta_anuncios.length : 0
  }));

  const filasAnuncios = reportes.flatMap((reporte) => {
    const propiedad = reporte.propiedad?.nombre_propiedad || `Requerimiento #${reporte.id_requerimiento}`;
    const agente = nombreAgenteDeReporte(reporte);

    return (reporte.reportes_meta_anuncios || []).map((anuncio) => ({
      propiedad,
      agente,
      periodo: reporte.periodo_mensual || 'Sin período',
      anuncio: anuncio.nombre_anuncio || 'Sin nombre',
      estado: anuncio.estado_texto || (anuncio.activo ? 'En circulación' : 'Pausado'),
      leads: aNumero(anuncio.leads),
      costo_por_lead: aNumero(anuncio.costo_por_lead),
      inversion: aNumero(anuncio.inversion),
      alcance: aNumero(anuncio.alcance),
      ctr_clics: aNumero(anuncio.ctr_clics)
    }));
  });

  const totalesReportes = filasReportes.reduce((acc, fila) => {
    acc.leads += fila.leads;
    acc.inversion += fila.inversion;
    acc.alcance += fila.alcance;
    acc.ctr += fila.ctr_clics;
    return acc;
  }, { leads: 0, inversion: 0, alcance: 0, ctr: 0 });

  const totalesAnuncios = filasAnuncios.reduce((acc, fila) => {
    acc.leads += fila.leads;
    acc.inversion += fila.inversion;
    acc.alcance += fila.alcance;
    acc.ctr += fila.ctr_clics;
    return acc;
  }, { leads: 0, inversion: 0, alcance: 0, ctr: 0 });

  const propiedades = new Set(reportes.map((r) => r.id_requerimiento)).size;
  const subtituloFiltro = contexto.agenteNombre ? `Agente: ${contexto.agenteNombre} • ` : '';

  await exportarExcel({
    nombreArchivo,
    hojas: [
      {
        nombre: 'Reportes por Propiedad',
        titulo: 'REMAX BLACK • Reportes CSV de Meta Ads',
        subtitulo: `${subtituloFiltro}${filasReportes.length} reporte(s) de ${propiedades} propiedad(es)`,
        columnas: [
          { header: 'Propiedad / Campaña', key: 'propiedad', width: 32 },
          { header: 'Agente', key: 'agente', width: 24 },
          { header: 'Período', key: 'periodo', width: 16, align: 'center' },
          { header: 'Fecha Reporte', key: 'fecha', width: 15, align: 'center' },
          { header: 'Leads (Lids)', key: 'leads', width: 12, align: 'right', numFmt: '#,##0' },
          { header: 'Coste por resultados ($)', key: 'costo_por_lead', width: 19, align: 'right', numFmt: '"$"#,##0.00' },
          { header: 'Inversión ($)', key: 'inversion', width: 14, align: 'right', numFmt: '"$"#,##0.00' },
          { header: 'Alcance', key: 'alcance', width: 12, align: 'right', numFmt: '#,##0' },
          { header: 'CTR - Clic', key: 'ctr_clics', width: 11, align: 'right', numFmt: '#,##0' },
          { header: 'Anuncios', key: 'anuncios', width: 10, align: 'center', numFmt: '#,##0' }
        ],
        filas: filasReportes,
        totales: {
          propiedad: `${filasReportes.length} reporte(s)`,
          leads: totalesReportes.leads,
          costo_por_lead: totalesReportes.leads > 0
            ? redondearMonto(totalesReportes.inversion / totalesReportes.leads)
            : 0,
          inversion: totalesReportes.inversion,
          alcance: totalesReportes.alcance,
          ctr_clics: filasReportes.length > 0
            ? Math.round(totalesReportes.ctr / filasReportes.length)
            : 0,
          anuncios: filasAnuncios.length
        }
      },
      {
        nombre: 'Anuncios del CSV',
        titulo: 'REMAX BLACK • Anuncios importados desde Meta Ads',
        subtitulo: `${subtituloFiltro}${filasAnuncios.length} anuncio(s) individuales`,
        columnas: [
          { header: 'Propiedad / Campaña', key: 'propiedad', width: 30 },
          { header: 'Agente', key: 'agente', width: 22 },
          { header: 'Período', key: 'periodo', width: 15, align: 'center' },
          { header: 'Anuncio', key: 'anuncio', width: 34 },
          { header: 'Estado', key: 'estado', width: 16, align: 'center' },
          { header: 'Leads (Lids)', key: 'leads', width: 12, align: 'right', numFmt: '#,##0' },
          { header: 'Coste por resultados ($)', key: 'costo_por_lead', width: 19, align: 'right', numFmt: '"$"#,##0.00' },
          { header: 'Inversión ($)', key: 'inversion', width: 14, align: 'right', numFmt: '"$"#,##0.00' },
          { header: 'Alcance', key: 'alcance', width: 12, align: 'right', numFmt: '#,##0' },
          { header: 'CTR - Clic', key: 'ctr_clics', width: 11, align: 'right', numFmt: '#,##0' }
        ],
        filas: filasAnuncios,
        totales: {
          propiedad: `${filasAnuncios.length} anuncio(s)`,
          leads: totalesAnuncios.leads,
          costo_por_lead: totalesAnuncios.leads > 0
            ? redondearMonto(totalesAnuncios.inversion / totalesAnuncios.leads)
            : 0,
          inversion: totalesAnuncios.inversion,
          alcance: totalesAnuncios.alcance,
          ctr_clics: filasAnuncios.length > 0
            ? Math.round(totalesAnuncios.ctr / filasAnuncios.length)
            : 0
        }
      }
    ]
  });
}
