// src/core/hooks/useRealtimeSync.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook para sincronizar el frontend en tiempo real cuando ocurren cambios directamente en el backend (Supabase).
 * 
 * Combina:
 * 1. Supabase Realtime (WebSockets / postgres_changes) para reflejo instantáneo en milisegundos.
 * 2. Eventos de foco de ventana (window 'focus' y 'visibilitychange') para cuando el usuario edita en otra pestaña.
 * 3. Sondeo suave de respaldo (polling) cada N segundos mientras la pestaña esté visible.
 * 
 * @param {Function} onActualizar Función a invocar para refrescar los datos en el frontend
 * @param {Array<string>} tablas Array opcional de tablas de Supabase a monitorear
 * @param {Object} opciones Opciones configurables
 */
export function useRealtimeSync(onActualizar, tablas = [], opciones = {}) {
  const {
    intervaloPollingMs = 10000,
    escucharFoco = true,
    habilitarRealtime = true
  } = opciones;

  const [conectado, setConectado] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(() => new Date());
  const callbackRef = useRef(onActualizar);
  callbackRef.current = onActualizar;

  const ejecutarActualizacion = useCallback((origen, extra = {}) => {
    setUltimaActualizacion(new Date());
    if (callbackRef.current) {
      try {
        callbackRef.current({ origen, ...extra, silent: true });
      } catch (err) {
        console.warn('[useRealtimeSync] Error ejecutando callback de actualización:', err);
      }
    }
  }, []);

  const forzarSincronizacion = useCallback(() => {
    ejecutarActualizacion('manual');
  }, [ejecutarActualizacion]);

  useEffect(() => {
    // 1. Escuchar foco y visibilidad de la pestaña del navegador
    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        ejecutarActualizacion('foco_pestana');
      }
    };

    if (escucharFoco) {
      window.addEventListener('focus', manejarVisibilidad);
      document.addEventListener('visibilitychange', manejarVisibilidad);
    }

    // 2. Suscripción en Tiempo Real mediante Supabase Realtime
    let canal = null;
    const tablasAEscuchar = tablas.length > 0
      ? tablas
      : ['requerimientos_propiedad', 'tareas_diseno', 'tareas_video', 'tareas_cm', 'reportes_meta_cm', 'reportes_meta_anuncios', 'usuarios'];

    if (habilitarRealtime && supabase) {
      const canalId = `sync_${Math.random().toString(36).slice(2, 9)}`;
      canal = supabase.channel(canalId);

      tablasAEscuchar.forEach((tabla) => {
        canal.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tabla },
          (payload) => {
            console.log(`[Realtime Sync] Cambio detectado en tabla '${tabla}' (${payload.eventType}):`, payload);
            ejecutarActualizacion('realtime', { tabla, payload });
          }
        );
      });

      canal.subscribe((status, err) => {
        if (err) {
          console.warn('[Realtime Sync] Error en canal de Supabase:', err);
          setConectado(false);
        } else if (status === 'SUBSCRIBED') {
          console.log('[Realtime Sync] Conectado a Supabase Realtime para tablas:', tablasAEscuchar);
          setConectado(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConectado(false);
        }
      });
    }

    // 3. Intervalo periódico de sondeo (polling) de respaldo
    let intervalId = null;
    if (intervaloPollingMs > 0) {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          ejecutarActualizacion('polling');
        }
      }, intervaloPollingMs);
    }

    // Limpieza al desmontar
    return () => {
      if (escucharFoco) {
        window.removeEventListener('focus', manejarVisibilidad);
        document.removeEventListener('visibilitychange', manejarVisibilidad);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (canal && supabase) {
        supabase.removeChannel(canal);
      }
    };
  }, [tablas.join(','), intervaloPollingMs, escucharFoco, habilitarRealtime, ejecutarActualizacion]);

  return { conectado, ultimaActualizacion, forzarSincronizacion };
}
