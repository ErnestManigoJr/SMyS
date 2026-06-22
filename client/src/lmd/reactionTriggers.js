import { generateReaction } from './reactionAdapter';

// Canned reaction pools per event type.
// Each pool is sampled randomly. Future AI replaces this via reactionAdapter.js.
const CANNED = {
  pause: [
    'Ooh — important moment?',
    'Good pause.',
    'Wait, did you catch that?',
    'Hold on…',
    'Something here?',
  ],
  play: [
    "Here we go!",
    'Back to it.',
    "Let's see what happens.",
    "And we're back.",
    'Okay, watching…',
  ],
  seek: [
    'Going back?',
    'Skip ahead?',
    'Something caught your eye?',
    'Rewinding…',
    'Jumping forward?',
  ],
  speech: [
    "I'm listening…",
    'Go on.',
    'Mmm.',
    'Tell me more.',
    'Say that again?',
  ],
  silence: [
    'Taking it in?',
    'Quiet moment.',
    'Processing…',
    'Thinking…',
  ],
  whisper: [
    'Nice thought.',
    "I'll hold onto that.",
    'Good timing.',
    "I'll save that one.",
    'Noted.',
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Select a reaction for the given event type.
 * Tries the AI adapter first; falls back to canned pool.
 * Returns { text, eventType } or null if no reaction applies.
 */
export async function triggerReaction(eventType, context = {}) {
  const ai = await generateReaction(eventType, context);
  if (ai) return { text: ai, eventType };

  const pool = CANNED[eventType];
  if (!pool?.length) return null;
  return { text: pick(pool), eventType };
}

export const REACTION_DISPLAY_MS = 4500; // how long a bubble stays visible
export const REACTION_COOLDOWN_MS = 7000; // minimum gap between reactions of same type
