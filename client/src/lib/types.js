/**
 * SMyS shared type definitions (JSDoc — no TypeScript build step required).
 * Import individual types in consuming files with @type {import('./types').XYZ}
 */

// ─── Rooms & Sessions ────────────────────────────────────────────────────────

/**
 * @typedef {Object} Room
 * @property {string}      id             - smys-xxxxxxxx
 * @property {string}      created_at
 * @property {string|null} ended_at
 * @property {string}      host_identity
 */

/**
 * @typedef {Object} Participant
 * @property {string}      id
 * @property {string}      room_id
 * @property {string}      identity       - host-xxx | guest-xxx
 * @property {string|null} display_name
 * @property {string}      joined_at
 * @property {string|null} left_at
 */

// ─── Recordings & Clips ───────────────────────────────────────────────────────

/**
 * @typedef {Object} Recording
 * @property {string}      id
 * @property {string|null} room_id
 * @property {string|null} identity
 * @property {string}      started_at
 * @property {string|null} ended_at
 * @property {number|null} duration_s
 * @property {string|null} storage_path
 * @property {string}      mime_type
 */

/**
 * @typedef {Object} Clip
 * @property {string}      id
 * @property {string|null} recording_id
 * @property {string|null} room_id
 * @property {string|null} identity
 * @property {string}      created_at
 * @property {string|null} storage_path
 * @property {string|null} public_url
 * @property {number|null} duration_s
 * @property {string|null} title
 */

// ─── LMD ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LMDProfile
 * @property {string}      id
 * @property {string}      identity       - matches LiveKit participantIdentity
 * @property {string|null} display_name
 * @property {string|null} selfie_url
 * @property {string}      created_at
 * @property {string}      updated_at
 */

/**
 * @typedef {Object} LMDPersonality
 * @property {string}      id
 * @property {string}      profile_id
 * @property {string}      trait          - e.g. 'warmth' | 'humor' | 'directness'
 * @property {number}      value          - 0.0 to 1.0
 * @property {string|null} label
 * @property {string}      updated_at
 */

/**
 * @typedef {Object} LMDMemory
 * @property {string}      id
 * @property {string}      profile_id
 * @property {string}      content
 * @property {string|null} context_type   - 'watch_party' | 'conversation' | 'reaction'
 * @property {number}      importance     - 0.0 to 1.0
 * @property {string}      created_at
 * @property {string|null} expires_at
 */

/**
 * @typedef {'system'|'user'|'assistant'} ConversationRole
 *
 * @typedef {Object} LMDConversation
 * @property {string}           id
 * @property {string|null}      room_id
 * @property {string}           profile_id
 * @property {ConversationRole} role
 * @property {string}           content
 * @property {Object}           metadata
 * @property {string}           created_at
 */

// ─── AI Adapter contract ──────────────────────────────────────────────────────

/**
 * Context passed to AI adapter calls.
 * @typedef {Object} ReactionContext
 * @property {string}      [watchUrl]     - current watch party URL
 * @property {string}      [watchType]    - 'mp4' | 'youtube'
 * @property {string}      [speakerName]  - name of person speaking
 * @property {LMDMemory[]} [memories]     - recent memories for this twin
 * @property {Object}      [personality]  - personality trait map { trait: value }
 */

/**
 * @typedef {Object} ReactionResult
 * @property {string} text               - bubble text to display
 * @property {string} eventType          - event that triggered it
 */
