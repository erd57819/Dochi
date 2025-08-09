import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import todakImage from '../assets/todak.png';

// 3D 참견도치들 컴포넌트
function TodakSpriteField({ globalProgress, mousePosition }) {
  const groupRef = useRef();
  const texture = useLoader(THREE.TextureLoader, todakImage);
  
  // 참견도치 스프라이트들 위치 (섹션별 조절)
  const todakSprites = useMemo(() => {
    const sprites = [];
    const count = 12; // 적당한 개수로 조절
    for (let i = 0; i < count; i++) {
      sprites.push({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 30
        ],
        scale: 0.8 + Math.random() * 0.6,
        phase: i * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        appearThreshold: i / count // 진행도에 따라 점진적 등장
      });
    }
    return sprites;
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.children.forEach((sprite, index) => {
        const data = todakSprites[index];
        if (data) {
          // 부유하는 애니메이션
          sprite.position.y = data.position[1] + Math.sin(time + data.phase) * 2;
          
          // 회전
          sprite.rotation.z = time * data.rotationSpeed;
          
          // 마우스 인터랙션 - 마우스 근처에서 크기 증가
          const mouseX = mousePosition.x * 20;
          const mouseY = -mousePosition.y * 15;
          const distance = Math.sqrt(
            (sprite.position.x - mouseX) ** 2 + 
            (sprite.position.z - mouseY) ** 2
          );
          
          if (distance < 5) {
            const effect = (1 - distance / 5) * 0.5 + 1;
            sprite.scale.setScalar(data.scale * effect);
          } else {
            sprite.scale.setScalar(data.scale);
          }
          
          // 진행도에 따른 등장과 투명도
          const shouldAppear = globalProgress >= data.appearThreshold;
          const opacity = shouldAppear ? 
            Math.min(0.9, 0.3 + (globalProgress - data.appearThreshold) * 2) : 0;
          sprite.material.opacity = opacity;
        }
      });
    }
  });
  
  return (
    <group ref={groupRef}>
      {todakSprites.map((sprite, index) => (
        <sprite
          key={`todak-${index}`}
          position={sprite.position}
          scale={[sprite.scale * 2, sprite.scale * 2, 1]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={0.8}
            alphaTest={0.1}
          />
        </sprite>
      ))}
    </group>
  );
}

