import React, { useState, useEffect, useMemo } from 'react';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/**
 * Selector interactivo de duración para Pauta Digital (Brenda / Meta Ads).
 * 1. "Por Días": Calendario ultra compacto, ágil y visual.
 * 2. "Mes (28 al 28)": Permite elegir y modificar libremente los meses con atajos rápidos y selectores.
 */
export default function SelectorDuracionPauta({ valor, alCambiar }) {
  // Detectar modo inicial ('Días' o 'Mes')
  const modoInicial = useMemo(() => {
    if (!valor) return 'Mes';
    if (valor.toLowerCase().startsWith('mes')) return 'Mes';
    if (valor.toLowerCase().includes('día') || valor.toLowerCase().includes('dia')) return 'Días';
    return 'Mes';
  }, [valor]);

  const [modo, setModo] = useState(modoInicial);

  // Fecha de referencia actual
  const hoy = useMemo(() => new Date(), []);
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());

  // Rango para selección por días: [Date | null, Date | null]
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  // Estados para modo "Mes" editable (Del 28 de mes A al 28 de mes B)
  const [mesInicioPauta, setMesInicioPauta] = useState(() => {
    if (valor) {
      const match = NOMBRES_MESES.findIndex(m => valor.toLowerCase().includes(m.toLowerCase().slice(0, 3)));
      if (match !== -1) return match;
    }
    // Si hoy es antes del 28, el ciclo actual arrancó el 28 del mes pasado
    // Si hoy es >= 28, arranca el 28 de este mes
    return hoy.getDate() >= 28 ? hoy.getMonth() : (hoy.getMonth() + 11) % 12;
  });
  
  const [anioInicioPauta, setAnioInicioPauta] = useState(() => {
    if (hoy.getDate() < 28 && hoy.getMonth() === 0) {
      return hoy.getFullYear() - 1;
    }
    return hoy.getFullYear();
  });

  const [mesFinPauta, setMesFinPauta] = useState(() => {
    const startMes = hoy.getDate() >= 28 ? hoy.getMonth() : (hoy.getMonth() + 11) % 12;
    return (startMes + 1) % 12;
  });
  
  const [anioFinPauta, setAnioFinPauta] = useState(() => {
    const startMes = hoy.getDate() >= 28 ? hoy.getMonth() : (hoy.getMonth() + 11) % 12;
    return startMes === 11 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  });

  // Generar string del modo mes
  const generarTextoMes = (mIni, aIni, mFin, aFin) => {
    const mes1 = NOMBRES_MESES_CORTOS[mIni];
    const mes2 = NOMBRES_MESES_CORTOS[mFin];
    if (aIni === aFin) {
      return `Mes (28 ${mes1} - 28 ${mes2} ${aIni})`;
    }
    return `Mes (28 ${mes1} ${aIni} - 28 ${mes2} ${aFin})`;
  };

  // Inicializar selección según el valor recibido
  useEffect(() => {
    if (valor && (valor.toLowerCase().includes('día') || valor.toLowerCase().includes('dia'))) {
      setModo('Días');
    } else if (valor && valor.toLowerCase().startsWith('mes')) {
      setModo('Mes');
    }
  }, [valor]);

  // Al cambiar modo a Mes
  const seleccionarModoMes = () => {
    setModo('Mes');
    const texto = generarTextoMes(mesInicioPauta, anioInicioPauta, mesFinPauta, anioFinPauta);
    alCambiar(texto);
  };

  // Atajo rápido para elegir un ciclo mensual predeterminado (ej: Oct - Nov)
  const aplicarCicloRapido = (mIni, aIni, mFin, aFin) => {
    setMesInicioPauta(mIni);
    setAnioInicioPauta(aIni);
    setMesFinPauta(mFin);
    setAnioFinPauta(aFin);
    const texto = generarTextoMes(mIni, aIni, mFin, aFin);
    alCambiar(texto);
  };

  // Al modificar mes de inicio en modo Mes
  const manejarCambioMesInicio = (nuevoMesIdx) => {
    const idx = parseInt(nuevoMesIdx, 10);
    setMesInicioPauta(idx);
    
    // Por defecto, fin es el mes siguiente
    const finIdx = (idx + 1) % 12;
    const finAnio = (idx === 11) ? anioInicioPauta + 1 : anioInicioPauta;
    setMesFinPauta(finIdx);
    setAnioFinPauta(finAnio);

    const texto = generarTextoMes(idx, anioInicioPauta, finIdx, finAnio);
    alCambiar(texto);
  };

  // Al modificar mes de fin en modo Mes
  const manejarCambioMesFin = (nuevoFinIdx) => {
    const idx = parseInt(nuevoFinIdx, 10);
    setMesFinPauta(idx);
    const finAnio = (idx < mesInicioPauta) ? anioInicioPauta + 1 : anioInicioPauta;
    setAnioFinPauta(finAnio);

    const texto = generarTextoMes(mesInicioPauta, anioInicioPauta, idx, finAnio);
    alCambiar(texto);
  };

  // Al cambiar a modo Días
  const seleccionarModoDias = () => {
    setModo('Días');
    if (!fechaInicio) {
      const start = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const end = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 6);
      setFechaInicio(start);
      setFechaFin(end);
      alCambiar(formatearRangoDias(start, end));
    } else {
      alCambiar(formatearRangoDias(fechaInicio, fechaFin || fechaInicio));
    }
  };

  function formatearRangoDias(f1, f2) {
    if (!f1) return '7 días';
    const inicio = f1 < f2 ? f1 : f2;
    const fin = f1 < f2 ? f2 : f1;
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const dias = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const pad = (n) => String(n).padStart(2, '0');
    const d1 = `${pad(inicio.getDate())}/${pad(inicio.getMonth() + 1)}`;
    const d2 = `${pad(fin.getDate())}/${pad(fin.getMonth() + 1)}`;

    return `${dias} ${dias === 1 ? 'día' : 'días'} (${d1} - ${d2})`;
  }

  // Clic en un día del calendario compacto
  const manejarClickDia = (dia) => {
    const fechaClic = new Date(anioActual, mesActual, dia);

    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(fechaClic);
      setFechaFin(null);
      const strVal = `1 día (${String(dia).padStart(2, '0')}/${String(mesActual + 1).padStart(2, '0')})`;
      alCambiar(strVal);
    } else {
      let start = fechaInicio;
      let end = fechaClic;
      if (end < start) {
        const tmp = start;
        start = end;
        end = tmp;
      }
      setFechaInicio(start);
      setFechaFin(end);
      alCambiar(formatearRangoDias(start, end));
    }
  };

  // Preajustes rápidos de días
  const aplicarPreajusteDias = (numDias) => {
    const start = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const end = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + (numDias - 1));
    setMesActual(start.getMonth());
    setAnioActual(start.getFullYear());
    setFechaInicio(start);
    setFechaFin(end);
    alCambiar(formatearRangoDias(start, end));
  };

  // Cuadrícula de días para el mes mostrado
  const diasMes = useMemo(() => {
    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const diasTotales = ultimoDia.getDate();

    let inicioSemana = primerDia.getDay() - 1;
    if (inicioSemana === -1) inicioSemana = 6;

    const celdas = [];
    for (let i = 0; i < inicioSemana; i++) {
      celdas.push(null);
    }
    for (let d = 1; d <= diasTotales; d++) {
      celdas.push(d);
    }
    return celdas;
  }, [mesActual, anioActual]);

  const mesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(a => a + 1);
    } else {
      setMesActual(m => m + 1);
    }
  };

  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(a => a - 1);
    } else {
      setMesActual(m => m - 1);
    }
  };

  // Determina si un día está seleccionado o en rango
  const estadoDia = (dia) => {
    if (!dia) return null;
    const fecha = new Date(anioActual, mesActual, dia);

    if (modo === 'Mes') {
      const f1 = new Date(anioInicioPauta, mesInicioPauta, 28);
      const f2 = new Date(anioFinPauta, mesFinPauta, 28);
      const esInicio = fecha.toDateString() === f1.toDateString();
      const esFin = fecha.toDateString() === f2.toDateString();
      const enRango = fecha >= f1 && fecha <= f2;
      return { esInicio, esFin, enRango };
    }

    if (!fechaInicio) return null;

    const fInicio = fechaInicio;
    const fFin = fechaFin || fechaInicio;
    const start = fInicio < fFin ? fInicio : fFin;
    const end = fInicio < fFin ? fFin : fInicio;

    const esInicio = fecha.toDateString() === start.toDateString();
    const esFin = fecha.toDateString() === end.toDateString();
    const enRango = fecha >= start && fecha <= end;

    return { esInicio, esFin, enRango };
  };

  // Generar 4 ciclos mensuales próximos para acceso con 1 solo clic
  const ciclosSugeridos = useMemo(() => {
    const list = [];
    const baseMonth = hoy.getMonth();
    const baseYear = hoy.getFullYear();

    for (let i = 0; i < 4; i++) {
      const m1 = (baseMonth + i) % 12;
      const y1 = baseYear + Math.floor((baseMonth + i) / 12);
      const m2 = (m1 + 1) % 12;
      const y2 = (m1 === 11) ? y1 + 1 : y1;
      
      const etiqueta = i === 0 
        ? `Mes actual (${NOMBRES_MESES_CORTOS[m1]} - ${NOMBRES_MESES_CORTOS[m2]})`
        : i === 1 
          ? `Próx. mes (${NOMBRES_MESES_CORTOS[m1]} - ${NOMBRES_MESES_CORTOS[m2]})`
          : `${NOMBRES_MESES_CORTOS[m1]} - ${NOMBRES_MESES_CORTOS[m2]} ${y2}`;

      const esActivo = mesInicioPauta === m1 && mesFinPauta === m2 && anioInicioPauta === y1;
      list.push({ m1, y1, m2, y2, etiqueta, esActivo });
    }
    return list;
  }, [hoy, mesInicioPauta, mesFinPauta, anioInicioPauta]);

  return (
    <div className="w-full space-y-2.5">
      {/* Botones de Selección de Modo (Segmented Control) */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container w-fit">
        <button
          type="button"
          onClick={seleccionarModoDias}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            modo === 'Días'
              ? 'bg-primary-container text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
          <span>Por Días</span>
        </button>

        <button
          type="button"
          onClick={seleccionarModoMes}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            modo === 'Mes'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">event_repeat</span>
          <span>Por Mes (28 al 28)</span>
        </button>
      </div>

      {/* ── MODO 1: CALENDARIO ULTRA COMPACTO PARA DÍAS ── */}
      {modo === 'Días' ? (
        <div className="w-full max-w-[320px] p-2.5 rounded-xl bg-surface-container-low/80 border border-surface-container shadow-xs space-y-2">
          {/* Encabezado ultra compacto */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[15px]">date_range</span>
              <span className="font-bold text-[11px] text-on-surface">
                {NOMBRES_MESES[mesActual]} {anioActual}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={mesAnterior}
                className="w-5 h-5 rounded flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={mesSiguiente}
                className="w-5 h-5 rounded flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Días de la semana ultra compactos */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia} className="text-[8px] font-bold text-outline uppercase py-0">
                {dia}
              </span>
            ))}
          </div>

          {/* Cuadrícula ultra compacta de días */}
          <div className="grid grid-cols-7 gap-0.5">
            {diasMes.map((dia, idx) => {
              if (dia === null) {
                return <div key={`empty-${idx}`} className="h-6 w-full" />;
              }

              const estado = estadoDia(dia);
              const esHoy =
                hoy.getDate() === dia &&
                hoy.getMonth() === mesActual &&
                hoy.getFullYear() === anioActual;

              let estiloFondo = 'hover:bg-surface-container text-on-surface';
              if (estado?.esInicio || estado?.esFin) {
                estiloFondo = 'bg-primary-container text-white font-bold shadow-xs scale-105 z-10';
              } else if (estado?.enRango) {
                estiloFondo = 'bg-primary-fixed/45 text-on-primary-fixed-variant font-medium';
              }

              return (
                <button
                  key={`day-${dia}`}
                  type="button"
                  onClick={() => manejarClickDia(dia)}
                  className={`h-6 rounded text-[10px] flex items-center justify-center relative transition-all duration-75 cursor-pointer ${estiloFondo}`}
                >
                  <span>{dia}</span>
                  {esHoy && !(estado?.esInicio || estado?.esFin) && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-secondary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Atajos rápidos compactos */}
          <div className="pt-1.5 border-t border-surface-container flex items-center justify-between gap-1 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-outline font-medium">Rápido:</span>
              {[3, 7, 15, 30].map((dias) => (
                <button
                  key={`preset-${dias}`}
                  type="button"
                  onClick={() => aplicarPreajusteDias(dias)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                >
                  {dias}d
                </button>
              ))}
            </div>

            <span className="font-bold text-[10px] text-secondary bg-secondary-container/40 px-1.5 py-0.5 rounded truncate max-w-[130px]">
              {valor || 'Sin fecha'}
            </span>
          </div>
        </div>
      ) : (
        /* ── MODO 2: MES COMPLETO (28 AL 28) EDITABLE Y SELECCIONABLE ── */
        <div className="w-full max-w-lg p-3 sm:p-4 rounded-xl bg-surface-container-low/80 border border-secondary/25 space-y-3 shadow-xs">
          {/* Encabezado del Modo Mes */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface">
                  Pauta Mensual (Del 28 al 28)
                </h4>
                <p className="text-[10px] text-outline">
                  Selecciona el mes o personaliza libremente el rango de meses.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary-container text-on-secondary-container border border-secondary/20">
              Ciclo 28 al 28
            </span>
          </div>

          {/* Atajos Rápidos de Ciclos Próximos */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
              Meses Frecuentes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ciclosSugeridos.map((c, i) => (
                <button
                  key={`ciclo-${i}`}
                  type="button"
                  onClick={() => aplicarCicloRapido(c.m1, c.y1, c.m2, c.y2)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    c.esActivo
                      ? 'bg-secondary text-white border-secondary shadow-xs scale-[1.02]'
                      : 'bg-surface-container-lowest text-on-surface border-surface-container hover:bg-surface-container hover:border-outline-variant'
                  }`}
                >
                  {c.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Selectores Personalizables de Mes de Inicio y Mes de Fin */}
          <div className="pt-2 border-t border-surface-container space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-secondary">tune</span>
              <span>Modificar Meses Manualmente:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Mes Desde */}
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                <label className="text-[9px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-secondary">play_arrow</span>
                  <span>Desde el 28 de:</span>
                </label>
                <select
                  value={mesInicioPauta}
                  onChange={(e) => manejarCambioMesInicio(e.target.value)}
                  className="w-full px-2 py-1 bg-surface-container-low rounded text-xs font-semibold text-on-surface border border-surface-container focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
                >
                  {NOMBRES_MESES.map((m, idx) => (
                    <option key={`ini-${m}`} value={idx}>
                      {m} {anioInicioPauta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mes Hasta */}
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                <label className="text-[9px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-secondary">stop</span>
                  <span>Hasta el 28 de:</span>
                </label>
                <select
                  value={mesFinPauta}
                  onChange={(e) => manejarCambioMesFin(e.target.value)}
                  className="w-full px-2 py-1 bg-surface-container-low rounded text-xs font-semibold text-on-surface border border-surface-container focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
                >
                  {NOMBRES_MESES.map((m, idx) => (
                    <option key={`fin-${m}`} value={idx}>
                      {m} {anioFinPauta}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resumen Activo de la Pauta Mensual */}
          <div className="p-2 rounded-lg bg-secondary-container/20 border border-secondary/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[15px]">event_available</span>
              <span className="font-bold text-[11px]">
                Del 28 de {NOMBRES_MESES[mesInicioPauta]} al 28 de {NOMBRES_MESES[mesFinPauta]}
              </span>
            </div>
            <span className="text-[10px] font-bold text-secondary bg-secondary-container/60 px-2 py-0.5 rounded-md">
              ✓ {valor || 'Mes activo'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
