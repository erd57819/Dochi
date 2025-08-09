import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Text, Center, Float } from '@react-three/drei';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// 커스텀 웨이브 셰이더 머티리얼
const WaveMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#FFB120'),
    uColor2: new THREE.Color('#BF7D2C'),
    uIntensity: 1.0,
    uSpeed: 1.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uSpeed;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWave;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // 웨이브 효과 생성
      float wave1 = sin(position.x * 0.5 + uTime * uSpeed) * 0.1;
      float wave2 = cos(position.z * 0.3 + uTime * uSpeed * 0.5) * 0.15;
      float wave3 = sin(position.x * 0.2 + position.z * 0.4 + uTime * uSpeed * 0.8) * 0.08;
      
      vWave = wave1 + wave2 + wave3;
      
      vec3 newPosition = position;
      newPosition.y += vWave;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWave;
    
    void main() {
      // 그라데이션 색상 계산
      float mixFactor = sin(vUv.x * 3.14159) * sin(vUv.y * 3.14159) * 0.5 + 0.5;
      mixFactor += vWave * 2.0;
      mixFactor = clamp(mixFactor, 0.0, 1.0);
      
      vec3 finalColor = mix(uColor1, uColor2, mixFactor);
      
      // 웨이브 강도에 따른 알파값
      float alpha = 0.8 + vWave * 0.6;
      alpha *= uIntensity;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ WaveMaterial });

// 웨이브 배경 컴포넌트
function WaveBackground({ currentSection, isTransitioning }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // 전환 중일 때 더 격렬한 웨이브
      materialRef.current.uSpeed = isTransitioning ? 3.0 : 1.0;
      materialRef.current.uIntensity = isTransitioning ? 2.0 : 1.2;
    }
  });

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(30, 30, 64, 64);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <waveMaterial 
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 3D 텍스트 컴포넌트
function DramaticText({ text, position = [0, 0, 0], isVisible = true }) {
  const groupRef = useRef();
  const targetScale = isVisible ? 1 : 0;
  
  useFrame((state) => {
    if (groupRef.current) {
      // 부드러운 스케일 애니메이션
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale), 
        0.05
      );
      
      // 미세한 떨림 효과 (비장한 느낌)
      if (isVisible) {
        const shake = Math.sin(state.clock.elapsedTime * 8) * 0.002;
        groupRef.current.position.y = position[1] + shake;
      }
    }
  });

  if (!text) return null;

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <Center>
          <Text
            fontSize={1.5}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff"
            color="#FFB120"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#BF7D2C"
          >
            {text}
            <meshStandardMaterial
              color="#FFB120"
              metalness={0.8}
              roughness={0.2}
              emissive="#BF7D2C"
              emissiveIntensity={0.3}
            />
          </Text>
        </Center>
      </Float>
    </group>
  );
}

// 파티클 시스템
function Particles({ count = 100 }) {
  const meshRef = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      const color = new THREE.Color();
      color.setHSL(0.1 + Math.random() * 0.1, 0.7, 0.5 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [count]);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={1.0}
        sizeAttenuation
      />
    </points>
  );
}

// 메인 3D 배경 컴포넌트
export default function ThreeBackground({ 
  currentSection = 0, 
  isTransitioning = false, 
  sectionTexts = [] 
}) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none" style={{ opacity: 0.8 }}>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: 'rgba(0,0,0,0.1)' }}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} color="#FFB120" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#BF7D2C" />
        <pointLight position={[0, 5, 0]} intensity={1} color="#FFAA53" />
        
        {/* 웨이브 배경 */}
        <WaveBackground 
          currentSection={currentSection} 
          isTransitioning={isTransitioning} 
        />
        
        {/* 3D 텍스트 */}
        {sectionTexts.map((text, index) => (
          <DramaticText
            key={index}
            text={text}
            position={[0, 2, 0]}
            isVisible={currentSection === index && isTransitioning}
          />
        ))}
        
        {/* 항상 보이는 테스트 텍스트 */}
        <DramaticText
          text="참견도치"
          position={[0, 0, 2]}
          isVisible={true}
        />
        
        {/* 파티클 */}
        <Particles count={80} />
        
        {/* 안개 효과 */}
        <fog attach="fog" args={['#000000', 5, 20]} />
      </Canvas>
    </div>
  );
}