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

// Two thin wireframe rings orbiting at different angles/speeds around
// the node-sphere — a common "premium tech" 3D motif (think Stripe's
// or Linear's marketing sites) that reads as depth even though it's
// just two flat circles rotating in 3D space.
function OrbitRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.15;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.1;
  });

  return (
    <>
      <group rotation={[Math.PI / 2.6, 0, 0]}>
        <Ring ref={ring1} args={[2.7, 2.72, 64]}>
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} side={THREE.DoubleSide} />
        </Ring>
      </group>
      <group rotation={[Math.PI / 1.8, Math.PI / 5, 0]}>
        <Ring ref={ring2} args={[3.05, 3.07, 64]}>
          <meshBasicMaterial color="#5eead4" transparent opacity={0.18} side={THREE.DoubleSide} />
        </Ring>
      </group>
    </>
  );
}

function NodeGraph({ nodeCount, pointer }: NodeGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

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

    const t = state.clock.elapsedTime;
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const s = 1 + Math.sin(t * 1.5 + i) * 0.15;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef}>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color="#22d3ee" transparent opacity={0.14} lineWidth={1} />
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
          <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.3} toneMapped={false} />
        </mesh>
      ))}
      <OrbitRings />
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow/10 via-transparent to-accent/10" />
      <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.7} color="#67e8f9" />
        <pointLight position={[-5, -3, -5]} intensity={0.35} color="#22d3ee" />
        <PointerTracker onMove={(x, y) => setPointer({ x, y })} />
        <NodeGraph nodeCount={volunteerCount} pointer={pointer} />
      </Canvas>
    </div>
  );
}
