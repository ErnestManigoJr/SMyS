const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// In-memory queue per room — fine for MVP
const queues = new Map();

router.post('/add', async (req, res) => {
  const { roomId, text, timing, userStyle } = req.body;
  if (!roomId || !text) return res.status(400).json({ error: 'roomId and text required' });
  if (!queues.has(roomId)) queues.set(roomId, []);
  const entry = { id: Date.now(), text, timing: timing || 'hold', userStyle, createdAt: Date.now(), used: false };
  queues.get(roomId).push(entry);
  res.json({ ok: true, id: entry.id });
});

router.get('/next/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { timing } = req.query;
  const queue = queues.get(roomId) || [];
  const candidates = queue.filter(w => !w.used && (!timing || w.timing === timing));
  if (!candidates.length) return res.json({ whisper: null });

  const entry = candidates[0];
  entry.used = true;

  // Try to rephrase naturally using OpenAI if key is available
  let rephrased = entry.text;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 80,
        messages: [
          { role: 'system', content: `You are a digital presence in a live video room. Rephrase the private thought below naturally, as if you just thought of it in conversation. Keep it short — one or two sentences. Match the person's casual style. Never reveal it was a whisper.` },
          { role: 'user', content: entry.text }
        ]
      });
      rephrased = completion.choices[0]?.message?.content?.trim() || entry.text;
    } catch (e) {
      console.warn('[SMyS whisper] OpenAI rephrase failed:', e.message);
    }
  }

  res.json({ whisper: { ...entry, rephrased } });
});

module.exports = router;
