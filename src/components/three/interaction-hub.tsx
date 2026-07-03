import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface NodeGraphProps {
  nodeCount: number;
  pointer: { x: number; y: number };
}

function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
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
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);

  const positions = useMemo(() => fibonacciSphere(nodeCount, 2.2), [nodeCount]);

  const edges = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    positions.forEach((p, i) => {
      const distances = positions
        .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceTo(q) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      distances.forEach(({ j }) => lines.push([p, positions[j]]));
    });
    return lines;
  }, [positions]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
    const targetX = pointer.y * 0.25;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
      ringRef.current.rotation.x += delta * 0.1;
    }

    const t = state.clock.elapsedTime;
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const s = 1 + Math.sin(t * 1.5 + i) * 0.15;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef}>
      <Ring ref={ringRef} args={[3.5, 3.6, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#2dd4bf" transparent opacity={0.2} side={THREE.DoubleSide} />
      </Ring>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color="#2dd4bf" transparent opacity={0.12} lineWidth={1} />
      ))}
      {positions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#2dd4bf" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
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
        <NodeGraph nodeCount={volunteerCount} pointer={pointer} />
      </Canvas>
    </div>
  );
}
