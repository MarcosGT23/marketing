// src/features/cm/presentation/components/MenuExportarReportesCM.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { notificarExito, notificarError } from '../../../../core/ui/notifications';
import { exportarReportesCmExcel } from '../../utils/cmExcelMapper';
import { idAgenteDeReporte, nombreAgenteDeReporte } from '../../utils/reportesMeta';

const ANCHO_MENU = 272;
const MARGEN = 8;

export default function MenuExportarReportesCM({ reportes = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState(null);
  const [exportando, setExportando] = useState(null);

  const contenedorRef = useRef(null);
  const botonRef = useRef(null);
  const menuRef = useRef(null);
  const primerItemRef = useRef(null);

  const agentes = useMemo(() => {
    const mapa = new Map();

    reportes.forEach((reporte) => {
      const id = idAgenteDeReporte(reporte);
      if (!mapa.has(id)) {
        mapa.set(id, { id, nombre: nombreAgenteDeReporte(reporte), reportes: 0 });
      }
      mapa.get(id).reportes += 1;
    });

    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [reportes]);

  const sinReportes = reportes.length === 0;

  const cerrar = (devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  };

  const abrirMenu = () => {
    const rect = botonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const izquierda = Math.min(
      Math.max(MARGEN, rect.right - ANCHO_MENU),
      window.innerWidth - ANCHO_MENU - MARGEN
    );
    const abrirArriba = window.innerHeight - rect.bottom < 300 && rect.top > 300;

    setPosicion({
      left: izquierda,
      top: abrirArriba ? rect.top - MARGEN : rect.bottom + MARGEN,
      transform: abrirArriba ? 'translateY(-100%)' : 'none'
    });
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;

    const alPulsarFuera = (event) => {
      const dentroDelBoton = contenedorRef.current?.contains(event.target);
      const dentroDelMenu = menuRef.current?.contains(event.target);
      if (!dentroDelBoton && !dentroDelMenu) setAbierto(false);
    };
    const alTeclear = (event) => {
      if (event.key === 'Escape') cerrar(true);
    };
    const alDesplazar = (event) => {
      // No cerrar cuando el scroll ocurre dentro del propio menú (lista de agentes).
      if (event.target && menuRef.current?.contains(event.target)) return;
      setAbierto(false);
    };

    document.addEventListener('pointerdown', alPulsarFuera);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', alDesplazar);
    window.addEventListener('scroll', alDesplazar, true);

    primerItemRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('pointerdown', alPulsarFuera);
      document.removeEventListener('keydown', alTeclear);
      window.removeEventListener('resize', alDesplazar);
      window.removeEventListener('scroll', alDesplazar, true);
    };
  }, [abierto]);

  const exportar = async (agente) => {
    if (exportando) return;

    const seleccionados = agente
      ? reportes.filter((reporte) => idAgenteDeReporte(reporte) === agente.id)
      : reportes;

    if (seleccionados.length === 0) {
      notificarError('No hay reportes CSV para exportar.', 'Sin datos');
      return;
    }

    setAbierto(false);
    setExportando(agente?.id || 'todos');

    try {
      await exportarReportesCmExcel(seleccionados, { agenteNombre: agente?.nombre || null });
      notificarExito(
        `${seleccionados.length} reporte(s) exportados${agente ? ` de ${agente.nombre}` : ''} con sus métricas.`,
        'Excel generado'
      );
    } catch (err) {
      console.error('[MenuExportarReportesCM] Error al exportar:', err);
      notificarError(err.message || 'No se pudo generar el archivo Excel.', 'Error en exportación');
    } finally {
      setExportando(null);
    }
  };

  const generando = Boolean(exportando);

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        onClick={() => (abierto ? cerrar() : abrirMenu())}
        disabled={sinReportes || generando}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-exportar-reportes-cm"
        title={sinReportes ? 'Aún no hay reportes CSV cargados' : 'Exportar métricas CSV por agente'}
        className="group relative flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-sm hover:bg-surface-container-low transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none"
        style={{
          border: '1px solid var(--color-primary-fixed-dim, #b4c5ff)',
          background: 'var(--color-surface-container-lowest, #ffffff)',
          color: 'var(--color-primary-container, #2563eb)'
        }}
      >
        <span
          className={`material-symbols-outlined text-[17px] ${generando ? 'animate-spin' : 'transition-transform group-hover:scale-110'}`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
        >
          {generando ? 'progress_activity' : 'table_view'}
        </span>
        <span className="whitespace-nowrap font-medium">
          {generando ? 'Generando .xlsx...' : 'Exportar Excel'}
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[16px] transition-transform ${abierto ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {abierto && posicion && createPortal(
        <div
          ref={menuRef}
          id="menu-exportar-reportes-cm"
          role="menu"
          aria-label="Exportar reportes CSV por agente"
          className="fixed z-[80] max-h-80 overflow-y-auto rounded-xl py-1 shadow-xl animate-fadeIn"
          style={{
            left: posicion.left,
            top: posicion.top,
            width: ANCHO_MENU,
            transform: posicion.transform,
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)'
          }}
        >
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-outline)' }}>
            Reportes CSV por agente
          </p>

          <button
            ref={primerItemRef}
            type="button"
            role="menuitem"
            onClick={() => exportar(null)}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]" style={{ color: 'var(--color-primary-container)' }}>
              groups
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold truncate" style={{ color: 'var(--color-on-surface)' }}>
                Todos los agentes
              </span>
              <span className="block text-[10px]" style={{ color: 'var(--color-outline)' }}>
                {reportes.length} reporte(s) · métricas del CSV
              </span>
            </span>
          </button>

          <div className="my-1 border-t" style={{ borderColor: 'var(--color-outline-variant)' }} role="separator" />

          {agentes.map((agente) => (
            <button
              key={agente.id}
              type="button"
              role="menuitem"
              onClick={() => exportar(agente)}
              className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                person
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold truncate" style={{ color: 'var(--color-on-surface)' }}>
                  {agente.nombre}
                </span>
                <span className="block text-[10px]" style={{ color: 'var(--color-outline)' }}>
                  {agente.reportes} reporte(s) · métricas del CSV
                </span>
              </span>
              <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-outline)' }}>
                download
              </span>
            </button>
          ))}

          {agentes.length === 0 && (
            <p className="px-3 py-3 text-xs" style={{ color: 'var(--color-outline)' }}>
              Aún no hay reportes CSV cargados.
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
