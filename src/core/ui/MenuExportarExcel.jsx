import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { obtenerPeriodoActual } from '../utils/dateUtils';
import {
  obtenerPeriodosExportacion, filtrarExportacion,
  idAgenteExportacion, nombreAgenteExportacion,
  idCampanaExportacion, nombreCampanaExportacion,
} from '../utils/exportacion';
import { notificarError, notificarExito } from './notifications';

const COLORES = { primary: 'var(--color-primary-container)', secondary: 'var(--color-secondary)', tertiary: 'var(--color-tertiary-container)', neutral: 'var(--color-on-surface)' };
const VACIOS = [];

export default function MenuExportarExcel({
  registros = VACIOS, periodosReferencia = VACIOS, periodoInicial,
  alExportar, etiqueta = 'Exportar Excel', colorTema = 'neutral',
  conAgentes = false, descripcion = 'Selecciona el mes de la campaña y descarga su reporte.',
}) {
  const id = useId();
  const botonRef = useRef(null);
  const menuRef = useRef(null);
  const guardandoRef = useRef(false);
  const [posicion, setPosicion] = useState(null);
  const [periodoSel, setPeriodoSel] = useState('');
  const [agenteSel, setAgenteSel] = useState('');
  const [campanaSel, setCampanaSel] = useState('');
  const [exportando, setExportando] = useState(false);
  const periodos = useMemo(() => obtenerPeriodosExportacion(registros, periodosReferencia), [registros, periodosReferencia]);
  const periodo = periodos.some(p => p.valor === periodoSel) ? periodoSel : periodos[0]?.valor || '';
  const delMes = filtrarExportacion(registros, { periodo });
  const agentes = [...new Map(delMes.map(item => [idAgenteExportacion(item), { id: idAgenteExportacion(item), nombre: nombreAgenteExportacion(item) }])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const agente = conAgentes && agentes.some(a => a.id === agenteSel) ? agenteSel : '';
  const delAgente = filtrarExportacion(registros, { periodo, agente });
  const campanas = [...new Map(delAgente.map(item => [idCampanaExportacion(item), { id: idCampanaExportacion(item), nombre: nombreCampanaExportacion(item) }])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const campana = campanas.some(c => c.id === campanaSel) ? campanaSel : '';
  const seleccionados = filtrarExportacion(registros, { periodo, agente, campana });
  const color = COLORES[colorTema] || COLORES.neutral;

  const cerrar = (foco = false) => {
    setPosicion(null);
    if (foco) botonRef.current?.focus();
  };

  const abrir = () => {
    const rect = botonRef.current.getBoundingClientRect();
    const ancho = Math.min(336, window.innerWidth - 16);
    setPeriodoSel([periodoInicial, obtenerPeriodoActual()].find(p => periodos.some(op => op.valor === p)) || periodos[0]?.valor || '');
    setAgenteSel('');
    setCampanaSel('');
    setPosicion({
      left: Math.max(8, Math.min(rect.right - ancho, window.innerWidth - ancho - 8)),
      top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 440)),
      width: ancho,
    });
  };

  useEffect(() => {
    if (!posicion) return;
    menuRef.current?.querySelector('select')?.focus({ preventScroll: true });
    const fuera = e => { if (!menuRef.current?.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar(); };
    const tecla = e => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(true); }
      if (e.key === 'Tab') {
        const campos = [...menuRef.current.querySelectorAll('button:not(:disabled), select:not(:disabled)')];
        const primero = campos[0], ultimo = campos.at(-1);
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus(); }
      }
    };
    const scroll = e => { if (!menuRef.current?.contains(e.target)) cerrar(); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', fueraResize);
    function fueraResize() { cerrar(); }
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', fueraResize);
    };
  }, [posicion]);

  const descargar = async () => {
    if (guardandoRef.current || !seleccionados.length) return;
    guardandoRef.current = true;
    setExportando(true);
    try {
      const nombrePeriodo = periodos.find(p => p.valor === periodo)?.nombre || periodo;
      await alExportar(seleccionados, {
        periodo: nombrePeriodo,
        agenteNombre: agentes.find(a => a.id === agente)?.nombre || null,
        campanaNombre: campanas.find(c => c.id === campana)?.nombre || null,
      });
      cerrar(true);
      notificarExito(`${seleccionados.length} registro(s) de ${nombrePeriodo} exportados a Excel.`, 'Exportación completada');
    } catch (err) {
      notificarError(err.message || 'No se pudo generar el archivo Excel.', 'Error en exportación');
    } finally {
      guardandoRef.current = false;
      setExportando(false);
    }
  };

  const estiloSelect = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' };
  return <>
    <button ref={botonRef} type="button" onClick={() => posicion ? cerrar() : abrir()}
      disabled={!periodos.length || exportando} aria-haspopup="dialog" aria-expanded={Boolean(posicion)} aria-controls={id}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ ...estiloSelect, background: 'var(--color-surface-container-lowest)', color }}>
      <span className={`material-symbols-outlined text-[17px] ${exportando ? 'animate-spin' : ''}`} aria-hidden="true">{exportando ? 'progress_activity' : 'table_view'}</span>
      {exportando ? 'Generando .xlsx...' : etiqueta}
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
    </button>
    {posicion && createPortal(
      <div ref={menuRef} id={id} role="dialog" aria-modal="true" aria-label="Exportar reporte por mes"
        className="fixed z-[80] rounded-2xl p-4 shadow-xl overflow-y-auto space-y-3"
        style={{ ...posicion, ...estiloSelect, background: 'var(--color-surface-container-lowest)', maxHeight: 'calc(100dvh - 16px)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Exportar reporte</h2>
          <button type="button" onClick={() => cerrar(true)} aria-label="Cerrar menú de exportación" className="p-1 rounded-lg cursor-pointer"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span></button>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-outline)' }}>{descripcion}</p>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">Mes de la campaña
          <select value={periodo} onChange={e => { setPeriodoSel(e.target.value); setAgenteSel(''); setCampanaSel(''); }} className="w-full rounded-xl p-2.5 text-xs" style={estiloSelect}>
            {periodos.map(p => <option key={p.valor} value={p.valor}>{p.nombre} ({p.cantidad})</option>)}
          </select>
        </label>
        {conAgentes && <label className="flex flex-col gap-1.5 text-xs font-semibold">Agente
          <select value={agente} onChange={e => { setAgenteSel(e.target.value); setCampanaSel(''); }} className="w-full rounded-xl p-2.5 text-xs" style={estiloSelect}>
            <option value="">Todos los agentes</option>
            {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>}
        <label className="flex flex-col gap-1.5 text-xs font-semibold">Campaña / Propiedad
          <select value={campana} onChange={e => setCampanaSel(e.target.value)} className="w-full rounded-xl p-2.5 text-xs" style={estiloSelect}>
            <option value="">Todas las campañas del mes</option>
            {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre} · #{c.id}</option>)}
          </select>
        </label>
        <p role="status" className="text-xs" style={{ color: 'var(--color-outline)' }}>
          {seleccionados.length ? `${seleccionados.length} registro(s) incluidos en el reporte.` : 'No hay reportes disponibles para este mes con los filtros seleccionados.'}
        </p>
        <button type="button" onClick={descargar} disabled={exportando || !seleccionados.length}
          className="w-full flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-primary-container)' }}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
          {exportando ? 'Generando .xlsx...' : 'Descargar Excel'}
        </button>
      </div>, document.body
    )}
  </>;
}
