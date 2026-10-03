import dns from 'node:dns';
import { createClient } from '@supabase/supabase-js';

// Optimizar resolución DNS en Node.js (Windows) priorizando IPv4
// Esto previene retardos de 10-14 segundos y ConnectTimeoutError causados por IPv6 en Cloudflare/Supabase
if (typeof dns?.setDefaultResultOrder === 'function') {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {
    // Continuar normalmente
  }
}

export function getSupabaseCredentials() {
  const url = 
    process.env.PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_URL) ||
    'https://srtbfxecimroebwxsebf.supabase.co';

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_SERVICE_ROLE_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydGJmeGVjaW1yb2Vid3hzZWJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE5MzMyNiwiZXhwIjoyMTA1NzY5MzI2fQ.C6vjzdo2Rw5Z9toiTwLA02vVobRNyfWysvxi_DQBx1o';

  return { url, serviceKey };
}

let _clientInstance = null;

export function getSupabaseServer() {
  if (_clientInstance) return _clientInstance;
  const { url, serviceKey } = getSupabaseCredentials();

  if (!url || !serviceKey) {
    console.warn("⚠️ Credenciales de Supabase no detectadas en el entorno actual.");
    return null;
  }

  _clientInstance = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return _clientInstance;
}

// Proxy transparente para llamadas como supabaseServer.from(...)
export const supabaseServer = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseServer();
    if (!client) {
      throw new Error(
        "Faltan las variables de entorno de Supabase. Configura PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});