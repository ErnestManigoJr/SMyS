const express = require('express');
const router = express.Router();

// In-memory clip store for MVP. Connect Supabase storage for production.
const clips = new Map();

router.post('/save', async (req, res) => {
  const { roomId, userId, videoBase64, title } = req.body;
  if (!videoBase64) return res.status(400).json({ error: 'videoBase64 required' });
  const id = `clip-${Date.now()}`;
  clips.set(id, { id, roomId, userId, videoBase64, title: title || 'SMyS Moment', createdAt: new Date().toISOString() });
  res.json({ ok: true, clipId: id });
});

router.get('/:clipId', (req, res) => {
  const clip = clips.get(req.params.clipId);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });
  const { videoBase64, ...meta } = clip;
  res.json({ ...meta, hasVideo: !!videoBase64 });
});

module.exports = router;
