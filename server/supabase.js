require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
// Prefer the service-role key on the server (bypasses RLS); fall back to anon key
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Supabase server client (service role).
 * null when env vars are absent — callers must guard: if (!supabase) return;
 */
const supabase = (url && key) ? createClient(url, key, {
  auth: { persistSession: false },
}) : null;

if (!supabase) {
  console.warn('[SMyS] Supabase not configured — running without persistence.');
}

module.exports = { supabase };
