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
