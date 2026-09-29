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
    leads: Math.round(Number(a.leads) || 0),
    costo_por_lead: Math.round(Number(a.costo_por_lead) || 0),
    inversion: Math.round(Number(a.inversion) || 0),
    alcance: Math.round(Number(a.alcance) || 0),
    ctr_clics: Math.round(Number(a.ctr_clics) || 0),
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
        leads: Math.round(Number(rep.leads) || 0),
        costo_por_lead: Math.round(Number(rep.costo_por_lead) || 0),
        inversion: Math.round(Number(rep.inversion) || 0),
        alcance: Math.round(Number(rep.alcance) || 0),
        ctr_clics: Math.round(Number(rep.ctr_clics) || 0)
      });
    } else if (lista.length > 0) {
      const activos = lista.filter(a => a.activo);
      const base = activos.length > 0 ? activos : lista;
      const leads = Math.round(base.reduce((s, a) => s + (a.leads || 0), 0));
      const inversion = Math.round(base.reduce((s, a) => s + (a.inversion || 0), 0));
      const alcance = Math.round(base.reduce((s, a) => s + (a.alcance || 0), 0));
      const costo_por_lead = Math.round(base.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / base.length);
      const ctr_clics = Math.round(base.reduce((s, a) => s + (a.ctr_clics || 0), 0) / base.length);
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
    const hayActivos = lista.some(a => a.activo);
    const hayInactivos = lista.some(a => !a.activo);
    setFiltroEstado(hayActivos ? 'activos' : (hayInactivos ? 'inactivos' : 'todos'));
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
          const leads = Math.round(base.reduce((s, a) => s + (a.leads || 0), 0));
          const inversion = Math.round(base.reduce((s, a) => s + (a.inversion || 0), 0));
          const alcance = Math.round(base.reduce((s, a) => s + (a.alcance || 0), 0));
          const costo_por_lead = Math.round(base.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / base.length);
          const ctr_clics = Math.round(base.reduce((s, a) => s + (a.ctr_clics || 0), 0) / base.length);
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
          leads: Math.round(Number(totales.leads) || 0),
          costo_por_lead: Math.round(Number(totales.costo_por_lead) || 0),
          inversion: Math.round(Number(totales.inversion) || 0),
          alcance: Math.round(Number(totales.alcance) || 0),
          ctr_clics: Math.round(Number(totales.ctr_clics) || 0)
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
    leads: Math.round(anunciosAMostrar.reduce((s, a) => s + (a.leads || 0), 0)),
    costo_por_lead: anunciosAMostrar.length > 0
      ? Math.round(anunciosAMostrar.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / anunciosAMostrar.length)
      : 0,
    inversion: Math.round(anunciosAMostrar.reduce((s, a) => s + (a.inversion || 0), 0)),
    alcance: Math.round(anunciosAMostrar.reduce((s, a) => s + (a.alcance || 0), 0)),
    ctr_clics: anunciosAMostrar.length > 0
      ? Math.round(anunciosAMostrar.reduce((s, a) => s + (a.ctr_clics || 0), 0) / anunciosAMostrar.length)
      : 0
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-4xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)'
        }}>
        
        {/* Cabecera */}
        <div className="p-4 sm:p-6 border-b flex items-start justify-between gap-2 sm:gap-3"
          style={{
            background: 'linear-gradient(to right, rgba(219, 225, 255, 0.35), var(--color-surface-container-lowest))',
            borderColor: 'var(--color-outline-variant)'
          }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ background: 'var(--color-primary-container)', color: 'white' }}>
                Detalle Requerimiento
              </span>
              <span className="text-[11px] sm:text-xs font-semibold truncate" style={{ color: 'var(--color-outline)' }}>• {item.periodo_mensual}</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-xl mt-1.5 truncate" style={{ color: 'var(--color-on-surface)' }}>{item.nombre_propiedad}</h2>
            <p className="text-[11px] sm:text-xs truncate mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              Agente: <strong>{item.usuarios?.nombre || 'General'}</strong> | Tipo: <strong>{item.tipo} - {item.categoria}</strong>
            </p>
          </div>
          <button 
            onClick={alCerrar} 
            className="p-1.5 rounded-xl transition-colors shrink-0 hover:bg-black/5"
            style={{ color: 'var(--color-outline)' }}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Ficha técnica */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 rounded-xl text-xs"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)'
            }}>
            <div>
              <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Precio</span>
              <strong className="truncate block" style={{ color: 'var(--color-on-surface)' }}>{item.precio || 'Sin precio'}</strong>
            </div>
            <div>
              <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Ubicación</span>
              <strong className="truncate block" style={{ color: 'var(--color-on-surface)' }}>{item.ubicacion || 'Sin especificar'}</strong>
            </div>
            <div>
              <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Superficie</span>
              <strong className="truncate block" style={{ color: 'var(--color-on-surface)' }}>{item.superficie || 'N/A'}</strong>
            </div>
            <div>
              <span className="uppercase text-[10px] font-bold block mb-0.5" style={{ color: 'var(--color-outline)' }}>Habitaciones</span>
              <strong className="truncate block" style={{ color: 'var(--color-on-surface)' }}>{item.habitaciones ?? 'N/A'}</strong>
            </div>
          </div>

          {/* Subida CSV */}
          <div className="p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center relative transition-all cursor-pointer"
            style={{
              border: '2px dashed rgba(37, 99, 235, 0.35)',
              background: 'rgba(37, 99, 235, 0.03)'
            }}>
            <input 
              type="file" 
              accept=".csv" 
              onChange={manejarSubidaCsv} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2 shadow-xs"
              style={{ background: 'var(--color-primary-container)', color: 'white' }}>
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>
              {cargandoArchivo ? 'Analizando archivo...' : 'Sube el .CSV de Meta Ads'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
              Filtra y clasifica anuncios en circulación vs. pausados o inactivos.
            </p>
            {nombreArchivo && (
              <span className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold max-w-full truncate shadow-xs"
                style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                <span className="material-symbols-outlined text-[14px]">check</span> <span className="truncate">{nombreArchivo}</span>
              </span>
            )}
          </div>

          {/* Métricas consolidadas (Campaña Activa) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>
                Métricas Consolidadas (Reporte 28)
              </h3>
              {anunciosInactivos.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {anunciosActivos.length} activos / {anunciosInactivos.length} inactivos separados
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {[
                { label: 'Leads (Lids)', key: 'leads', type: 'number', step: '1', placeholder: '0' },
                { label: 'Cost. por Lids ($)', key: 'costo_por_lead', type: 'number', step: '1', placeholder: '0' },
                { label: 'Inversión ($)', key: 'inversion', type: 'number', step: '1', placeholder: '0' },
                { label: 'Alcance', key: 'alcance', type: 'number', step: '1', placeholder: '0' },
                { label: 'CTR - Clic', key: 'ctr_clics', type: 'number', step: '1', placeholder: '0' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>{field.label}</label>
                  <input 
                    type={field.type} 
                    step={field.step}
                    value={totales[field.key]} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setTotales({
                        ...totales,
                        [field.key]: val === '' ? '' : (parseInt(val, 10) || 0)
                      });
                    }}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none transition-all"
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
                      const curVal = totales[field.key];
                      if (curVal !== '' && curVal != null) {
                        setTotales(prev => ({ ...prev, [field.key]: Math.round(Number(curVal) || 0) }));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de Anuncios con Filtrado Activos / Inactivos */}
          {listaAnuncios.length > 0 && (
            <div className="space-y-3">
              {/* Barra de pestañas y filtros */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-primary-container">table_chart</span>
                  <span>Anuncios Detectados</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant">
                    {listaAnuncios.length}
                  </span>
                </h3>

                {/* Filtros Activos / Inactivos / Todos */}
                <div 
                  className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-xl text-xs w-full sm:w-auto"
                  style={{ border: '1px solid var(--color-outline-variant)' }}
                >
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('activos')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      filtroEstado === 'activos'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${filtroEstado === 'activos' ? 'bg-emerald-300' : 'bg-emerald-500'}`}></span>
                    <span>Activos ({anunciosActivos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('inactivos')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      filtroEstado === 'inactivos'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${filtroEstado === 'inactivos' ? 'bg-amber-200' : 'bg-amber-400'}`}></span>
                    <span>Inactivos ({anunciosInactivos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('todos')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-semibold transition-all text-center cursor-pointer ${
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
                <div 
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-amber-800 dark:text-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400 shrink-0">info</span>
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
                <div 
                  className="px-3.5 py-2.5 rounded-xl bg-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-on-surface-variant"
                  style={{ border: '1px solid var(--color-outline-variant)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-outline shrink-0">pause_circle</span>
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
              <div 
                className="overflow-x-auto rounded-2xl bg-surface-container-lowest"
                style={{ border: '1px solid var(--color-outline-variant)' }}
              >
                <table className="w-full text-xs min-w-[560px]">
                  <thead className="bg-surface-container-low" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <tr>
                      <th className="text-left px-3.5 py-2.5 text-on-surface-variant font-semibold">Entrega del anuncio</th>
                      <th className="text-left px-3.5 py-2.5 text-on-surface-variant font-semibold">Anuncio</th>
                      <th className="text-right px-3.5 py-2.5 text-on-surface-variant font-semibold">Leads</th>
                      <th className="text-right px-3.5 py-2.5 text-on-surface-variant font-semibold">Costo/Lead</th>
                      <th className="text-right px-3.5 py-2.5 text-on-surface-variant font-semibold">Inversión</th>
                      <th className="text-right px-3.5 py-2.5 text-on-surface-variant font-semibold">Alcance</th>
                      <th className="text-right px-3.5 py-2.5 text-on-surface-variant font-semibold">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                    {anunciosAMostrar.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-outline italic">
                          No hay anuncios en esta sección ({filtroEstado}).
                        </td>
                      </tr>
                    ) : (
                      anunciosAMostrar.map((a, i) => (
                        <tr 
                          key={i} 
                          className={`hover:bg-surface-container-low/50 transition-colors ${
                            !a.activo ? 'opacity-75 bg-surface-container-low/20' : ''
                          }`}
                        >
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {a.activo ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {a.estado_texto || 'Pausado'}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-on-surface font-medium max-w-[200px] truncate" title={a.nombre_anuncio}>
                            {a.nombre_anuncio}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-primary-container font-bold">{a.leads}</td>
                          <td className="px-3.5 py-2.5 text-right text-on-surface font-medium">${a.costo_por_lead}</td>
                          <td className="px-3.5 py-2.5 text-right text-on-surface font-medium">${a.inversion}</td>
                          <td className="px-3.5 py-2.5 text-right text-on-surface font-medium">{a.alcance?.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-right text-on-surface font-medium">{a.ctr_clics}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {anunciosAMostrar.length > 0 && (
                    <tfoot 
                      className="bg-surface-container-low/70 font-bold" 
                      style={{ borderTop: '2px solid var(--color-outline-variant)' }}
                    >
                      <tr>
                        <td colSpan={2} className="px-3.5 py-2.5 text-on-surface uppercase text-[10px] tracking-wider">
                          Subtotales ({anunciosAMostrar.length} {filtroEstado})
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-primary-container font-extrabold text-xs">{subtotalesVista.leads}</td>
                        <td className="px-3.5 py-2.5 text-right text-on-surface font-bold text-xs">${subtotalesVista.costo_por_lead}</td>
                        <td className="px-3.5 py-2.5 text-right text-on-surface font-bold text-xs">${subtotalesVista.inversion}</td>
                        <td className="px-3.5 py-2.5 text-right text-on-surface font-bold text-xs">{subtotalesVista.alcance?.toLocaleString()}</td>
                        <td className="px-3.5 py-2.5 text-right text-on-surface font-bold text-xs">{subtotalesVista.ctr_clics}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Estado de Campaña */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4" 
            style={{ borderTop: '1px solid var(--color-outline-variant)' }}
          >
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1.5 uppercase tracking-wide">
                Estado de Campaña
              </label>
              <div className="relative">
                <select
                  value={estadoCm}
                  onChange={(e) => setEstadoCm(e.target.value)}
                  className="w-full h-[42px] px-3.5 pr-8 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-semibold appearance-none cursor-pointer transition-all"
                  style={{ 
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-container)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                  }}
                >
                  <option value="Por Hacer">⏳ Por Hacer</option>
                  <option value="Configurando">🛠️ Configurando Anuncio</option>
                  <option value="Campaña Activa">🔥 Campaña Activa</option>
                  <option value="Finalizado">✅ Finalizado (Reporte Listo)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1.5 uppercase tracking-wide">
                Plataforma
              </label>
              <input 
                type="text" 
                value={plataforma} 
                onChange={(e) => setPlataforma(e.target.value)}
                placeholder="Ej: Meta Ads / Instagram"
                className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium transition-all"
                style={{ 
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-container)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1.5 uppercase tracking-wide">
                Presupuesto Asignado
              </label>
              <input 
                type="text" 
                value={presupuesto} 
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="Ej: $150 USD"
                className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium transition-all"
                style={{ 
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-container)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                }}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div 
          className="p-4 sm:p-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3"
          style={{ borderTop: '1px solid var(--color-outline-variant)' }}
        >
          <button 
            type="button" 
            onClick={alCerrar}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all text-center hover:bg-surface-container-high cursor-pointer"
            style={{ border: '1px solid var(--color-outline-variant)' }}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            disabled={guardando}
            onClick={manejarGuardar}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            <span className="material-symbols-outlined text-[17px]">save</span>
            <span>{guardando ? 'Guardando en Supabase...' : 'Guardar Todo el Reporte'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}