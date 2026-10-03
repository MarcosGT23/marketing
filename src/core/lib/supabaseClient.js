import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = 
  getEnv('PUBLIC_SUPABASE_URL') || 
  getEnv('SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  'https://srtbfxecimroebwxsebf.supabase.co';

const supabaseAnonKey = 
  getEnv('PUBLIC_SUPABASE_ANON_KEY') || 
  getEnv('SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydGJmeGVjaW1yb2Vid3hzZWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTMzMjYsImV4cCI6MjEwNTc2OTMyNn0.VNYqM6mYalyRHhZTiN3KADUnRgRsQ1xDvSRnLGggc3Q';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;