// src/core/ui/BotonExportarExcel.jsx
import React, { useState } from 'react';
import { notificarExito, notificarError } from './notifications';

export default function BotonExportarExcel({
  alExportar,
  etiqueta = 'Exportar Excel',
  icono = 'table_view',
  className = '',
  colorTema = 'neutral', // 'primary' | 'secondary' | 'tertiary' | 'neutral'
  disabled = false,
  tooltip = 'Descargar reporte en formato Microsoft Excel (.xlsx)'
}) {
  const [exportando, setExportando] = useState(false);

  const handleClick = async () => {
    if (exportando || disabled || !alExportar) return;

    setExportando(true);
    try {
      await alExportar();
      notificarExito('Reporte .xlsx descargado exitosamente.', 'Exportación completada');
    } catch (err) {
      console.error('[BotonExportarExcel] Error al exportar:', err);
      notificarError(err.message || 'No se pudo generar el archivo Excel.', 'Error en exportación');
    } finally {
      setExportando(false);
    }
  };

  // Variantes de color según el tema del panel
  const estilosPorTema = {
    primary: {
      border: '1px solid var(--color-primary-fixed-dim, #b4c5ff)',
      background: 'var(--color-surface-container-lowest, #ffffff)',
      color: 'var(--color-primary-container, #2563eb)',
    },
    secondary: {
      border: '1px solid rgba(16, 185, 129, 0.3)',
      background: 'var(--color-surface-container-lowest, #ffffff)',
      color: 'var(--color-secondary, #006c49)',
    },
    tertiary: {
      border: '1px solid var(--color-tertiary-fixed-dim, #d0bcff)',
      background: 'var(--color-surface-container-lowest, #ffffff)',
      color: 'var(--color-tertiary-container, #7d4ce7)',
    },
    neutral: {
      border: '1px solid var(--color-outline-variant, #cbd5e1)',
      background: 'var(--color-surface-container-lowest, #ffffff)',
      color: 'var(--color-on-surface, #0f172a)',
    }
  };

  const estiloActual = estilosPorTema[colorTema] || estilosPorTema.neutral;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={exportando || disabled}
      title={tooltip}
      className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-sm transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${className}`}
      style={estiloActual}
      onMouseEnter={(e) => {
        if (!disabled && !exportando) {
          e.currentTarget.style.background = 'var(--color-surface-container-low, #eff4ff)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !exportando) {
          e.currentTarget.style.background = estiloActual.background;
        }
      }}
    >
      {exportando ? (
        <span 
          className="material-symbols-outlined text-[17px] animate-spin"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
        >
          progress_activity
        </span>
      ) : (
        <span 
          className="material-symbols-outlined text-[17px] transition-transform group-hover:scale-110"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
        >
          {icono}
        </span>
      )}
      <span className="whitespace-nowrap font-medium">
        {exportando ? 'Generando .xlsx...' : etiqueta}
      </span>
    </button>
  );
}
