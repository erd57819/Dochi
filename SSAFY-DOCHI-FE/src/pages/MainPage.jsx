import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Typed from 'typed.js';

import image9 from "@/assets/image 9.png";
import image10 from "@/assets/image 10.png";
import image17 from "@/assets/image 17.png";
import image18 from "@/assets/image 18.png";
import image65 from "@/assets/image-65.png";
import social from "@/assets/Social.png";
import line from "@/assets/line.png";
import vector2 from "@/assets/Vector-2.png";
import vector3 from "@/assets/Vector-3.png";
import vector from "@/assets/Vector.png";
import todak from "@/assets/todak.png";

export const MainPage = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [animatedSections, setAnimatedSections] = useState(new Set());
  
  // Typed.js refs
  const typewriterRef = useRef(null);
  const typewriterLine1Ref = useRef(null);
  const typewriterLine2Ref = useRef(null);
  const typedInstances = useRef([]);

  const typewriterStyle = `
    .typewriter {
      overflow: hidden;
      border-right: 3px solid transparent;
      white-space: nowrap;
      width: 0;
    }
    
    .typewriter.animate {
      animation: typing 1.5s steps(9, end) 0.3s forwards, blink-caret 0.75s step-end infinite 0.3s;
      animation-fill-mode: both;
    }
    
    .typewriter.animate.finished {
      border-right: none;
    }
    
    .custom-cursor {
      animation: blink 1s infinite;
      font-size: inherit;
      line-height: inherit;
      color: #000;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    
    .typewriter-line1 {
      overflow: hidden;
      border-right: 3px solid transparent;
      white-space: nowrap;
      width: 0;
    }
    
    .typewriter-line1.animate {
      animation: typing-line1 1.0s steps(6, end) 0.7s forwards, blink-caret 0.75s step-end infinite 0.7s;
      animation-fill-mode: both;
    }
    
    .typewriter-line1.animate.finished {
      border-right: none;
    }
    
    .typewriter-line2 {
      overflow: hidden;
      border-right: 3px solid transparent;
      white-space: nowrap;
      width: 0;
      opacity: 0;
    }
    
    .typewriter-line2.animate {
      animation: fade-in 0.1s ease-in 1.8s forwards, typing-line2 1.5s steps(10, end) 1.8s forwards, blink-caret 0.75s step-end infinite 1.8s;
    }
    
    .typewriter-line2.animate.finished {
      border-right: none;
    }
    
    @keyframes fade-in {
      to { opacity: 1; }
    }
    
    .shake-text {
      
    }
    
    .shake-text.animate {
      animation: shake 0.5s ease-in-out 2.0s both;
    }
    
    .pulse-text {
      
    }
    
    .pulse-text.animate {
      animation: pulse-scale 1.0s ease-in-out 0.3s both;
    }
    
    .fade-in-element {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-element.animate {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .fade-in-title {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-title.animate {
      animation: fadeInUp 0.6s ease-out 0.15s forwards;
    }
    
    .fade-in-image {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-image.animate {
      animation: fadeInUp 0.6s ease-out 0.3s forwards;
    }
    
    .fade-in-button {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-button.animate {
      animation: fadeInUp 0.6s ease-out 0.45s forwards;
    }
    
    .fade-in-link {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-link.animate {
      animation: fadeInUp 0.6s ease-out 0.6s forwards;
    }
    
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes typing {
      from { width: 0 }
      to { width: 100% }
    }
    
    @keyframes typing-line1 {
      0% { width: 0; }
      100% { width: 10ch; }
    }
    
    @keyframes typing-line2 {
      0% { width: 0; }
      100% { width: 16ch; }
    }
    
    @keyframes blink-caret {
      from, to { border-color: transparent }
      50% { border-color: #000 }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
      20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    
    @keyframes pulse-scale {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;

  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleWheel = (e) => {
      const currentScrollTop = window.scrollY;
      const sectionHeight = window.innerHeight;
      
      if (currentScrollTop >= sectionHeight * 3.9) {
        return;
      }
      
      e.preventDefault();
      
      if (isScrolling) return;
      
      isScrolling = true;
      const delta = e.deltaY;
      
      let targetScroll;
      
      if (delta > 0) {
        if (currentScrollTop < sectionHeight * 0.8) {
          targetScroll = sectionHeight;
        } else if (currentScrollTop < sectionHeight * 1.8) {
          targetScroll = sectionHeight * 2;
        } else if (currentScrollTop < sectionHeight * 2.8) {
          targetScroll = sectionHeight * 3;
        } else if (currentScrollTop < sectionHeight * 3.8) {
          targetScroll = sectionHeight * 4;
        }
      } else {
        if (currentScrollTop > sectionHeight * 3.2) {
          targetScroll = sectionHeight * 3;
        } else if (currentScrollTop > sectionHeight * 2.2) {
          targetScroll = sectionHeight * 2;
        } else if (currentScrollTop > sectionHeight * 1.2) {
          targetScroll = sectionHeight;
        } else if (currentScrollTop > sectionHeight * 0.2) {
          targetScroll = 0;
        }
      }
      
      if (targetScroll !== undefined) {
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 600);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const sectionHeight = window.innerHeight;
      
      let newSection;
      if (scrollTop < sectionHeight * 0.5) {
        newSection = 0;
      } else if (scrollTop < sectionHeight * 1.5) {
        newSection = 1;
      } else if (scrollTop < sectionHeight * 2.5) {
        newSection = 2;
      } else if (scrollTop < sectionHeight * 3.5) {
        newSection = 3;
      } else {
        newSection = 4;
      }
      
      if (currentSection !== newSection) {
        setCurrentSection(newSection);
        
        const typewriterEl = document.querySelector('.typewriter');
        const shakeEl = document.querySelector('.shake-text');
        if (typewriterEl) {
          typewriterEl.classList.remove('animate', 'finished');
        }
        if (shakeEl) {
          shakeEl.classList.remove('animate', 'finished');
        }
        
        const line1El = document.querySelector('.typewriter-line1');
        const line2El = document.querySelector('.typewriter-line2');
        const pulseEl = document.querySelector('.pulse-text');
        if (line1El) line1El.classList.remove('animate', 'finished');
        if (line2El) line2El.classList.remove('animate', 'finished');
        if (pulseEl) pulseEl.classList.remove('animate');
        
        const fadeElements = document.querySelectorAll('#section-2 .fade-in-element, #section-2 .fade-in-title, #section-2 .fade-in-image, #section-2 .fade-in-button, #section-2 .fade-in-link');
        fadeElements.forEach(el => el.classList.remove('animate'));
        
        setTimeout(() => {
          // Clear previous typed instances
          typedInstances.current.forEach(typed => {
            if (typed) typed.destroy();
          });
          typedInstances.current = [];
          
          if (newSection === 0) {
            const shakeEl = document.querySelector('.shake-text');
            if (shakeEl) shakeEl.classList.add('animate');
            
            // Typed.js for .typewriter
            if (typewriterRef.current) {
              const typed = new Typed(typewriterRef.current, {
                strings: ['좁혀지지 않는 갈등'],
                typeSpeed: 80,
                showCursor: true,
                cursorChar: '|',
                cursorClass: 'typed-cursor'
              });
              typedInstances.current.push(typed);
            }
            
            setTimeout(() => {
              if (shakeEl) shakeEl.classList.add('finished');
            }, 2500);
          }
          
          if (newSection === 1) {
            const pulseEl = document.querySelector('.pulse-text');
            if (pulseEl) pulseEl.classList.add('animate');
            
            // Typed.js for .typewriter-line1
            if (typewriterLine1Ref.current) {
              const typed1 = new Typed(typewriterLine1Ref.current, {
                strings: ['<div><span class="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">비밀보장</span><span class="text-black">되는</span></div><div><span class="text-[#030303]">참견도치</span><span class="text-black">가 들어줄게요</span><span class="custom-cursor">|</span></div>'],
                typeSpeed: 70,
                showCursor: false,
              });
              typedInstances.current.push(typed1);
            }
          }
          
          if (newSection === 2) {
            const fadeElements = document.querySelectorAll('#section-2 .fade-in-element, #section-2 .fade-in-title, #section-2 .fade-in-image, #section-2 .fade-in-button, #section-2 .fade-in-link');
            fadeElements.forEach(el => el.classList.add('animate'));
          }
        }, 100);
        
        setAnimatedSections(new Set([newSection]));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    
    setTimeout(() => {
      setAnimatedSections(new Set([0]));
    }, 100);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      // Cleanup typed instances
      typedInstances.current.forEach(typed => {
        if (typed) typed.destroy();
      });
    };
  }, [currentSection]);
  
  const scrollToSection = (sectionIndex) => {
    const targetY = sectionIndex * window.innerHeight;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  return (
    <div className="bg-white overflow-x-hidden" style={{scrollSnapType: 'y mandatory', scrollBehavior: 'smooth'}}>
      <style>{typewriterStyle}</style>
      
      
      <div className="fixed right-4 sm:right-6 lg:right-8 xl:right-12 top-1/2 transform -translate-y-1/2 z-40 flex flex-col space-y-3 sm:space-y-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full cursor-pointer transition-all duration-300 ${
              currentSection === index 
                ? 'bg-[#bf7d2c] scale-125' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => scrollToSection(index)}
          />
        ))}
      </div>
      
      <div className="bg-white w-full mx-auto relative">
        
        {/* Section 0: 좁혀지지 않는 갈등 */}
        <section id="section-0" className="relative w-full h-screen bg-white flex items-center justify-center pt-4 lg:pt-6" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            <div className="absolute top-[6vh] sm:top-[8vh] lg:top-[10vh] xl:top-[8vh] 2xl:top-[6vh] right-8 sm:right-16 lg:right-32">
              <div className="flex justify-end">
                <div 
                  className="font-['Pretendard-SemiBold'] font-semibold text-black leading-tight"
                  style={{ 
                    fontSize: 'clamp(60px, 6.5vw, 128px)',
                    textAlign: 'left'
                  }}
                >
                  <span ref={typewriterRef}></span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-[28vh] sm:bottom-[32vh] lg:bottom-[35vh] xl:bottom-[32vh] 2xl:bottom-[28vh] right-8 sm:right-16 lg:right-32">
              <div className="text-right">
                <div 
                  className="font-['Pretendard-SemiBold'] font-semibold leading-tight shake-text"
                  style={{ fontSize: 'clamp(50px, 5.5vw, 112px)' }}
                >
                  <span className="text-black">참견도치가 </span>
                  <br />
                  <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견</span>
                  <span className="text-black">해드립니다</span>
                </div>
              </div>
            </div>
            <img
              className="absolute top-1/2 left-8 sm:left-16 lg:left-32 transform -translate-y-1/2 object-cover"
              alt="Image"
              src={image9}
              style={{
                width: 'clamp(220px, 22vw, 352px)',
                height: 'auto'
              }}
            />
          </div>
        </section>

        {/* Section 1: 고민이 있다면? */}
        <section id="section-1" className="relative w-full h-screen bg-white flex items-center justify-center pt-4 lg:pt-6" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            <header 
              className="absolute top-[6vh] sm:top-[8vh] lg:top-[10vh] xl:top-[8vh] 2xl:top-[6vh] left-8 sm:left-16 lg:left-32 text-black max-w-4xl font-['Pretendard-SemiBold'] font-semibold leading-tight pulse-text"
              style={{ fontSize: 'clamp(60px, 6.5vw, 128px)' }}
            >
              고민이 있다면?
            </header>
            <main className="absolute w-full top-1/2 left-8 sm:left-16 lg:left-32 right-8 sm:right-16 lg:right-32 transform -translate-y-2/5">
              <div 
                ref={typewriterLine1Ref}
                className="relative max-w-4xl font-['Pretendard-SemiBold'] font-semibold leading-tight z-20"
                style={{ 
                  fontSize: 'clamp(50px, 5.5vw, 112px)',
                  lineHeight: '1.2'
                }}
              >
              </div>
            </main>
            
            <img
              className="absolute top-60 sm:top-52 lg:top-44 right-16 sm:right-20 lg:right-32 object-cover z-10"
              alt="참견도치 캐릭터 이미지"
              src={image10}
              style={{
                width: 'clamp(288px, 25vw, 512px)',
                height: 'auto'
              }}
            />
          </div>
        </section>

        {/* Section 2: 나만의 고민해결 플랫폼 */}
        <section id="section-2" className="relative w-full h-screen bg-white flex items-center justify-center pt-4 lg:pt-6" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            <div className="absolute top-[10vh] sm:top-[12vh] lg:top-[15vh] xl:top-[12vh] 2xl:top-[10vh] left-8 sm:left-16 lg:left-32 fade-in-title max-w-4xl">
              <div 
                className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] leading-tight whitespace-nowrap"
                style={{ fontSize: 'clamp(56px, 6vw, 128px)' }}
              >
                나만의{" "}
                <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                  고민해결
                </span>{" "}
                플랫폼,
              </div>
              <div 
                className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] leading-tight mt-2"
                style={{ fontSize: 'clamp(48px, 5vw, 112px)' }}
              >
                참견도치 🦔
              </div>
            </div>

            <img
              className="absolute top-1/2 right-4 sm:right-8 lg:right-12 transform -translate-y-1/2 object-cover fade-in-image"
              alt="Main Hedgehog"
              src={image65}
              style={{
                width: 'clamp(280px, 25vw, 480px)',
                height: 'auto'
              }}
            />

            <div className="absolute bottom-[26vh] sm:bottom-[30vh] lg:bottom-[33vh] xl:bottom-[28vh] 2xl:bottom-[23vh] left-8 sm:left-16 lg:left-32 fade-in-button">
              <div 
                className="w-36 sm:w-44 lg:w-52 xl:w-52 2xl:w-52 h-10 sm:h-12 lg:h-14 xl:h-14 2xl:h-14 bg-[#bf7d2c] rounded-[18px] flex items-center justify-center cursor-pointer hover:bg-[#a66a25] transition-colors"
                onClick={() => navigate('/service')}
              >
                <div className="font-['Pretendard-SemiBold'] font-semibold text-white text-sm sm:text-base lg:text-lg xl:text-lg 2xl:text-lg">
                  참견도치 사용해보기
                </div>
              </div>
            </div>
            
            <div 
              className="absolute bottom-[28vh] sm:bottom-[32vh] lg:bottom-[35vh] xl:bottom-[30vh] 2xl:bottom-[25vh] left-64 sm:left-80 lg:left-96 xl:left-96 2xl:left-96 mt-4 font-['Pretendard-SemiBold'] font-semibold text-[#3d2b1f] text-sm sm:text-base lg:text-lg xl:text-lg 2xl:text-lg underline cursor-pointer hover:text-[#bf7d2c] transition-colors fade-in-link"
              onClick={() => scrollToSection(3)}
            >
              더 둘러보기 →
            </div>
          </div>
        </section>

        {/* Section 3: 서비스 이용해보기 */}
        <section id="section-3" className="relative w-full min-h-screen bg-white flex items-start justify-center pt-12 lg:pt-16 pb-12 px-4 sm:px-8 lg:px-20 scale-90" style={{scrollSnapAlign: 'start'}}>
          <div>
            <div className="text-center mb-6 sm:mb-8 lg:mb-12 xl:mb-10 2xl:mb-8">
              <h2 
                className="font-['Pretendard-SemiBold'] font-semibold leading-tight"
                style={{ fontSize: 'clamp(32px, 5.2vw, 100px)' }}
              >
                <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
                <span className="text-[#333333]"> 서비스 이용해보기</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7 max-w-5xl mx-auto">
              <div className="space-y-5 lg:space-y-7">
                <div 
                  className="bg-[#f8d6b3] rounded-[16px] p-5 sm:p-7 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
                  onClick={() => navigate('/community')}
                >
                  <img className="absolute w-3.5 h-7 top-5 sm:top-7 right-5 sm:right-7" alt="Vector" src={vector} />
                  <div className="font-['Pretendard-Bold'] font-bold text-[#3d2b1f] text-lg sm:text-xl lg:text-2xl mb-3.5">참견도치 커뮤니티</div>
                  <div className="font-['Pretendard-Regular'] font-normal text-[#3d2b1f] text-sm sm:text-base lg:text-lg pr-7">비슷한 고민을 가진 사람들과 이야기해보세요</div>
                </div>
                <div 
                  className="bg-[#83673f] rounded-[16px] p-5 sm:p-7 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative min-h-[180px] sm:min-h-[216px]"
                  onClick={() => navigate('/conflicts/create')}
                >
                  <img className="absolute w-3.5 h-7 top-5 sm:top-7 right-5 sm:right-7" alt="Vector" src={vector2} />
                  <div className="font-['Pretendard-Bold'] font-bold text-white text-lg sm:text-xl lg:text-2xl mb-3.5">참견도치와 갈등 해결하기</div>
                  <div className="font-['Pretendard-Regular'] font-normal text-white text-sm sm:text-base lg:text-lg leading-relaxed pr-7">화상 대화 속 감정과 대화를 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요</div>
                </div>
              </div>
              <div className="space-y-5 lg:space-y-7">
                <div 
                  className="bg-[#7f5539] rounded-[16px] p-5 sm:p-7 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative min-h-[180px] sm:min-h-[216px]"
                  onClick={() => navigate('/comfort')}
                >
                  <img className="absolute w-3.5 h-7 top-5 sm:top-7 right-5 sm:right-7" alt="Vector" src={vector2} />
                  <div className="font-['Pretendard-Bold'] font-bold text-white text-lg sm:text-xl lg:text-2xl mb-3.5">토닥토닥 서비스</div>
                  <div className="font-['Pretendard-Regular'] font-normal text-white text-sm sm:text-base lg:text-lg leading-relaxed pr-7">참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요</div>
                </div>
                <div 
                  className="bg-[#cd9f6e] rounded-[16px] p-5 sm:p-7 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
                  onClick={() => navigate('/mypage')}
                >
                  <img className="absolute w-3.5 h-7 top-5 sm:top-7 right-5 sm:right-7" alt="Vector" src={vector3} />
                  <div className="font-['Pretendard-Bold'] font-bold text-[#4E2B1A] text-lg sm:text-xl lg:text-2xl mb-3.5">마이페이지</div>
                  <div className="font-['Pretendard-Regular'] font-normal text-[#4E2B1A] text-sm sm:text-base lg:text-lg pr-7">나의 대화·중재 기록을 확인하고 관리해요</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
        
      <div className="relative w-full" style={{background: 'linear-gradient(to top, #f0f4ff 0%, #ffffff 100%)'}}>
        {/* Section 4: Detailed Services Section */}
        <section id="section-4" className="w-full flex flex-col items-center justify-center px-4 sm:px-8 lg:px-20 pt-20 lg:pt-24 pb-16" style={{minHeight: '100vh', scrollSnapAlign: 'start'}}>
            {/* 전체 제목 */}
            <div className="text-center mb-16">
                <h2
                    className="font-['Pretendard-SemiBold'] font-semibold"
                    style={{ fontSize: 'clamp(48px, 5vw, 86px)' }}
                >
                    <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
                    <span className="text-[#333333]">의 서비스</span>
                </h2>
            </div>

            {/* 메인 콘텐츠 영역 (좌/우 분리) */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* 왼쪽 컬럼: 큰 이미지 */}
                <div className="flex justify-center items-center">
                    <img 
                        alt="참견도치 캐릭터" 
                        src={image10} 
                        style={{
                            width: 'clamp(300px, 100%, 409px)',
                            height: 'auto'
                        }}
                    />
                </div>

                {/* 오른쪽 컬럼: 서비스 목록 */}
                <div className="flex flex-col justify-center space-y-12 pl-4 border-l-2 border-gray-200">
                    {/* 1. 토닥토닥 서비스 */}
                    <div className="flex items-start space-x-6 cursor-pointer group" onClick={() => navigate('/comfort')}>
                        <img alt="토닥 서비스 아이콘" src={todak} className="w-16 h-auto flex-shrink-0"/>
                        <div>
                            <h3 className="font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-2xl lg:text-3xl mb-3 group-hover:text-[#FFAF53] transition-colors">토닥토닥 서비스</h3>
                            <p className="font-['Pretendard-Medium'] font-medium text-black text-base lg:text-lg">참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요</p>
                        </div>
                    </div>

                    {/* 2. 갈등 해결하기 */}
                    <div className="flex items-start space-x-6 cursor-pointer group" onClick={() => navigate('/conflicts/create')}>
                        <img alt="갈등 해결 아이콘" src={image9} className="w-14 h-auto flex-shrink-0"/>
                        <div>
                            <h3 className="font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-2xl lg:text-3xl mb-3 group-hover:text-[#FFAF53] transition-colors">참견도치와 갈등 해결하기</h3>
                            <p className="font-['Pretendard-Medium'] font-medium text-black text-base lg:text-lg">화상 대화 속 감정과 대화을 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요</p>
                        </div>
                    </div>
                    
                    {/* 3. 커뮤니티 */}
                    <div className="flex items-start space-x-6 cursor-pointer group" onClick={() => navigate('/community')}>
                        <img alt="커뮤니티 아이콘" src={image18} className="w-16 h-auto flex-shrink-0"/>
                        <div>
                            <h3 className="font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-2xl lg:text-3xl mb-3 group-hover:text-[#FFAF53] transition-colors">커뮤니티</h3>
                            <p className="font-['Pretendard-Medium'] font-medium text-[#3d2b1f] text-base lg:text-lg">비슷한 고민을 가진 사람들과 이야기해보세요</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Footer Section */}
        <footer className="relative w-full py-16 px-4 sm:px-8 lg:px-20 bg-[#f0f4ff]">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              
              {/* About */}
              <div className="md:col-span-1 lg:col-span-2">
                  <h4 className="[-webkit-text-stroke:0.3px_#000000] font-['Pretendard-Regular'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap mb-3">About Team DDabong-Dochi</h4>
                  <p className="font-['Pretendard-Regular'] font-normal text-gray-600 text-sm tracking-[0] leading-[20px] mb-4">
                    AI 갈등 도우미 참견도치가 고민을 들어두고 해결을 위한 다양한 서비스를 제공해 드립니다.
                  </p>
                  <img className="w-[136px] h-[16px]" alt="Social" src={social} />
              </div>

              {/* Front-End Members */}
              <div>
                  <h4 className="font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap mb-3">Front-End</h4>
                  <ul className="font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-8 text-zinc-800">
                    <li>Sunwoo Park</li>
                    <li>Dahye Lee</li>
                    <li>Yongbin Kim</li>
                  </ul>
              </div>

              {/* Back-End Members */}
              <div>
                  <h4 className="font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap mb-3">Back-End</h4>
                  <ul className="font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-8 text-gray-900">
                      <li>TaeYoung Kim</li>
                      <li>Junho Shin</li>
                      <li>Soyeon Kim</li>
                  </ul>
              </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainPage;