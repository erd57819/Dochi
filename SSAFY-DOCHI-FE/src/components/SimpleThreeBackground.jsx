import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 빨려들어가는 나선형 터널 효과
function SpiralTunnel({ isTransitioning }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * (isTransitioning ? 2 : 0.5);
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(20)].map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 2]} rotation={[0, 0, i * 0.3]}>
          <ringGeometry args={[1 + i * 0.3, 1.2 + i * 0.3, 32]} />
          <meshStandardMaterial 
            color="#FFB120"
            emissive="#BF7D2C"
            emissiveIntensity={isTransitioning ? 0.8 : 0.2}
            transparent
            opacity={1 - (i * 0.05)}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// 웨이브 효과를 위한 평면
function WavePlane({ currentSection, isTransitioning }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const y = Math.sin(x * 0.5 + time) * 0.5 + Math.cos(z * 0.3 + time) * 0.3;
        positions.setY(i, y * (isTransitioning ? 2 : 1));
      }
      
      positions.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[20, 20, 32, 32]} />
      <meshStandardMaterial 
        color="#BF7D2C"
        transparent
        opacity={0.4}
        wireframe={false}
      />
    </mesh>
  );
}

// 빨려들어가는 파티클
function SuckedParticles({ count = 100, isTransitioning }) {
  const pointsRef = useRef();
  const particlesRef = useRef();

  const particles = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 10 + 5;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      velocities[i * 3] = -Math.cos(angle) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = -Math.sin(angle) * 0.02;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current && particlesRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array;
      const velocities = particlesRef.current;
      const speed = isTransitioning ? 5 : 1;
      
      for (let i = 0; i < count; i++) {
        // 중심으로 빨려들어가는 움직임
        positions[i * 3] += velocities[i * 3] * speed;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * speed;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * speed;
        
        // 중심에 도달하면 다시 외곽으로
        const distance = Math.sqrt(
          positions[i * 3] ** 2 + 
          positions[i * 3 + 1] ** 2 + 
          positions[i * 3 + 2] ** 2
        );
        
        if (distance < 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 10 + 5;
          
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  React.useEffect(() => {
    particlesRef.current = particles.velocities;
  }, [particles.velocities]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isTransitioning ? 0.2 : 0.08}
        color="#FFAA53"
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// 화면이 부서지는 효과
function ShatterEffect() {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      // 부서진 조각들이 흩어지는 애니메이션
      groupRef.current.children.forEach((child, i) => {
        const time = state.clock.elapsedTime;
        child.position.x += Math.sin(time + i) * 0.02;
        child.position.y += Math.cos(time + i * 0.5) * 0.02;
        child.rotation.x += 0.05;
        child.rotation.y += 0.03;
      });
    }
  });

  const fragments = React.useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        Math.random() * 2
      ],
      size: Math.random() * 0.5 + 0.2,
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ]
    }));
  }, []);

  return (
    <group ref={groupRef}>
      {fragments.map((fragment, i) => (
        <mesh 
          key={i}
          position={fragment.position}
          rotation={fragment.rotation}
        >
          <boxGeometry args={[fragment.size, fragment.size, 0.1]} />
          <meshStandardMaterial 
            color="#FFB120"
            transparent
            opacity={0.8}
            emissive="#BF7D2C"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function SimpleThreeBackground({ 
  currentSection = 0, 
  isTransitioning = false 
}) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 1,
        background: `radial-gradient(circle at center, rgba(255,177,32,0.1) 0%, rgba(191,125,44,0.05) 50%, transparent 100%)`
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        {/* 조명 */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          color="#FFB120" 
        />
        <pointLight 
          position={[-5, 0, 5]} 
          intensity={0.8} 
          color="#BF7D2C" 
        />
        
        {/* 빨려들어가는 나선형 터널 */}
        <SpiralTunnel isTransitioning={isTransitioning} />
        
        {/* 웨이브 평면 */}
        <WavePlane 
          currentSection={currentSection}
          isTransitioning={isTransitioning}
        />
        
        {/* 빨려들어가는 파티클 */}
        <SuckedParticles count={60} isTransitioning={isTransitioning} />
        
        {/* 전환 시 화면 전체에 균열/파편 효과 */}
        {isTransitioning && <ShatterEffect />}
      </Canvas>
    </div>
  );
}