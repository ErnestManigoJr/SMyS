/**
 * Database helpers — all functions return null / [] when Supabase is not configured.
 * The app works fully offline; Supabase adds persistence when credentials are present.
 *
 * @module db
 */

import { supabase } from './supabase';

function warn(fn, err) {
  console.warn(`[db:${fn}]`, err?.message ?? err);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

/** @param {string} roomId @param {string} hostIdentity @returns {Promise<import('./types').Room|null>} */
export async function logRoom(roomId, hostIdentity) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('rooms')
    .upsert({ id: roomId, host_identity: hostIdentity }, { onConflict: 'id' })
    .select().single();
  if (error) warn('logRoom', error);
  return data ?? null;
}

/** @param {string} roomId */
export async function closeRoom(roomId) {
  if (!supabase) return;
  await supabase.from('rooms').update({ ended_at: new Date().toISOString() }).eq('id', roomId);
}

// ─── Participants ─────────────────────────────────────────────────────────────

/**
 * @param {{ roomId: string, identity: string, displayName?: string }} opts
 * @returns {Promise<import('./types').Participant|null>}
 */
export async function logParticipant({ roomId, identity, displayName }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('participants')
    .insert({ room_id: roomId, identity, display_name: displayName ?? null })
    .select().single();
  if (error) warn('logParticipant', error);
  return data ?? null;
}

/** @param {string} participantId */
export async function markParticipantLeft(participantId) {
  if (!supabase) return;
  await supabase.from('participants').update({ left_at: new Date().toISOString() }).eq('id', participantId);
}

// ─── Recordings ───────────────────────────────────────────────────────────────

/**
 * @param {{ roomId?: string, identity?: string, mimeType?: string }} opts
 * @returns {Promise<import('./types').Recording|null>}
 */
export async function createRecording({ roomId, identity, mimeType = 'video/webm' }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recordings')
    .insert({ room_id: roomId ?? null, identity: identity ?? null, mime_type: mimeType })
    .select().single();
  if (error) warn('createRecording', error);
  return data ?? null;
}

/**
 * @param {string} id
 * @param {{ durationS?: number, storagePath?: string }} opts
 */
export async function finalizeRecording(id, { durationS, storagePath } = {}) {
  if (!supabase || !id) return;
  await supabase.from('recordings').update({
    ended_at: new Date().toISOString(),
    duration_s: durationS ?? null,
    storage_path: storagePath ?? null,
  }).eq('id', id);
}

// ─── Clips ────────────────────────────────────────────────────────────────────

/**
 * @param {{ recordingId?: string, roomId?: string, identity?: string, storagePath?: string, publicUrl?: string, durationS?: number, title?: string }} opts
 * @returns {Promise<import('./types').Clip|null>}
 */
export async function saveClip({ recordingId, roomId, identity, storagePath, publicUrl, durationS, title } = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('clips')
    .insert({
      recording_id: recordingId ?? null,
      room_id:      roomId      ?? null,
      identity:     identity    ?? null,
      storage_path: storagePath ?? null,
      public_url:   publicUrl   ?? null,
      duration_s:   durationS   ?? null,
      title:        title       ?? null,
    })
    .select().single();
  if (error) warn('saveClip', error);
  return data ?? null;
}

// ─── LMD Profiles ─────────────────────────────────────────────────────────────

/**
 * @param {{ identity: string, displayName?: string, selfieUrl?: string }} opts
 * @returns {Promise<import('./types').LMDProfile|null>}
 */
export async function upsertProfile({ identity, displayName, selfieUrl }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lmd_profiles')
    .upsert(
      { identity, display_name: displayName ?? null, selfie_url: selfieUrl ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'identity' }
    )
    .select().single();
  if (error) warn('upsertProfile', error);
  return data ?? null;
}

/** @param {string} identity @returns {Promise<import('./types').LMDProfile|null>} */
export async function getProfile(identity) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('lmd_profiles')
    .select('*')
    .eq('identity', identity)
    .maybeSingle();
  return data ?? null;
}

// ─── LMD Personality ──────────────────────────────────────────────────────────

/**
 * @param {string} profileId
 * @param {{ trait: string, value: number, label?: string }[]} traits
 */
export async function setPersonality(profileId, traits) {
  if (!supabase || !traits?.length) return;
  const rows = traits.map(({ trait, value, label }) => ({
    profile_id: profileId, trait, value, label: label ?? null, updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('lmd_personality')
    .upsert(rows, { onConflict: 'profile_id,trait' });
  if (error) warn('setPersonality', error);
}

/** @param {string} profileId @returns {Promise<import('./types').LMDPersonality[]>} */
export async function getPersonality(profileId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('lmd_personality')
    .select('*')
    .eq('profile_id', profileId);
  return data ?? [];
}

// ─── LMD Memories ─────────────────────────────────────────────────────────────

/**
 * @param {{ profileId: string, content: string, contextType?: string, importance?: number }} opts
 * @returns {Promise<import('./types').LMDMemory|null>}
 */
export async function addMemory({ profileId, content, contextType, importance = 0.5 }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lmd_memories')
    .insert({ profile_id: profileId, content, context_type: contextType ?? null, importance })
    .select().single();
  if (error) warn('addMemory', error);
  return data ?? null;
}

/**
 * @param {string} profileId
 * @param {number} [limit=20]
 * @returns {Promise<import('./types').LMDMemory[]>}
 */
export async function getMemories(profileId, limit = 20) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('lmd_memories')
    .select('*')
    .eq('profile_id', profileId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('importance', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── LMD Conversations ────────────────────────────────────────────────────────

/**
 * @param {{ roomId?: string, profileId: string, role: 'system'|'user'|'assistant', content: string, metadata?: Object }} opts
 * @returns {Promise<import('./types').LMDConversation|null>}
 */
export async function logMessage({ roomId, profileId, role, content, metadata = {} }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lmd_conversations')
    .insert({ room_id: roomId ?? null, profile_id: profileId, role, content, metadata })
    .select().single();
  if (error) warn('logMessage', error);
  return data ?? null;
}

/**
 * @param {string} roomId
 * @param {string} profileId
 * @param {number} [limit=50]
 * @returns {Promise<import('./types').LMDConversation[]>}
 */
export async function getConversation(roomId, profileId, limit = 50) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('lmd_conversations')
    .select('*')
    .eq('room_id', roomId)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return data ?? [];
}
