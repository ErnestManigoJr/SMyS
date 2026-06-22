import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function Entrance() {
  const setScreen = useAppStore(s => s.setScreen);
  return (
    <motion.div className="screen-full center-col"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
      <motion.div className="smys-logo"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}>
        <div className="logo-ring">
          <span className="logo-text">SMyS</span>
        </div>
        <p className="logo-sub">See Myself</p>
      </motion.div>
      <motion.p className="entrance-tagline"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
        Your digital presence.<br />Live with someone.
      </motion.p>
      <motion.button className="btn-primary entrance-btn"
        onClick={() => setScreen('selfie')}
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.4 }}
        whileTap={{ scale: 0.96 }}>
        Enter SMyS
      </motion.button>
    </motion.div>
  );
}
