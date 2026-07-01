'use client';

// A subtle node graph representing the volunteer community — each
// node is a volunteer, edges connect people who've worked the same
// task. This is intentionally simple (no physics engine, no heavy
// geometry) since it's a background/ambient visual, not the app's
// core interaction surface.
//
// IMPORTANT: this file is only ever loaded via next/dynamic with
// ssr: false (see app/(dashboard)/tasks/page.tsx) — @react-three/fiber
// touches the DOM/canvas APIs that don't exist during server render.

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Node {
  position: [number, number, number];
}

function NodeGraph({ nodeCount }: { nodeCount: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Positions are randomized once per mount, not regenerated every
  // frame — recomputing a layout every render is the usual cause of
  // "why is my 3D scene janky" performance complaints.
  const nodes: Node[] = useMemo(
    () =>
      Array.from({ length: nodeCount }, () => ({
        position: [
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
        ],
      })),
    [nodeCount]
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#7F77DD" />
        </mesh>
      ))}
    </group>
  );
}

export function InteractionHub({ volunteerCount = 12 }: { volunteerCount?: number }) {
  return (
    <div className="h-64 w-full rounded-lg border border-border bg-white/40 backdrop-blur-glass overflow-hidden">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        <NodeGraph nodeCount={volunteerCount} />
      </Canvas>
    </div>
  );
}
