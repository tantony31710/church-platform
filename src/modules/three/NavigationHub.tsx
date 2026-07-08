import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

interface NavNode {
  to: string;
  label: string;
  position: THREE.Vector3;
}

const navItems = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/insights', label: 'Insights' },
  { to: '/admin', label: 'Admin' },
];

function NavNodeMesh({ item, position, onClick }: { item: { to: string, label: string }, position: THREE.Vector3, onClick: (to: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, hovered ? 1.2 : 1, 0.1));
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(item.to)}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={hovered ? '#7dd3fc' : '#2dd4bf'} emissive={hovered ? '#2dd4bf' : '#000'} />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle">
        {item.label}
      </Text>
    </group>
  );
}

export function NavigationHub() {
  const navigate = useNavigate();
  const nodes = useMemo(() => {
    return navItems.map((item, i) => {
      const angle = (i / navItems.length) * Math.PI * 2;
      return {
        ...item,
        position: new THREE.Vector3(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5),
      };
    });
  }, []);

  return (
    <div className="h-64 w-full">
      <Canvas camera={{ position: [0, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {nodes.map((node) => (
            <NavNodeMesh key={node.to} item={node} position={node.position} onClick={navigate} />
          ))}
        </Float>
      </Canvas>
    </div>
  );
}
