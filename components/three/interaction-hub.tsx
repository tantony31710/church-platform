'use client';

// A glowing node-sphere representing the volunteer community: each
// point is a volunteer, positioned on a sphere surface (fibonacci
// distribution, so points spread evenly instead of clustering at the
// poles), with edges drawn between nearby nodes. Slow ambient
// rotation plus a subtle pointer-parallax tilt.
//
// This file is only ever loaded via next/dynamic with ssr:false (see
// interaction-hub-loader.tsx) — @react-three/fiber touches canvas/DOM
// APIs that don't exist during server render.

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface NodeGraphProps {
  nodeCount: number;
  pointer: { x: number; y: number };
}

// Even distribution on a sphere surface — avoids the "bunched at the
// top and bottom" look you get from naive random lat/long sampling.
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    );
  }
  return points;
}

function NodeGraph({ nodeCount, pointer }: NodeGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  const positions = useMemo(() => fibonacciSphere(nodeCount, 2.2), [nodeCount]);

  // Connect each node to its 2 nearest neighbors — enough to read as
  // a "network" without becoming a solid tangled ball of lines.
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
    // Ambient rotation, always running.
    groupRef.current.rotation.y += delta * 0.06;

    // Gentle parallax toward the pointer position, eased rather than
    // snapped — lerp toward the target tilt each frame.
    const targetX = pointer.y * 0.25;
    const targetY = groupRef.current.rotation.y + pointer.x * 0.15 - groupRef.current.rotation.y;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);

    // Subtle per-node pulse so the sphere doesn't feel static.
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
        <Line key={i} points={[a, b]} color="#4c7fe0" transparent opacity={0.12} lineWidth={1} />
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
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#38bdf8"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Tracks normalized pointer position over the canvas so NodeGraph can
// tilt toward it. Lives inside <Canvas> to get access to R3F's
// pointer/viewport events without a manual window listener.
function PointerTracker({ onMove }: { onMove: (x: number, y: number) => void }) {
  const { size } = useThree();
  useFrame(({ pointer }) => {
    onMove(pointer.x, pointer.y);
  });
  return null;
}

export function InteractionHub({ volunteerCount = 16 }: { volunteerCount?: number }) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  return (
    <div 
      className="relative h-72 w-full rounded-lg overflow-hidden glass glow-ring"
      role="img"
      aria-label="Interactive visualization of the volunteer community network"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow/5 via-transparent to-accent/5" />
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.6} color="#7dd3fc" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#7f77dd" />
        <PointerTracker onMove={(x, y) => setPointer({ x, y })} />
        <NodeGraph nodeCount={volunteerCount} pointer={pointer} />
      </Canvas>
    </div>
  );
}
