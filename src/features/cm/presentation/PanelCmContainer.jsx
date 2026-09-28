import { useState, useEffect } from 'react';
import PanelCmUI from './components/PanelCmUI';
import ModalDetallePropiedadCM from './components/ModalDetallePropiedadCM';
import { actualizarTareaCm, registrarReporteMeta } from '../infrastructure/cm.api';

export default function PanelCmContainer() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [reporteExistente, setReporteExistente] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Carga la lista general de requerimientos
  const cargarRequerimientos = async () => {
    try {
      const res = await fetch('/api/requerimientos');
      const json = await res.json();
      setDatos(json);
    } catch (err) {
      console.error(err);
      alert('Error cargando pautas de CM');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRequerimientos();
  }, []);

  // Abre el modal y consulta reportes_meta_cm y sus anuncios para esa propiedad
  const abrirDetalle = async (item) => {
    setPropiedadSeleccionada(item);
    setModalAbierto(true);
    await consultarReporte(item.id_requerimiento);
  };

  // Consulta el reporte guardado para una propiedad específica
  const consultarReporte = async (id_requerimiento) => {
    try {
      const res = await fetch(`/api/cm/anuncios?id_requerimiento=${id_requerimiento}`);
      const json = await res.json();
      setReporteExistente(json);
    } catch (err) {
      console.error('Error consultando reporte:', err);
      setReporteExistente(null);
    }
  };

  const cerrarDetalle = () => {
    setPropiedadSeleccionada(null);
    setReporteExistente(null);
    setModalAbierto(false);
  };

  // Guarda el estado de la tarea CM + las métricas y anuncios del CSV en Supabase
  const manejarGuardarTodo = async (payload) => {
    const { id_tarea_cm, estado, plataforma, presupuesto, id_requerimiento, id_agente, periodo_mensual, metricas, anuncios } = payload;

    // 1. Actualizar estado/plataforma/presupuesto en tareas_cm
    if (id_tarea_cm) {
      await actualizarTareaCm(id_tarea_cm, { estado, plataforma, presupuesto });
    }

    // 2. Guardar reporte (totales) y cada anuncio en Supabase
    if (anuncios && anuncios.length > 0) {
      await registrarReporteMeta({
        id_requerimiento,
        id_agente,
        periodo_mensual,
        metricas,
        anuncios
      });
    }

    alert('¡Campaña y métricas sincronizadas exitosamente en Supabase!');

    // 3. Re-consultar reporte actualizado para refrescar el modal
    await consultarReporte(id_requerimiento);
  };

  return (
    <>
      <PanelCmUI
        tareas={datos}
        cargando={cargando}
        alSeleccionarPropiedad={abrirDetalle}
      />

      <ModalDetallePropiedadCM
        item={propiedadSeleccionada}
        reporte={reporteExistente}
        anuncios={reporteExistente?.reportes_meta_anuncios || []}
        abierto={modalAbierto}
        alCerrar={cerrarDetalle}
        alGuardarTodo={manejarGuardarTodo}
      />
    </>
  );
}