import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const API = import.meta.env.VITE_SERVER_URL || 'https://smys-production.up.railway.app';

export default function RoomChoice() {
  const { displayName, setRoomId, setRoomToken, setScreen } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const create = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoomId(data.roomId);
      setRoomToken(data.token);
      useAppStore.getState().setIdentity({ userId: data.participantIdentity });
      setScreen('invite');
    } catch (e) {
      setErr(e.message || 'Could not create room.');
    }
    setLoading(false);
  };

  return (
    <motion.div className="screen-full center-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <p className="eyebrow">Step 3 of 3</p>
        <h2>Start a room</h2>
        <p className="body-sm">Create a private SMyS room. You will get a link to share with one other person.</p>
        <button className="btn-primary" style={{ marginTop: 24, width: '100%' }}
          onClick={create} disabled={loading}>
          {loading ? 'Creating room…' : 'Create my room'}
        </button>
        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>
    </motion.div>
  );
}
