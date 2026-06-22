/**
 * LMD AI Adapter — placeholder interface.
 *
 * All three exports share the same contract: return a string on success,
 * null to fall through to the canned/local fallback.
 *
 * To wire up real AI (Claude, OpenAI, etc.), replace the bodies of these
 * three functions only. Nothing else in the LMD layer needs to change.
 *
 * Suggested server route: POST /api/lmd/react  { event, context } → { text }
 *                         POST /api/lmd/whisper { prompt, context } → { text }
 *                         POST /api/lmd/memory  { turns }          → { summary }
 */

/**
 * Generate a live reaction bubble for the local twin.
 *
 * @param {string} eventType - 'pause' | 'play' | 'seek' | 'speech' | 'silence' | 'whisper'
 * @param {import('../lib/types').ReactionContext} context
 * @returns {Promise<string|null>}
 */
export async function generateReaction(_eventType, _context) {
  // TODO: replace with AI call
  // const res = await fetch('/api/lmd/react', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ event: _eventType, context: _context }),
  // });
  // const { text } = await res.json();
  // return text ?? null;
  return null;
}

/**
 * Generate a whisper — a proactive thought the twin surfaces unprompted.
 * Called when the user has been silent for a while or a 'soon' slot opens.
 *
 * @param {{ prompt?: string, context?: import('../lib/types').ReactionContext }} opts
 * @returns {Promise<string|null>}
 */
export async function generateWhisper(_opts) {
  // TODO: replace with AI call
  return null;
}

/**
 * Summarise a conversation window into a memory fragment to be persisted.
 * Called at the end of a session or when conversation history exceeds the context limit.
 *
 * @param {import('../lib/types').LMDConversation[]} _turns
 * @returns {Promise<string|null>} - compact summary text, or null to skip
 */
export async function summarizeMemory(_turns) {
  // TODO: replace with AI call
  return null;
}
