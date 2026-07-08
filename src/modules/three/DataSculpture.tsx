import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface DataSculptureProps {
  data: number[];
  color?: string;
}

export function DataSculpture({ data, color = '#22d3ee' }: DataSculptureProps) {
  const mesh = React.useRef<THREE.Mesh>(null);
  
  // Create a complex shape based on data
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2;
      const radius = 1 + data[i] * 0.5;
      p.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    return p;
  }, [data]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      mesh.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          speed={2}
          distort={0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}
