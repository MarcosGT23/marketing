// src/core/hooks/useFiltroPeriodos.js
// Filtra una lista de actividades por período mensual y expone el submenú
// de períodos. Por defecto selecciona el mes en curso (si tiene actividades)
// o el período más reciente, para que nunca se mezclen períodos.
import { useMemo, useState } from 'react';
import { normalizarPeriodo, obtenerPeriodoActual, resumirPeriodos } from '../utils/dateUtils';
import { SIN_PERIODO } from '../ui/SubmenuPeriodos.jsx';

export function filtrarPorPeriodo(items = [], periodoActivo, campo = 'periodo_mensual') {
  if (!periodoActivo) return items;
  if (periodoActivo === SIN_PERIODO) {
    return items.filter((item) => !normalizarPeriodo(item?.[campo]));
  }
  return items.filter((item) => normalizarPeriodo(item?.[campo]) === periodoActivo);
}

export function useFiltroPeriodos(tareas = [], campo = 'periodo_mensual') {
  const resumen = useMemo(() => resumirPeriodos(tareas, campo), [tareas, campo]);
  const [periodoSel, setPeriodoSel] = useState(null);

  const periodoActivo = useMemo(() => {
    const opciones = resumen.sinPeriodo > 0
      ? [...resumen.periodos, SIN_PERIODO]
      : resumen.periodos;
    if (opciones.length === 0) return null;
    if (periodoSel && opciones.includes(periodoSel)) return periodoSel;
    const actual = obtenerPeriodoActual();
    if (resumen.periodos.includes(actual)) return actual;
    return resumen.periodos[0] || SIN_PERIODO;
  }, [resumen, periodoSel]);

  const tareasFiltradas = useMemo(
    () => filtrarPorPeriodo(tareas, periodoActivo, campo),
    [tareas, periodoActivo, campo]
  );

  return {
    periodos: resumen.periodos,
    conteos: resumen.conteos,
    sinPeriodo: resumen.sinPeriodo,
    periodoActivo,
    setPeriodoSel,
    tareasFiltradas
  };
}
