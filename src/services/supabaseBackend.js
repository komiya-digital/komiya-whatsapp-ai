import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const url = config.supabase.url || process.env.VITE_SUPABASE_URL || '';
const key = config.supabase.serviceRoleKey || config.supabase.anonKey || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseServer = (url && key) 
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;
