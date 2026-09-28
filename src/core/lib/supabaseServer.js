import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const url = 
    process.env.PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_URL) ||
    '';

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_SERVICE_ROLE_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) ||
    '';

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

// Proxy transparente para no romper llamadas como supabaseServer.from(...)
export const supabaseServer = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseServer();
    if (!client) {
      throw new Error(
        "Faltan las variables de entorno de Supabase en Vercel. Configura PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel (Project Settings > Environment Variables)."
      );
    }
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});