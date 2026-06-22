import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { X } from 'lucide-react';

const TIMING_OPTIONS = [
  { id: 'hold', label: 'Hold', desc: 'Save it — bring in when the moment is right' },
  { id: 'soon', label: 'Soon', desc: 'Use this in the next natural pause' },
  { id: 'now',  label: 'Now',  desc: 'Say this as soon as possible' },
];

export default function WhisperDrawer({ onClose }) {
  const [text, setText] = useState('');
  const [timing, setTiming] = useState('hold');
  const [sent, setSent] = useState(false);
  const addWhisper = useAppStore(s => s.addWhisper);
  const whispers = useAppStore(s => s.whispers).filter(w => !w.used);

  const send = () => {
    if (!text.trim()) return;
    addWhisper(text.trim(), timing);
    setSent(true);
    setText('');
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <motion.div className="whisper-drawer"
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}>

      <div className="whisper-header">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Whisper</p>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Private thoughts — your Twin brings them in naturally</p>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <textarea
        className="whisper-input"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Whisper something…"
        rows={3}
        autoFocus
      />

      {/* Timing selector */}
      <div className="whisper-timing">
        {TIMING_OPTIONS.map(opt => (
          <button key={opt.id}
            className={`timing-btn ${timing === opt.id ? 'active' : ''}`}
            onClick={() => setTiming(opt.id)}>
            <strong>{opt.label}</strong>
            <span>{opt.desc}</span>
          </button>
        ))}
      </div>

      <button className="btn-primary whisper-send"
        onClick={send} disabled={!text.trim()}>
        {sent ? '✓ Whispered' : 'Whisper this →'}
      </button>

      {/* Queue */}
      {whispers.length > 0 && (
        <div className="whisper-queue">
          <p className="eyebrow" style={{ fontSize: 10, margin: '12px 0 6px' }}>Waiting to be used</p>
          {whispers.map(w => (
            <div key={w.id} className="whisper-queue-item">
              <span className={`timing-tag ${w.timing}`}>{w.timing}</span>
              <span style={{ fontSize: 13 }}>{w.text}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
