/**
 * Placeholder AI adapter.
 *
 * Contract:  generateReaction(eventType, context) → Promise<string | null>
 *
 * Return a string to override canned responses.
 * Return null to fall through to reactionTriggers.js canned pool.
 *
 * Swap this file for a real AI call (Claude, OpenAI, etc.) when ready.
 * Everything else in the reaction layer stays the same.
 */
export async function generateReaction(_eventType, _context) {
  // TODO: replace with AI call
  //   const res = await fetch('/api/lmd/react', {
  //     method: 'POST',
  //     body: JSON.stringify({ event: _eventType, context: _context }),
  //   });
  //   const { text } = await res.json();
  //   return text;
  return null;
}
