// src/features/cm/presentation/components/ModalDetallePropiedadCM.jsx
import { useState, useEffect } from 'react';
import { procesarCsvMeta } from '../../utils/parseMetaCsv';

// Normaliza un anuncio para asegurar propiedades activo, nombre y entrega del anuncio
const normalizarAnuncio = (a) => {
  const nombreRaw = a.nombre_anuncio || '';
  const matchPrefijo = nombreRaw.match(/^\[([^\]]+)\]\s*(.*)$/);
  
  let esInactivo = a.activo === false;
  let estado_texto = a.estado_texto || '';
  let nombreLimpio = nombreRaw.trim();

  if (matchPrefijo) {
    const etiqueta = matchPrefijo[1];
    nombreLimpio = matchPrefijo[2].trim();
    esInactivo = true;
    if (!estado_texto) estado_texto = etiqueta;
  }

  if (!estado_texto) {
    estado_texto = esInactivo ? 'Desactivado' : 'En circulación';
  }

  return {
    ...a,
    nombre_anuncio: nombreLimpio || 'Sin nombre',
    activo: !esInactivo,
    estado_texto
  };
};

export default function ModalDetallePropiedadCM({ item, reporte = null, anuncios = [], abierto, alCerrar, alGuardarTodo }) {
  const [totales, setTotales] = useState({
    leads: 0,
    costo_por_lead: 0,
    inversion: 0,
    alcance: 0,
    ctr_clics: 0
  });
  const [listaAnuncios, setListaAnuncios] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos' | 'inactivos' | 'todos'
  const [estadoCm, setEstadoCm] = useState('Por Hacer');
  const [plataforma, setPlataforma] = useState('Facebook / Instagram');
  const [presupuesto, setPresupuesto] = useState('');
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('');

  // Sincronizar estado cuando cambia la propiedad o llega el reporte del servidor
  useEffect(() => {
    if (!item) return;

    // Reporte padre (puede venir en prop 'reporte' o en 'item.reportes_meta_cm')
    const rep = reporte || (Array.isArray(item.reportes_meta_cm) ? item.reportes_meta_cm[0] : item.reportes_meta_cm);

    // Lista de anuncios asociados al reporte normalizados
    const listaRaw = rep?.reportes_meta_anuncios || (Array.isArray(anuncios) && anuncios.length > 0 ? anuncios : []);
    const lista = listaRaw.map(normalizarAnuncio);
    setListaAnuncios(lista);

    // Totales: si existen en el reporte de BD se muestran; si no, calculados de los activos
    if (rep && (rep.leads != null || rep.inversion != null)) {
      setTotales({
        leads: rep.leads ?? 0,
        costo_por_lead: rep.costo_por_lead ?? 0,
        inversion: rep.inversion ?? 0,
        alcance: rep.alcance ?? 0,
        ctr_clics: rep.ctr_clics ?? 0
      });
    } else if (lista.length > 0) {
      const activos = lista.filter(a => a.activo);
      const base = activos.length > 0 ? activos : lista;
      const leads = base.reduce((s, a) => s + (a.leads || 0), 0);
      const inversion = parseFloat(base.reduce((s, a) => s + (a.inversion || 0), 0).toFixed(2));
      const alcance = base.reduce((s, a) => s + (a.alcance || 0), 0);
      const costo_por_lead = parseFloat((base.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / base.length).toFixed(2));
      const ctr_clics = parseFloat((base.reduce((s, a) => s + (a.ctr_clics || 0), 0) / base.length).toFixed(2));
      setTotales({ leads, costo_por_lead, inversion, alcance, ctr_clics });
    } else {
      setTotales({ leads: 0, costo_por_lead: 0, inversion: 0, alcance: 0, ctr_clics: 0 });
    }

    // Cargar datos de la tarea operativa de Brenda
    const tcm = item.tareas_cm?.[0] || {};
    setEstadoCm(tcm.estado || 'Por Hacer');
    setPlataforma(tcm.plataforma || 'Facebook / Instagram');
    setPresupuesto(tcm.presupuesto || '');
    setNombreArchivo('');
    setFiltroEstado('activos');
  }, [item, reporte, anuncios]);

  // Manejador del archivo CSV con filtrado de activos/inactivos
  const manejarSubidaCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo .csv');
      return;
    }

    setNombreArchivo(file.name);
    setCargandoArchivo(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const texto = event.target?.result;
        const resultado = procesarCsvMeta(texto).map(normalizarAnuncio);
        setListaAnuncios(resultado);

        // Separar activos para el cálculo de totales principales
        const activos = resultado.filter(a => a.activo);
        const inactivos = resultado.filter(a => !a.activo);
        const base = activos.length > 0 ? activos : resultado;

        if (base.length > 0) {
          const leads = base.reduce((s, a) => s + (a.leads || 0), 0);
          const inversion = parseFloat(base.reduce((s, a) => s + (a.inversion || 0), 0).toFixed(2));
          const alcance = base.reduce((s, a) => s + (a.alcance || 0), 0);
          const costo_por_lead = parseFloat((base.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / base.length).toFixed(2));
          const ctr_clics = parseFloat((base.reduce((s, a) => s + (a.ctr_clics || 0), 0) / base.length).toFixed(2));
          setTotales({ leads, costo_por_lead, inversion, alcance, ctr_clics });
        }

        // Si hay anuncios activos mostrar la pestaña de activos; si no, mostrar todos
        setFiltroEstado(activos.length > 0 ? 'activos' : 'todos');
      } catch (err) {
        alert('Error al leer el archivo CSV: ' + err.message);
      } finally {
        setCargandoArchivo(false);
      }
    };
    reader.readAsText(file);
  };

  const manejarGuardar = async () => {
    setGuardando(true);
    try {
      await alGuardarTodo({
        id_requerimiento: item.id_requerimiento,
        id_tarea_cm: item.tareas_cm?.[0]?.id_tarea,
        id_agente: item.id_agente,
        periodo_mensual: item.periodo_mensual,
        estado: estadoCm,
        plataforma,
        presupuesto,
        metricas: {
          leads: parseInt(totales.leads, 10) || 0,
          costo_por_lead: parseFloat(totales.costo_por_lead) || 0,
          inversion: parseFloat(totales.inversion) || 0,
          alcance: parseInt(totales.alcance, 10) || 0,
          ctr_clics: parseFloat(totales.ctr_clics) || 0
        },
        anuncios: listaAnuncios  // array completo con propiedad 'activo'
      });
      alCerrar();
    } catch (err) {
      alert('Error al sincronizar datos: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !item) return null;

  // Filtrado de anuncios para la vista
  const anunciosActivos = listaAnuncios.filter(a => a.activo);
  const anunciosInactivos = listaAnuncios.filter(a => !a.activo);

  const anunciosAMostrar = filtroEstado === 'activos'
    ? anunciosActivos
    : filtroEstado === 'inactivos'
    ? anunciosInactivos
    : listaAnuncios;

  // Subtotales dinámicos de la vista actual
  const subtotalesVista = {
    leads: anunciosAMostrar.reduce((s, a) => s + (a.leads || 0), 0),
    costo_por_lead: anunciosAMostrar.length > 0
      ? parseFloat((anunciosAMostrar.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / anunciosAMostrar.length).toFixed(2))
      : 0,
    inversion: parseFloat(anunciosAMostrar.reduce((s, a) => s + (a.inversion || 0), 0).toFixed(2)),
    alcance: anunciosAMostrar.reduce((s, a) => s + (a.alcance || 0), 0),
    ctr_clics: anunciosAMostrar.length > 0
      ? parseFloat((anunciosAMostrar.reduce((s, a) => s + (a.ctr_clics || 0), 0) / anunciosAMostrar.length).toFixed(2))
      : 0
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-4xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-surface-container overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-3.5 sm:p-6 bg-gradient-to-r from-primary-fixed/30 to-surface-container-lowest border-b border-surface-container flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-wider shrink-0">
                Detalle Requerimiento
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-outline truncate">• {item.periodo_mensual}</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-xl text-on-surface mt-1 truncate">{item.nombre_propiedad}</h2>
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate mt-0.5">
              Agente: <strong>{item.usuarios?.nombre || 'General'}</strong> | Tipo: <strong>{item.tipo} - {item.categoria}</strong>
            </p>
          </div>
          <button 
            onClick={alCerrar} 
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          
          {/* Ficha técnica */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-surface-container-low/60 p-3 sm:p-4 rounded-xl text-xs">
            <div>
              <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Precio</span>
              <strong className="text-on-surface truncate block">{item.precio || 'Sin precio'}</strong>
            </div>
            <div>
              <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Ubicación</span>
              <strong className="text-on-surface truncate block">{item.ubicacion || 'Sin especificar'}</strong>
            </div>
            <div>
              <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Superficie</span>
              <strong className="text-on-surface truncate block">{item.superficie || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-outline uppercase text-[10px] font-bold block mb-0.5">Habitaciones</span>
              <strong className="text-on-surface truncate block">{item.habitaciones ?? 'N/A'}</strong>
            </div>
          </div>

          {/* Subida CSV */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-dashed border-primary-container/40 bg-primary-fixed/10 flex flex-col items-center justify-center text-center relative hover:bg-primary-fixed/20 transition-colors">
            <input 
              type="file" 
              accept=".csv" 
              onChange={manejarSubidaCsv} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-2 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <p className="font-display font-semibold text-sm text-on-surface">
              {cargandoArchivo ? 'Analizando archivo...' : 'Sube el .CSV de Meta Ads'}
            </p>
            <p className="text-[11px] text-outline mt-0.5">
              Filtra y clasifica anuncios en circulación vs. pausados o inactivos.
            </p>
            {nombreArchivo && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold max-w-full truncate">
                <span className="material-symbols-outlined text-[14px]">check</span> <span className="truncate">{nombreArchivo}</span>
              </span>
            )}
          </div>

          {/* Métricas consolidadas (Campaña Activa) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
              <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
                Métricas Consolidadas (Reporte 28)
              </h3>
              {anunciosInactivos.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {anunciosActivos.length} activos / {anunciosInactivos.length} inactivos separados
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">Leads (Lids)</label>
                <input 
                  type="number" 
                  value={totales.leads} 
                  onChange={(e) => setTotales({ ...totales, leads: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">Cost. por Lids ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totales.costo_por_lead} 
                  onChange={(e) => setTotales({ ...totales, costo_por_lead: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">Inversión ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totales.inversion} 
                  onChange={(e) => setTotales({ ...totales, inversion: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">Alcance</label>
                <input 
                  type="number" 
                  value={totales.alcance} 
                  onChange={(e) => setTotales({ ...totales, alcance: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">CTR - Clic (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totales.ctr_clics} 
                  onChange={(e) => setTotales({ ...totales, ctr_clics: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Anuncios con Filtrado Activos / Inactivos */}
          {listaAnuncios.length > 0 && (
            <div>
              {/* Barra de pestañas y filtros */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">table_chart</span>
                  Anuncios Detectados ({listaAnuncios.length})
                </h3>

                {/* Filtros Activos / Inactivos / Todos */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-container text-xs w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('activos')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroEstado === 'activos'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    <span>Activos ({anunciosActivos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('inactivos')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroEstado === 'inactivos'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                    <span>Inactivos ({anunciosInactivos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('todos')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-semibold transition-all text-center ${
                      filtroEstado === 'todos'
                        ? 'bg-surface-container-highest text-on-surface shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    Todos ({listaAnuncios.length})
                  </button>
                </div>
              </div>

              {/* Mensaje de aviso informativo */}
              {filtroEstado === 'activos' && anunciosInactivos.length > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 shrink-0">info</span>
                    <span>Se filtraron <strong>{anunciosInactivos.length} anuncio(s) pausados/inactivos</strong> de las métricas de circulación.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFiltroEstado('inactivos')}
                    className="underline font-bold text-[11px] self-start sm:self-auto shrink-0 hover:opacity-80"
                  >
                    Ver inactivos
                  </button>
                </div>
              )}

              {filtroEstado === 'inactivos' && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-outline shrink-0">pause_circle</span>
                    <span>Mostrando <strong>{anunciosInactivos.length} anuncio(s) pausados o desactivados</strong> en Meta Ads.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFiltroEstado('activos')}
                    className="underline font-bold text-[11px] self-start sm:self-auto shrink-0 hover:text-on-surface"
                  >
                    Volver a activos
                  </button>
                </div>
              )}

              {/* Tabla */}
              <div className="overflow-x-auto rounded-xl border border-surface-container">
                <table className="w-full text-xs min-w-[560px]">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="text-left px-3 py-2 text-outline font-semibold">Entrega del anuncio</th>
                      <th className="text-left px-3 py-2 text-outline font-semibold">Anuncio</th>
                      <th className="text-right px-3 py-2 text-outline font-semibold">Leads</th>
                      <th className="text-right px-3 py-2 text-outline font-semibold">Costo/Lead</th>
                      <th className="text-right px-3 py-2 text-outline font-semibold">Inversión</th>
                      <th className="text-right px-3 py-2 text-outline font-semibold">Alcance</th>
                      <th className="text-right px-3 py-2 text-outline font-semibold">CTR%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anunciosAMostrar.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-outline italic">
                          No hay anuncios en esta sección ({filtroEstado}).
                        </td>
                      </tr>
                    ) : (
                      anunciosAMostrar.map((a, i) => (
                        <tr 
                          key={i} 
                          className={`border-t border-surface-container hover:bg-surface-container-low/40 transition-colors ${
                            !a.activo ? 'opacity-80 bg-surface-container-low/20' : ''
                          }`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            {a.activo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {a.estado_texto || 'Pausado'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-on-surface font-medium max-w-[200px] truncate" title={a.nombre_anuncio}>
                            {a.nombre_anuncio}
                          </td>
                          <td className="px-3 py-2 text-right text-primary-container font-bold">{a.leads}</td>
                          <td className="px-3 py-2 text-right text-on-surface">${a.costo_por_lead}</td>
                          <td className="px-3 py-2 text-right text-on-surface">${a.inversion}</td>
                          <td className="px-3 py-2 text-right text-on-surface">{a.alcance?.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-on-surface">{a.ctr_clics}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {anunciosAMostrar.length > 0 && (
                    <tfoot className="bg-surface-container-low/60 font-bold border-t-2 border-surface-container">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-outline uppercase text-[10px] tracking-wider">
                          Subtotales ({anunciosAMostrar.length} {filtroEstado})
                        </td>
                        <td className="px-3 py-2 text-right text-primary-container">{subtotalesVista.leads}</td>
                        <td className="px-3 py-2 text-right text-on-surface">${subtotalesVista.costo_por_lead}</td>
                        <td className="px-3 py-2 text-right text-on-surface">${subtotalesVista.inversion}</td>
                        <td className="px-3 py-2 text-right text-on-surface">{subtotalesVista.alcance?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-on-surface">{subtotalesVista.ctr_clics}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Estado de Campaña */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-container">
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1">Estado de Campaña</label>
              <select
                value={estadoCm}
                onChange={(e) => setEstadoCm(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer font-medium"
              >
                <option value="Por Hacer">Por Hacer</option>
                <option value="Configurando">Configurando Anuncio</option>
                <option value="Campaña Activa">🔥 Campaña Activa</option>
                <option value="Finalizado">✅ Finalizado (Reporte Listo)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1">Plataforma</label>
              <input 
                type="text" 
                value={plataforma} 
                onChange={(e) => setPlataforma(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1">Presupuesto Asignado</label>
              <input 
                type="text" 
                value={presupuesto} 
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="Ej: $150 USD"
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-surface-container-low flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-surface-container">
          <button 
            type="button" 
            onClick={alCerrar}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors text-center"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            disabled={guardando}
            onClick={manejarGuardar}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{guardando ? 'Guardando en Supabase...' : 'Guardar Todo el Reporte'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}