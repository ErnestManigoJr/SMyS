import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Copy, CheckCircle } from 'lucide-react';

export default function Invite() {
  const { roomId, setScreen } = useAppStore();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}?room=${roomId}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div className="screen-full center-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <p className="eyebrow">Invite</p>
        <h2>Send this link</h2>
        <p className="body-sm">Text this link to the person you want to be in the room with you. When they tap it, they will join your room.</p>

        <div className="invite-link-box" onClick={copy}>
          <span className="invite-link-text">{link}</span>
          {copied
            ? <CheckCircle size={20} color="#34d399" />
            : <Copy size={20} color="#a78bfa" />
          }
        </div>
        <p className="body-sm" style={{ marginTop: 8, color: copied ? '#34d399' : '#888' }}>
          {copied ? 'Copied! Now paste it in a text message.' : 'Tap to copy'}
        </p>

        <button className="btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={() => setScreen('room')}>
          I'm ready — enter the room
        </button>
      </div>
    </motion.div>
  );
}
