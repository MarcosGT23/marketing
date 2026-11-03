import React, { useState, useEffect, useCallback } from 'react';
import TodosRequerimientosUI from './components/TodosRequerimientosUI';
import { useRealtimeSync } from '../../../core/hooks/useRealtimeSync';
import { obtenerJson } from '../../../core/utils/http';
import { notificarError } from '../../../core/ui/notifications';

export default function TodosRequerimientosContainer() {
  const [requerimientos, setRequerimientos] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async (silent = false) => {
    if (!silent) setCargando(true);
    try {
      const [resReq, resAgentes] = await Promise.all([
        obtenerJson('/api/requerimientos'),
        obtenerJson('/api/usuarios?rol=Agente')
      ]);

      setRequerimientos(Array.isArray(resReq) ? resReq : []);
      setAgentes(Array.isArray(resAgentes) ? resAgentes : []);
    } catch (err) {
      console.error('Error cargando requerimientos:', err);
      if (!silent) notificarError(err.message || 'No se pudieron cargar los requerimientos.');
    } finally {
      if (!silent) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(false);
  }, [cargarDatos]);

  // Sincronización en tiempo real ante cualquier cambio en Supabase
  useRealtimeSync(() => {
    cargarDatos(true);
  }, ['requerimientos_propiedad', 'tareas_diseno', 'tareas_video', 'tareas_cm', 'usuarios']);

  return (
    <TodosRequerimientosUI
      requerimientos={requerimientos}
      cargando={cargando}
      agentes={agentes}
      alActualizar={() => cargarDatos(true)}
    />
  );
}
