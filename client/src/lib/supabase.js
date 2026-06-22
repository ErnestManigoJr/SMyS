import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase browser client.
 * null when env vars are not configured — all helpers in db.js guard against null
 * so the app works locally without Supabase credentials.
 */
export const supabase = (url && key) ? createClient(url, key) : null;

export const hasSupabase = !!supabase;
