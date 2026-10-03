import { useState, useEffect, useCallback } from 'react';
import PanelCmUI from './components/PanelCmUI';
import ModalDetallePropiedadCM from './components/ModalDetallePropiedadCM';
import ModalNuevoReporteCM from './components/ModalNuevoReporteCM';
import { actualizarTareaCm, registrarReporteMeta } from '../infrastructure/cm.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function PanelCmContainer() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [reporteExistente, setReporteExistente] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalNuevoReporteAbierto, setModalNuevoReporteAbierto] = useState(false);

  // Carga la lista general de requerimientos
  const cargarRequerimientos = useCallback(async (silent = false) => {
    if (!silent) setCargando(true);
    try {
      const res = await fetch('/api/requerimientos');
      const json = await res.json();
      if (!res.ok || json?.error) {
        console.error("Error API CM:", json);
        if (!silent) alert(json?.error || 'Error cargando pautas de CM');
        return;
      }
      setDatos(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('[PanelCmContainer] Error:', err);
      if (!silent) alert('Error cargando pautas de CM: ' + err.message);
    } finally {
      if (!silent) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRequerimientos(false);
  }, [cargarRequerimientos]);

  // Consulta el reporte guardado para una propiedad específica
  const consultarReporte = useCallback(async (id_requerimiento) => {
    try {
      const res = await fetch(`/api/cm/anuncios?id_requerimiento=${id_requerimiento}`);
      const json = await res.json();
      setReporteExistente(json);
    } catch (err) {
      console.error('Error consultando reporte:', err);
      setReporteExistente(null);
    }
  }, []);

  // Sincronización en tiempo real desde Supabase para tareas CM, requerimientos y reportes
  useRealtimeSync(() => {
    cargarRequerimientos(true);
    if (modalAbierto && propiedadSeleccionada?.id_requerimiento) {
      consultarReporte(propiedadSeleccionada.id_requerimiento);
    }
  }, ['requerimientos_propiedad', 'tareas_cm', 'reportes_meta_cm', 'reportes_meta_anuncios']);

  // Abre el modal y consulta reportes_meta_cm y sus anuncios para esa propiedad
  const abrirDetalle = async (item) => {
    setPropiedadSeleccionada(item);
    setModalAbierto(true);
    await consultarReporte(item.id_requerimiento);
  };

  const cerrarDetalle = () => {
    setPropiedadSeleccionada(null);
    setReporteExistente(null);
    setModalAbierto(false);
  };

  // Guarda el estado de la tarea CM + las métricas y anuncios del CSV en Supabase
  const manejarGuardarTodo = async (payload) => {
    const { id_tarea_cm, estado, plataforma, presupuesto, id_requerimiento, id_agente, periodo_mensual, metricas, anuncios } = payload;

    // 1. Actualizar estado/plataforma/presupuesto en tareas_cm (por id_tarea o id_requerimiento)
    try {
      await actualizarTareaCm(id_tarea_cm || null, { 
        id_requerimiento,
        estado, 
        plataforma, 
        presupuesto 
      });
    } catch (errCm) {
      console.warn('Error actualizando tareas_cm:', errCm.message);
    }

    // 2. Guardar reporte (totales) y cada anuncio en Supabase si hay métricas o anuncios
    const tieneMetricas = metricas && Object.values(metricas).some(v => v !== 0 && v !== '' && v != null);
    if ((anuncios && anuncios.length > 0) || tieneMetricas) {
      await registrarReporteMeta({
        id_requerimiento,
        id_agente,
        periodo_mensual,
        metricas,
        anuncios: anuncios || []
      });
    }

    alert('¡Campaña y métricas sincronizadas exitosamente en Supabase!');

    // 3. Re-consultar requerimientos y reporte actualizado para refrescar inmediatamente
    await cargarRequerimientos(true);
    if (id_requerimiento) {
      await consultarReporte(id_requerimiento);
    }
  };

  return (
    <>
      <PanelCmUI
        tareas={datos}
        cargando={cargando}
        alSeleccionarPropiedad={abrirDetalle}
        alAbrirNuevoReporte={() => setModalNuevoReporteAbierto(true)}
      />

      <ModalDetallePropiedadCM
        item={propiedadSeleccionada}
        reporte={reporteExistente}
        anuncios={reporteExistente?.reportes_meta_anuncios || []}
        abierto={modalAbierto}
        alCerrar={cerrarDetalle}
        alGuardarTodo={manejarGuardarTodo}
      />

      <ModalNuevoReporteCM
        abierto={modalNuevoReporteAbierto}
        alCerrar={() => setModalNuevoReporteAbierto(false)}
        propiedades={datos}
        alGuardarExitoso={async () => {
          await cargarRequerimientos(false);
        }}
      />
    </>
  );
}