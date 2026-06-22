import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { registerVideoEl, unregisterVideoEl } from './watchParty';

export default function RoomScreen({ position }) {
  const glowRef = useRef();
  const { watchUrl, watchType } = useAppStore();
  const [videoTexture, setVideoTexture] = useState(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!watchUrl || watchType !== 'mp4') {
      setVideoTexture(null);
      setVideoError(false);
      unregisterVideoEl();
      return;
    }

    setVideoError(false);
    const el = document.createElement('video');
    el.src = watchUrl;
    el.crossOrigin = 'anonymous';
    el.loop = true;
    el.playsInline = true;
    el.load();

    el.addEventListener('error', () => setVideoError(true));

    registerVideoEl(el);

    const tex = new THREE.VideoTexture(el);
    tex.colorSpace = THREE.SRGBColorSpace;
    setVideoTexture(tex);

    return () => {
      el.pause();
      el.src = '';
      tex.dispose();
      unregisterVideoEl();
      setVideoTexture(null);
      setVideoError(false);
    };
  }, [watchUrl, watchType]);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity =
        0.18 + Math.sin(clock.getElapsedTime() * 0.5) * 0.06;
    }
    if (videoTexture) videoTexture.needsUpdate = true;
  });

  const showIdle = !watchUrl || watchType === 'youtube';

  return (
    <group position={position}>
      {/* Frame */}
      <RoundedBox args={[3.6, 2.1, 0.06]} radius={0.04} ref={glowRef}>
        <meshStandardMaterial color="#0a0a14" emissive="#4c1d95" emissiveIntensity={0.2} roughness={0.3} />
      </RoundedBox>

      {/* Screen surface */}
      <mesh position={[0, 0, 0.034]}>
        <planeGeometry args={[3.4, 1.95]} />
        {videoTexture && !videoError
          ? <meshBasicMaterial map={videoTexture} />
          : <meshBasicMaterial color="#060312" />}
      </mesh>

      {/* Idle label */}
      {showIdle && !videoError && (
        <>
          <Text position={[0, 0.2, 0.07]} fontSize={0.22} color="#a78bfa" anchorX="center">
            SMyS
          </Text>
          <Text position={[0, -0.08, 0.07]} fontSize={0.09} color="#6d6a7f" anchorX="center">
            See Myself · Live
          </Text>
        </>
      )}

      {/* YouTube label (iframe is rendered in Room.jsx as HTML overlay) */}
      {watchType === 'youtube' && !videoError && (
        <Text position={[0, 0, 0.07]} fontSize={0.09} color="#6d6a7f" anchorX="center">
          YouTube · see overlay
        </Text>
      )}

      {/* MP4 load error */}
      {videoError && (
        <>
          <Text position={[0, 0.15, 0.07]} fontSize={0.13} color="#f87171" anchorX="center">
            Video failed to load
          </Text>
          <Text position={[0, -0.1, 0.07]} fontSize={0.08} color="#6d6a7f" anchorX="center">
            Check URL and CORS settings
          </Text>
        </>
      )}
    </group>
  );
}
