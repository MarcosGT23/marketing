import React, { useState, useMemo } from 'react';
import ModalEditarRequerimiento from './ModalEditarRequerimiento';

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

export default function TodosRequerimientosUI({
  requerimientos = [],
  cargando,
  agentes = [],
  alActualizar
}) {
  const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState(null);
  const [vistaModo, setVistaModo] = useState('agentes'); // 'agentes' | 'todos'
  const [busqueda, setBusqueda] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [requerimientoAEditar, setRequerimientoAEditar] = useState(null);
  const [expandidos, setExpandidos] = useState({});

  const toggleExpandir = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Agrupar requerimientos por agente
  const listaAgentesAgrupados = useMemo(() => {
    const mapa = {};

    requerimientos.forEach((item) => {
      const id = String(item.usuarios?.id_usuario || item.id_agente || 'sin-asignar');
      const nombre = item.usuarios?.nombre || (item.id_agente ? `Agente #${item.id_agente}` : 'General / Sin Agente');

      if (!mapa[id]) {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        mapa[id] = {
          id,
          nombre,
          iniciales: obtenerIniciales(nombre),
          colorGradiente: COLORES_AVATAR[hash % COLORES_AVATAR.length],
          requerimientos: [],
          conDiseno: 0,
          conVideo: 0,
          conPauta: 0,
          altaPrioridad: 0
        };
      }

      mapa[id].requerimientos.push(item);
      if (item.req_arte_estatico || item.req_carrusel || item.tareas_diseno) mapa[id].conDiseno++;
      if (item.req_reel || item.tareas_video) mapa[id].conVideo++;
      if (item.tareas_cm?.plataforma || item.tareas_cm?.presupuesto) mapa[id].conPauta++;
      if (item.prioridad === 'Alta') mapa[id].altaPrioridad++;
    });

    return Object.values(mapa).sort((a, b) => b.requerimientos.length - a.requerimientos.length);
  }, [requerimientos]);

  // Agentes filtrados por la búsqueda
  const agentesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return listaAgentesAgrupados;
    const term = busqueda.toLowerCase();
    return listaAgentesAgrupados.filter(ag => 
      ag.nombre.toLowerCase().includes(term) ||
      ag.requerimientos.some(r => 
        (r.nombre_propiedad && r.nombre_propiedad.toLowerCase().includes(term)) ||
        (r.ubicacion && r.ubicacion.toLowerCase().includes(term))
      )
    );
  }, [listaAgentesAgrupados, busqueda]);

  // Agente actualmente activo en vista detallada
  const agenteActivo = useMemo(() => {
    if (!agenteSeleccionadoId) return null;
    return listaAgentesAgrupados.find(a => String(a.id) === String(agenteSeleccionadoId)) || null;
  }, [agenteSeleccionadoId, listaAgentesAgrupados]);

  // Requerimientos filtrados generales o del agente activo
  const requerimientosAMostrar = useMemo(() => {
    let base = agenteActivo ? agenteActivo.requerimientos : requerimientos;

    return base.filter((item) => {
      const matchBusqueda = !busqueda.trim() ||
        (item.nombre_propiedad && item.nombre_propiedad.toLowerCase().includes(busqueda.toLowerCase())) ||
        (item.ubicacion && item.ubicacion.toLowerCase().includes(busqueda.toLowerCase())) ||
        (item.usuarios?.nombre && item.usuarios.nombre.toLowerCase().includes(busqueda.toLowerCase()));

      const matchPeriodo = !periodoFiltro || item.periodo_mensual === periodoFiltro;
      const matchCategoria = !categoriaFiltro || item.categoria === categoriaFiltro;

      return matchBusqueda && matchPeriodo && matchCategoria;
    });
  }, [agenteActivo, requerimientos, busqueda, periodoFiltro, categoriaFiltro]);

  // Periodos únicos disponibles
  const periodosDisponibles = useMemo(() => {
    const setP = new Set(requerimientos.map(r => r.periodo_mensual).filter(Boolean));
    return Array.from(setP);
  }, [requerimientos]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin border-primary-container" />
        <p className="text-sm text-outline">Cargando requerimientos y agentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div 
        className="rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-surface-container-lowest), var(--color-surface-container-low))',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed text-on-primary-fixed-variant">
              Gestión por Agentes
            </span>
            <span className="text-xs text-outline">• {listaAgentesAgrupados.length} agentes • {requerimientos.length} requerimientos totales</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface">
            Requerimientos Inmobiliarios
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Explora las carpetas por agente para ver y editar en detalle cada uno de sus requerimientos de diseño, video y pauta digital.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <a
            href="/agente/nuevo"
            className="px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-primary-container text-white shadow-md hover:bg-primary transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nuevo Requerimiento</span>
          </a>
        </div>
      </div>

      {/* Barra de Filtros y Selector de Modo de Vista */}
      <div 
        className="p-4 sm:p-5 rounded-2xl space-y-3.5"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Selector de Modo (Por Agentes / Todos los Requerimientos) */}
          <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-surface-container w-fit">
            <button
              type="button"
              onClick={() => {
                setVistaModo('agentes');
                setAgenteSeleccionadoId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vistaModo === 'agentes' && !agenteActivo
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Por Agentes ({listaAgentesAgrupados.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVistaModo('todos');
                setAgenteSeleccionadoId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vistaModo === 'todos'
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>Ver Todos ({requerimientos.length})</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar agente, propiedad..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-container"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            />
          </div>
        </div>

        {/* Filtros secundarios de Periodo y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-surface-container/60">
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          >
            <option value="">Todos los Periodos</option>
            {periodosDisponibles.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          >
            <option value="">Todas las Categorías</option>
            <option value="Departamento">Departamento</option>
            <option value="Casa">Casa</option>
            <option value="Terreno">Terreno</option>
            <option value="Oficina">Oficina</option>
            <option value="Local Comercial">Local Comercial</option>
            <option value="Diseño Interno">Diseño Interno</option>
          </select>

          {(busqueda || periodoFiltro || categoriaFiltro) && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setPeriodoFiltro('');
                setCategoriaFiltro('');
              }}
              className="text-primary-container font-semibold hover:underline text-xs flex items-center gap-1 self-center"
            >
              <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ── VISTA 1: DIRECTORIO DE AGENTES ── */}
      {vistaModo === 'agentes' && !agenteActivo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-outline">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              Directorio de Agentes Inmobiliarios ({agentesFiltrados.length})
            </h2>
            <span className="text-xs text-outline">
              Haz clic en una tarjeta para ver sus requerimientos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agentesFiltrados.map((agente) => (
              <div
                key={agente.id}
                onClick={() => setAgenteSeleccionadoId(agente.id)}
                className="rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  {/* Encabezado del Agente */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agente.colorGradiente} text-white flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0`}>
                      {agente.iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-base text-on-surface truncate group-hover:text-primary-container transition-colors">
                        {agente.nombre}
                      </h3>
                      <p className="text-xs text-outline mt-0.5">
                        Agente Inmobiliario REMAX
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed text-on-primary-fixed-variant shrink-0">
                      {agente.requerimientos.length} req.
                    </span>
                  </div>

                  {/* Resumen de entregables de este agente */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center text-xs mb-3 bg-surface-container-low border border-surface-container">
                    <div>
                      <span className="uppercase text-[9px] font-bold text-outline block">Diseño</span>
                      <strong className="text-secondary font-bold">{agente.conDiseno}</strong>
                    </div>
                    <div>
                      <span className="uppercase text-[9px] font-bold text-outline block">Video</span>
                      <strong className="text-tertiary font-bold">{agente.conVideo}</strong>
                    </div>
                    <div>
                      <span className="uppercase text-[9px] font-bold text-outline block">Pauta CM</span>
                      <strong className="text-primary-container font-bold">{agente.conPauta}</strong>
                    </div>
                  </div>

                  {/* Vista previa de propiedades */}
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                      Propiedades asignadas:
                    </span>
                    {agente.requerimientos.slice(0, 3).map((r) => (
                      <div key={r.id_requerimiento} className="text-xs text-on-surface-variant truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0"></span>
                        <span className="truncate">{r.nombre_propiedad}</span>
                      </div>
                    ))}
                    {agente.requerimientos.length > 3 && (
                      <span className="text-[11px] font-medium text-outline block italic">
                        +{agente.requerimientos.length - 3} propiedad(es) más...
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer de la tarjeta de agente */}
                <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold text-primary-container group-hover:underline">
                  <span>Ver {agente.requerimientos.length} requerimientos</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}

            {agentesFiltrados.length === 0 && (
              <div className="col-span-full text-center py-16 rounded-2xl bg-surface-container-lowest border border-surface-container text-outline">
                <span className="material-symbols-outlined text-4xl block mb-2">person_search</span>
                <p>No se encontraron agentes con ese criterio de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA 2: REQUERIMIENTOS DEL AGENTE SELECCIONADO ── */}
      {vistaModo === 'agentes' && agenteActivo && (
        <div className="space-y-5 animate-fadeIn">
          {/* Barra superior para volver al directorio */}
          <button
            type="button"
            onClick={() => setAgenteSeleccionadoId(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-container bg-surface-container-low hover:bg-surface-container transition-colors w-fit cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            <span>Volver al Directorio de Agentes</span>
          </button>

          {/* Perfil del Agente Activo */}
          <div 
            className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(to right, rgba(37,99,235,0.06), var(--color-surface-container-lowest))',
              border: '1px solid var(--color-outline-variant)'
            }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agenteActivo.colorGradiente} text-white flex items-center justify-center font-display font-bold text-xl shadow-md shrink-0`}>
                {agenteActivo.iniciales}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Agente Inmobiliario
                  </span>
                  <span className="text-xs text-outline">• ID: {agenteActivo.id}</span>
                </div>
                <h2 className="font-display font-bold text-xl text-on-surface">
                  {agenteActivo.nombre}
                </h2>
                <p className="text-xs text-outline">
                  {agenteActivo.requerimientos.length} requerimientos registrados
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300">
                {agenteActivo.conDiseno} con Diseño
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed-variant">
                {agenteActivo.conVideo} con Video
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary-container text-on-secondary-container">
                {agenteActivo.conPauta} con Pauta
              </span>
            </div>
          </div>

          {/* Grid de Tarjetas de Requerimientos de este Agente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {requerimientosAMostrar.map(item => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-2xl bg-surface-container-lowest border border-surface-container text-outline">
                <span className="material-symbols-outlined text-4xl block mb-2">inbox</span>
                <p>No se encontraron requerimientos para este agente con los filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA 3: LISTADO GENERAL (TODOS) ── */}
      {vistaModo === 'todos' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-outline">
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              Todos los Requerimientos ({requerimientosAMostrar.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {requerimientosAMostrar.map(item => renderTarjetaRequerimiento(item))}

            {requerimientosAMostrar.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-2xl bg-surface-container-lowest border border-surface-container text-outline">
                <span className="material-symbols-outlined text-4xl block mb-2">content_paste_off</span>
                <p>No se encontraron requerimientos con los filtros seleccionados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Modificar Requerimiento Completo */}
      <ModalEditarRequerimiento
        abierto={Boolean(requerimientoAEditar)}
        requerimiento={requerimientoAEditar}
        alCerrar={() => setRequerimientoAEditar(null)}
        alGuardarExitoso={() => {
          setRequerimientoAEditar(null);
          if (alActualizar) alActualizar();
        }}
        agentes={agentes}
      />
    </div>
  );

  // Helper para renderizar cada tarjeta de requerimiento
  function renderTarjetaRequerimiento(item) {
    const agente = item.usuarios?.nombre || (item.id_agente ? `Agente #${item.id_agente}` : 'General');
    const diseno = (Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno) || {};
    const video = (Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video) || {};
    const cm = (Array.isArray(item.tareas_cm) ? item.tareas_cm[0] : item.tareas_cm) || {};
    const estaExpandido = Boolean(expandidos[item.id_requerimiento]);

    return (
      <div
        key={item.id_requerimiento}
        className="rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)'
        }}
      >
        <div>
          {/* Header Tarjeta */}
          <div 
            className="p-5 flex items-start justify-between gap-3 border-b"
            style={{
              background: 'linear-gradient(to right, rgba(37,99,235,0.05), transparent)',
              borderColor: 'var(--color-outline-variant)'
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base text-on-surface truncate">
                  {item.nombre_propiedad}
                </h3>
                {item.prioridad === 'Alta' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error border border-error/30">
                    Urgente
                  </span>
                )}
                {item.prioridad === 'Media' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Media
                  </span>
                )}
              </div>
              <p className="text-xs text-outline mt-1 truncate">
                Agente: <strong className="text-on-surface">{agente}</strong> • {item.periodo_mensual}
              </p>
            </div>

            {/* Botón Editar Requerimiento Completo */}
            <button
              type="button"
              onClick={() => setRequerimientoAEditar(item)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-container hover:text-white transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
              title="Editar todos los campos del requerimiento"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Editar Completo</span>
            </button>
          </div>

          {/* Tags de Entregables */}
          <div className="px-5 py-2.5 border-b flex items-center gap-1.5 flex-wrap bg-surface-container-low/50" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <span className="text-[10px] uppercase font-bold text-outline mr-1">Entregables:</span>
            {item.req_arte_estatico && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[12px] text-sky-700">image</span>
                Arte Estático
              </span>
            )}
            {item.req_carrusel && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[12px] text-purple-700">view_carousel</span>
                Carrusel
              </span>
            )}
            {item.req_reel && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[12px] text-indigo-700">movie</span>
                Reel
              </span>
            )}
            {cm.plataforma && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[12px] text-emerald-700">campaign</span>
                Pauta ({cm.plataforma.split('/')[0].trim()})
              </span>
            )}
          </div>

          {/* Especificaciones de Propiedad */}
          <div className="p-5 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Categoría</span>
                <strong className="text-on-surface truncate block">{item.categoria || 'Propiedad'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Operación</span>
                <strong className="text-primary-container truncate block">{item.tipo || 'Venta'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Habitaciones</span>
                <strong className="text-on-surface block">{item.habitaciones ? `${item.habitaciones} hab.` : '—'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">Superficie</span>
                <strong className="text-on-surface block">{item.superficie || '—'}</strong>
              </div>
            </div>

            {item.ubicacion && (
              <p className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                <span>{item.ubicacion}</span>
              </p>
            )}

            {/* Estados en cada panel */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container text-center">
                <span className="text-[10px] text-outline block font-semibold">Diseño</span>
                <span className="text-[11px] font-bold text-on-surface mt-0.5 block truncate">
                  {diseno.estado || 'No asignado'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container text-center">
                <span className="text-[10px] text-outline block font-semibold">Video</span>
                <span className="text-[11px] font-bold text-on-surface mt-0.5 block truncate">
                  {video.estado || 'No asignado'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container text-center">
                <span className="text-[10px] text-outline block font-semibold">Pauta Ads</span>
                <span className="text-[11px] font-bold text-on-surface mt-0.5 block truncate">
                  {cm.estado || 'No asignado'}
                </span>
              </div>
            </div>

            {/* Descripción expandible */}
            {item.descripcion_propiedad && (
              <div className="pt-2 border-t border-surface-container space-y-1">
                <p className={`text-on-surface-variant ${estaExpandido ? '' : 'line-clamp-2'}`}>
                  <span className="font-bold text-outline">Descripción: </span>
                  {item.descripcion_propiedad}
                </p>
                {item.descripcion_propiedad.length > 80 && (
                  <button
                    type="button"
                    onClick={() => toggleExpandir(item.id_requerimiento)}
                    className="text-[11px] font-semibold text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{estaExpandido ? 'Ver menos' : 'Ver más detalles'}</span>
                    <span className="material-symbols-outlined text-[15px]">
                      {estaExpandido ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Detalles completos al expandir */}
            {estaExpandido && (
              <div className="pt-2 border-t border-surface-container space-y-2 text-xs animate-fadeIn bg-surface-container-low/40 p-3 rounded-xl">
                {item.elemento_destacar && (
                  <p><strong className="text-primary-container">Hook / Gancho:</strong> {item.elemento_destacar}</p>
                )}
                {item.publico_objetivo && (
                  <p><strong className="text-tertiary">Público Objetivo:</strong> {item.publico_objetivo}</p>
                )}
                {cm.periodo_pauta && (
                  <p><strong className="text-secondary">Duración Pauta:</strong> {cm.periodo_pauta}</p>
                )}
                {cm.descripcion_pauta && (
                  <p><strong className="text-secondary">Objetivos de Pauta:</strong> {cm.descripcion_pauta}</p>
                )}
                {item.notas_produccion && (
                  <p><strong className="text-outline">Notas Producción:</strong> {item.notas_produccion}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón inferior para acción rápida */}
        <div 
          className="p-3 sm:px-5 flex items-center justify-between border-t bg-surface-container-low"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <span className="text-[11px] text-outline">
            Creado: {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'Reciente'}
          </span>
          <button
            type="button"
            onClick={() => setRequerimientoAEditar(item)}
            className="text-xs font-semibold text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            <span>Modificar este requerimiento</span>
          </button>
        </div>
      </div>
    );
  }
}
