// src/core/utils/excelExporter.js

/**
 * Paleta corporativa de REMAX BLACK para reportes en Excel
 */
const BRAND_COLORS = {
  headerBg: '0B1C30',       // Azul muy oscuro / Navy Black
  headerText: 'FFFFFF',     // Blanco puro
  subHeaderBg: '1E293B',    // Slate oscuro
  zebraBg: 'F8FAFC',        // Gris ultra claro para filas alternadas
  border: 'E2E8F0',         // Borde suave
  accent: '004AC6',         // Azul REMAX
};

/**
 * Genera y descarga un archivo Excel (.xlsx) en el navegador del usuario.
 * 
 * @param {Object} opciones
 * @param {string} opciones.nombreArchivo - Nombre del archivo final (ej: "Reporte_Diseno.xlsx")
 * @param {Array<Object>} opciones.hojas - Arreglo de configuración de hojas
 *    hoja = {
 *       nombre: 'Nombre de la Hoja',
 *       titulo: 'Título descriptivo en cabecera',
 *       subtitulo: 'Filtro aplicado o período',
 *       columnas: [ { header: 'Nombre', key: 'campo', width: 20, align: 'left'|'center'|'right', numFmt: '' } ],
 *       filas: [ { campo: 'valor' } ],
 *       totales: { campo: 'Total: $1,200' } // opcional
 *    }
 */
export async function exportarExcel({ nombreArchivo = 'reporte.xlsx', hojas = [] }) {
  if (typeof window === 'undefined') return;

  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'REMAX BLACK Marketing';
  workbook.lastModifiedBy = 'REMAX BLACK Panel';
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const hojaConfig of hojas) {
    const {
      nombre = 'Datos',
      titulo,
      subtitulo,
      columnas = [],
      filas = [],
      totales = null
    } = hojaConfig;

    // Crear hoja
    const sheet = workbook.addWorksheet(nombre.substring(0, 31), {
      views: [{ showGridLines: true }]
    });

    let filaInicioTabla = 1;

    // Si tiene título corporativo
    if (titulo) {
      // Fila 1: Título principal
      const filaTitulo = sheet.addRow([titulo]);
      filaTitulo.height = 28;
      filaTitulo.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: BRAND_COLORS.headerBg } };
      filaTitulo.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      // Fila 2: Subtítulo / Metadatos de generación
      const fechaGen = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      const textoSubtitulo = subtitulo ? `${subtitulo} • Generado: ${fechaGen}` : `Generado: ${fechaGen} • REMAX BLACK Marketing`;
      const filaSub = sheet.addRow([textoSubtitulo]);
      filaSub.height = 18;
      filaSub.getCell(1).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
      filaSub.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      // Fila 3: Espaciado
      sheet.addRow([]);
      filaInicioTabla = 4;
    }

    // Configuración de encabezados
    const headers = columnas.map(c => c.header);
    const headerRow = sheet.addRow(headers);
    headerRow.height = 24;

    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BRAND_COLORS.headerBg }
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: BRAND_COLORS.headerText }
      };
      const colDef = columnas[colNumber - 1];
      cell.alignment = {
        vertical: 'middle',
        horizontal: colDef?.align || 'left',
        wrapText: false
      };
      cell.border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.headerBg } },
        bottom: { style: 'medium', color: { argb: BRAND_COLORS.accent } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.subHeaderBg } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.subHeaderBg } }
      };
    });

    // Agregar filas de datos
    filas.forEach((filaObj, idx) => {
      const valoresFila = columnas.map(col => {
        const val = filaObj[col.key];
        return val !== undefined && val !== null ? val : '';
      });

      const dataRow = sheet.addRow(valoresFila);
      dataRow.height = 20;

      const isEven = idx % 2 === 1;

      dataRow.eachCell((cell, colNumber) => {
        const colDef = columnas[colNumber - 1];

        // Zebra striping para lectura cómoda
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: BRAND_COLORS.zebraBg }
          };
        }

        cell.font = {
          name: 'Segoe UI',
          size: 9.5,
          color: { argb: '0F172A' }
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: colDef?.align || 'left'
        };

        // Formatos numéricos si están definidos
        if (colDef?.numFmt) {
          cell.numFmt = colDef.numFmt;
        }

        cell.border = {
          top: { style: 'thin', color: { argb: BRAND_COLORS.border } },
          bottom: { style: 'thin', color: { argb: BRAND_COLORS.border } },
          left: { style: 'thin', color: { argb: BRAND_COLORS.border } },
          right: { style: 'thin', color: { argb: BRAND_COLORS.border } }
        };
      });
    });

    // Fila de totales si se especificó
    if (totales && typeof totales === 'object') {
      const valoresTotales = columnas.map(col => totales[col.key] ?? '');
      const totalRow = sheet.addRow(valoresTotales);
      totalRow.height = 22;
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_COLORS.headerBg } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E2E8F0' }
        };
        const colDef = columnas[colNumber - 1];
        cell.alignment = { vertical: 'middle', horizontal: colDef?.align || 'left' };
        cell.border = {
          top: { style: 'medium', color: { argb: BRAND_COLORS.headerBg } },
          bottom: { style: 'double', color: { argb: BRAND_COLORS.headerBg } }
        };
      });
    }

    // Auto-filtros en la cabecera
    if (columnas.length > 0 && filas.length > 0) {
      sheet.autoFilter = {
        from: { row: filaInicioTabla, column: 1 },
        to: { row: filaInicioTabla + filas.length, column: columnas.length }
      };
    }

    // Anchos de columna automáticos basados en contenido y configuración
    columnas.forEach((colDef, idx) => {
      const colIndex = idx + 1;
      let maxLen = (colDef.header || '').length;

      filas.forEach(f => {
        const val = f[colDef.key];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen) maxLen = str.length;
        }
      });

      // Si tiene width especificado se respeta, si no se calcula con márgenes cómodos
      const finalWidth = colDef.width || Math.min(Math.max(maxLen + 4, 12), 45);
      sheet.getColumn(colIndex).width = finalWidth;
    });
  }

  // Escribir buffer y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  
  // Garantizar extensión .xlsx
  const nombreFinal = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  anchor.download = nombreFinal;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
