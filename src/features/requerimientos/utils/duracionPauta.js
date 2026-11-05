import { MESES_ES } from '../../../core/utils/dateUtils.js';

const CICLO_MENSUAL = /^Mes\s*\(28\s+(\p{L}+)(?:\s+(\d{4}))?\s*-\s*28\s+(\p{L}+)\s+(\d{4})\)$/iu;
const RANGO_DIAS = /^\d+ d[ií]as? \((\d{2})\/(\d{2})\/(\d{4}) - (\d{2})\/(\d{2})\/(\d{4})\)$/iu;
export const ERROR_DURACION_PAUTA = 'La duración de la pauta no es válida. Vuelve a seleccionar las fechas.';

const mesIndice = (nombre) => MESES_ES.findIndex(mes => mes.toLowerCase().startsWith(nombre.toLowerCase()));
const dosDigitos = (valor) => String(valor).padStart(2, '0');

// Supabase reserva 20 caracteres para periodo_pauta. Los rangos conservan
// ambas fechas en un formato compacto y la API devuelve el texto del selector.
export function guardarDuracionPauta(valor) {
  if (valor == null) return valor;
  if (typeof valor !== 'string') return undefined;
  const texto = valor.trim();
  if (Array.from(texto).length <= 20) return texto;

  const mensual = texto.match(CICLO_MENSUAL);
  if (mensual) {
    const [, nombreInicio, anioInicio, nombreFin, anioFin] = mensual;
    const mesInicio = mesIndice(nombreInicio);
    const mesFin = mesIndice(nombreFin);
    if (mesInicio < 0 || mesFin < 0) return undefined;
    const inicio = anioInicio || String(Number(anioFin) - (mesFin < mesInicio ? 1 : 0));
    return `M${inicio}${dosDigitos(mesInicio + 1)}${anioFin}${dosDigitos(mesFin + 1)}`;
  }

  const dias = texto.match(RANGO_DIAS);
  if (dias) {
    const [, diaInicio, mesInicio, anioInicio, diaFin, mesFin, anioFin] = dias;
    return `D${anioInicio}${mesInicio}${diaInicio}${anioFin}${mesFin}${diaFin}`;
  }
  return undefined;
}

export function mostrarDuracionPauta(valor) {
  const mensual = valor?.match(/^M(\d{4})(0[1-9]|1[0-2])(\d{4})(0[1-9]|1[0-2])$/);
  if (mensual) {
    const [, anioInicio, mesInicio, anioFin, mesFin] = mensual;
    const inicio = MESES_ES[Number(mesInicio) - 1].slice(0, 3);
    const fin = MESES_ES[Number(mesFin) - 1].slice(0, 3);
    const anio = anioInicio === anioFin ? '' : ` ${anioInicio}`;
    return `Mes (28 ${inicio}${anio} - 28 ${fin} ${anioFin})`;
  }

  const dias = valor?.match(/^D(\d{4})(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})$/);
  if (dias) {
    const [, anioInicio, mesInicio, diaInicio, anioFin, mesFin, diaFin] = dias;
    const inicio = Date.UTC(Number(anioInicio), Number(mesInicio) - 1, Number(diaInicio));
    const fin = Date.UTC(Number(anioFin), Number(mesFin) - 1, Number(diaFin));
    const cantidad = (fin - inicio) / 86400000 + 1;
    return `${cantidad} ${cantidad === 1 ? 'día' : 'días'} (${diaInicio}/${mesInicio}/${anioInicio} - ${diaFin}/${mesFin}/${anioFin})`;
  }
  return valor;
}

export function leerDuracionPauta(valor, hoy = new Date()) {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (hoy.getDate() < 28 ? 1 : 0), 28);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 28);
  const resultado = { modo: 'Mes', inicio, fin, fechaInicio: null, fechaFin: null };
  const texto = mostrarDuracionPauta(String(valor || ''));
  const mensual = texto.match(CICLO_MENSUAL);
  if (mensual) {
    const mesInicio = mesIndice(mensual[1]);
    const mesFin = mesIndice(mensual[3]);
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
