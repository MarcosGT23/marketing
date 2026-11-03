import { MESES_ES } from '../../../core/utils/dateUtils.js';

export function leerDuracionPauta(valor, hoy = new Date()) {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (hoy.getDate() < 28 ? 1 : 0), 28);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 28);
  const resultado = { modo: 'Mes', inicio, fin, fechaInicio: null, fechaFin: null };
  const texto = String(valor || '');
  const mensual = texto.match(/^Mes\s*\(28\s+(\p{L}+)(?:\s+(\d{4}))?\s*-\s*28\s+(\p{L}+)\s+(\d{4})\)$/iu);
  if (mensual) {
    const mesInicio = MESES_ES.findIndex(m => m.toLowerCase().startsWith(mensual[1].toLowerCase()));
    const mesFin = MESES_ES.findIndex(m => m.toLowerCase().startsWith(mensual[3].toLowerCase()));
    if (mesInicio >= 0 && mesFin >= 0) {
      const anioFin = Number(mensual[4]);
      const anioInicio = mensual[2] ? Number(mensual[2]) : anioFin - (mesFin < mesInicio ? 1 : 0);
      resultado.inicio = new Date(anioInicio, mesInicio, 28);
      resultado.fin = new Date(anioFin, mesFin, 28);
    }
  } else if (/d[ií]a/i.test(texto)) {
    resultado.modo = 'Días';
    const fechas = [...texto.matchAll(/(\d{2})\/(\d{2})(?:\/(\d{4}))?/g)];
    const dias = Number(texto.match(/^(\d+)/)?.[1]) || 7;
    resultado.fechaInicio = fechas[0]
      ? new Date(Number(fechas[0][3]) || hoy.getFullYear(), Number(fechas[0][2]) - 1, Number(fechas[0][1]))
      : new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (fechas[1]) {
      resultado.fechaFin = new Date(Number(fechas[1][3]) || resultado.fechaInicio.getFullYear(), Number(fechas[1][2]) - 1, Number(fechas[1][1]));
      if (!fechas[1][3] && resultado.fechaFin < resultado.fechaInicio) resultado.fechaFin.setFullYear(resultado.fechaFin.getFullYear() + 1);
    } else if (!fechas.length) {
      resultado.fechaFin = new Date(resultado.fechaInicio);
      resultado.fechaFin.setDate(resultado.fechaFin.getDate() + dias - 1);
    }
  }
  return resultado;
}
