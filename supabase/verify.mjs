/**
 * Supabase wiring verification — run once you have real credentials.
 *
 * Usage:
 *   1. Fill in client/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 *   2. Copy those same values to the variables below (or set env vars)
 *   3. Run: node supabase/verify.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL   || process.env.SUPABASE_URL   || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.error('❌  SUPABASE_URL / SUPABASE_ANON_KEY not set. Export them or fill in above.');
  process.exit(1);
}

const db = createClient(url, key);
let pass = 0, fail = 0;

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`✅  ${label}`, result ? `→ id=${result.id ?? JSON.stringify(result).slice(0,60)}` : '');
    pass++;
  } catch (err) {
    console.error(`❌  ${label}:`, err.message ?? err);
    fail++;
  }
}

// ── Check 3: Room + Participant ───────────────────────────────────────────────
const roomId = `verify-${Date.now()}`;

await check('rooms.upsert', async () => {
  const { data, error } = await db
    .from('rooms')
    .upsert({ id: roomId, host_identity: 'verify-host' }, { onConflict: 'id' })
    .select().single();
  if (error) throw error;
  return data;
});

await check('participants.insert', async () => {
  const { data, error } = await db
    .from('participants')
    .insert({ room_id: roomId, identity: 'verify-guest', display_name: 'Verify Guest' })
    .select().single();
  if (error) throw error;
  return data;
});

// ── Check 4: Recording + Clip ─────────────────────────────────────────────────
let recordingId;

await check('recordings.insert', async () => {
  const { data, error } = await db
    .from('recordings')
    .insert({ room_id: roomId, identity: 'verify-host', mime_type: 'video/webm' })
    .select().single();
  if (error) throw error;
  recordingId = data.id;
  return data;
});

await check('clips.insert', async () => {
  const { data, error } = await db
    .from('clips')
    .insert({ recording_id: recordingId, room_id: roomId, identity: 'verify-host', title: 'Verify Clip' })
    .select().single();
  if (error) throw error;
  return data;
});

// ── Check 5: LMD Profile + Personality + Memory + Conversation ───────────────
let profileId;

await check('lmd_profiles.upsert', async () => {
  const { data, error } = await db
    .from('lmd_profiles')
    .upsert({ identity: 'verify-host', display_name: 'Verify User', updated_at: new Date().toISOString() }, { onConflict: 'identity' })
    .select().single();
  if (error) throw error;
  profileId = data.id;
  return data;
});

await check('lmd_personality.upsert', async () => {
  const { data, error } = await db
    .from('lmd_personality')
    .upsert([
      { profile_id: profileId, trait: 'warmth',    value: 0.8, updated_at: new Date().toISOString() },
      { profile_id: profileId, trait: 'humor',     value: 0.6, updated_at: new Date().toISOString() },
      { profile_id: profileId, trait: 'directness',value: 0.7, updated_at: new Date().toISOString() },
    ], { onConflict: 'profile_id,trait' })
    .select();
  if (error) throw error;
  return data?.[0];
});

await check('lmd_memories.insert', async () => {
  const { data, error } = await db
    .from('lmd_memories')
    .insert({ profile_id: profileId, content: 'Verify memory', context_type: 'conversation', importance: 0.5 })
    .select().single();
  if (error) throw error;
  return data;
});

await check('lmd_conversations.insert', async () => {
  const { data, error } = await db
    .from('lmd_conversations')
    .insert({ room_id: roomId, profile_id: profileId, role: 'user', content: 'Hello verify', metadata: {} })
    .select().single();
  if (error) throw error;
  return data;
});

// ── Cleanup ───────────────────────────────────────────────────────────────────
// (rows are left in place for manual inspection; delete from dashboard when done)

console.log(`\n${'─'.repeat(50)}`);
console.log(`Result: ${pass} passed, ${fail} failed`);
if (fail === 0) console.log('🎉  All Supabase checks PASS — wiring is correct.');
else console.log('Fix the ❌ above, then re-run.');
