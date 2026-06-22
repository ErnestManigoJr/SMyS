import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { startRecording, stopRecording, elapsedSeconds } from './recorder';

const MAX_SECONDS = 120;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function RecordButton() {
  const isRecording = useAppStore(s => s.isRecording);
  const watchType   = useAppStore(s => s.watchType);
  const setRecording = useAppStore(s => s.setRecording);
  const setClip      = useAppStore(s => s.setClip);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleStart = async () => {
    try {
      await startRecording((blob, mimeType) => {
        setClip({ url: URL.createObjectURL(blob), size: blob.size, mimeType });
        setRecording(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
      });
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const s = elapsedSeconds();
        setElapsed(s);
        if (s >= MAX_SECONDS) stopRecording();
      }, 500);
    } catch (e) {
      console.error('[recorder]', e.message);
      setRecording(false);
    }
  };

  const ytNote = watchType === 'youtube'
    ? 'YouTube overlay cannot be captured — only the 3D room is recorded'
    : null;

  return (
    <div className="record-wrap">
      {isRecording && (
        <span className="record-timer">{fmt(elapsed)}</span>
      )}
      <motion.button
        className={`ctrl-btn record-btn${isRecording ? ' recording' : ''}`}
        onClick={isRecording ? stopRecording : handleStart}
        whileTap={{ scale: 0.92 }}
        title={
          ytNote ?? (isRecording
            ? `Stop recording (${fmt(MAX_SECONDS - elapsed)} left)`
            : 'Record this moment')
        }>
        {isRecording
          ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>⏹</motion.span>
          : '⏺'
        }
      </motion.button>
    </div>
  );
}
