import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface NodeGraphProps {
  nodeCount: number;
  pointer: { x: number; y: number };
}

function generateLayout(count: number, type: 'sphere' | 'random', radius: number): THREE.Vector3[] {
  if (type === 'random') {
    return Array.from({ length: count }, () => 
      new THREE.Vector3(
          (Math.random() - 0.5) * radius * 2,
          (Math.random() - 0.5) * radius * 2,
          (Math.random() - 0.5) * radius * 2
      )
    );
  }
  const points: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius));
  }
  return points;
}

function NodeGraph({ nodeCount, pointer }: NodeGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const parallaxRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  const positions = useMemo(() => generateLayout(nodeCount, 'sphere', 2.2), [nodeCount]);
  const parallaxPositions = useMemo(() => generateLayout(nodeCount, 'random', 4), [nodeCount]);

  useFrame((state, delta) => {
    if (!groupRef.current || !parallaxRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
    
    // Parallax effect
    parallaxRef.current.rotation.y = -pointer.x * 0.2;
    parallaxRef.current.rotation.x = pointer.y * 0.2;

    const t = state.clock.elapsedTime;
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const s = 1 + Math.sin(t * 1.5 + i) * 0.15;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      <group ref={groupRef}>
        {positions.map((pos, i) => (
          <mesh key={i} position={pos} ref={(el) => { if (el) nodeRefs.current[i] = el; }}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#2dd4bf" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={parallaxRef}>
        {parallaxPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CameraController({ pointer }: { pointer: { x: number; y: number } }) {
  const { camera } = useThree();
  useFrame((state, delta) => {
    const targetX = pointer.x * 0.5;
    const targetY = pointer.y * 0.5;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 2);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function PointerTracker({ onMove }: { onMove: (x: number, y: number) => void }) {
  useFrame(({ pointer }) => onMove(pointer.x, pointer.y));
  return null;
}

export function InteractionHub({ volunteerCount = 16 }: { volunteerCount?: number }) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  return (
    <div className="relative h-72 w-full rounded-lg overflow-hidden glass glow-ring">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow/5 via-transparent to-accent/5" />
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.6} color="#7dd3fc" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#2dd4bf" />
        <PointerTracker onMove={(x, y) => setPointer({ x, y })} />
        <CameraController pointer={pointer} />
        <NodeGraph nodeCount={volunteerCount} pointer={pointer} />
      </Canvas>
    </div>
  );
}
