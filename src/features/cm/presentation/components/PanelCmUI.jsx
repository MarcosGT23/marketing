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
      <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-on-surface">Pauta Digital & Meta Ads (Brenda)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] sm:text-xs font-bold shrink-0">
              Reporte 28
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Gestión de requerimientos publicitarios separados por agente inmobiliario.
          </p>
        </div>

        {/* Resumen Global */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 sm:py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[18px]">person</span>
            <span><strong>{agentes.length}</strong> Agentes</span>
          </div>
          <div className="px-3 py-1.5 sm:py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span><strong>{tareas.length}</strong> Requerimientos</span>
          </div>
        </div>
      </div>

      {/* ── Barra de Navegación / Menú de Agentes ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl border border-surface-container">
        
        {/* Selector de Modo / Navegación */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {agenteActivo ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAgenteSeleccionadoId(null)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-all active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Directorio</span>
              </button>
              
              <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                <select
                  value={agenteSeleccionadoId || ''}
                  onChange={(e) => setAgenteSeleccionadoId(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 bg-surface-container-low border border-surface-container rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
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
            <div className="flex items-center gap-1 p-0.5 bg-surface-container-low rounded-lg border border-surface-container w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setVistaModo('agentes'); setAgenteSeleccionadoId(null); }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  vistaModo === 'agentes'
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>Por Agentes ({agentes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => { setVistaModo('todos'); setAgenteSeleccionadoId(null); }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  vistaModo === 'todos'
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                <span>Propiedades ({tareas.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none material-symbols-outlined text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={agenteActivo ? `Buscar en ${agenteActivo.nombre}...` : "Buscar propiedad o agente..."}
            className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
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
                className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-primary-container/50 transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
              >
                <div>
                  {/* Cabecera Agente */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agente.colorGradiente} text-white flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0`}>
                      {agente.iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-base text-on-surface group-hover:text-primary transition-colors truncate">
                        {agente.nombre}
                      </h3>
                      <p className="text-xs text-outline flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">real_estate_agent</span>
                        <span>Agente Inmobiliario</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed-variant text-xs font-bold shrink-0">
                      {agente.requerimientos.length} req.
                    </span>
                  </div>

                  {/* Estadísticas de Campaña */}
                  <div className="grid grid-cols-3 gap-2 bg-surface-container-low/60 p-2.5 rounded-xl border border-surface-container-low text-center text-xs mb-3">
                    <div>
                      <span className="text-outline uppercase text-[10px] font-bold block">Activas</span>
                      <strong className="text-emerald-600 font-bold">{agente.campanasActivas}</strong>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px] font-bold block">Por Hacer</span>
                      <strong className="text-amber-600 font-bold">{agente.porHacer}</strong>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px] font-bold block">Finalizado</span>
                      <strong className="text-primary-container font-bold">{agente.finalizadas}</strong>
                    </div>
                  </div>

                  {/* Preview de requerimientos */}
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Propiedades asignadas:</span>
                    {agente.requerimientos.slice(0, 3).map((r) => (
                      <div key={r.id_requerimiento} className="text-xs text-on-surface-variant truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline/50 shrink-0"></span>
                        <span className="truncate">{r.nombre_propiedad}</span>
                      </div>
                    ))}
                    {agente.requerimientos.length > 3 && (
                      <span className="text-[11px] text-outline font-medium block italic">
                        +{agente.requerimientos.length - 3} propiedad(es) más...
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Botón Ingresar */}
                <div className="pt-3 border-t border-surface-container-low flex items-center justify-between text-xs font-semibold text-primary-container group-hover:underline">
                  <span>Ingresar a requerimientos</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}

            {agentesFiltrados.length === 0 && (
              <div className="col-span-3 text-center py-12 text-outline">
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
          <div className="bg-gradient-to-r from-primary-fixed/20 via-surface-container-lowest to-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${agenteActivo.colorGradiente} text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl shadow-md shrink-0`}>
                {agenteActivo.iniciales}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-primary-container uppercase tracking-wider">Agente Inmobiliario</span>
                  <span className="text-xs text-outline truncate">• ID: {agenteActivo.id}</span>
                </div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-on-surface truncate">{agenteActivo.nombre}</h2>
                <p className="text-xs text-on-surface-variant truncate">
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
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  {agenteActivo.finalizadas} Finalizado
                </span>
              )}
            </div>
          </div>

          {/* Grid de Requerimientos de este Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {requerimientosAMostrar.map((item) => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-outline bg-surface-container-lowest rounded-2xl border border-surface-container">
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
            <h2 className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              Todas las Propiedades ({requerimientosAMostrar.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requerimientosAMostrar.map((item) => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-3 text-center py-12 text-outline bg-surface-container-lowest rounded-2xl border border-surface-container">
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
        className="bg-surface-container-lowest border border-surface-container rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer hover:border-primary-container/50"
        onClick={() => alSeleccionarPropiedad(item)}
      >
        <div>
          <div className="p-5 border-b border-surface-container-low flex justify-between items-start gap-2 bg-gradient-to-r from-primary-fixed/20 to-transparent">
            <div>
              <h3 className="font-display font-semibold text-base text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                <span>{item.nombre_propiedad}</span>
                <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity text-primary-container">
                  open_in_new
                </span>
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Agente: <strong>{agente}</strong> • {item.periodo_mensual}
              </p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
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
            <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low/60 p-3 rounded-xl border border-surface-container-low">
              <div>
                <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Plataforma</span>
                <strong className="text-on-surface">{cm.plataforma || 'Facebook / IG'}</strong>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Presupuesto</span>
                <strong className="text-primary-container">{cm.presupuesto || 'Sin definir'}</strong>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant line-clamp-2">
              {item.descripcion_propiedad || 'Sin descripción detallada.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low/40 border-t border-surface-container-low flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary-container group-hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">upload_file</span>
            Ver detalle y cargar CSV
          </span>
          <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </div>
      </div>
    );
  }
}