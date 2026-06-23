import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import Scene from '../room/Scene';
import WhisperDrawer from '../whisper/WhisperDrawer';
import RecordButton from '../recording/RecordButton';
import ClipReview from '../recording/ClipReview';
import { initLiveKit, disconnectLiveKit, muteAudio, unmuteAudio, retryMic, publishData } from '../voice/livekit';
import { getVideoEl, applyCommand, isYouTubeUrl, toYouTubeEmbed, setYTIframe } from '../room/watchParty';
import { useTwinThoughts } from '../lmd/useTwinThoughts';
import { REACTION_DISPLAY_MS } from '../lmd/reactionTriggers';

const API = import.meta.env.VITE_SERVER_URL || 'https://smys-production.up.railway.app';

export default function Room() {
  const {
    roomId, roomToken, displayName, selfieDataUrl, inviteRoomId,
    setRoomId, setRoomToken, setParticipants, setSpeakingIds,
    isMuted, setMuted, resetRoom, currentClip, userId,
    participants, speakingIds,
    watchUrl, watchHost, watchType, setWatchParty, clearWatchParty,
    setTwinThought,
  } = useAppStore();

  const { emit: emitReaction, enqueueWhisper, flushSoon } = useTwinThoughts();

  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [err, setErr] = useState('');
  // null = no mic issue, 'microphone'|'notfound'|'inuse'|'unknown' = specific error
  // micState: null | { status, errorName?, errorMessage? }
  // status values: 'asking' | 'on' | 'muted' | 'blocked' | 'denied' | 'notfound' | 'inuse' | 'unknown'
  const [micState, setMicState] = useState(null);
  const [micBannerDismissed, setMicBannerDismissed] = useState(false);

  // Derived helpers
  const micStatus   = micState?.status ?? 'idle';
  const micError    = !['asking', 'on', 'muted', 'idle'].includes(micStatus);
  const micRetrying = micStatus === 'asking';

  // Watch party
  const [videoInput, setVideoInput] = useState('');
  const [videoLoadErr, setVideoLoadErr] = useState('');
  const ytIframeRef = (el) => setYTIframe(el);

  const handleLoadVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    setVideoLoadErr('');

    if (isYouTubeUrl(url)) {
      const embed = toYouTubeEmbed(url);
      if (!embed) { setVideoLoadErr('Could not parse YouTube URL.'); return; }
      setWatchParty(embed, userId, 'youtube');
      publishData({ type: 'load', url: embed, hostIdentity: userId, watchType: 'youtube' });
    } else {
      setWatchParty(url, userId, 'mp4');
      publishData({ type: 'load', url, hostIdentity: userId, watchType: 'mp4' });
      setTimeout(() => {
        const el = getVideoEl();
        if (el) el.play().catch(() => {});
        publishData({ type: 'play', time: 0, hostIdentity: userId });
      }, 600);
    }
  };

  const handleHostPlayPause = () => {
    const el = getVideoEl();
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      publishData({ type: 'play', time: el.currentTime, hostIdentity: userId });
      emitReaction('play');
    } else {
      el.pause();
      publishData({ type: 'pause', time: el.currentTime, hostIdentity: userId });
      emitReaction('pause');
      flushSoon(); // drain one 'soon' whisper on pause
    }
  };

  const handleHostSeek = (e) => {
    const el = getVideoEl();
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * el.duration;
    el.currentTime = t;
    publishData({ type: 'seek', time: t, hostIdentity: userId });
    emitReaction('seek');
  };

  // React to remote participants speaking or going silent
  const prevSpeakingRef = useRef([]);
  useEffect(() => {
    const prev = prevSpeakingRef.current;
    const remoteIds = participants.map(p => p.identity);

    // A remote participant started speaking
    const newSpeakers = speakingIds.filter(id => id !== userId && !prev.includes(id));
    if (newSpeakers.length) emitReaction('speech');

    // A remote participant went silent (was speaking, now isn't)
    const newSilent = prev.filter(id => id !== userId && !speakingIds.includes(id));
    if (newSilent.length && remoteIds.some(id => newSilent.includes(id))) {
      emitReaction('silence');
      flushSoon(); // natural pause after someone stops talking → drain soon queue
    }

    prevSpeakingRef.current = speakingIds;
  }, [speakingIds]);

  // Dispatch whisper to twin based on timing
  const whispers = useAppStore(s => s.whispers);
  const prevWhisperCountRef = useRef(0);
  useEffect(() => {
    if (whispers.length > prevWhisperCountRef.current) {
      const newest = whispers[whispers.length - 1];
      if (newest) enqueueWhisper(newest.text, newest.timing);
    }
    prevWhisperCountRef.current = whispers.length;
  }, [whispers.length]);

  // Periodic sync broadcast from host (every 5 s) so late joiners catch up.
  // Works for both MP4 (video element) and YouTube (iframe — no currentTime available).
  useEffect(() => {
    if (watchHost !== userId || !watchUrl) return;
    const id = setInterval(() => {
      const el = getVideoEl(); // null for YouTube — that's fine, we still broadcast URL
      publishData({
        type: 'sync',
        url: watchUrl,
        watchType: watchType || 'mp4',
        hostIdentity: userId,
        time: el?.currentTime ?? 0,
        playing: el ? !el.paused : true,
      });
    }, 5000);
    return () => clearInterval(id);
  }, [watchHost, userId, watchUrl, watchType]);

  // Re-broadcast current watch state whenever a new participant joins
  const prevParticipantCountRef = useRef(0);
  useEffect(() => {
    const count = participants.length;
    if (count > prevParticipantCountRef.current && watchUrl && watchHost === userId) {
      publishData({ type: 'load', url: watchUrl, hostIdentity: userId, watchType: watchType || 'mp4' });
    }
    prevParticipantCountRef.current = count;
  }, [participants.length]);

  useEffect(() => {
    // `active` prevents stale callbacks from a React StrictMode cleanup
    // from updating state on the subsequent re-mount
    let active = true;

    const init = async () => {
      let token = roomToken;
      let rid = roomId;

      console.log('[SMyS Room init] inviteRoomId:', inviteRoomId, '| roomId:', rid, '| hasToken:', !!token);

      if (inviteRoomId && !token) {
        console.log('[SMyS Room] guest path → calling /rooms/join with roomId:', inviteRoomId);
        try {
          const res = await fetch(`${API}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: inviteRoomId, displayName }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          token = data.token;
          rid = data.roomId;
          console.log('[SMyS Room] /rooms/join OK → roomId:', rid, '| identity:', data.participantIdentity);
          if (!active) { console.log('[SMyS Room] inactive after join — aborting'); return; }
          setRoomId(rid);
          setRoomToken(token);
          useAppStore.getState().setIdentity({ userId: data.participantIdentity });
        } catch (e) {
          if (!active) return;
          setErr('Could not join room: ' + e.message);
          setJoining(false);
          return;
        }
      }

      if (token && rid) {
        const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://smys-x5zur9v7.livekit.cloud';
        console.log('[SMyS Room] calling initLiveKit | rid:', rid, '| livekitUrl:', livekitUrl || '(none — demo mode)');
        if (livekitUrl) {
          await initLiveKit(livekitUrl, token, {
            selfieDataUrl,
            displayName,
            onConnected: () => { if (active) { setConnected(true); setJoining(false); setReconnecting(false); } },
            onParticipants: (list) => { if (active) setParticipants(list); },
            onSpeaking: (ids) => { if (active) setSpeakingIds(ids); },
            onReconnecting: () => { if (active) setReconnecting(true); },
            onReconnected: () => { if (active) setReconnecting(false); },
            onError: (e) => { if (active) { setErr(e); setJoining(false); } },
            onMicStatus: (s) => {
              if (!active) return;
              setMicState(s);
              if (s?.status === 'on') setMicBannerDismissed(false);
            },
            onData: (msg, fromIdentity) => {
              if (!active) return;
              console.log('[SMyS onData] type:', msg.type, '| from:', fromIdentity);
              if (msg.type === 'load') {
                console.log('[SMyS onData] load → url:', msg.url?.slice(0, 60), '| watchType:', msg.watchType);
                setWatchParty(msg.url, msg.hostIdentity, msg.watchType || 'mp4');
              } else if (msg.type === 'sync') {
                if (msg.url && !useAppStore.getState().watchUrl) {
                  setWatchParty(msg.url, msg.hostIdentity, msg.watchType || 'mp4');
                }
                applyCommand({ type: msg.playing ? 'play' : 'pause', time: msg.time });
              } else if (msg.type === 'play' || msg.type === 'pause' || msg.type === 'seek') {
                applyCommand(msg);
                emitReaction(msg.type);
                if (msg.type === 'pause') flushSoon();
              } else if (msg.type === 'twinThought') {
                // Display a remote twin's thought bubble locally
                setTwinThought(msg.identity, msg.text);
                setTimeout(() => setTwinThought(msg.identity, null), msg.ttl || REACTION_DISPLAY_MS);
              }
            },
          });
        } else {
          // No LiveKit configured — demo mode
          if (active) { setConnected(true); setJoining(false); }
        }
      } else {
        if (active) setJoining(false);
      }
    };

    init();
    return () => {
      active = false;
      disconnectLiveKit();
    };
  }, []);

  const MIC_BANNER = {
    blocked: {
      icon: '🔒',
      headline: 'Browser blocked microphone',
      body: [
        'To fix: click the lock/mic icon in the address bar,',
        'set Microphone → Allow, then refresh this page.',
      ],
      showRetry: false,
    },
    denied: {
      icon: '🎙️',
      headline: 'Microphone access denied',
      body: ['Click Enable microphone below to try again.'],
      showRetry: true,
    },
    notfound: {
      icon: '🔌',
      headline: 'No microphone found',
      body: ['Plug in a microphone, then click Enable microphone.'],
      showRetry: true,
    },
    inuse: {
      icon: '⚠️',
      headline: 'Microphone in use by another app',
      body: ['Close other apps using the mic, then click Enable microphone.'],
      showRetry: true,
    },
    unknown: {
      icon: '⚠️',
      headline: 'Microphone unavailable',
      body: ['An unexpected error occurred. Click Enable microphone to retry.'],
      showRetry: true,
    },
  };

  // Single function used by both the banner button and the mic icon button
  const handleEnableMic = async () => {
    setMicBannerDismissed(false);
    await retryMic((s) => {
      setMicState(s);
      if (s?.status === 'on') setMicBannerDismissed(false);
    });
  };

  const handleToggleMute = async () => {
    if (isMuted) {
      await unmuteAudio();
      setMuted(false);
      setMicState(s => ({ ...s, status: 'on' }));
    } else {
      await muteAudio();
      setMuted(true);
      setMicState(s => ({ ...s, status: 'muted' }));
    }
  };

  const handleLeave = () => {
    disconnectLiveKit();
    resetRoom();
    useAppStore.getState().setScreen('entrance');
  };

  if (err) return (
    <div className="screen-full center-col">
      <div className="card">
        <p className="error" style={{ marginBottom: 12 }}>{err}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Try again</button>
      </div>
    </div>
  );

  if (joining) return (
    <div className="screen-full center-col">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <p style={{ fontSize: 18, color: '#a78bfa' }}>Loading your room…</p>
      </motion.div>
    </div>
  );

  return (
    <div className="room-root">
      {/* 3D Scene */}
      <Scene />

      {/* Reconnecting banner */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div
            className="reconnect-banner"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}>
            ⟳ Reconnecting…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic banner — top center, never overlaps right controls */}
      <AnimatePresence>
        {micError && MIC_BANNER[micStatus] && !micBannerDismissed && (
          <motion.div
            className="mic-error-banner"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}>
            <span className="mic-error-icon">{MIC_BANNER[micStatus].icon}</span>
            <div className="mic-error-text">
              <strong>{MIC_BANNER[micStatus].headline}</strong>
              {MIC_BANNER[micStatus].body.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
              {micState?.errorName && (
                <span style={{ fontSize: 11, opacity: 0.55, fontFamily: 'monospace' }}>
                  {micState.errorName}: {micState.errorMessage}
                </span>
              )}
            </div>
            {MIC_BANNER[micStatus].showRetry && (
              <button className="mic-error-btn" onClick={handleEnableMic} disabled={micRetrying}>
                {micRetrying ? 'Requesting…' : 'Enable microphone'}
              </button>
            )}
            {micStatus === 'blocked' && (
              <button className="mic-error-btn" onClick={() => window.location.reload()}>
                Refresh page
              </button>
            )}
            <button className="mic-error-close" onClick={() => setMicBannerDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participant list — bottom left, sorted by identity to match 3D seat order */}
      <div className="participant-list">
        {[
          { identity: userId || 'self', name: displayName, photoUrl: selfieDataUrl, isSelf: true },
          ...participants.map(p => ({ ...p, isSelf: false })),
        ]
          .sort((a, b) => a.identity.localeCompare(b.identity))
          .map(p => (
            <div key={p.identity} className={`participant-chip${p.isSelf ? ' self' : ''}`}>
              {p.photoUrl && <img src={p.photoUrl} alt={p.name} />}
              <span>{p.name}</span>
              {p.isSelf
                ? connected && (isMuted
                    ? <span className="muted-dot">🔇</span>
                    : <span className="live-dot" />)
                : speakingIds.includes(p.identity) && <span className="live-dot" />}
            </div>
          ))}
      </div>

      {/* Connection status — top center */}
      <div className="room-status">
        {connected
          ? <span style={{ color: '#34d399' }}>● Live</span>
          : <span style={{ color: '#f87171' }}>● Not connected</span>
        }
        {!(import.meta.env.VITE_LIVEKIT_URL || 'wss://smys-x5zur9v7.livekit.cloud') && (
          <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>Demo mode</span>
        )}
      </div>

      {/* Watch Party URL input — top right */}
      <div className="watch-party-panel">
        {!watchUrl ? (
          <div className="watch-party-input">
            <input
              className="watch-party-url"
              type="text"
              placeholder="Paste MP4 or YouTube URL…"
              value={videoInput}
              onChange={e => { setVideoInput(e.target.value); setVideoLoadErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLoadVideo()}
            />
            <button className="watch-party-load" onClick={handleLoadVideo}>Load video</button>
            {videoLoadErr && <span className="watch-party-err">{videoLoadErr}</span>}
          </div>
        ) : (
          <div className="watch-party-controls">
            <span className="watch-party-host">
              {watchHost === userId
                ? '🎬 You are the host'
                : `🎬 Host: ${participants.find(p => p.identity === watchHost)?.name || 'Guest'}`}
            </span>
            {watchHost === userId && watchType === 'mp4' && (
              <>
                <button className="ctrl-btn" onClick={handleHostPlayPause} title="Play / Pause">⏯</button>
                <div className="watch-seek-bar" onClick={handleHostSeek} title="Click to seek" />
              </>
            )}
            <button
              className="ctrl-btn"
              style={{ fontSize: 12 }}
              onClick={() => { clearWatchParty(); setVideoInput(''); setVideoLoadErr(''); }}
              title="Stop video">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* YouTube overlay — shown when watchType is 'youtube' */}
      {watchUrl && watchType === 'youtube' && (
        <div className="watch-yt-overlay">
          <iframe
            ref={ytIframeRef}
            src={watchUrl}
            className="watch-yt-iframe"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Watch Party"
          />
        </div>
      )}

      {/* Controls — bottom right */}
      <div className="room-controls">
        {/* Whisper */}
        <button className="ctrl-btn" onClick={() => setShowWhisper(v => !v)} title="Whisper a thought">
          💭
        </button>

        {/* Mic button — four visible states: asking / error / muted / on */}
        {import.meta.env.VITE_LIVEKIT_URL && (
          <div className="mic-btn-wrap">
            <button
              className={`ctrl-btn mic-btn mic-btn--${micStatus}`}
              onClick={
                micStatus === 'asking'  ? undefined
                : micStatus === 'blocked' ? () => setMicBannerDismissed(false)
                : micError              ? handleEnableMic
                : handleToggleMute
              }
              disabled={micStatus === 'asking'}
              title={
                micStatus === 'asking'  ? 'Requesting microphone…'
                : micStatus === 'blocked' ? 'Mic blocked — click for instructions'
                : micError              ? 'Mic error — click to retry'
                : micStatus === 'muted'  ? 'Unmute microphone'
                : micStatus === 'on'     ? 'Mute microphone'
                : 'Microphone'
              }>
              {micStatus === 'asking'  ? '⏳'
               : micStatus === 'blocked' ? '🔒'
               : micError              ? '⚠️'
               : micStatus === 'muted'  ? '🔇'
               : '🎙️'}
            </button>
            {micError && <span className="mic-err-dot" />}
          </div>
        )}

        {/* Record */}
        <RecordButton />

        {/* Leave */}
        <button
          className="ctrl-btn leave-btn"
          onClick={() => setShowLeaveConfirm(true)}
          title="Leave room">
          ✕
        </button>
      </div>

      {/* Leave confirmation */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            className="leave-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
              className="leave-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Leave room?</p>
              <p style={{ color: '#a78bfa', fontSize: 14, marginBottom: 20 }}>
                Your session will end and others will see you leave.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowLeaveConfirm(false)}>
                  Stay
                </button>
                <button className="btn-primary" style={{ flex: 1, background: '#7f1d1d' }} onClick={handleLeave}>
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whisper drawer */}
      <AnimatePresence>
        {showWhisper && <WhisperDrawer onClose={() => setShowWhisper(false)} />}
      </AnimatePresence>

      {/* Clip review modal */}
      <AnimatePresence>
        {currentClip && <ClipReview />}
      </AnimatePresence>
    </div>
  );
}
