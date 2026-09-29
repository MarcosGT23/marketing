// src/features/cm/presentation/components/PanelCmUI.jsx
import { useState, useMemo } from 'react';

// Paleta de gradientes para avatares de agentes
const COLORES_AVATAR = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-600 to-blue-600',
];

function obtenerIniciales(nombre) {
  if (!nombre) return 'AG';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function PanelCmUI({ tareas = [], cargando, alSeleccionarPropiedad }) {
  const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState(null);
  const [vistaModo, setVistaModo] = useState('agentes'); // 'agentes' | 'todos'
  const [busqueda, setBusqueda] = useState('');

  // Agrupar requerimientos por agente
  const agentes = useMemo(() => {
    const mapa = {};

    tareas.forEach((item) => {
      const id = String(item.usuarios?.id_usuario || item.id_agente || 'sin-asignar');
      const nombre = item.usuarios?.nombre || (item.id_agente ? `Agente #${item.id_agente}` : 'General / Sin Agente');

      if (!mapa[id]) {
        // Asignar un color determinista basado en el id o nombre
        const hash = (id + nombre).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorGradiente = COLORES_AVATAR[hash % COLORES_AVATAR.length];

        mapa[id] = {
          id,
          nombre,
          iniciales: obtenerIniciales(nombre),
          colorGradiente,
          requerimientos: [],
          campanasActivas: 0,
          porHacer: 0,
          finalizadas: 0,
        };
      }

      mapa[id].requerimientos.push(item);

      const estado = item.tareas_cm?.[0]?.estado || 'Por Hacer';
      if (estado === 'Campaña Activa') mapa[id].campanasActivas++;
      else if (estado === 'Finalizado') mapa[id].finalizadas++;
      else mapa[id].porHacer++;
    });

    return Object.values(mapa).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tareas]);

  // Agente actualmente activo (si hay uno seleccionado)
  const agenteActivo = useMemo(() => {
    if (!agenteSeleccionadoId) return null;
    return agentes.find((a) => a.id === agenteSeleccionadoId) || null;
  }, [agentes, agenteSeleccionadoId]);

  // Requerimientos filtrados según la vista actual
  const requerimientosAMostrar = useMemo(() => {
    if (agenteActivo) {
      return agenteActivo.requerimientos.filter((item) =>
        item.nombre_propiedad?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    return tareas.filter((item) => {
      const coincidePropiedad = item.nombre_propiedad?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideAgente = item.usuarios?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
      return coincidePropiedad || coincideAgente;
    });
  }, [agenteActivo, tareas, busqueda]);

  // Filtrar lista de agentes por búsqueda
  const agentesFiltrados = useMemo(() => {
    if (!busqueda) return agentes;
    const q = busqueda.toLowerCase();
    return agentes.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.requerimientos.some((r) => r.nombre_propiedad?.toLowerCase().includes(q))
    );
  }, [agentes, busqueda]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-3">
        <span className="material-symbols-outlined animate-spin text-primary-container text-3xl">progress_activity</span>
        <span className="text-sm font-medium">Sincronizando pautas publicitarias con el equipo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ── Banner Principal ── */}
      <section className="rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl -mr-20 -mt-20"
          style={{ background: 'radial-gradient(circle, var(--color-primary-container) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
            style={{ background: 'var(--color-primary-fixed)' }}>
            <span className="material-symbols-outlined text-[24px] sm:text-[28px]" style={{ color: 'var(--color-on-primary-fixed-variant)' }}>ads_click</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-md font-bold text-lg sm:text-xl" style={{ color: 'var(--color-on-surface)' }}>Pauta Digital & Meta Ads</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                Reporte 28
              </span>
            </div>
            <p className="font-body-sm text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
              Gestión de requerimientos publicitarios separados por agente inmobiliario
            </p>
          </div>
        </div>

        {/* Resumen Global */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
          <div className="px-3 py-1.5 sm:py-2 rounded-xl text-xs flex items-center gap-2 font-medium"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
              color: 'var(--color-on-surface)'
            }}>
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-primary-container)' }}>person</span>
            <span><strong>{agentes.length}</strong> Agentes</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full font-label-sm text-[11px] font-semibold shadow-xs"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary-container)' }} />
            Brenda — Pauta Digital
          </div>
        </div>
      </section>

      {/* ── Barra de Navegación / Menú de Agentes ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
        
        {/* Selector de Modo / Navegación */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {agenteActivo ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAgenteSeleccionadoId(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                style={{
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)'
                }}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Directorio</span>
              </button>
              
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <select
                  value={agenteSeleccionadoId || ''}
                  onChange={(e) => setAgenteSeleccionadoId(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none transition-all"
                  style={{
                    background: 'var(--color-surface-container-low)',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-on-surface)'
                  }}
                >
                  {agentes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.requerimientos.length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 p-1 rounded-xl w-full sm:w-auto"
              style={{
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)'
              }}>
              <button
                type="button"
                onClick={() => { setVistaModo('agentes'); setAgenteSeleccionadoId(null); }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: vistaModo === 'agentes' ? 'var(--color-primary-container)' : 'transparent',
                  color: vistaModo === 'agentes' ? 'white' : 'var(--color-on-surface-variant)',
                  boxShadow: vistaModo === 'agentes' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
                }}
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>Por Agentes ({agentes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => { setVistaModo('todos'); setAgenteSeleccionadoId(null); }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: vistaModo === 'todos' ? 'var(--color-primary-container)' : 'transparent',
                  color: vistaModo === 'todos' ? 'white' : 'var(--color-on-surface-variant)',
                  boxShadow: vistaModo === 'todos' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
                }}
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                <span>Propiedades ({tareas.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined text-[18px]"
            style={{ color: 'var(--color-outline)' }}>
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={agenteActivo ? `Buscar en ${agenteActivo.nombre}...` : "Buscar propiedad o agente..."}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs focus:outline-none transition-all"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
              color: 'var(--color-on-surface)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary-container)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
              e.currentTarget.style.background = 'var(--color-surface-container-lowest)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'var(--color-surface-container-low)';
            }}
          />
        </div>
      </div>

      {/* ── VISTA 1: Directorio / Menú de Agentes ── */}
      {!agenteActivo && vistaModo === 'agentes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              Directorio de Agentes ({agentesFiltrados.length})
            </h2>
            <span className="text-xs text-outline">Haz clic en un agente para ver sus propiedades</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agentesFiltrados.map((agente) => (
              <div
                key={agente.id}
                onClick={() => setAgenteSeleccionadoId(agente.id)}
                className="rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  {/* Cabecera Agente */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agente.colorGradiente} text-white flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0`}>
                      {agente.iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-base transition-colors truncate"
                        style={{ color: 'var(--color-on-surface)' }}>
                        {agente.nombre}
                      </h3>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-outline)' }}>
                        <span className="material-symbols-outlined text-[14px]">real_estate_agent</span>
                        <span>Agente Inmobiliario</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                      style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                      {agente.requerimientos.length} req.
                    </span>
                  </div>

                  {/* Estadísticas de Campaña */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center text-xs mb-3"
                    style={{
                      background: 'var(--color-surface-container-low)',
                      border: '1px solid var(--color-outline-variant)'
                    }}>
                    <div>
                      <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Activas</span>
                      <strong className="text-emerald-600 font-bold">{agente.campanasActivas}</strong>
                    </div>
                    <div>
                      <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Por Hacer</span>
                      <strong className="text-amber-600 font-bold">{agente.porHacer}</strong>
                    </div>
                    <div>
                      <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--color-outline)' }}>Finalizado</span>
                      <strong className="font-bold" style={{ color: 'var(--color-primary-container)' }}>{agente.finalizadas}</strong>
                    </div>
                  </div>

                  {/* Preview de requerimientos */}
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-outline)' }}>Propiedades asignadas:</span>
                    {agente.requerimientos.slice(0, 3).map((r) => (
                      <div key={r.id_requerimiento} className="text-xs truncate flex items-center gap-1.5"
                        style={{ color: 'var(--color-on-surface-variant)' }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-outline)' }}></span>
                        <span className="truncate">{r.nombre_propiedad}</span>
                      </div>
                    ))}
                    {agente.requerimientos.length > 3 && (
                      <span className="text-[11px] font-medium block italic" style={{ color: 'var(--color-outline)' }}>
                        +{agente.requerimientos.length - 3} propiedad(es) más...
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Botón Ingresar */}
                <div className="pt-3 border-t flex items-center justify-between text-xs font-semibold group-hover:underline"
                  style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-primary-container)' }}>
                  <span>Ingresar a requerimientos</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}

            {agentesFiltrados.length === 0 && (
              <div className="col-span-3 text-center py-12 rounded-2xl"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-outline)'
                }}>
                <span className="material-symbols-outlined text-4xl block mb-2">person_search</span>
                <p>No se encontraron agentes con ese criterio de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA 2: Requerimientos del Agente Seleccionado ── */}
      {agenteActivo && (
        <div className="space-y-5">
          {/* Tarjeta de Perfil del Agente */}
          <div className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(to right, rgba(219, 225, 255, 0.3), var(--color-surface-container-lowest), var(--color-surface-container-lowest))',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${agenteActivo.colorGradiente} text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl shadow-md shrink-0`}>
                {agenteActivo.iniciales}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary-container)' }}>Agente Inmobiliario</span>
                  <span className="text-xs truncate" style={{ color: 'var(--color-outline)' }}>• ID: {agenteActivo.id}</span>
                </div>
                <h2 className="font-display font-bold text-lg sm:text-xl truncate" style={{ color: 'var(--color-on-surface)' }}>{agenteActivo.nombre}</h2>
                <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {agenteActivo.requerimientos.length} requerimientos registrados para pauta digital y Meta Ads
                </p>
              </div>
            </div>

            {/* Badges de Estado del Agente */}
            <div className="flex flex-wrap items-center gap-2">
              {agenteActivo.campanasActivas > 0 && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {agenteActivo.campanasActivas} Activas
                </span>
              )}
              {agenteActivo.porHacer > 0 && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {agenteActivo.porHacer} Por Hacer
                </span>
              )}
              {agenteActivo.finalizadas > 0 && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  style={{
                    background: 'var(--color-surface-container)',
                    color: 'var(--color-on-surface-variant)'
                  }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary-container)' }}></span>
                  {agenteActivo.finalizadas} Finalizado
                </span>
              )}
            </div>
          </div>

          {/* Grid de Requerimientos de este Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {requerimientosAMostrar.map((item) => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 rounded-2xl"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-outline)'
                }}>
                <span className="material-symbols-outlined text-4xl block mb-2">inventory_2</span>
                <p>Este agente no tiene requerimientos que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA 3: Todas las Propiedades (Modo Global) ── */}
      {!agenteActivo && vistaModo === 'todos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--color-outline)' }}>
              <span className="material-symbols-outlined text-[16px]">domain</span>
              Todas las Propiedades ({requerimientosAMostrar.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requerimientosAMostrar.map((item) => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-3 text-center py-12 rounded-2xl"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-outline)'
                }}>
                <p>No se encontraron propiedades.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );

  // Renderiza una tarjeta de requerimiento/propiedad
  function renderTarjetaRequerimiento(item) {
    const cm = item.tareas_cm?.[0] || {};
    const agente = item.usuarios?.nombre || 'General';

    return (
      <div
        key={cm.id_tarea || item.id_requerimiento}
        className="rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer hover:-translate-y-0.5"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}
        onClick={() => alSeleccionarPropiedad(item)}
      >
        <div>
          <div className="p-5 flex justify-between items-start gap-2"
            style={{
              background: 'linear-gradient(to right, rgba(219, 225, 255, 0.2), transparent)',
              borderBottom: '1px solid var(--color-outline-variant)'
            }}>
            <div>
              <h3 className="font-display font-semibold text-base transition-colors flex items-center gap-1.5"
                style={{ color: 'var(--color-on-surface)' }}>
                <span>{item.nombre_propiedad}</span>
                <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-primary-container)' }}>
                  open_in_new
                </span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                Agente: <strong>{agente}</strong> • {item.periodo_mensual}
              </p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
                cm.estado === 'Finalizado'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : cm.estado === 'Campaña Activa'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-surface-container text-outline'
              }`}
            >
              {cm.estado || 'Por Hacer'}
            </span>
          </div>

          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl"
              style={{
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)'
              }}>
              <div>
                <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Plataforma</span>
                <strong style={{ color: 'var(--color-on-surface)' }}>{cm.plataforma || 'Facebook / IG'}</strong>
              </div>
              <div>
                <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Presupuesto</span>
                <strong style={{ color: 'var(--color-primary-container)' }}>{cm.presupuesto || 'Sin definir'}</strong>
              </div>
            </div>

            <p className="text-xs line-clamp-2" style={{ color: 'var(--color-on-surface-variant)' }}>
              {item.descripcion_propiedad || 'Sin descripción detallada.'}
            </p>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between"
          style={{
            background: 'var(--color-surface-container-low)',
            borderTop: '1px solid var(--color-outline-variant)'
          }}>
          <span className="text-[11px] font-semibold group-hover:underline flex items-center gap-1"
            style={{ color: 'var(--color-primary-container)' }}>
            <span className="material-symbols-outlined text-[15px]">upload_file</span>
            Ver detalle y cargar CSV
          </span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform"
            style={{ color: 'var(--color-outline)' }}>
            chevron_right
          </span>
        </div>
      </div>
    );
  }
}