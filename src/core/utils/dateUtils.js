// src/core/utils/dateUtils.js

export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Retorna el período actual formateado en español (ej: "Octubre 2026")
 */
export function obtenerPeriodoActual(fecha = new Date()) {
  const mesIndex = fecha.getMonth();
  const mesNombre = MESES_ES[mesIndex] || 'Enero';
  const ano = fecha.getFullYear();
  return `${mesNombre} ${ano}`;
}

/**
 * Normaliza un período mensual al formato canónico "Octubre 2026".
 * Acepta las variantes que se guardan en la base de datos
 * ("Octubre 2026", "octubre de 2026", "Octubre de 2026", "octubre 2026").
 */
export function normalizarPeriodo(valor) {
  if (!valor) return '';
  const texto = String(valor).trim();
  const match = texto.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*(?:de\s+)?(\d{4})$/);
  if (!match) return texto;

  const mes = match[1];
  const ano = match[2];
  const indice = MESES_ES.findIndex(m => m.toLowerCase() === mes.toLowerCase());
  const nombreMes = indice >= 0
    ? MESES_ES[indice]
    : mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();

  return `${nombreMes} ${ano}`;
}

/**
 * Devuelve todas las variantes de escritura de un período para poder filtrar
 * en la base de datos sin perder registros por diferencias de formato.
 */
export function variantesPeriodo(valor) {
  const normalizado = normalizarPeriodo(valor);
  if (!normalizado) return [];

  const [mes, ano] = normalizado.split(' ');
  if (!ano) return [normalizado];

  const mesLower = mes.toLowerCase();
  return Array.from(new Set([
    normalizado,              // "Octubre 2026"
    `${mesLower} de ${ano}`,  // "octubre de 2026"
    `${mes} de ${ano}`,       // "Octubre de 2026"
    `${mesLower} ${ano}`      // "octubre 2026"
  ]));
}

/**
 * Convierte un período ("Octubre 2026") a Date para poder ordenarlos
 * del más reciente al más antiguo. Devuelve null si no es interpretable.
 */
export function periodoAFecha(valor) {
  const normalizado = normalizarPeriodo(valor);
  if (!normalizado) return null;

  const [mes, anoTexto] = normalizado.split(' ');
  const ano = parseInt(anoTexto, 10);
  const indice = MESES_ES.findIndex(m => m.toLowerCase() === mes.toLowerCase());
  if (Number.isNaN(ano) || indice < 0) return null;

  return new Date(ano, indice, 1);
}

/**
 * Genera una lista de próximos períodos a partir del mes en curso
 */
export function generarProximosPeriodos(cantidad = 8, fechaInicio = new Date()) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
    const mes = MESES_ES[d.getMonth()];
    const ano = d.getFullYear();
    const q = `Q${Math.floor(d.getMonth() / 3) + 1}`;
    let destacado = 'Planificación';
    if (i === 0) destacado = 'Mes en curso';
    else if (i === 1) destacado = 'Próximo';
    else if (d.getMonth() === 11) destacado = 'Cierre de año';
    else if (d.getMonth() === 0) destacado = 'Nuevo ciclo';

    lista.push({
      mes,
      ano,
      destacado,
      q,
      texto: `${mes} ${ano}`
    });
  }
  return lista;
}
