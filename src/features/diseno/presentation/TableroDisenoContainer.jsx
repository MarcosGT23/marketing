import { useState, useEffect, useRef } from 'react';
import TableroDisenoUI from './components/TableroDisenoUI';
import { actualizarTareaDiseno } from '../infrastructure/diseno.api';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';
import { encolar, debePreservar, tienePendientes, esperarCola } from '../../../core/utils/serialQueue';
import { notificarExito, notificarError } from '../../../core/ui/notifications';

export default function TableroDisenoContainer() {
  const [datos, setDatos] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Referencia para blindar mutaciones optimistas recientes contra sobreescritura de peticiones concurrentes
  const mutacionesRecientesRef = useRef(new Map());
  const datosRef = useRef(datos);
  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);
  
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

        // Preservar el cambio optimista mientras haya guardados pendientes o recién confirmados
        const mutacionReciente = mutacionesRecientesRef.current.get(item.id_requerimiento);
        if (mutacionReciente && (debePreservar(item.id_requerimiento) || ahora - mutacionReciente.timestamp < 2000)) {
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

  const dispararAutoGuardadoDiseno = (idRequerimiento) => {
    encolar(idRequerimiento, async () => {
      const item = datosRef.current.find(d => d.id_requerimiento === idRequerimiento);
      if (!item) return;

      const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
      if (!td) return;

      try {
        const resultado = await actualizarTareaDiseno(td.id_tarea || null, {
          id_requerimiento: idRequerimiento,
          estado: td.estado,
          progreso_porcentaje: Number(td.progreso_porcentaje) || 0,
          fecha_limite: td.fecha_limite || null,
          usuario: 'Área de Diseño'
        });

        // Si la tarea no tenía id_tarea y el backend la creó, asociar el nuevo id en memoria
        if (resultado?.data?.id_tarea && !td.id_tarea) {
          const nuevoId = resultado.data.id_tarea;
          const mut = mutacionesRecientesRef.current.get(idRequerimiento);
          if (mut) mut.actualizado.id_tarea = nuevoId;

          setDatos(prev => prev.map(p => {
            if (p.id_requerimiento !== idRequerimiento) return p;
            const actual = Array.isArray(p.tareas_diseno) ? p.tareas_diseno[0] : p.tareas_diseno;
            return { ...p, tareas_diseno: { ...actual, id_tarea: nuevoId } };
          }));
        }
      } catch (err) {
        console.error('Error auto-guardando tarea de diseño:', err);
        // Al quedar la cola libre, sincronizar con la BD para reflejar el estado real
        esperarCola(idRequerimiento).then(() => {
          if (!tienePendientes(idRequerimiento)) {
            mutacionesRecientesRef.current.delete(idRequerimiento);
            cargarDatos(true);
          }
        });
      }
    });
  };

  const manejarCambioCampo = (idTarea, campo, valor, idRequerimiento) => {
    const actual = datosRef.current;
    const indice = actual.findIndex(item => {
      const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
      return (idTarea && td?.id_tarea === idTarea) || (idRequerimiento && item.id_requerimiento === idRequerimiento);
    });
    if (indice === -1) return;

    const item = actual[indice];
    const td = Array.isArray(item.tareas_diseno) ? item.tareas_diseno[0] : item.tareas_diseno;
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

    // Actualizar la referencia antes de encolar para que el guardado lea siempre el último estado
    const nuevaLista = actual.map((p, i) => i === indice ? { ...p, tareas_diseno: actualizado } : p);
    datosRef.current = nuevaLista;
    setDatos(nuevaLista);

    mutacionesRecientesRef.current.set(item.id_requerimiento, {
      timestamp: Date.now(),
      actualizado
    });

    dispararAutoGuardadoDiseno(item.id_requerimiento);
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
      notificarExito('El avance de diseño se guardó y quedó registrado en la bitácora.', 'Avance actualizado');
      await cargarDatos();
    } catch (err) {
      notificarError(err.message || 'No se pudo guardar el avance de diseño.');
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
      notificarExito('La nueva tarea de diseño ya está en el tablero.', 'Tarea creada');
      cargarDatos(); 
    } catch (err) {
      notificarError(err.message || 'No se pudo crear la tarea de diseño.');
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