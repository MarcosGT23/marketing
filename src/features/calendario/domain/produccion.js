import { leerFilasCsv } from '../../../core/utils/csv.js';
import { MESES_ES } from '../../../core/utils/dateUtils.js';

export const HOJA_PRODUCCION = {
  nombre: 'CALENDARIO PRODUCCIÓN',
  url: 'https://docs.google.com/spreadsheets/d/1vYr3FGQCPqwPscycq2ypRTzoBiXF1wCC/edit?gid=841561740',
  csv: 'https://docs.google.com/spreadsheets/d/1vYr3FGQCPqwPscycq2ypRTzoBiXF1wCC/export?format=csv&gid=841561740',
};

function fechaIso(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function nombreColumna(indice) {
  let nombre = '';
  for (let valor = indice + 1; valor > 0; valor = Math.floor((valor - 1) / 26)) {
    nombre = String.fromCharCode(65 + (valor - 1) % 26) + nombre;
  }
  return nombre;
}

export function leerProduccionCsv(texto) {
  const filas = leerFilasCsv(texto.replace(/^\uFEFF/, ''));
  const anotaciones = [];
  const meses = [];
  let periodo = null;
  let inicioSemana = null;
  let fechasColumnas = [];

  filas.forEach((fila, indiceFila) => {
    const mes = MESES_ES.findIndex(nombre => nombre.toLowerCase() === (fila[2] || '').trim().toLowerCase());
    if (/^\d{4}$/.test((fila[1] || '').trim()) && mes >= 0) {
      const anio = Number(fila[1]);
      periodo = { valor: `${anio}-${String(mes + 1).padStart(2, '0')}`, nombre: `${MESES_ES[mes]} ${anio}`, anio, mes };
      meses.push({ valor: periodo.valor, nombre: periodo.nombre });
      const primero = new Date(Date.UTC(anio, mes, 1));
      inicioSemana = new Date(Date.UTC(anio, mes, 1 - (primero.getUTCDay() + 6) % 7));
      fechasColumnas = [];
      return;
    }
    if ((fila[1] || '').trim().toUpperCase() === 'LUNES') return;

    const filaFechas = fila.slice(1, 8).filter(valor => /^\d{1,2}$/.test(valor.trim())).length >= 2 &&
      /^\d{1,2}$/.test((fila[1] || '').trim());
    if (filaFechas && periodo) {
      fechasColumnas = Array.from({ length: 7 }, (_, columna) => {
        const esperado = new Date(inicioSemana);
        esperado.setUTCDate(esperado.getUTCDate() + columna);
        return Number(fila[columna + 1]) === esperado.getUTCDate() ? fechaIso(esperado) : null;
      });
      inicioSemana.setUTCDate(inicioSemana.getUTCDate() + 7);
    }

    fila.forEach((contenido, columna) => {
      const textoCelda = contenido.trim();
      if (!textoCelda) return;
      if (filaFechas && columna >= 1 && columna <= 7 && /^\d{1,2}$/.test(textoCelda)) return;
      if (textoCelda.toLowerCase() === 'notas:') return;
      const celda = `${nombreColumna(columna)}${indiceFila + 1}`;
      anotaciones.push({
        id: `produccion-${celda}`,
        source: 'produccion',
        cell: celda,
        text: contenido,
        date: columna >= 1 && columna <= 7 ? fechasColumnas[columna - 1] || null : null,
        period: periodo?.valor || null,
        periodLabel: periodo?.nombre || 'Sin período indicado',
        sourceUrl: `${HOJA_PRODUCCION.url}&range=${celda}`,
      });
    });
  });
  if (!meses.length) throw new Error('La pestaña no tiene los encabezados de año, mes y días esperados.');
  return { anotaciones, meses, sourceUrl: HOJA_PRODUCCION.url, sheetName: HOJA_PRODUCCION.nombre };
}