// vaalentin/2015 + 참견도치 하이브리드 씬
function VaalentinScene({ globalProgress, mousePosition, isTransitioning }) {
  const sceneRef = useRef();
  const particlesRef = useRef();
  const galaxyRef = useRef();
  const beamsRef = useRef();
  
  // 1000개 배경 파티클 (원본과 동일)
  const backgroundParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 1000; i++) {
      particles.push({
        position: [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ],
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2
      });
    }
    return particles;
  }, []);
  
  // 갤럭시 시스템 (5개 행성)
  const galaxyPlanets = useMemo(() => {
    const planets = [];
    for (let i = 0; i < 5; i++) {
      const radius = 5 + i * 2;
      planets.push({
        radius,
        angle: (i / 5) * Math.PI * 2,
        speed: 0.1 / (i + 1),
        size: 0.1 + i * 0.05
      });
    }
    return planets;
  }, []);
  
  // vaalentin 클론 애니메이션
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // 갤럭시 행성들 궤도 운동
    if (galaxyRef.current) {
      galaxyRef.current.children.forEach((planet, index) => {
        const planetData = galaxyPlanets[index];
        if (planetData) {
          const currentAngle = planetData.angle + time * planetData.speed;
          planet.position.x = Math.cos(currentAngle) * planetData.radius;
          planet.position.z = Math.sin(currentAngle) * planetData.radius;
        }
      });
    }
    
    // 배경 파티클들 미세한 움직임
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.02;
      particlesRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;
    }
    
    // 빔 효과들
    if (beamsRef.current) {
      beamsRef.current.children.forEach((beam, index) => {
        beam.material.opacity = 0.3 + Math.sin(time * 2 + index) * 0.2;
        beam.scale.y = 1 + Math.sin(time * 3 + index * 0.5) * 0.3;
      });
    }
    
    // 전체 씬 미세 회전
    if (sceneRef.current) {
      sceneRef.current.rotation.y = time * 0.005;
    }
  });
  
  return (
    <group ref={sceneRef}>
      {/* 3D 참견도치 스프라이트 필드 */}
      <TodakSpriteField 
        globalProgress={globalProgress}
        mousePosition={mousePosition}
      />
      
      {/* 1000개 배경 파티클 */}
      <group ref={particlesRef}>
        {backgroundParticles.map((particle, index) => (
          <mesh key={`particle-${index}`} position={particle.position}>
            <sphereGeometry args={[particle.size * 0.01, 4, 4]} />
            <meshBasicMaterial 
              color="#666666"
              transparent 
              opacity={particle.opacity * 0.2}
            />
          </mesh>
        ))}
      </group>
      
      {/* 갤럭시 시스템 - 5개 행성 */}
      <group ref={galaxyRef}>
        {galaxyPlanets.map((planet, index) => (
          <group key={`planet-${index}`}>
            {/* 행성 */}
            <mesh>
              <sphereGeometry args={[planet.size, 8, 8]} />
              <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
            
            {/* 궤도 링 (그라데이션) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.radius - 0.1, planet.radius + 0.1, 32]} />
              <meshBasicMaterial 
                color="#333333"
                transparent 
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
      
      {/* 빔 효과들 */}
      <group ref={beamsRef}>
        {[...Array(8)].map((_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          const radius = 12;
          return (
            <mesh 
              key={`beam-${index}`}
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
              ]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.05, 15, 0.05]} />
              <meshBasicMaterial 
                color="white"
                transparent 
                opacity={0.4}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* 섹션에 따른 추가 효과들 */}
      {globalProgress > 0.2 && (
        <group>
          {/* 플로우 필드 효과 */}
          {[...Array(50)].map((_, index) => (
            <mesh 
              key={`flow-${index}`}
              position={[
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
              ]}
            >
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshBasicMaterial 
                color="#999999"
                transparent 
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {/* 3D 도시 구조 (후반부) */}
      {globalProgress > 0.6 && (
        <group>
          {[...Array(20)].map((_, index) => (
            <mesh 
              key={`building-${index}`}
              position={[
                (Math.random() - 0.5) * 15,
                Math.random() * 5,
                (Math.random() - 0.5) * 15
              ]}
            >
              <boxGeometry args={[
                0.5 + Math.random() * 0.5,
                2 + Math.random() * 3,
                0.5 + Math.random() * 0.5
              ]} />
              <meshBasicMaterial 
                color="#333333"
                transparent 
                opacity={0.7}
                wireframe
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// vaalentin 스타일 배경 - 순수한 검정 (미니멀)
function VaalentinBackground({ globalProgress }) {
  const { scene } = useThree();
  
  useEffect(() => {
    // vaalentin 원본: 순수 검정 배경
    scene.background = new THREE.Color('#0a0a0a');
  }, [scene]);
  
  return null;
}

export default function PrePage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isScrollingRef = useRef(false);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  
  // 참견도치 섹션 데이터
  const sections = [
    {
      title: "TODAK",
      subtitle: "참견도치와 함께",
      description: "AI 갈등 해결의 새로운 경험을 시작하세요"
    },
    {
      title: "CONFLICT", 
      subtitle: "복잡한 갈등",
      description: "혼자서는 풀기 어려운 문제들이 있죠"
    },
    {
      title: "ANALYZE",
      subtitle: "AI 분석으로",
      description: "갈등의 본질을 정확히 파악합니다"
    },
    {
      title: "RESOLVE",
      subtitle: "맞춤형 해결책",
      description: "당신만의 갈등 해결 방법을 제시합니다"
    },
    {
      title: "HARMONY",
      subtitle: "더 나은 관계로",
      description: "참견도치와 함께 평화로운 일상을 만들어보세요"
    }
  ];
  
  const maxSection = sections.length - 1;
  
  // 부드러운 전역 진행도 업데이트
  useEffect(() => {
    const updateProgress = () => {
      // 목표 진행도 계산
      const target = currentSection / maxSection;
      targetProgressRef.current = target;
      
      // 부드러운 보간
      const animate = () => {
        const current = smoothProgressRef.current;
        const difference = targetProgressRef.current - current;
        
        if (Math.abs(difference) > 0.001) {
          smoothProgressRef.current += difference * (isTransitioning ? 0.08 : 0.05);
          setGlobalProgress(smoothProgressRef.current);
          requestAnimationFrame(animate);
        } else {
          smoothProgressRef.current = targetProgressRef.current;
          setGlobalProgress(smoothProgressRef.current);
        }
      };
      
      animate();
    };
    
    updateProgress();
  }, [currentSection, maxSection, isTransitioning]);
  
  // 페이지 이동 함수
  const handleEnterSite = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/main');
    }, 1500);
  }, [navigate]);
  
  // 마우스 이벤트
  const handleMouseMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    setMousePosition({ x, y });
  };
  
  // 개선된 스크롤 핸들러 - 더 부드러운 전환
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    setIsTransitioning(true);
    
    const delta = e.deltaY;
    
    if (delta > 0) {
      // 아래로 스크롤
      setCurrentSection(prev => Math.min(prev + 1, maxSection));
    } else if (delta < 0) {
      // 위로 스크롤  
      setCurrentSection(prev => Math.max(prev - 1, 0));
    }
    
    // 더 짧은 딜레이로 반응성 개선
    setTimeout(() => {
      isScrollingRef.current = false;
      setIsTransitioning(false);
    }, 800);
  }, [maxSection]);
  
  // 키보드 핸들러
  const handleKeyDown = useCallback((e) => {
    if (isScrollingRef.current) return;
    
    if (e.key === 'ArrowDown') {
      isScrollingRef.current = true;
      setIsTransitioning(true);
      setCurrentSection(prev => Math.min(prev + 1, maxSection));
      setTimeout(() => {
        isScrollingRef.current = false;
        setIsTransitioning(false);
      }, 800);
    } else if (e.key === 'ArrowUp') {
      isScrollingRef.current = true;
      setIsTransitioning(true);
      setCurrentSection(prev => Math.max(prev - 1, 0));
      setTimeout(() => {
        isScrollingRef.current = false;
        setIsTransitioning(false);
      }, 800);
    } else if (e.key === 'Enter' && currentSection === maxSection) {
      handleEnterSite();
    }
  }, [currentSection, maxSection, handleEnterSite]);
  
  // 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);
  
  return (
    <div 
      className="w-full h-screen bg-black overflow-hidden cursor-none relative"
      onMouseMove={handleMouseMove}
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
      >
        <VaalentinBackground globalProgress={globalProgress} />
        
        {/* vaalentin 조명 - 미니멀하고 차분함 */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.3} 
          color="white" 
        />
        
        {/* vaalentin 진짜 클론 씬 */}
        <VaalentinScene 
          globalProgress={globalProgress}
          mousePosition={mousePosition}
          isTransitioning={isTransitioning}
        />
        
        <fog attach="fog" args={['#000000', 15, 40]} />
      </Canvas>
      
      {/* vaalentin 스타일 UI - 미니멀 타이포그래피 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        {/* vaalentin 섹션 콘텐츠 */}
        <div 
          className={`text-center transition-all duration-1000 transform ${
            isTransitioning 
              ? 'opacity-10 scale-95' 
              : 'opacity-100 scale-100'
          }`}
        >
          <h1 className="text-8xl font-thin text-white mb-8 tracking-widest" 
              style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 100 }}>
            {sections[currentSection].title}
          </h1>
          <h2 className="text-2xl text-gray-400 font-thin mb-6 tracking-wider"
              style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 200 }}>
            {sections[currentSection].subtitle}
          </h2>
          <p className="text-lg text-gray-500 font-light max-w-md mx-auto leading-relaxed"
             style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 300 }}>
            {sections[currentSection].description}
          </p>
        </div>
        
        {/* vaalentin 스타일 시작 버튼 */}
        {currentSection === maxSection && (
          <button
            className="mt-16 px-8 py-3 border border-white/30 text-white font-thin text-sm tracking-widest transition-all duration-500 hover:border-white hover:bg-white/5 pointer-events-auto"
            onClick={handleEnterSite}
            style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 200 }}
          >
            참견도치 시작하기
          </button>
        )}
      </div>
      
      {/* vaalentin 스타일 인디케이터 - 미니멀 */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 z-20">
        {sections.map((_, index) => (
          <div
            key={index}
            className={`w-1 h-8 cursor-pointer transition-all duration-500 ${
              currentSection === index 
                ? 'bg-white opacity-100' 
                : 'bg-white/30 opacity-50 hover:opacity-70'
            }`}
            onClick={() => {
              if (!isScrollingRef.current) {
                isScrollingRef.current = true;
                setIsTransitioning(true);
                setCurrentSection(index);
                setTimeout(() => {
                  isScrollingRef.current = false;
                  setIsTransitioning(false);
                }, 800);
              }
            }}
            style={{ pointerEvents: 'auto' }}
          />
        ))}
      </div>
      
      {/* vaalentin 스타일 가이드 - 매우 미니멀 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center z-20">
        <p className="text-white/40 text-xs tracking-wider font-light"
           style={{ fontFamily: 'Raleway, sans-serif' }}>
          {currentSection < maxSection ? 'SCROLL TO NAVIGATE' : 'PRESS ENTER'}
        </p>
        {currentSection < maxSection && (
          <div className="mt-4 animate-pulse">
            <div className="w-0.5 h-4 bg-white/30 mx-auto"></div>
          </div>
        )}
      </div>
      
      {/* vaalentin 스타일 커서 - 미니멀 */}
      <div 
        className="fixed w-2 h-2 bg-white/50 pointer-events-none z-30 transition-all duration-200 rounded-full"
        style={{
          left: mousePosition.x * (window.innerWidth / 2) + (window.innerWidth / 2) - 4,
          top: -mousePosition.y * (window.innerHeight / 2) + (window.innerHeight / 2) - 4,
          transform: `scale(${isTransitioning ? 2 : 1})`,
          opacity: isTransitioning ? 1 : 0.7
        }}
      />
      
      {/* 전환 오버레이 - 검정으로 페이드 */}
      {isTransitioning && currentSection === maxSection && (
        <div className="absolute inset-0 bg-black z-40 opacity-90" />
      )}
    </div>
  );
}