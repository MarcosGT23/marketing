import { useState, useEffect } from 'react';
import TableroDisenoUI from './components/TableroDisenoUI';
import { actualizarTareaDiseno } from '../infrastructure/diseno.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function TableroDisenoContainer() {
  const [datos, setDatos] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Estado inicial con los nuevos campos
  const [tareaInterna, setTareaInterna] = useState({ 
    titulo: '', 
    descripcion: '', 
    prioridad: 'Media', 
    fecha_limite: '',
    id_agente: '',
    categoria_diseno: 'Artes estáticos'
  });

  const cargarDatos = async (silent = false) => {
    if (!silent) setCargando(true);
    try {
      const [resReq, resAgentes] = await Promise.all([
        fetch('/api/requerimientos').then(r => r.json()),
        fetch('/api/usuarios?rol=Agente').then(r => r.json())
      ]);
      
      const conDiseno = (Array.isArray(resReq) ? resReq : []).filter(item => item.tareas_diseno);
      setDatos(conDiseno);
      setAgentes(Array.isArray(resAgentes) ? resAgentes : []);
    } catch (err) {
      console.error('Error cargando diseño:', err);
    } finally {
      if (!silent) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Sincronización en tiempo real
  useRealtimeSync(() => {
    cargarDatos(true);
  }, ['requerimientos_propiedad', 'tareas_diseno', 'usuarios']);

  const dispararAutoGuardadoDiseno = async (idTarea, tareaActualizada) => {
    try {
      await actualizarTareaDiseno(idTarea, {
        estado: tareaActualizada.estado,
        progreso_porcentaje: Number(tareaActualizada.progreso_porcentaje) || 0,
        fecha_limite: tareaActualizada.fecha_limite || null,
        usuario: 'Área de Diseño'
      });
    } catch (err) {
      console.error('Error auto-guardando tarea de diseño:', err);
    }
  };

  const manejarCambioCampo = (idTarea, campo, valor) => {
    let datosActualizados = null;
    setDatos(prev => prev.map(item => {
      const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
      if (td?.id_tarea === idTarea) {
        const actualizado = { ...td, [campo]: valor };
        if (campo === 'estado') {
          const porcentajes = {
            'Por Hacer': 0,
            'En Proceso': 50,
            'Revisión': 75,
            'Finalizado': 100
          };
          if (porcentajes[valor] !== undefined) {
            actualizado.progreso_porcentaje = porcentajes[valor];
          }
        }
        datosActualizados = { idTarea, tareaActualizada: actualizado };
        return {
          ...item,
          tareas_diseno: actualizado
        };
      }
      return item;
    }));

    if (datosActualizados) {
      dispararAutoGuardadoDiseno(datosActualizados.idTarea, datosActualizados.tareaActualizada);
    }
  };

  const manejarGuardar = async (idTarea) => {
    const item = datos.find(d => {
      const td = Array.isArray(d.tareas_diseno) ? d.tareas_diseno[0] : d.tareas_diseno;
      return td?.id_tarea === idTarea;
    });
    if (!item) return;

    const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
    const { estado, progreso_porcentaje, fecha_limite } = td || {};

    try {
      await actualizarTareaDiseno(idTarea, {
        estado,
        progreso_porcentaje: Number(progreso_porcentaje) || 0,
        fecha_limite: fecha_limite || null
      });
      alert('¡Avance de diseño guardado y registrado en la bitácora!');
      await cargarDatos();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const manejarCrearInterna = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/requerimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_agente: tareaInterna.id_agente ? parseInt(tareaInterna.id_agente, 10) : null,
          nombre_propiedad: tareaInterna.titulo, 
          descripcion_propiedad: tareaInterna.descripcion,
          categoria: 'Diseño Interno',
          categoria_diseno: tareaInterna.categoria_diseno,
          prioridad: tareaInterna.prioridad,
          fecha_rodaje: tareaInterna.fecha_limite, 
          req_arte_estatico: true // Fuerza a que se asigne al tablero de diseño
        })
      });
      
      setModalAbierto(false);
      setTareaInterna({ titulo: '', descripcion: '', prioridad: 'Media', fecha_limite: '', id_agente: '', categoria_diseno: 'Artes estáticos' });
      cargarDatos(); 
    } catch (err) {
      alert("Error al crear tarea: " + err.message);
    }
  };

  return (
    <TableroDisenoUI 
      tareas={datos}
      agentes={agentes}
      cargando={cargando} 
      alCambiarCampo={manejarCambioCampo} 
      alGuardar={manejarGuardar}
      modalAbierto={modalAbierto}
      setModalAbierto={setModalAbierto}
      tareaInterna={tareaInterna}
      setTareaInterna={setTareaInterna}
      manejarCrearInterna={manejarCrearInterna}
    />
  );
}