import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Download, X } from 'lucide-react';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClipReview() {
  const currentClip = useAppStore(s => s.currentClip);
  const setClip     = useAppStore(s => s.setClip);
  if (!currentClip) return null;

  const { url, size, mimeType } = currentClip;
  const ext = mimeType?.includes('mp4') ? 'mp4' : 'webm';

  const download = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `smys-${Date.now()}.${ext}`;
    a.click();
  };

  const discard = () => {
    URL.revokeObjectURL(url);
    setClip(null);
  };

  return (
    <motion.div className="clip-modal-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="clip-modal"
        initial={{ scale: 0.88, y: 30 }} animate={{ scale: 1, y: 0 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Clip saved</p>
            <h3 style={{ margin: 0 }}>Review & download</h3>
          </div>
          <button className="icon-btn" onClick={discard}><X size={18} /></button>
        </div>

        <video src={url} controls playsInline
          style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 300 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, marginBottom: 14 }}>
          <span className="clip-meta">{ext.toUpperCase()}</span>
          {size > 0 && <span className="clip-meta">{fmtSize(size)}</span>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={download}>
            <Download size={14} style={{ marginRight: 6 }} />
            Save to device
          </button>
          <button style={{ flex: 1 }} onClick={discard}>Discard</button>
        </div>

        <p className="body-sm" style={{ marginTop: 10, textAlign: 'center' }}>
          .webm plays in Chrome and Firefox. To share on TikTok, Reels, or Shorts, convert to MP4.
        </p>
      </motion.div>
    </motion.div>
  );
}
