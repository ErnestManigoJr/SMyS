import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

function darkenHex(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor(((n >> 16) & 0xff) * 0.4).toString(16).padStart(2, '0');
  const g = Math.floor(((n >> 8)  & 0xff) * 0.4).toString(16).padStart(2, '0');
  const b = Math.floor(( n        & 0xff) * 0.4).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export default function Person({
  position,
  photoUrl,
  name,
  isSelf,
  isSpeaking,
  avatarColor = '#7c3aed',
  thought = null,
}) {
  const groupRef   = useRef(); // full avatar — Y rotation turn
  const headRef    = useRef(); // head group — Y position bob + Y scale nod
  const backingRef = useRef(); // head backing material — emissive glow
  const haloRef    = useRef(); // halo ring material — opacity

  const [texture,  setTexture]  = useState(null);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    if (!photoUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(photoUrl, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      // The selfie is already square-cropped (240×240) from Selfie.jsx,
      // but guard against non-square sources just in case.
      const aspect = t.image.width / t.image.height;
      if (Math.abs(aspect - 1) > 0.02) {
        if (aspect > 1) {
          t.repeat.set(1 / aspect, 1);
          t.offset.set((1 - 1 / aspect) / 2, 0);
        } else {
          t.repeat.set(1, aspect);
          t.offset.set(0, (1 - aspect) / 2);
        }
      }
      setTexture(t);
    });
  }, [photoUrl]);

  useEffect(() => {
    setReacting(!!thought);
  }, [thought]);

  // Left-seat avatars turn toward center (+Y), right-seat avatars turn (-Y)
  const turnDir = position[0] < -0.1 ? 1 : position[0] > 0.1 ? -1 : 0;

  useFrame(({ clock }) => {
    const t     = clock.getElapsedTime();
    const phase = isSelf ? 0 : 1.2;

    // Full-body Y rotation toward adjacent avatar when reacting
    if (groupRef.current) {
      const targetY = reacting ? turnDir * 0.22 : 0;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.07;
    }

    // Head bob + nod scale
    if (headRef.current) {
      let bobSpeed, bobAmp, scaleY;
      if (isSpeaking) {
        bobSpeed = 4.5; bobAmp = 0.035; scaleY = 1 + Math.sin(t * 9 + phase) * 0.04;
      } else if (reacting) {
        bobSpeed = 5.0; bobAmp = 0.05;  scaleY = 1 + Math.sin(t * 10 + phase) * 0.055;
      } else {
        bobSpeed = 0.7; bobAmp = 0.02;  scaleY = 1;
      }
      headRef.current.position.y = Math.sin(t * bobSpeed + phase) * bobAmp;
      headRef.current.scale.y    = scaleY;
    }

    // Head backing emissive glow
    if (backingRef.current) {
      const target = isSpeaking ? 0.7 : reacting ? 1.0 : 0.25;
      backingRef.current.emissiveIntensity +=
        (target - backingRef.current.emissiveIntensity) * 0.08;
    }

    // Halo opacity
    if (haloRef.current) {
      const target = isSpeaking ? 0.75 : reacting ? 0.95 : 0.35;
      haloRef.current.opacity += (target - haloRef.current.opacity) * 0.1;
    }
  });

  const dark = darkenHex(avatarColor);

  return (
    <group ref={groupRef} position={position}>

      {/* Left leg */}
      <mesh position={[-0.1, 0.22, 0]} castShadow>
        <boxGeometry args={[0.15, 0.44, 0.18]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.1, 0.22, 0]} castShadow>
        <boxGeometry args={[0.15, 0.44, 0.18]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[0.56, 0.72, 0.24]} />
        <meshStandardMaterial color={dark} roughness={0.7} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.40, 0.72, 0]} castShadow>
        <boxGeometry args={[0.15, 0.62, 0.18]} />
        <meshStandardMaterial color={dark} roughness={0.7} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.40, 0.72, 0]} castShadow>
        <boxGeometry args={[0.15, 0.62, 0.18]} />
        <meshStandardMaterial color={dark} roughness={0.7} />
      </mesh>

      {/* Shoulder joints */}
      <mesh position={[-0.32, 0.94, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} emissive={avatarColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.32, 0.94, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} emissive={avatarColor} emissiveIntensity={0.2} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
        <meshStandardMaterial color={dark} roughness={0.7} />
      </mesh>

      {/* Head group — animates bob + nod */}
      <group ref={headRef}>

        {/* Head backing card — emissive glow on speak/react */}
        <mesh position={[0, 1.58, 0]}>
          <boxGeometry args={[0.72, 0.72, 0.1]} />
          <meshStandardMaterial
            ref={backingRef}
            color={dark}
            roughness={0.5}
            emissive={avatarColor}
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Face plane — selfie fills this forward-facing surface */}
        <mesh position={[0, 1.58, 0.056]}>
          <planeGeometry args={[0.68, 0.68]} />
          <meshStandardMaterial
            map={texture || null}
            color={texture ? '#ffffff' : avatarColor}
            roughness={0.4}
            emissive={texture ? '#000000' : dark}
            emissiveIntensity={0}
          />
        </mesh>

        {/* Glow halo ring */}
        <mesh position={[0, 1.58, -0.06]}>
          <ringGeometry args={[0.4, 0.47, 32]} />
          <meshBasicMaterial
            ref={haloRef}
            color={avatarColor}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Name label */}
        <Text
          position={[0, 2.08, 0]}
          fontSize={0.1}
          color={isSpeaking ? '#ffffff' : reacting ? '#e2d9f3' : '#cccccc'}
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.008}>
          {name || (isSelf ? 'You' : 'Guest')}
        </Text>

        {/* Twin thought bubble */}
        {thought && (
          <Html position={[0, 2.42, 0]} center distanceFactor={4} zIndexRange={[10, 0]}>
            <div className="twin-bubble">
              <span className="twin-bubble-tail" />
              {thought}
            </div>
          </Html>
        )}
      </group>

    </group>
  );
}
