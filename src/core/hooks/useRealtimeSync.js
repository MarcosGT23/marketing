// src/core/hooks/useRealtimeSync.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const NOMBRE_CANAL_LOCAL = 'panel_inmobiliario_sync_local';

/**
 * Emite una señal inmediata a todas las pestañas locales del navegador
 * para que refresquen sus datos sin esperar sondeo ni depender de la nube.
 */
export function notificarCambioLocal(datos = {}) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(NOMBRE_CANAL_LOCAL);
      bc.postMessage({ timestamp: Date.now(), ...datos });
      bc.close();
    } catch (e) {
      // Ignorar en entornos sin soporte
    }
  }
}

/**
 * Hook para sincronizar el frontend en tiempo real cuando ocurren cambios directamente en el backend (Supabase) o entre pestañas locales.
 * 
 * Combina:
 * 1. BroadcastChannel nativo para reflejo instantáneo en local (<5ms) entre pestañas abiertas.
 * 2. Supabase Realtime (WebSockets / postgres_changes) para sincronización con la nube.
 * 3. Eventos de foco de ventana (window 'focus' y 'visibilitychange') para cuando el usuario edita en otra pestaña.
 * 4. Sondeo suave de respaldo (polling) cada N segundos mientras la pestaña esté visible.
 */
export function useRealtimeSync(onActualizar, tablas = [], opciones = {}) {
  const {
    intervaloPollingMs = 8000,
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
    // 0. Sincronización instantánea entre pestañas locales mediante BroadcastChannel
    let bcListener = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bcListener = new BroadcastChannel(NOMBRE_CANAL_LOCAL);
        bcListener.onmessage = (event) => {
          console.log('[Realtime Sync Local] Notificación entre pestañas recibida:', event.data);
          ejecutarActualizacion('broadcast_local', event.data);
        };
      } catch (e) {
        // Fallback silencioso
      }
    }

    let ultimoFoco = Date.now();
    const manejarVisibilidad = () => {
      const ahora = Date.now();
      if (document.visibilityState === 'visible' && ahora - ultimoFoco > 6000) {
        ultimoFoco = ahora;
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
      if (bcListener) {
        try { bcListener.close(); } catch (e) {}
      }
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
