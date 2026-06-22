const { AccessToken } = require('livekit-server-sdk');

async function createToken(roomId, participantIdentity, participantName) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    // Demo mode — return a placeholder token string
    console.warn('[SMyS] No LiveKit keys set. Running in demo mode (no real audio).');
    return `demo-token-${participantIdentity}`;
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: '4h',
  });
  token.addGrant({ room: roomId, roomJoin: true, canPublish: true, canSubscribe: true });
  return await token.toJwt();
}

module.exports = { createToken };
