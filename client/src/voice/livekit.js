import { Room, RoomEvent, Track, createLocalAudioTrack } from 'livekit-client';

let room = null;
let localAudioTrack = null;

export async function initLiveKit(url, token, {
  selfieDataUrl,
  displayName,
  onConnected,
  onParticipants,
  onSpeaking,
  onReconnecting,
  onReconnected,
  onError,
  onMicStatus, // replaces onMicError — receives { status, name, message } | null
  onData,
}) {
  const thisRoom = new Room({ adaptiveStream: true, dynacast: true });
  room = thisRoom;

  const isActive = () => room === thisRoom;

  // Remove any audio elements left over from a previous session
  document.querySelectorAll('[data-livekit-audio]').forEach(el => el.remove());

  try {
    thisRoom.on(RoomEvent.Connected, async () => {
      console.log('[SMyS] Room connected:', thisRoom.localParticipant?.identity);
      try {
        await thisRoom.localParticipant.updateMetadata(
          JSON.stringify({ photoUrl: selfieDataUrl || '', displayName: displayName || '' })
        );
      } catch { /* non-fatal */ }
      if (isActive()) onConnected?.();
    });

    thisRoom.on(RoomEvent.ParticipantConnected, (p) => {
      console.log('[SMyS] Participant joined:', p.identity);
      if (isActive()) updateParticipants(thisRoom, onParticipants);
      // Re-sync after a short delay: the joining participant's updateMetadata()
      // call is async and may not have resolved by the time this event fires.
      setTimeout(() => { if (isActive()) updateParticipants(thisRoom, onParticipants); }, 800);
    });

    thisRoom.on(RoomEvent.ParticipantDisconnected, (p) => {
      console.log('[SMyS] Participant left:', p.identity);
      if (isActive()) updateParticipants(thisRoom, onParticipants);
    });

    thisRoom.on(RoomEvent.ParticipantMetadataChanged, () => {
      if (isActive()) updateParticipants(thisRoom, onParticipants);
    });

    thisRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (isActive()) onSpeaking?.(speakers.map(p => p.identity));
    });

    thisRoom.on(RoomEvent.Reconnecting, () => {
      console.log('[SMyS] Reconnecting…');
      if (isActive()) onReconnecting?.();
    });

    thisRoom.on(RoomEvent.Reconnected, () => {
      console.log('[SMyS] Reconnected');
      if (isActive()) {
        onReconnected?.();
        updateParticipants(thisRoom, onParticipants);
      }
    });

    thisRoom.on(RoomEvent.Disconnected, (reason) => {
      console.log('[SMyS] Room disconnected, reason:', reason);
      if (isActive()) onError?.('Disconnected from room');
    });

    thisRoom.on(RoomEvent.DataReceived, (payload, participant) => {
      if (!isActive()) return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        console.log('[SMyS] DataReceived | type:', msg.type, '| from:', participant?.identity, '| room:', thisRoom.name);
        onData?.(msg, participant?.identity);
      } catch { /* ignore malformed */ }
    });

    thisRoom.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) {
        console.log('[SMyS] Remote audio subscribed from', participant.identity);
        const el = track.attach();
        el.dataset.livekitAudio = 'true';
        el.autoplay = true;
        document.body.appendChild(el);
        console.log('[SMyS] Remote audio attached to DOM for', participant.identity);
      }
    });

    thisRoom.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) {
        console.log('[SMyS] Remote audio unsubscribed from', participant.identity);
        track.detach().forEach(el => el.remove());
      }
    });

    await thisRoom.connect(url, token);
    if (!isActive()) return;

    console.log('[SMyS] LiveKit connected | room.name:', thisRoom.name, '| localIdentity:', thisRoom.localParticipant?.identity);

    // Unlock browser autoplay so remote audio elements can play
    await thisRoom.startAudio();
    console.log('[SMyS] Audio context unlocked');

    updateParticipants(thisRoom, onParticipants);
    // Re-sync after settle: existing participants' updateMetadata() calls are
    // async — their photoUrl may not be in p.metadata yet at connect time.
    setTimeout(() => { if (isActive()) updateParticipants(thisRoom, onParticipants); }, 1200);

    // Mic is separate — failure never ejects user from room
    await attemptMic(thisRoom, isActive, onMicStatus);
  } catch (e) {
    console.log('[SMyS] initLiveKit error:', e.message, '| still active:', isActive());
    if (isActive()) onError?.(e.message || 'LiveKit connection failed');
  }
}

function updateParticipants(thisRoom, cb) {
  if (!thisRoom || !cb) return;
  const list = [];
  thisRoom.remoteParticipants.forEach(p => {
    let meta = {};
    try { meta = p.metadata ? JSON.parse(p.metadata) : {}; } catch { /* ignore */ }
    list.push({
      identity: p.identity,
      name: meta.displayName || p.name || p.identity,
      photoUrl: meta.photoUrl || '',
    });
  });
  cb(list);
}

// Classify the MediaDevices error.
// Returns a status code string; also checks Permissions API to separate
// browser-level block ('blocked') from user-dismissed prompt ('denied').
async function classifyMicError(e) {
  const n = e?.name || '';
  if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
    // Ask the Permissions API: was the mic permanently blocked or just dismissed?
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      return status.state === 'denied' ? 'blocked' : 'denied';
    } catch {
      return 'blocked'; // fallback — assume blocked if Permissions API unavailable
    }
  }
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError') return 'notfound';
  if (n === 'NotReadableError' || n === 'TrackStartError')    return 'inuse';
  return 'unknown';
}

async function attemptMic(thisRoom, isActive, onMicStatus) {
  // Signal that the browser permission prompt is about to appear
  onMicStatus?.({ status: 'asking' });

  try {
    const track = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
    if (!isActive()) return;
    await thisRoom.localParticipant.publishTrack(track);
    localAudioTrack = track;
    console.log('[SMyS] Local mic track published');
    onMicStatus?.({ status: 'on' }); // success — clear any previous error
  } catch (e) {
    console.log('[SMyS] Mic error:', e.name, e.message);
    const status = await classifyMicError(e);
    onMicStatus?.({ status, errorName: e.name, errorMessage: e.message });
  }
}

// Exported for the "Enable microphone" and mic-button retry path
export async function retryMic(onMicStatus) {
  if (!room) return;
  const thisRoom = room;
  const isActive = () => room === thisRoom;

  if (localAudioTrack) {
    try { await thisRoom.localParticipant.unpublishTrack(localAudioTrack); } catch { /* ignore */ }
    localAudioTrack = null;
  }

  await attemptMic(thisRoom, isActive, onMicStatus);
}

export function publishData(obj) {
  if (!room) {
    console.warn('[SMyS] publishData SKIPPED — no room | type:', obj?.type);
    return;
  }
  console.log('[SMyS] publishData | type:', obj.type, '| room:', room.name, '| identity:', room.localParticipant?.identity);
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  room.localParticipant.publishData(bytes, { reliable: true });
}

export async function muteAudio() {
  if (localAudioTrack) await localAudioTrack.mute();
}

export async function unmuteAudio() {
  if (localAudioTrack) await localAudioTrack.unmute();
}

export function disconnectLiveKit() {
  console.log('[SMyS] disconnectLiveKit | room was:', room?.name ?? 'null');
  const dying = room;
  room = null;
  localAudioTrack = null;
  dying?.disconnect();
  // Clean up audio elements immediately on leave
  document.querySelectorAll('[data-livekit-audio]').forEach(el => el.remove());
}
