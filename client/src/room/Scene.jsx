import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import Person from './Person';
import RoomScreen from './Screen';
import CameraRig from './CameraRig';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Named overrides first; fallback: deterministic hue from identity string
const NAME_COLORS = {
  ernest: '#7c3aed', // purple
  june:   '#a89683', // taupe
  andy:   '#0d9488', // teal
};

const FALLBACK_PALETTE = [
  '#0d9488', '#f59e0b', '#ec4899', '#0ea5e9',
  '#10b981', '#f97316', '#6366f1', '#ef4444',
];

function participantColor(identity = '', name = '') {
  const key = (name || identity).toLowerCase().split(/[\s_\-]/)[0];
  if (NAME_COLORS[key]) return NAME_COLORS[key];
  let hash = 0;
  for (let i = 0; i < identity.length; i++) hash = (hash * 31 + identity.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

// Seat X positions spread evenly around 0 with 1.6 spacing
function seatPositions(count) {
  const spacing = 1.6;
  const total = (count - 1) * spacing;
  return Array.from({ length: count }, (_, i) => [i * spacing - total / 2, 0, 0.5]);
}

export default function Scene() {
  const { selfieDataUrl, displayName, userId, participants, speakingIds, twinThoughts } = useAppStore();

  // Unified list sorted by identity so every client shows the same seat order
  const allParticipants = useMemo(() => {
    const local = {
      identity: userId || 'self',
      name: displayName || 'You',
      photoUrl: selfieDataUrl,
      isSelf: true,
    };
    const remotes = participants.map(p => ({ ...p, isSelf: false }));
    return [local, ...remotes].sort((a, b) => a.identity.localeCompare(b.identity));
  }, [userId, displayName, selfieDataUrl, participants]);

  const seats = useMemo(() => seatPositions(allParticipants.length), [allParticipants.length]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        shadows={!isMobile}
        camera={{ position: [0, 1.6, 3.5], fov: 55 }}
        gl={{ antialias: !isMobile, alpha: false, preserveDrawingBuffer: true }}
        style={{ background: 'linear-gradient(180deg, #0f0720 0%, #06030d 100%)' }}>

        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow={!isMobile} />
          <pointLight position={[-3, 2, -2]} intensity={0.6} color="#7c3aed" />
          <pointLight position={[3, 1, 2]} intensity={0.4} color="#ec4899" />

          {!isMobile && <Environment preset="night" />}

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color="#0d0a1a" roughness={0.9} />
          </mesh>

          {/* Back wall */}
          <mesh position={[0, 2, -4]}>
            <planeGeometry args={[12, 6]} />
            <meshStandardMaterial color="#0a0716" roughness={1} />
          </mesh>

          <RoomScreen position={[0, 2.2, -3.5]} />

          {/* Couch proxy — width scales with participant count */}
          <mesh position={[0, 0.3, 0.5]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(2.4, allParticipants.length * 1.4), 0.6, 0.9]} />
            <meshStandardMaterial color="#1a1030" roughness={0.8} />
          </mesh>

          {allParticipants.map((p, i) => (
            <Person
              key={p.identity}
              position={seats[i]}
              photoUrl={p.photoUrl || ''}
              name={p.name}
              isSelf={p.isSelf}
              isSpeaking={speakingIds.includes(p.identity)}
              avatarColor={participantColor(p.identity, p.name)}
              thought={twinThoughts[p.identity] || null}
            />
          ))}

          <ContactShadows
            position={[0, 0, 0]}
            opacity={isMobile ? 0.25 : 0.5}
            scale={8}
            blur={isMobile ? 1 : 2}
            far={4}
          />

          <CameraRig />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
