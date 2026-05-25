// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Credenciales de Supabase ──────────────────────────────────────
// TODO: Mover a variables de entorno antes de publicar en producción
const SUPABASE_URL  = 'https://idqrqevylfqbqepxilej.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcXJxZXZ5bGZxYnFlcHhpbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDgxMzgsImV4cCI6MjA5NTAyNDEzOH0.CC7Tm0J3aDPHzhpp1m0_4sqZZEqwYjL3TUcQ1Qk6mpA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   false,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

export type AuthUser = {
  id:          string;
  email:       string;
  name?:       string;
  avatar?:     string;
  avatar_url?: string;
  gender?:     'male' | 'female' | 'other';
  is_plus:     boolean;
  is_seller:   boolean;
  location?:   string;
  phone?:      string;
};