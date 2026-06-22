import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

// Resize + center-crop to a square thumbnail suitable for LiveKit metadata (~4–8 KB)
function toThumb(src, size = 240, quality = 0.72) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const min = Math.min(img.width, img.height);
      const sx  = (img.width  - min) / 2;
      const sy  = (img.height - min) / 2;
      const c   = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d').drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.src = src;
  });
}

export default function Selfie() {
  const setScreen = useAppStore(s => s.setScreen);
  const setIdentity = useAppStore(s => s.setIdentity);

  const [preview, setPreview] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [err, setErr] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const thumb = await toThumb(reader.result);
      setPreview(thumb);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setErr('');
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      setErr('Camera not available. Upload a photo instead.');
      setCameraOpen(false);
    }
  };

  const capture = async () => {
    const v = videoRef.current;
    // Draw mirrored frame to a temporary full-res canvas
    const tmp = document.createElement('canvas');
    tmp.width  = v.videoWidth  || 640;
    tmp.height = v.videoHeight || 640;
    const ctx = tmp.getContext('2d');
    ctx.translate(tmp.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    // Resize + center-crop to square thumbnail
    const thumb = await toThumb(tmp.toDataURL('image/jpeg', 0.9));
    setPreview(thumb);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const next = () => {
    setIdentity({ selfieDataUrl: preview, userId: `user_${Date.now()}` });
    setScreen('setup');
  };

  return (
    <motion.div className="screen-full center-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <p className="eyebrow">Step 1 of 3</p>
        <h2>Take your selfie</h2>
        <p className="body-sm">This becomes your SMyS Twin — your digital presence in the room.</p>

        {preview && (
          <motion.div className="selfie-preview" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <img src={preview} alt="Your selfie" />
            <div className="selfie-label">Your SMyS Twin</div>
          </motion.div>
        )}

        {cameraOpen && (
          <div className="camera-wrap">
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 14, transform: 'scaleX(-1)' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={capture}>Capture Selfie</button>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraOpen(false); }}>Cancel</button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!cameraOpen && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <label className="btn-outline" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              📷 Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
            <button className="btn-outline" style={{ flex: 1 }} onClick={openCamera}>🎥 Open Camera</button>
          </div>
        )}

        {err && <p className="error" style={{ marginTop: 8 }}>{err}</p>}

        <button className="btn-primary" style={{ marginTop: 20, width: '100%', opacity: preview ? 1 : 0.4 }}
          disabled={!preview} onClick={next}>
          This is me — continue →
        </button>
      </div>
    </motion.div>
  );
}
