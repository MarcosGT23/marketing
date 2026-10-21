import React, { useState, useEffect } from 'react';
import SelectorDuracionPauta from './SelectorDuracionPauta';
import { actualizarRequerimiento } from '../../infrastructure/requerimiento.api';
import { obtenerPeriodoActual } from '../../../../core/utils/dateUtils';
import { ESTADO_CAMPANA_ACTIVO, ESTADO_CAMPANA_INACTIVO } from '../../../../core/utils/campanaUtils';

export default function ModalEditarRequerimiento({
  abierto,
  requerimiento,
  alCerrar,
  alGuardarExitoso,
  agentes = [],
  panel = 'general' // 'diseno' | 'video' | 'cm' | 'general'
}) {
  const [tabActiva, setTabActiva] = useState('propiedad'); // 'propiedad' | 'diseno' | 'video' | 'pauta' | 'audiovisual'
  const [guardando, setGuardando] = useState(false);
  const [listaAgentes, setListaAgentes] = useState(agentes);
  const [mensajeError, setMensajeError] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_propiedad: '',
    id_agente: '',
    periodo_mensual: obtenerPeriodoActual(),
    estado_general: ESTADO_CAMPANA_ACTIVO,
    categoria: 'Departamento',
    categoria_diseno: '',
    tipo: 'Venta',
    ubicacion: '',
    precio: '',
    superficie: '',
    habitaciones: '',
    prioridad: 'Baja',
    descripcion_propiedad: '',
    elemento_destacar: '',
    publico_objetivo: '',
    // Entregables Diseño
    req_arte_estatico: false,
    req_carrusel: false,
    fecha_limite: '',
    // Video
    req_reel: false,
    req_guion: false,
    req_fotos: false,
    req_grabacion: false,
    req_edicion: false,
    req_voz_off: false,
    fecha_rodaje: '',
    notas_produccion: '',
    // CM
    habilitar_pauta: true,
    plataforma: 'Facebook / Instagram',
    moneda: 'USD',
    presupuesto: '',
    periodo_pauta: 'Mes',
    descripcion_pauta: ''
  });

  // Cargar lista de agentes si no vinieron en props
  useEffect(() => {
    if (listaAgentes.length === 0 && abierto) {
      fetch('/api/usuarios?rol=Agente')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setListaAgentes(data);
        })
        .catch(err => console.error('Error cargando agentes en modal:', err));
    }
  }, [abierto, listaAgentes.length]);

  // Sincronizar datos cuando cambia el requerimiento o se abre el modal
  useEffect(() => {
    if (requerimiento && abierto) {
      const td = (Array.isArray(requerimiento.tareas_diseno) ? requerimiento.tareas_diseno[0] : requerimiento.tareas_diseno) || {};
      const tv = (Array.isArray(requerimiento.tareas_video) ? requerimiento.tareas_video[0] : requerimiento.tareas_video) || {};
      const tcm = (Array.isArray(requerimiento.tareas_cm) ? requerimiento.tareas_cm[0] : requerimiento.tareas_cm) || {};

      setFormData({
        nombre_propiedad: requerimiento.nombre_propiedad || '',
        id_agente: requerimiento.id_agente || (requerimiento.usuarios?.id_usuario || ''),
        periodo_mensual: requerimiento.periodo_mensual || obtenerPeriodoActual(),
        estado_general: requerimiento.estado_general || ESTADO_CAMPANA_ACTIVO,
        categoria: requerimiento.categoria || 'Departamento',
        categoria_diseno: requerimiento.categoria_diseno || '',
        tipo: requerimiento.tipo || 'Venta',
        ubicacion: requerimiento.ubicacion || '',
        precio: requerimiento.precio || '',
        superficie: requerimiento.superficie || '',
        habitaciones: requerimiento.habitaciones !== null && requerimiento.habitaciones !== undefined ? String(requerimiento.habitaciones) : '',
        prioridad: requerimiento.prioridad || 'Baja',
        descripcion_propiedad: requerimiento.descripcion_propiedad || '',
        elemento_destacar: requerimiento.elemento_destacar || '',
        publico_objetivo: requerimiento.publico_objetivo || '',
        // Entregables Diseño
        req_arte_estatico: Boolean(requerimiento.req_arte_estatico),
        req_carrusel: Boolean(requerimiento.req_carrusel),
        fecha_limite: td.fecha_limite || '',
        // Video
        req_reel: Boolean(requerimiento.req_reel),
        req_guion: Boolean(tv.req_guion),
        req_fotos: Boolean(tv.req_fotos),
        req_grabacion: Boolean(tv.req_grabacion),
        req_edicion: Boolean(tv.req_edicion),
        req_voz_off: Boolean(tv.req_voz_off),
        fecha_rodaje: requerimiento.fecha_rodaje || '',
        notas_produccion: requerimiento.notas_produccion || '',
        // CM
        habilitar_pauta: Boolean(tcm.plataforma && tcm.plataforma.trim() !== '' && tcm.estado !== 'Sin Pauta'),
        plataforma: tcm.plataforma || 'Facebook / Instagram',
        moneda: tcm.moneda || 'USD',
        presupuesto: tcm.presupuesto !== null && tcm.presupuesto !== undefined ? String(tcm.presupuesto) : '',
        periodo_pauta: tcm.periodo_pauta || 'Mes',
        descripcion_pauta: tcm.descripcion_pauta || ''
      });
      setTabActiva('propiedad');
      setMensajeError(null);
    }
  }, [requerimiento, abierto]);

  if (!abierto || !requerimiento) return null;

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleCheckbox = (campo, check) => {
    setFormData(prev => ({ ...prev, [campo]: check }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nombre_propiedad?.trim()) {
      setMensajeError('El nombre de la propiedad es obligatorio.');
      return;
    }

    setGuardando(true);
    setMensajeError(null);

    try {
      const datosPropiedad = {
        nombre_propiedad: formData.nombre_propiedad,
        id_agente: formData.id_agente,
        periodo_mensual: formData.periodo_mensual,
        categoria: formData.categoria,
        tipo: formData.tipo,
        ubicacion: formData.ubicacion,
        precio: formData.precio,
        superficie: formData.superficie,
        habitaciones: formData.habitaciones,
        prioridad: formData.prioridad,
        descripcion_propiedad: formData.descripcion_propiedad,
        elemento_destacar: formData.elemento_destacar,
        publico_objetivo: formData.publico_objetivo,
      };

      let payload = {};
      if (panel === 'diseno') {
        payload = {
          ...datosPropiedad,
          req_arte_estatico: formData.req_arte_estatico,
          req_carrusel: formData.req_carrusel,
          categoria_diseno: formData.categoria_diseno,
          fecha_limite: formData.fecha_limite,
          panel: 'diseno'
        };
      } else if (panel === 'video') {
        payload = {
          ...datosPropiedad,
          req_reel: formData.req_reel,
          req_guion: formData.req_guion,
          req_fotos: formData.req_fotos,
          req_grabacion: formData.req_grabacion,
          req_edicion: formData.req_edicion,
          req_voz_off: formData.req_voz_off,
          fecha_rodaje: formData.fecha_rodaje,
          notas_produccion: formData.notas_produccion,
          panel: 'video'
        };
      } else if (panel === 'cm') {
        payload = {
          ...datosPropiedad,
          habilitar_pauta: formData.habilitar_pauta,
          quitar_pauta: !formData.habilitar_pauta,
          plataforma: formData.habilitar_pauta ? (formData.plataforma || 'Facebook / Instagram') : null,
          moneda: formData.moneda,
          presupuesto: formData.habilitar_pauta ? formData.presupuesto : null,
          periodo_pauta: formData.habilitar_pauta ? formData.periodo_pauta : null,
          descripcion_pauta: formData.habilitar_pauta ? formData.descripcion_pauta : null,
          panel: 'cm'
        };
      } else {
        payload = {
          ...formData,
          quitar_pauta: !formData.habilitar_pauta,
          plataforma: formData.habilitar_pauta ? formData.plataforma : null,
          panel: 'general'
        };
      }

      const res = await actualizarRequerimiento(requerimiento.id_requerimiento, payload, panel);
      if (alGuardarExitoso) {
        alGuardarExitoso(res);
      }
      alCerrar();
    } catch (err) {
      console.error('Error al actualizar requerimiento:', err);
      setMensajeError(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  // Configuración de visualización según el panel
  const configHeaderPorPanel = {
    diseno: {
      titulo: 'Modificar Requerimiento de Diseño',
      subtitulo: `Solo modifica entregables gráficos de diseño • ID: ${requerimiento.id_requerimiento}`,
      icono: 'palette',
      iconoColor: 'bg-primary-container text-white',
    },
    video: {
      titulo: 'Modificar Requerimiento Audiovisual',
      subtitulo: `Solo modifica producción de video • ID: ${requerimiento.id_requerimiento}`,
      icono: 'movie',
      iconoColor: 'bg-tertiary text-white',
    },
    cm: {
      titulo: 'Modificar Requerimiento de Pauta (CM)',
      subtitulo: `Solo modifica pauta digital y presupuesto • ID: ${requerimiento.id_requerimiento}`,
      icono: 'campaign',
      iconoColor: 'bg-secondary text-white',
    },
    general: {
      titulo: 'Modificar Requerimiento Completo',
      subtitulo: `Edición integral de todos los paneles • ID: ${requerimiento.id_requerimiento}`,
      icono: 'edit_note',
      iconoColor: 'bg-primary-container text-white',
    }
  };

  const headerConfig = configHeaderPorPanel[panel] || configHeaderPorPanel.general;

  const campanaActiva = (formData.estado_general || ESTADO_CAMPANA_ACTIVO) === ESTADO_CAMPANA_ACTIVO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Ventana Modal */}
      <div 
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            borderColor: 'var(--color-outline-variant)',
            background: 'linear-gradient(to right, rgba(37,99,235,0.08), transparent)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${headerConfig.iconoColor}`}>
              <span className="material-symbols-outlined text-[22px]">{headerConfig.icono}</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg" style={{ color: 'var(--color-on-surface)' }}>
                {headerConfig.titulo}
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                {headerConfig.subtitulo}
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={alCerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="flex border-b px-6 gap-2 bg-surface-container-low" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <button
            type="button"
            onClick={() => setTabActiva('propiedad')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tabActiva === 'propiedad'
                ? 'border-primary-container text-primary-container'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Propiedad y General</span>
          </button>

          {panel === 'diseno' && (
            <button
              type="button"
              onClick={() => setTabActiva('diseno')}
              className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                tabActiva === 'diseno'
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">palette</span>
              <span>Entregables de Diseño</span>
            </button>
          )}

          {panel === 'video' && (
            <button
              type="button"
              onClick={() => setTabActiva('video')}
              className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                tabActiva === 'video'
                  ? 'border-tertiary text-tertiary'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">movie</span>
              <span>Producción de Video</span>
            </button>
          )}

          {panel === 'cm' && (
            <button
              type="button"
              onClick={() => setTabActiva('pauta')}
              className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                tabActiva === 'pauta'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>Pauta Digital (CM)</span>
            </button>
          )}

          {panel === 'general' && (
            <>
              <button
                type="button"
                onClick={() => setTabActiva('audiovisual')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  tabActiva === 'audiovisual'
                    ? 'border-tertiary text-tertiary'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>Diseño y Video</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('pauta')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  tabActiva === 'pauta'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Pauta Digital (CM)</span>
              </button>
            </>
          )}
        </div>

        {/* Mensaje de Error */}
        {mensajeError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error/10 border border-error/25 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: PROPIEDAD */}
          {tabActiva === 'propiedad' && (
            <div className="space-y-4">
              {/* Estado de activación de la campaña (estado_general) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${campanaActiva ? 'bg-primary/15 text-primary-container' : 'bg-surface-container-high text-outline'}`}>
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Campaña Activada</p>
                    <p className="text-[10px] text-outline">
                      {campanaActiva
                        ? 'Suma en el KPI "Campañas Activadas" del dashboard'
                        : 'No suma en el KPI "Campañas Activadas" del dashboard'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 h-[36px] p-0.5 rounded-xl bg-surface-container-lowest border border-surface-container self-start sm:self-auto shrink-0">
                  {[
                    { valor: ESTADO_CAMPANA_ACTIVO, label: 'Activa', icon: 'check_circle', active: 'bg-primary-container text-white' },
                    { valor: ESTADO_CAMPANA_INACTIVO, label: 'Inactiva', icon: 'pause_circle', active: 'bg-surface-container-high text-on-surface' }
                  ].map(op => {
                    const isSelected = formData.estado_general === op.valor;
                    return (
                      <button
                        key={op.valor}
                        type="button"
                        onClick={() => handleChange('estado_general', op.valor)}
                        className={`h-full px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected ? op.active : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{op.icon}</span>
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Nombre de la Propiedad <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_propiedad}
                    onChange={(e) => handleChange('nombre_propiedad', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: Penthouse Equipetrol Norte"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Agente Responsable
                  </label>
                  <select
                    value={formData.id_agente}
                    onChange={(e) => handleChange('id_agente', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none cursor-pointer"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                  >
                    <option value="">Seleccionar Agente</option>
                    {listaAgentes.map(ag => (
                      <option key={ag.id_usuario} value={ag.id_usuario}>{ag.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none cursor-pointer"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                  >
                    <option value="Departamento">Departamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Local Comercial">Local Comercial</option>
                    <option value="Diseño Interno">Diseño Interno</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Tipo de Operación</label>
                    <span className="text-[10px] text-primary font-medium">Opción múltiple</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {['Venta', 'Alquiler', 'Anticrético'].map((op) => {
                      const tiposAct = formData.tipo ? (Array.isArray(formData.tipo) ? formData.tipo : String(formData.tipo).split(',').map(s => s.trim()).filter(Boolean)) : ['Venta'];
                      const sel = tiposAct.includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => {
                            let next;
                            if (sel) {
                              next = tiposAct.filter(t => t !== op);
                            } else {
                              next = [...tiposAct, op];
                            }
                            handleChange('tipo', next.join(', '));
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            sel ? 'bg-primary/10 text-primary border-primary/40 font-bold' : 'bg-surface-container-low text-outline border-transparent hover:text-on-surface'
                          }`}
                        >
                          {sel && '✓ '}{op}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Habitaciones</label>
                  <input
                    type="number"
                    value={formData.habitaciones}
                    onChange={(e) => handleChange('habitaciones', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: 3"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Superficie (Terreno / Construida)</label>
                  <input
                    type="text"
                    value={formData.superficie}
                    onChange={(e) => handleChange('superficie', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: 350 m² (Terreno) | 180 m² (Construida)"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Precio Comercial</label>
                  <input
                    type="text"
                    value={formData.precio}
                    onChange={(e) => handleChange('precio', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: $us 185,000 o Bs 1,287,600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Ubicación</label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: Equipetrol Norte, Calle 7"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => handleChange('prioridad', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none cursor-pointer"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta (Urgente)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  Descripción de la Propiedad
                </label>
                <textarea
                  rows={3}
                  value={formData.descripcion_propiedad}
                  onChange={(e) => handleChange('descripcion_propiedad', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                  placeholder="Detalles sobre ambientes, amenidades, áreas comunes..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Elemento a Destacar (Hook)
                  </label>
                  <input
                    type="text"
                    value={formData.elemento_destacar}
                    onChange={(e) => handleChange('elemento_destacar', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: Terraza panorámica con churrasquera propia"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Público Objetivo
                  </label>
                  <input
                    type="text"
                    value={formData.publico_objetivo}
                    onChange={(e) => handleChange('publico_objetivo', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: Familias jóvenes e inversionistas de renta alta"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ENTREGABLES DE DISEÑO (CUANDO PANEL === 'diseno') */}
          {tabActiva === 'diseno' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2.5">
                  Entregables Gráficos Requeridos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.req_arte_estatico ? 'bg-secondary-container/25 border-secondary' : 'bg-surface-container-low border-surface-container'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.req_arte_estatico}
                      onChange={(e) => handleCheckbox('req_arte_estatico', e.target.checked)}
                      className="w-4 h-4 rounded text-secondary"
                    />
                    <div>
                      <p className="text-xs font-bold text-on-surface">Arte Estático</p>
                      <p className="text-[10px] text-outline">Diseño Gráfico (Flyer / Publicación)</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.req_carrusel ? 'bg-secondary-container/25 border-secondary' : 'bg-surface-container-low border-surface-container'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.req_carrusel}
                      onChange={(e) => handleCheckbox('req_carrusel', e.target.checked)}
                      className="w-4 h-4 rounded text-secondary"
                    />
                    <div>
                      <p className="text-xs font-bold text-on-surface">Carrusel</p>
                      <p className="text-[10px] text-outline">Diseño Gráfico de Múltiples Diapositivas</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.categoria === 'Diseño Interno' && (
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Tipo de Diseño Interno
                  </label>
                  <input
                    type="text"
                    value={formData.categoria_diseno}
                    onChange={(e) => handleChange('categoria_diseno', e.target.value)}
                    placeholder="Ej: Banner corporativo, Flyer de evento, Papelería..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-surface-container-lowest border border-amber-500/30"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Fecha Límite de Entrega de Diseño</label>
                <input
                  type="date"
                  value={formData.fecha_limite || ''}
                  onChange={(e) => handleChange('fecha_limite', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-primary-container focus:outline-none"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                />
              </div>
            </div>
          )}

          {/* TAB: PRODUCCIÓN DE VIDEO (CUANDO PANEL === 'video') */}
          {tabActiva === 'video' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2.5">
                  Formato de Video
                </h3>
                <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.req_reel ? 'bg-tertiary-fixed/30 border-tertiary' : 'bg-surface-container-low border-surface-container'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.req_reel}
                    onChange={(e) => handleCheckbox('req_reel', e.target.checked)}
                    className="w-4 h-4 rounded text-tertiary"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Grabación Reel / Video Vertical</p>
                    <p className="text-[10px] text-outline">Producción Audiovisual completa en locación</p>
                  </div>
                </label>
              </div>

              {/* Tareas de Video */}
              <div className="p-4 rounded-2xl bg-tertiary-fixed/15 border border-tertiary/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">movie</span>
                    Especificaciones Audiovisuales
                  </span>
                  <span className="text-[10px] text-outline">Checklist de producción</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'req_guion', label: 'Guion / Storyboard' },
                    { key: 'req_fotos', label: 'Sesión Fotos' },
                    { key: 'req_grabacion', label: 'Grabación Locación' },
                    { key: 'req_edicion', label: 'Edición & Montaje' },
                    { key: 'req_voz_off', label: 'Voz en Off' }
                  ].map(spec => (
                    <label key={spec.key} className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-lg border border-surface-container cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[spec.key])}
                        onChange={(e) => handleCheckbox(spec.key, e.target.checked)}
                        className="rounded text-tertiary"
                      />
                      <span className="text-on-surface font-medium">{spec.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Fecha Tentativa de Rodaje</label>
                    <input
                      type="date"
                      value={formData.fecha_rodaje || ''}
                      onChange={(e) => handleChange('fecha_rodaje', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-lowest"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Notas de Producción</label>
                    <input
                      type="text"
                      value={formData.notas_produccion || ''}
                      onChange={(e) => handleChange('notas_produccion', e.target.value)}
                      placeholder="Coordinar llaves, mejor horario de luz..."
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-lowest"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMATOS Y PRODUCCIÓN */}
          {tabActiva === 'audiovisual' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-2.5">
                  Entregables Gráficos y Audiovisuales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.req_arte_estatico ? 'bg-secondary-container/25 border-secondary' : 'bg-surface-container-low border-surface-container'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.req_arte_estatico}
                      onChange={(e) => handleCheckbox('req_arte_estatico', e.target.checked)}
                      className="w-4 h-4 rounded text-secondary"
                    />
                    <div>
                      <p className="text-xs font-bold text-on-surface">Arte Estático</p>
                      <p className="text-[10px] text-outline">Diseño Gráfico</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.req_carrusel ? 'bg-secondary-container/25 border-secondary' : 'bg-surface-container-low border-surface-container'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.req_carrusel}
                      onChange={(e) => handleCheckbox('req_carrusel', e.target.checked)}
                      className="w-4 h-4 rounded text-secondary"
                    />
                    <div>
                      <p className="text-xs font-bold text-on-surface">Carrusel</p>
                      <p className="text-[10px] text-outline">Diseño Gráfico</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.req_reel ? 'bg-tertiary-fixed/30 border-tertiary' : 'bg-surface-container-low border-surface-container'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.req_reel}
                      onChange={(e) => handleCheckbox('req_reel', e.target.checked)}
                      className="w-4 h-4 rounded text-tertiary"
                    />
                    <div>
                      <p className="text-xs font-bold text-on-surface">Grabación Reel</p>
                      <p className="text-[10px] text-outline">Producción Audiovisual</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.categoria === 'Diseño Interno' && (
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Tipo de Diseño Interno
                  </label>
                  <input
                    type="text"
                    value={formData.categoria_diseno}
                    onChange={(e) => handleChange('categoria_diseno', e.target.value)}
                    placeholder="Ej: Banner corporativo, Flyer de evento, Papelería..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-surface-container-lowest border border-amber-500/30"
                  />
                </div>
              )}

              {/* Tareas de Video */}
              <div className="p-4 rounded-2xl bg-tertiary-fixed/15 border border-tertiary/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">movie</span>
                    Especificaciones Audiovisuales
                  </span>
                  <span className="text-[10px] text-outline">Checklist de producción</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'req_guion', label: 'Guion / Storyboard' },
                    { key: 'req_fotos', label: 'Sesión Fotos' },
                    { key: 'req_grabacion', label: 'Grabación Locación' },
                    { key: 'req_edicion', label: 'Edición & Montaje' },
                    { key: 'req_voz_off', label: 'Voz en Off' }
                  ].map(spec => (
                    <label key={spec.key} className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-lg border border-surface-container cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[spec.key])}
                        onChange={(e) => handleCheckbox(spec.key, e.target.checked)}
                        className="rounded text-tertiary"
                      />
                      <span className="text-on-surface font-medium">{spec.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Fecha Tentativa de Rodaje</label>
                    <input
                      type="date"
                      value={formData.fecha_rodaje || ''}
                      onChange={(e) => handleChange('fecha_rodaje', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-lowest"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface">Notas de Producción</label>
                    <input
                      type="text"
                      value={formData.notas_produccion || ''}
                      onChange={(e) => handleChange('notas_produccion', e.target.value)}
                      placeholder="Coordinar llaves, mejor horario de luz..."
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-lowest"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAUTA DIGITAL */}
          {tabActiva === 'pauta' && (
            <div className="space-y-4">
              {/* Tarjeta de estado de pauteo (Activar / Quitar pauteo) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formData.habilitar_pauta ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-outline'}`}>
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Pauta Publicitaria (CM)</p>
                    <p className="text-[10px] text-outline">
                      {formData.habilitar_pauta 
                        ? 'Activo: Esta propiedad aparecerá en el Panel de CM' 
                        : 'Desactivado: Esta propiedad no aparecerá en el Panel de CM'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {formData.habilitar_pauta && (
                    <button
                      type="button"
                      onClick={() => handleChange('habilitar_pauta', false)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Quitar pauteo para que no figure en CM"
                    >
                      <span className="material-symbols-outlined text-[15px]">cancel</span>
                      <span>Quitar Pauteo</span>
                    </button>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.habilitar_pauta}
                      onChange={(e) => handleChange('habilitar_pauta', e.target.checked)}
                      className="w-4 h-4 rounded text-secondary cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${formData.habilitar_pauta ? 'text-secondary' : 'text-outline'}`}>
                      {formData.habilitar_pauta ? 'Con Pauta' : 'Sin Pauta'}
                    </span>
                  </label>
                </div>
              </div>

              {!formData.habilitar_pauta ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
                  <div className="flex-1">
                    <p className="font-semibold">El pauteo está desactivado para esta propiedad</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Al guardar los cambios, esta propiedad se retirará del Panel de CM y no figurará en la lista de campañas publicitarias.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('habilitar_pauta', true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    Activar Pauteo
                  </button>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Plataforma</label>
                    <span className="text-[10px] text-outline">Canal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 h-[38px] p-0.5 rounded-xl bg-surface-container-low border border-surface-container items-center">
                    {[
                      { id: 'Facebook / Instagram', label: 'Meta', icon: 'campaign', color: 'text-blue-600', active: 'bg-surface-container-lowest text-blue-700 shadow-xs border-blue-300 ring-1 ring-blue-400/30 font-bold' },
                      { id: 'TikTok Ads', label: 'TikTok', icon: 'play_circle', color: 'text-pink-600', active: 'bg-surface-container-lowest text-pink-700 shadow-xs border-pink-300 ring-1 ring-pink-400/30 font-bold' },
                      { id: 'Google Ads', label: 'Google', icon: 'ads_click', color: 'text-amber-600', active: 'bg-surface-container-lowest text-amber-700 shadow-xs border-amber-300 ring-1 ring-amber-400/30 font-bold' }
                    ].map((plat) => {
                      const isSelected = formData.plataforma === plat.id;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => handleChange('plataforma', plat.id)}
                          className={`h-full flex items-center justify-center gap-1 px-1 rounded-lg text-[11px] transition-all border ${
                            isSelected 
                              ? `${plat.active}` 
                              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[13px] ${isSelected ? plat.color : 'text-outline'}`}>
                            {plat.icon}
                          </span>
                          <span className="truncate">{plat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Moneda</label>
                    <span className="text-[10px] text-outline">Divisa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 h-[38px] p-0.5 rounded-xl bg-surface-container-low border border-surface-container items-center">
                    {[
                      { id: 'USD', label: 'USD ($)', icon: 'attach_money', color: 'text-emerald-600', active: 'bg-surface-container-lowest text-emerald-700 shadow-xs border-emerald-300 ring-1 ring-emerald-400/30 font-bold' },
                      { id: 'Bs', label: 'Bs.', icon: 'payments', color: 'text-indigo-600', active: 'bg-surface-container-lowest text-indigo-700 shadow-xs border-indigo-300 ring-1 ring-indigo-400/30 font-bold' }
                    ].map((m) => {
                      const isSelected = formData.moneda === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleChange('moneda', m.id)}
                          className={`h-full flex items-center justify-center gap-1 px-1 rounded-lg text-[11px] transition-all border ${
                            isSelected 
                              ? `${m.active}` 
                              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[13px] ${isSelected ? m.color : 'text-outline'}`}>
                            {m.icon}
                          </span>
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Presupuesto</label>
                  <input
                    type="number"
                    value={formData.presupuesto}
                    onChange={(e) => handleChange('presupuesto', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-surface-container-low"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                    placeholder="Ej: 150"
                  />
                </div>
              </div>

              {/* Selector interactivo de Duración con Calendario / Ciclo 28 a 28 */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--color-on-surface)' }}>
                  <span>Duración y Calendario de la Pauta</span>
                  <span className="text-[10px] text-outline font-normal">Días marcados en calendario o mes 28 al 28</span>
                </label>
                <SelectorDuracionPauta
                  valor={formData.periodo_pauta}
                  alCambiar={(nuevoPeriodo) => handleChange('periodo_pauta', nuevoPeriodo)}
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  Descripción y Objetivos de la Pauta
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcion_pauta}
                  onChange={(e) => handleChange('descripcion_pauta', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low focus:ring-2 focus:ring-secondary focus:outline-none"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                  placeholder="Segmentación geográfica, objetivo de leads, llamada a la acción..."
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>

        {/* Footer Actions */}
        <div 
          className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-surface-container-low"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <button
            type="button"
            onClick={alCerrar}
            disabled={guardando}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary-container text-white hover:bg-primary shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {guardando ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Guardar Requerimiento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
