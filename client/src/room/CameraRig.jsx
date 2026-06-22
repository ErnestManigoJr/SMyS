import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export default function CameraRig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 1.6, z: 3.5 });

  useFrame(({ mouse }) => {
    target.current.x = mouse.x * 0.3;
    target.current.y = 1.6 + mouse.y * 0.12;
    camera.position.x += (target.current.x - camera.position.x) * 0.04;
    camera.position.y += (target.current.y - camera.position.y) * 0.04;
    camera.lookAt(0, 1.2, 0);
  });

  return null;
}
