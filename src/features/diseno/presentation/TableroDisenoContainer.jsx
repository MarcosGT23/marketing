import { useState, useEffect, useRef } from 'react';
import TableroDisenoUI from './components/TableroDisenoUI';
import { actualizarTareaDiseno } from '../infrastructure/diseno.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';

export default function TableroDisenoContainer() {
  const [datos, setDatos] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Referencia para blindar mutaciones optimistas recientes contra sobreescritura de peticiones concurrentes
  const mutacionesRecientesRef = useRef(new Map());
  
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
        fetch('/api/requerimientos?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/usuarios?rol=Agente', { cache: 'no-store' }).then(r => r.json())
      ]);
      
      const ahora = Date.now();
      const conDiseno = (Array.isArray(resReq) ? resReq : []).filter(item => 
        Boolean(item.tareas_diseno || item.req_arte_estatico || item.req_carrusel || item.categoria === 'Diseño Interno')
      ).map(item => {
        const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
        const tareaServidor = td || {
          id_tarea: null,
          id_requerimiento: item.id_requerimiento,
          estado: 'Por Hacer',
          progreso_porcentaje: 0,
          fecha_limite: item.fecha_rodaje || null
        };

        // Si el usuario acaba de cambiar esta tarea en los últimos 4 segundos, preservar su cambio optimista
        const mutacionReciente = mutacionesRecientesRef.current.get(item.id_requerimiento);
        if (mutacionReciente && ahora - mutacionReciente.timestamp < 4000) {
          return {
            ...item,
            tareas_diseno: {
              ...tareaServidor,
              ...mutacionReciente.actualizado,
              id_tarea: tareaServidor.id_tarea || mutacionReciente.actualizado.id_tarea
            }
          };
        }

        return {
          ...item,
          tareas_diseno: tareaServidor
        };
      });

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

  const dispararAutoGuardadoDiseno = async (idTarea, tareaActualizada, idRequerimiento) => {
    try {
      const resultado = await actualizarTareaDiseno(idTarea, {
        id_requerimiento: idRequerimiento,
        estado: tareaActualizada.estado,
        progreso_porcentaje: Number(tareaActualizada.progreso_porcentaje) || 0,
        fecha_limite: tareaActualizada.fecha_limite || null,
        usuario: 'Área de Diseño'
      });

      // Si la tarea no tenía id_tarea y el backend la creó, asociar el nuevo id_tarea en memoria y en la referencia
      if (resultado?.data?.id_tarea) {
        const nuevoId = resultado.data.id_tarea;
        const mut = mutacionesRecientesRef.current.get(idRequerimiento);
        if (mut) {
          mut.actualizado.id_tarea = nuevoId;
        }

        if (!idTarea || idTarea === null) {
          setDatos(prev => prev.map(item => {
            if (item.id_requerimiento === idRequerimiento) {
              return {
                ...item,
                tareas_diseno: {
                  ...tareaActualizada,
                  id_tarea: nuevoId
                }
              };
            }
            return item;
          }));
        }
      }
    } catch (err) {
      console.error('Error auto-guardando tarea de diseño:', err);
      // En caso de fallo crítico en el servidor, remover el blindaje para sincronizar con la BD
      mutacionesRecientesRef.current.delete(idRequerimiento);
    }
  };

  const manejarCambioCampo = (idTarea, campo, valor, idRequerimiento) => {
    let datosActualizados = null;
    setDatos(prev => prev.map(item => {
      const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
      const coincide = (idTarea && td?.id_tarea === idTarea) || (idRequerimiento && item.id_requerimiento === idRequerimiento);
      if (coincide) {
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

        // Blindar inmediatamente la mutación contra sobreescritura de peticiones concurrentes
        mutacionesRecientesRef.current.set(item.id_requerimiento, {
          timestamp: Date.now(),
          actualizado
        });

        datosActualizados = { idTarea: td?.id_tarea || idTarea, tareaActualizada: actualizado, idRequerimiento: item.id_requerimiento };
        return {
          ...item,
          tareas_diseno: actualizado
        };
      }
      return item;
    }));

    if (datosActualizados) {
      dispararAutoGuardadoDiseno(datosActualizados.idTarea, datosActualizados.tareaActualizada, datosActualizados.idRequerimiento);
    }
  };

  const manejarGuardar = async (idTarea) => {
    if (!idTarea) {
      await cargarDatos();
      return;
    }

    const item = datos.find(d => {
      const td = Array.isArray(d.tareas_diseno) ? d.tareas_diseno[0] : d.tareas_diseno;
      return td?.id_tarea === idTarea;
    });
    if (!item) {
      await cargarDatos();
      return;
    }

    const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
    const { estado, progreso_porcentaje, fecha_limite } = td || {};

    try {
      await actualizarTareaDiseno(idTarea, {
        id_requerimiento: item.id_requerimiento,
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
      alRecargar={() => cargarDatos()}
      modalAbierto={modalAbierto}
      setModalAbierto={setModalAbierto}
      tareaInterna={tareaInterna}
      setTareaInterna={setTareaInterna}
      manejarCrearInterna={manejarCrearInterna}
    />
  );
}