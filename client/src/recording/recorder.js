const MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

let _recorder = null;
let _chunks   = [];
let _startMs  = null;
let _audioTracks = [];

export function supportedMimeType() {
  return MIME_TYPES.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
}

// onStop(blob, mimeType) is called when recording finishes
export async function startRecording(onStop) {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('Room canvas not found — Scene must be mounted');

  _chunks = [];
  _audioTracks = [];

  // Capture the Three.js canvas at 30 fps.
  // MP4 watch party is rendered as THREE.VideoTexture on the screen mesh, so it's included automatically.
  // YouTube is an iframe overlay and cannot be captured (cross-origin restriction).
  const canvasStream = canvas.captureStream(30);

  // Add local microphone track (best-effort; failure just records video-only)
  try {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    _audioTracks = mic.getAudioTracks();
    _audioTracks.forEach(t => canvasStream.addTrack(t));
  } catch { /* no mic */ }

  const mimeType = supportedMimeType();
  _recorder = new MediaRecorder(canvasStream, { mimeType });

  _recorder.ondataavailable = e => { if (e.data.size > 0) _chunks.push(e.data); };
  _recorder.onstop = () => {
    _audioTracks.forEach(t => t.stop());
    canvasStream.getTracks().forEach(t => t.stop());
    const blob = new Blob(_chunks, { type: mimeType });
    _recorder  = null;
    _startMs   = null;
    onStop(blob, mimeType);
  };

  _recorder.start(500); // chunk every 500 ms so data accumulates reliably
  _startMs = Date.now();
}

export function stopRecording() {
  if (_recorder?.state === 'recording') _recorder.stop();
}

export function elapsedSeconds() {
  return _startMs ? Math.floor((Date.now() - _startMs) / 1000) : 0;
}
