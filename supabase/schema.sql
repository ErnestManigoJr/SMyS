-- SMyS MVP — Supabase schema
-- Run this once in the Supabase SQL editor: https://supabase.com/dashboard → SQL Editor
-- Tables are grouped by domain: Rooms/Sessions, LMD, Recordings/Clips

-- ─────────────────────────────────────────────────────────────────────────────
-- ROOMS & SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rooms (
  id             TEXT        PRIMARY KEY,          -- smys-xxxxxxxx (from server)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,                      -- NULL while session is live
  host_identity  TEXT        NOT NULL              -- host-xxxxxx participant identity
);

CREATE TABLE IF NOT EXISTS participants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        TEXT        REFERENCES rooms(id) ON DELETE CASCADE,
  identity       TEXT        NOT NULL,             -- host-xxx / guest-xxx
  display_name   TEXT,
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  left_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS participants_room_idx ON participants(room_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RECORDINGS & CLIPS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recordings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        TEXT        REFERENCES rooms(id) ON DELETE SET NULL,
  identity       TEXT,                             -- who pressed record
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  duration_s     INTEGER,
  storage_path   TEXT,                             -- Supabase Storage object path
  mime_type      TEXT        DEFAULT 'video/webm'
);

CREATE INDEX IF NOT EXISTS recordings_room_idx ON recordings(room_id);

CREATE TABLE IF NOT EXISTS clips (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id   UUID        REFERENCES recordings(id) ON DELETE SET NULL,
  room_id        TEXT        REFERENCES rooms(id) ON DELETE SET NULL,
  identity       TEXT,                             -- who clipped it
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  storage_path   TEXT,                             -- Supabase Storage object path
  public_url     TEXT,                             -- signed or public URL for playback
  duration_s     INTEGER,
  title          TEXT
);

CREATE INDEX IF NOT EXISTS clips_room_idx    ON clips(room_id);
CREATE INDEX IF NOT EXISTS clips_identity_idx ON clips(identity);

-- ─────────────────────────────────────────────────────────────────────────────
-- LMD — LIVE MEMORY DIGITAL (twin personality and memory)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lmd_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  identity       TEXT        UNIQUE NOT NULL,      -- matches LiveKit participantIdentity
  display_name   TEXT,
  selfie_url     TEXT,                             -- thumbnail stored in Supabase Storage
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Personality axis values for each twin (0.0 = low, 1.0 = high)
CREATE TABLE IF NOT EXISTS lmd_personality (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID        REFERENCES lmd_profiles(id) ON DELETE CASCADE,
  trait          TEXT        NOT NULL,             -- e.g. 'warmth', 'humor', 'directness'
  value          FLOAT       DEFAULT 0.5 CHECK (value >= 0 AND value <= 1),
  label          TEXT,                             -- human-readable description
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, trait)
);

CREATE INDEX IF NOT EXISTS lmd_personality_profile_idx ON lmd_personality(profile_id);

-- Episodic memory entries for each twin
CREATE TABLE IF NOT EXISTS lmd_memories (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID        REFERENCES lmd_profiles(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL,             -- the memory text
  context_type   TEXT,                             -- 'watch_party' | 'conversation' | 'reaction'
  importance     FLOAT       DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at     TIMESTAMPTZ                       -- optional TTL; NULL = permanent
);

CREATE INDEX IF NOT EXISTS lmd_memories_profile_idx    ON lmd_memories(profile_id);
CREATE INDEX IF NOT EXISTS lmd_memories_importance_idx ON lmd_memories(importance DESC);

-- Conversation turns for each twin (system/user/assistant roles)
CREATE TABLE IF NOT EXISTS lmd_conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        TEXT        REFERENCES rooms(id) ON DELETE SET NULL,
  profile_id     UUID        REFERENCES lmd_profiles(id) ON DELETE CASCADE,
  role           TEXT        NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content        TEXT        NOT NULL,
  metadata       JSONB       DEFAULT '{}',         -- e.g. { event_type: 'pause', watch_url: '...' }
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lmd_conv_room_profile_idx ON lmd_conversations(room_id, profile_id);
CREATE INDEX IF NOT EXISTS lmd_conv_created_idx      ON lmd_conversations(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (enable but leave open for MVP — tighten before production)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_personality   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_memories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmd_conversations ENABLE ROW LEVEL SECURITY;

-- Temporary open policies for MVP development — replace with auth-scoped policies later
CREATE POLICY "allow_all_rooms"             ON rooms             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_participants"      ON participants      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recordings"        ON recordings        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clips"             ON clips             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lmd_profiles"      ON lmd_profiles      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lmd_personality"   ON lmd_personality   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lmd_memories"      ON lmd_memories      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lmd_conversations" ON lmd_conversations FOR ALL USING (true) WITH CHECK (true);
