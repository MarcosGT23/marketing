import { useState, useMemo, useEffect } from 'react';
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

export default function ModalNuevoReporteCM({ 
  abierto, 
  alCerrar, 
  propiedades = [], 
  alGuardarExitoso 
}) {
  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Campos principales del reporte
  const [solicitante, setSolicitante] = useState('');
  const [idAgente, setIdAgente] = useState('');
  const [usuariosDb, setUsuariosDb] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyStr);
  const [idRequerimientoSeleccionado, setIdRequerimientoSeleccionado] = useState('');

  // Métricas
  const [totales, setTotales] = useState({
    leads: 0,
    costo_por_lead: 0,
    inversion: 0,
    alcance: 0,
    ctr_clics: 0
  });

  // Datos operativos de campaña
  const [estadoCm, setEstadoCm] = useState('Por Hacer');
  const [plataforma, setPlataforma] = useState('Facebook / Instagram');
  const [presupuesto, setPresupuesto] = useState('');

  // CSV y anuncios
  const [listaAnuncios, setListaAnuncios] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos' | 'inactivos' | 'todos'
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [idiomaCsv, setIdiomaCsv] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar usuarios de la base de datos
  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    setCargandoUsuarios(true);

    fetch('/api/usuarios?rol=todos')
      .then(r => r.json())
      .then(data => {
        if (cancelado) return;
        if (Array.isArray(data) && data.length > 0) {
          setUsuariosDb(data);
        } else {
          return fetch('/api/usuarios?rol=Agente').then(r => r.json()).then(dAg => {
            if (!cancelado && Array.isArray(dAg)) setUsuariosDb(dAg);
          });
        }
      })
      .catch(err => console.error('Error cargando usuarios desde BD:', err))
      .finally(() => {
        if (!cancelado) setCargandoUsuarios(false);
      });

    return () => { cancelado = true; };
  }, [abierto]);

  if (!abierto) return null;

  // Filtrado de anuncios
  const anunciosActivos = listaAnuncios.filter(a => a.activo);
  const anunciosInactivos = listaAnuncios.filter(a => !a.activo);

  const anunciosAMostrar = filtroEstado === 'activos'
    ? anunciosActivos
    : filtroEstado === 'inactivos'
      ? anunciosInactivos
      : listaAnuncios;

  // Al vincular a una propiedad existente
  const manejarCambioPropiedad = (e) => {
    const idReq = e.target.value;
    setIdRequerimientoSeleccionado(idReq);
    if (idReq) {
      const prop = propiedades.find(p => String(p.id_requerimiento) === String(idReq));
      if (prop) {
        if (!titulo) setTitulo(`Reporte: ${prop.nombre_propiedad}`);
        const usuarioProp = prop.usuarios;
        const propIdAgente = prop.id_agente || usuarioProp?.id_usuario;
        if (propIdAgente) {
          setIdAgente(String(propIdAgente));
        }
        if (usuarioProp?.nombre) {
          setSolicitante(usuarioProp.nombre);
        } else if (prop.id_agente && usuariosDb.length > 0) {
          const u = usuariosDb.find(user => String(user.id_usuario) === String(prop.id_agente));
          if (u) setSolicitante(u.nombre);
        }
        if (!descripcion && prop.descripcion_propiedad) setDescripcion(prop.descripcion_propiedad);
        const tcm = (Array.isArray(prop.tareas_cm) ? prop.tareas_cm[0] : prop.tareas_cm) || {};
        if (tcm.plataforma) setPlataforma(tcm.plataforma);
        if (tcm.presupuesto) setPresupuesto(tcm.presupuesto);
        if (tcm.estado) setEstadoCm(tcm.estado);
      }
    }
  };

  // Manejo de carga de archivo CSV
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
        const rawResultado = procesarCsvMeta(texto);
        if (rawResultado.idiomaInfo) {
          setIdiomaCsv(rawResultado.idiomaInfo);
        }
        const resultado = rawResultado.map(normalizarAnuncio);
        setListaAnuncios(resultado);

        // Si no hay título puesto, sugerir basado en el archivo
        if (!titulo) {
          const nombreLimpio = file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
          setTitulo(`Reporte Meta: ${nombreLimpio}`);
        }

        // Separar activos para el cálculo de totales principales
        const activos = resultado.filter(a => a.activo);
        const base = activos.length > 0 ? activos : resultado;

        if (base.length > 0) {
          const leads = Math.round(base.reduce((s, a) => s + (a.leads || 0), 0));
          const inversion = Math.round(base.reduce((s, a) => s + (a.inversion || 0), 0));
          const alcance = Math.round(base.reduce((s, a) => s + (a.alcance || 0), 0));
          const costo_por_lead = leads > 0 
            ? Math.round(inversion / leads) 
            : Math.round(base.reduce((s, a) => s + (a.costo_por_lead || 0), 0) / base.length);
          const ctr_clics = Math.round(base.reduce((s, a) => s + (a.ctr_clics || 0), 0) / base.length);
          setTotales({ leads, costo_por_lead, inversion, alcance, ctr_clics });

          if (estadoCm === 'Por Hacer' || estadoCm === 'Configurando') {
            setEstadoCm('Campaña Activa');
          }
        }

        setFiltroEstado(activos.length > 0 ? 'activos' : 'todos');
      } catch (err) {
        alert('Error al leer el archivo CSV: ' + err.message);
      } finally {
        setCargandoArchivo(false);
      }
    };
    reader.readAsText(file);
  };

  // Guardar reporte
  const manejarGuardar = async () => {
    if (!solicitante.trim()) {
      alert('Por favor selecciona o introduce un solicitante.');
      return;
    }
    if (!titulo.trim()) {
      alert('Por favor introduce un título para el reporte.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id_requerimiento: idRequerimientoSeleccionado || null,
        id_agente: idAgente && idAgente !== 'otro' ? idAgente : null,
        solicitante: solicitante.trim(),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        estado: estadoCm,
        plataforma: plataforma.trim(),
        presupuesto: presupuesto.trim(),
        metricas: totales,
        anuncios: listaAnuncios
      };

      const res = await fetch('/api/cm/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al guardar el reporte');
      }

      alert('¡Reporte guardado y sincronizado con éxito!');
      if (alGuardarExitoso) {
        alGuardarExitoso(data);
      }
      alCerrar();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
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
            background: 'linear-gradient(to right, rgba(219, 225, 255, 0.4), var(--color-surface-container-lowest))',
            borderColor: 'var(--color-outline-variant)'
          }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ background: 'var(--color-primary-container)', color: 'white' }}>
                Nuevo Reporte Publicitario
              </span>
              <span className="text-[11px] sm:text-xs font-semibold truncate" style={{ color: 'var(--color-outline)' }}>
                • {fecha ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'General'}
              </span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-xl mt-1.5 truncate" style={{ color: 'var(--color-on-surface)' }}>
              {titulo || 'Crear Reporte de Pauta & CM'}
            </h2>
            <p className="text-[11px] sm:text-xs truncate mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              Solicitante: <strong>{solicitante || 'Sin asignar'}</strong> | Plataforma: <strong>{plataforma}</strong>
            </p>
          </div>
          <button 
            onClick={alCerrar} 
            className="p-1.5 rounded-xl transition-colors shrink-0 hover:bg-black/5 cursor-pointer"
            style={{ color: 'var(--color-outline)' }}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Tarjeta de Datos del Reporte (Solicitante, Título, Fecha, Descripción) */}
          <div className="p-4 sm:p-5 rounded-2xl space-y-4"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)'
            }}>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Solicitante / Agente (Directamente desde la Base de Datos) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-outline)' }}>
                    Solicitante / Agente *
                  </label>
                  {cargandoUsuarios && (
                    <span className="text-[10px] font-medium flex items-center gap-1 text-primary-container animate-pulse">
                      <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                      Cargando...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={idAgente}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIdAgente(val);
                      if (val === 'otro') {
                        setSolicitante('');
                      } else {
                        const usuario = usuariosDb.find(u => String(u.id_usuario) === String(val));
                        setSolicitante(usuario ? usuario.nombre : '');
                      }
                    }}
                    className="w-full h-[42px] px-3.5 pr-8 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-semibold cursor-pointer focus:outline-none transition-all appearance-none"
                    style={{
                      border: '1px solid var(--color-outline-variant)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <option value="">
                      {cargandoUsuarios ? 'Cargando usuarios de BD...' : '— Seleccionar Agente de la BD —'}
                    </option>
                    {usuariosDb.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nombre} {u.rol ? `(${u.rol})` : ''}
                      </option>
                    ))}
                    <option value="otro">✏️ Escribir otro solicitante manual...</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>

                {idAgente === 'otro' && (
                  <div className="mt-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={solicitante}
                      onChange={(e) => setSolicitante(e.target.value)}
                      placeholder="Escribe el nombre del solicitante..."
                      className="w-full h-[38px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium focus:outline-none transition-all"
                      style={{
                        border: '1px solid var(--color-outline-variant)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Título del Reporte */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-outline)' }}>
                  Título del Reporte *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Campaña 4 Casas Zona Oeste"
                  className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-semibold focus:outline-none transition-all"
                  style={{
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-outline)' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-semibold focus:outline-none transition-all cursor-pointer"
                  style={{
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                />
              </div>

            </div>

            {/* Vincular a Requerimiento / Propiedad (Opcional) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-outline)' }}>
                Vincular a Requerimiento / Propiedad Existente <span className="font-normal text-[10px]">(Opcional)</span>
              </label>
              <div className="relative">
                <select
                  value={idRequerimientoSeleccionado}
                  onChange={manejarCambioPropiedad}
                  className="w-full h-[42px] px-3.5 pr-8 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium cursor-pointer focus:outline-none transition-all appearance-none"
                  style={{
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <option value="">— Ninguno (Reporte de Pauta Independiente) —</option>
                  {propiedades.map(p => (
                    <option key={p.id_requerimiento} value={p.id_requerimiento}>
                      {p.nombre_propiedad} ({p.usuarios?.nombre || 'General'})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-outline)' }}>
                Descripción u Observaciones del Reporte
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Objetivo de la pauta, notas sobre la audiencia, resultados clave observados o recomendaciones..."
                className="w-full p-3 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-normal focus:outline-none transition-all resize-none"
                style={{
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              />
            </div>

          </div>

          {/* Subida CSV de Meta Ads */}
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
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold max-w-full truncate shadow-xs"
                  style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                  <span className="material-symbols-outlined text-[14px]">check</span> <span className="truncate">{nombreArchivo}</span>
                </span>
                {idiomaCsv && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs"
                    style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                    <span>{idiomaCsv.icono}</span>
                    <span>Idioma detectado: <strong>{idiomaCsv.nombre}</strong></span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Métricas Consolidadas (Reporte 28) */}
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
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>
                    {field.label}
                  </label>
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

          {/* Tabla de Anuncios si se ha cargado CSV */}
          {listaAnuncios.length > 0 && (
            <div className="space-y-3">
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

              {/* Aviso si hay inactivos */}
              {filtroEstado === 'activos' && anunciosInactivos.length > 0 && (
                <div 
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-amber-800 dark:text-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400 shrink-0">info</span>
                    <span>Se filtraron <strong>{anunciosInactivos.length} anuncio(s) pausados/inactivos</strong> de las métricas principales.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFiltroEstado('inactivos')}
                    className="underline font-bold text-[11px] self-start sm:self-auto shrink-0 hover:opacity-80 cursor-pointer"
                  >
                    Ver inactivos
                  </button>
                </div>
              )}

              {/* Tabla de anuncios */}
              <div 
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--color-outline-variant)' }}
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr 
                      className="border-b"
                      style={{ 
                        background: 'var(--color-surface-container-low)',
                        borderColor: 'var(--color-outline-variant)'
                      }}
                    >
                      <th className="p-3 font-bold uppercase text-[10px] text-outline">Estado</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline">Nombre del Anuncio</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline text-right">Leads</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline text-right">Costo / Lead</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline text-right">Inversión</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline text-right">Alcance</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-outline text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                    {anunciosAMostrar.map((anuncio, idx) => (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${anuncio.activo ? 'hover:bg-primary-50/20 dark:hover:bg-primary-950/20' : 'opacity-70 bg-amber-500/5 hover:opacity-100'}`}
                      >
                        <td className="p-3 whitespace-nowrap">
                          {anuncio.activo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{anuncio.estado_texto || 'En circulación'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              <span className="material-symbols-outlined text-[11px]">pause</span>
                              <span>{anuncio.estado_texto || 'Desactivado'}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium max-w-[220px] truncate" title={anuncio.nombre_anuncio}>
                          {anuncio.nombre_anuncio}
                        </td>
                        <td className="p-3 text-right font-bold text-primary-container">{anuncio.leads}</td>
                        <td className="p-3 text-right font-semibold">${anuncio.costo_por_lead}</td>
                        <td className="p-3 text-right font-semibold">${anuncio.inversion}</td>
                        <td className="p-3 text-right font-medium">{anuncio.alcance?.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{anuncio.ctr_clics}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Configuración operativa de Campaña */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1.5 uppercase tracking-wide">
                Estado de Campaña
              </label>
              <div className="relative">
                <select
                  value={estadoCm}
                  onChange={(e) => setEstadoCm(e.target.value)}
                  className="w-full h-[42px] px-3.5 pr-8 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-semibold cursor-pointer focus:outline-none transition-all appearance-none"
                  style={{ 
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
                placeholder="Ej: Meta Ads / Facebook / Instagram"
                className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium focus:outline-none transition-all"
                style={{ 
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
                className="w-full h-[42px] px-3.5 bg-surface-container-lowest rounded-xl text-xs text-on-surface font-medium focus:outline-none transition-all"
                style={{ 
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
