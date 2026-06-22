import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const VOICES = [
  { id: 'alloy', label: 'Alloy — calm, neutral' },
  { id: 'echo', label: 'Echo — clear, steady' },
  { id: 'fable', label: 'Fable — warm, expressive' },
  { id: 'onyx', label: 'Onyx — deep, grounded' },
  { id: 'nova', label: 'Nova — bright, friendly' },
  { id: 'shimmer', label: 'Shimmer — soft, clear' },
];

export default function Setup() {
  const { selfieDataUrl, setIdentity, setScreen, inviteRoomId } = useAppStore();
  const [name, setName] = useState('');
  const [voiceId, setVoiceId] = useState('alloy');
  const [style, setStyle] = useState('realistic');

  const next = () => {
    if (!name.trim()) return;
    setIdentity({ displayName: name.trim(), voiceId, style });
    setScreen(inviteRoomId ? 'room' : 'roomchoice');
  };

  return (
    <motion.div className="screen-full center-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <p className="eyebrow">Step 2 of 3</p>
        <h2>Set up your Twin</h2>

        {selfieDataUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '10px 14px', background: 'rgba(124,58,237,.15)', borderRadius: 14, border: '1px solid rgba(124,58,237,.3)' }}>
            <img src={selfieDataUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
            <span className="body-sm" style={{ color: '#c4b5fd' }}>Your face is your Twin.</span>
          </div>
        )}

        <label className="field-label">Your name
          <input className="field-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="What should the room call you?" autoFocus />
        </label>

        <label className="field-label">Your digital voice
          <select className="field-input" value={voiceId} onChange={e => setVoiceId(e.target.value)}>
            {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>

        <label className="field-label">Twin style
          <select className="field-input" value={style} onChange={e => setStyle(e.target.value)}>
            <option value="realistic">Realistic — natural photo</option>
            <option value="hologram">Hologram — blue glow</option>
            <option value="noir">Noir — black and white</option>
            <option value="anime">Anime — vivid, saturated</option>
            <option value="clay">Clay — warm, sculptural</option>
          </select>
        </label>

        <button className="btn-primary" style={{ marginTop: 20, width: '100%', opacity: name.trim() ? 1 : 0.4 }}
          disabled={!name.trim()} onClick={next}>
          Build my Twin →
        </button>
      </div>
    </motion.div>
  );
}
