require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const livekitTokenRoute = require('./livekitToken');
const whisperRoute = require('./whisperQueue');
const recordingRoute = require('./recording');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173', 'https://s-my-s.vercel.app'];

app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.includes(o)) ? cb(null, true) : cb(new Error('CORS: ' + o)) }));
app.use(express.json({ limit: '20mb' }));

app.get('/health', (_, res) => res.json({ ok: true, app: 'SMyS MVP', ts: Date.now() }));

// Room create / join (wraps LiveKit token generation)
app.post('/rooms/create', async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName) return res.status(400).json({ error: 'displayName required' });
    const roomId = `smys-${uuid().slice(0, 8)}`;
    const participantIdentity = `host-${uuid().slice(0, 6)}`;
    console.log(`[create] roomId=${roomId} identity=${participantIdentity} name="${displayName}"`);
    const token = await livekitTokenRoute.createToken(roomId, participantIdentity, displayName);
    res.json({ roomId, token, participantIdentity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/rooms/join', async (req, res) => {
  try {
    const { roomId, displayName } = req.body;
    if (!roomId || !displayName) return res.status(400).json({ error: 'roomId and displayName required' });
    const participantIdentity = `guest-${uuid().slice(0, 6)}`;
    console.log(`[join]   roomId=${roomId} identity=${participantIdentity} name="${displayName}"`);
    const token = await livekitTokenRoute.createToken(roomId, participantIdentity, displayName);
    res.json({ roomId, token, participantIdentity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/whisper', whisperRoute);
app.use('/recording', recordingRoute);

app.listen(PORT, () => console.log(`SMyS server running at http://localhost:${PORT}`));
