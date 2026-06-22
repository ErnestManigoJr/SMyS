import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { triggerReaction, REACTION_DISPLAY_MS, REACTION_COOLDOWN_MS } from './reactionTriggers';
import { publishData } from '../voice/livekit';

function broadcast(identity, text, ttl) {
  try {
    publishData({ type: 'twinThought', identity, text, ttl });
  } catch { /* not connected yet */ }
}

export function useTwinThoughts() {
  const userId      = useAppStore(s => s.userId);
  const setThought  = useAppStore(s => s.setTwinThought);

  const lastFiredAt = useRef({});  // { [eventType]: timestamp } — throttle per type
  const clearTimer  = useRef(null);
  const soonQueue   = useRef([]);  // pending "soon" whisper texts

  // ── Internal: show a text bubble for this client's twin ──────────────────
  const show = useCallback((text) => {
    if (!userId || !text) return;
    setThought(userId, text);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setThought(userId, null), REACTION_DISPLAY_MS);
    broadcast(userId, text, REACTION_DISPLAY_MS);
  }, [userId, setThought]);

  // ── emit: fire a canned/AI reaction for a room event ─────────────────────
  const emit = useCallback(async (eventType, context = {}) => {
    if (!userId) return;
    const now  = Date.now();
    const last = lastFiredAt.current[eventType] || 0;
    if (now - last < REACTION_COOLDOWN_MS) return;
    lastFiredAt.current[eventType] = now;

    const reaction = await triggerReaction(eventType, context);
    if (reaction) show(reaction.text);
  }, [userId, show]);

  // ── enqueueWhisper: timing-aware whisper dispatch ─────────────────────────
  //   'now'  → show immediately as the twin's spoken text
  //   'soon' → hold in queue; flush on next pause or silence event
  //   'hold' → save in store only; twin stays quiet
  const enqueueWhisper = useCallback((text, timing) => {
    if (!text) return;
    if (timing === 'now') {
      show(text);
    } else if (timing === 'soon') {
      soonQueue.current.push(text);
    }
    // 'hold' → no action here; already in whispers store
  }, [show]);

  // ── flushSoon: call on pause or silence to dequeue one 'soon' whisper ─────
  const flushSoon = useCallback(() => {
    const next = soonQueue.current.shift();
    if (next) show(next);
  }, [show]);

  return { emit, enqueueWhisper, flushSoon };
}
