import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
// Swiper 제거 - sticky scroll로 대체

import image9 from "@/assets/image 9.png";
import image10 from "@/assets/image 10.png";
import image17 from "@/assets/image 17.png";
import image18 from "@/assets/image 18.png";
import image65 from "@/assets/image-65.png";
import line203 from "@/assets/Line-203.png";
import social from "@/assets/Social.png";
import line from "@/assets/line.png";
import vector2 from "@/assets/Vector-2.png";
import vector3 from "@/assets/Vector-3.png";
import vector from "@/assets/Vector.png";
import todak from "@/assets/todak.png";

export const MainPage = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [animatedSections, setAnimatedSections] = useState(new Set()); // 초기는 비워둔 상태
  const containerRef = useRef(null);

  // 애니메이션 CSS
  const typewriterStyle = `
    .typewriter {
      overflow: hidden;
      border-right: 3px solid transparent;
      white-space: nowrap;
      width: 0;
    }
    
    .typewriter.animate {
      animation: typing 2s steps(8, end) 0.5s forwards, blink-caret 0.75s step-end infinite 0.5s;
      animation-fill-mode: both;
    }
    
    .typewriter.animate.finished {
      border-right: none;
    }
    
    .typewriter-line1 {
      overflow: hidden;
      border-right: 3px solid transparent;
      white-space: nowrap;
      width: 0;
    }
    
    .typewriter-line1.animate {
      animation: typing-line1 1.5s steps(5, end) 2.5s forwards, blink-caret 0.75s step-end infinite 2.5s;
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
      animation: fade-in 0.1s ease-in 4.5s forwards, typing-line2 2.1s steps(7, end) 4.5s forwards, blink-caret 0.75s step-end infinite 4.5s;
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
      animation: shake 0.6s ease-in-out 3s both;
    }
    
    .pulse-text {
      
    }
    
    .pulse-text.animate {
      animation: pulse-scale 1.5s ease-in-out 0.5s both;
    }
    
    .fade-in-element {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-element.animate {
      animation: fadeInUp 0.8s ease-out forwards;
    }
    
    .fade-in-title {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-title.animate {
      animation: fadeInUp 0.8s ease-out 0.2s forwards;
    }
    
    .fade-in-image {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-image.animate {
      animation: fadeInUp 0.8s ease-out 0.4s forwards;
    }
    
    .fade-in-button {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-button.animate {
      animation: fadeInUp 0.8s ease-out 0.6s forwards;
    }
    
    .fade-in-link {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .fade-in-link.animate {
      animation: fadeInUp 0.8s ease-out 0.8s forwards;
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
      0% { width: 0; opacity: 1; }
      100% { width: 100%; opacity: 1; }
    }
    
    @keyframes typing-line2 {
      0% { width: 0; opacity: 1; }
      100% { width: 100%; opacity: 1; }
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
      
      // 5번째 섹션 진입 후에는 자연스러운 스크롤 허용
      if (currentScrollTop >= sectionHeight * 3.9) {
        return; // 기본 스크롤 동작 허용
      }
      
      e.preventDefault();
      
      if (isScrolling) return;
      
      isScrolling = true;
      const delta = e.deltaY;
      
      let targetScroll;
      
      if (delta > 0) {
        // 아래로 스크롤
        if (currentScrollTop < sectionHeight * 0.8) {
          targetScroll = sectionHeight; // 2번째 섹션
        } else if (currentScrollTop < sectionHeight * 1.8) {
          targetScroll = sectionHeight * 2; // 3번째 섹션
        } else if (currentScrollTop < sectionHeight * 2.8) {
          targetScroll = sectionHeight * 3; // 4번째 섹션
        } else if (currentScrollTop < sectionHeight * 3.8) {
          targetScroll = sectionHeight * 4; // 5번째 섹션
        }
      } else {
        // 위로 스크롤
        if (currentScrollTop > sectionHeight * 3.2) {
          targetScroll = sectionHeight * 3; // 4번째 섹션
        } else if (currentScrollTop > sectionHeight * 2.2) {
          targetScroll = sectionHeight * 2; // 3번째 섹션
        } else if (currentScrollTop > sectionHeight * 1.2) {
          targetScroll = sectionHeight; // 2번째 섹션
        } else if (currentScrollTop > sectionHeight * 0.2) {
          targetScroll = 0; // 1번째 섹션
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
      
      // 현재 섹션과 다른 섹션이면 상태 업데이트 및 애니메이션 처리
      if (currentSection !== newSection) {
        setCurrentSection(newSection);
        
        // 모든 섹션의 애니메이션 클래스 제거
        // 섹션 0
        const typewriterEl = document.querySelector('.typewriter');
        const shakeEl = document.querySelector('.shake-text');
        if (typewriterEl) {
          typewriterEl.classList.remove('animate', 'finished');
        }
        if (shakeEl) {
          shakeEl.classList.remove('animate', 'finished');
        }
        
        // 섹션 1
        const line1El = document.querySelector('.typewriter-line1');
        const line2El = document.querySelector('.typewriter-line2');
        const pulseEl = document.querySelector('.pulse-text');
        if (line1El) line1El.classList.remove('animate', 'finished');
        if (line2El) line2El.classList.remove('animate', 'finished');
        if (pulseEl) pulseEl.classList.remove('animate');
        
        // 섹션 2
        const fadeElements = document.querySelectorAll('#section-2 .fade-in-element, #section-2 .fade-in-title, #section-2 .fade-in-image, #section-2 .fade-in-button, #section-2 .fade-in-link');
        fadeElements.forEach(el => el.classList.remove('animate'));
        
        // 짧은 딘레이 후 새로운 섹션의 애니메이션 시작
        setTimeout(() => {
          if (newSection === 0) {
            const typewriterEl = document.querySelector('.typewriter');
            const shakeEl = document.querySelector('.shake-text');
            if (typewriterEl) typewriterEl.classList.add('animate');
            if (shakeEl) shakeEl.classList.add('animate');
            
            // 애니메이션 완료 후 커서 제거
            setTimeout(() => {
              if (typewriterEl) typewriterEl.classList.add('finished');
              if (shakeEl) shakeEl.classList.add('finished');
            }, 3500);
          }
          
          if (newSection === 1) {
            const line1El = document.querySelector('.typewriter-line1');
            const line2El = document.querySelector('.typewriter-line2');
            const pulseEl = document.querySelector('.pulse-text');
            if (line1El) line1El.classList.add('animate');
            if (line2El) line2El.classList.add('animate');
            if (pulseEl) pulseEl.classList.add('animate');
            
            setTimeout(() => {
              if (line1El) line1El.classList.add('finished');
            }, 4000);
            
            setTimeout(() => {
              if (line2El) line2El.classList.add('finished');
            }, 6600);
          }
          
          if (newSection === 2) {
            const fadeElements = document.querySelectorAll('#section-2 .fade-in-element, #section-2 .fade-in-title, #section-2 .fade-in-image, #section-2 .fade-in-button, #section-2 .fade-in-link');
            fadeElements.forEach(el => el.classList.add('animate'));
          }
        }, 100); // DOM 렌더링 완료 대기
        
        // animatedSections 상태를 현재 섹션만 포함하도록 업데이트
        setAnimatedSections(new Set([newSection]));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    
    // 초기 로드 시 첫 번째 섹션 애니메이션 시작
    setTimeout(() => {
      const typewriterEl = document.querySelector('.typewriter');
      const shakeEl = document.querySelector('.shake-text');
      if (typewriterEl) typewriterEl.classList.add('animate');
      if (shakeEl) shakeEl.classList.add('animate');
      
      setTimeout(() => {
        if (typewriterEl) typewriterEl.classList.add('finished');
        if (shakeEl) shakeEl.classList.add('finished');
      }, 3500);
      
      setAnimatedSections(new Set([0]));
    }, 100);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
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
      {/* 타자기 애니메이션 스타일 */}
      <style>{typewriterStyle}</style>
      
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>
      
      {/* Sticky Pagination */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 flex flex-col space-y-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
              currentSection === index 
                ? 'bg-[#bf7d2c] scale-125' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => scrollToSection(index)}
          />
        ))}
      </div>
      
      <div className="bg-white w-full mx-auto relative pt-24">
        
        {/* Section 0: 좁혀지지 않는 갈등 */}
        <section id="section-0" className="relative w-full h-screen bg-white flex items-center justify-center" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            <div className="absolute top-12 sm:top-16 lg:top-20 right-8 sm:right-16 lg:right-32">
              <div className="text-right">
                <div className="font-['Pretendard-SemiBold'] font-semibold text-black text-9xl leading-tight typewriter">
                  좁혀지지 않는 갈등
                </div>
              </div>
            </div>
            <div className="absolute bottom-1/3 right-8 sm:right-16 lg:right-32">
              <div className="text-right">
                <div className="font-['Pretendard-SemiBold'] font-semibold text-8xl leading-tight shake-text">
                  <span className="text-black">참견도치가 </span>
                  <br />
                  <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견</span>
                  <span className="text-black">해드립니다</span>
                </div>
              </div>
            </div>
            <img
              className="absolute w-56 h-68 sm:w-68 sm:h-80 lg:w-80 lg:h-92 xl:w-88 xl:h-104 top-1/2 left-8 sm:left-16 lg:left-32 transform -translate-y-1/2 object-cover"
              alt="Image"
              src={image9}
            />
          </div>
        </section>

        {/* Section 1: 고민이 있다면? */}
        <section id="section-1" className="relative w-full h-screen bg-white flex items-center justify-center" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            <header className="absolute top-4 sm:top-8 lg:top-12 left-8 sm:left-16 lg:left-32 text-black text-9xl max-w-4xl font-['Pretendard-SemiBold'] font-semibold leading-tight pulse-text">
              고민이 있다면?
            </header>
            <main className="absolute w-full top-1/2 left-8 sm:left-16 lg:left-32 right-8 sm:right-16 lg:right-32 transform -translate-y-2/5">
              {/* 첫 번째 줄 */}
              <div className="relative text-8xl max-w-4xl font-['Pretendard-SemiBold'] font-semibold leading-tight typewriter-line1">
                <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">비밀보장</span>
                <span className="text-black">되는</span>
              </div>
              
              {/* 두 번째 줄 */}
              <div className="relative mt-4 sm:mt-6 lg:mt-8 text-8xl max-w-4xl font-['Pretendard-SemiBold'] font-semibold leading-tight typewriter-line2">
                <span className="text-[#030303]">참견도치</span>
                <span className="text-black">가 들어줄게요</span>
              </div>
              
              <img
                className="absolute w-72 h-72 sm:w-88 sm:h-88 lg:w-104 lg:h-104 xl:w-[32rem] xl:h-[32rem] -top-28 sm:-top-36 lg:-top-44 right-0 sm:right-8 lg:right-20 object-cover"
                alt="참곬도치 캐릭터 이미지"
                src={image10}
              />
            </main>
          </div>
        </section>

        {/* Section 2: 나만의 고민해결 플랫폼 */}
        <section id="section-2" className="relative w-full h-screen bg-white flex items-center justify-center" style={{scrollSnapAlign: 'start'}}>
          <div className="relative w-full h-full px-4 sm:px-8 lg:px-20">
            {/* Main Title */}
            <div className="absolute top-20 sm:top-24 lg:top-28 left-8 sm:left-16 lg:left-32 fade-in-title max-w-4xl">
              <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-9xl leading-tight whitespace-nowrap">
                나만의{" "}
                <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                  고민해결
                </span>{" "}
                플랫폼,
              </div>
              <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-8xl leading-tight mt-2">
                참견도치 🦔
              </div>
            </div>

            {/* Main Hedgehog Image */}
            <img
              className="absolute w-72 h-72 sm:w-88 sm:h-88 lg:w-104 lg:h-104 xl:w-[30rem] xl:h-[30rem] top-1/2 right-4 sm:right-8 lg:right-12 transform -translate-y-1/2 object-cover fade-in-image"
              alt="Main Hedgehog"
              src={image65}
            />

            {/* CTA Buttons */}
            <div className="absolute bottom-1/3 left-8 sm:left-16 lg:left-32 fade-in-button">
              <div 
                className="w-52 sm:w-60 lg:w-68 xl:w-76 h-16 sm:h-18 lg:h-20 bg-[#bf7d2c] rounded-[18px] flex items-center justify-center cursor-pointer hover:bg-[#a66a25] transition-colors"
                onClick={() => navigate('/service')}
              >
                <div className="font-['Pretendard-SemiBold'] font-semibold text-white text-sm sm:text-base lg:text-lg xl:text-xl">
                  참견도치 사용해보기
                </div>
              </div>
            </div>
            
            <div 
              className="absolute bottom-1/3 left-72 sm:left-88 lg:left-108 xl:left-124 mt-4 font-['Pretendard-SemiBold'] font-semibold text-[#3d2b1f] text-sm sm:text-base lg:text-lg xl:text-xl underline cursor-pointer hover:text-[#bf7d2c] transition-colors fade-in-link"
              onClick={() => scrollToSection(3)}
            >
              더 둘러보기 →
            </div>
          </div>
        </section>

        {/* Service Cards Section */}
        <section id="section-3" className="relative w-full h-screen bg-white flex items-start justify-center pt-12" style={{scrollSnapAlign: 'start'}}>
          <div className="w-full px-4 sm:px-8 lg:px-20">
            <div className="text-center mb-16 sm:mb-20 lg:mb-24">
              <h2 className="font-['Pretendard-SemiBold'] font-semibold text-4xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight">
                <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
                <span className="text-[#333333]"> 서비스 이용해보기</span>
              </h2>
            </div>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Left Column */}
              <div className="space-y-6 lg:space-y-8">
                {/* Community Card */}
                <div 
                  className="bg-[#f8d6b3] rounded-[18px] p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
                  onClick={() => navigate('/community')}
                >
                  <img
                    className="absolute w-4 h-8 top-6 sm:top-8 right-6 sm:right-8"
                    alt="Vector"
                    src={vector}
                  />
                  
                  <div className="font-['Pretendard-Bold'] font-bold text-[#3d2b1f] text-xl sm:text-2xl lg:text-3xl mb-4">
                    참견도치 커뮤니티
                  </div>
                  
                  <div className="font-['Pretendard-Regular'] font-normal text-[#3d2b1f] text-base sm:text-lg lg:text-xl pr-8">
                    비슷한 고민을 가진 사람들과 이야기해보세요
                  </div>
                </div>

                {/* Conflict Resolution Card */}
                <div 
                  className="bg-[#83673f] rounded-[18px] p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative min-h-[200px] sm:min-h-[240px]"
                  onClick={() => navigate('/conflicts/create')}
                >
                  <img
                    className="absolute w-4 h-8 top-6 sm:top-8 right-6 sm:right-8"
                    alt="Vector"
                    src={vector2}
                  />
                  
                  <div className="font-['Pretendard-Bold'] font-bold text-white text-xl sm:text-2xl lg:text-3xl mb-4">
                    참견도치와 갈등 해결하기
                  </div>
                  
                  <div className="font-['Pretendard-Regular'] font-normal text-white text-base sm:text-lg lg:text-xl leading-relaxed pr-8">
                    화상 대화 속 감정과 대화를 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6 lg:space-y-8">
                {/* Comfort Service Card */}
                <div 
                  className="bg-[#7f5539] rounded-[18px] p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative min-h-[200px] sm:min-h-[240px]"
                  onClick={() => navigate('/comfort')}
                >
                  <img
                    className="absolute w-4 h-8 top-6 sm:top-8 right-6 sm:right-8"
                    alt="Vector"
                    src={vector2}
                  />
                  
                  <div className="font-['Pretendard-Bold'] font-bold text-white text-xl sm:text-2xl lg:text-3xl mb-4">
                    토닥토닥 서비스
                  </div>
                  
                  <div className="font-['Pretendard-Regular'] font-normal text-white text-base sm:text-lg lg:text-xl leading-relaxed pr-8">
                    참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
                  </div>
                </div>

                {/* My Page Card */}
                <div 
                  className="bg-[#cd9f6e] rounded-[18px] p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
                  onClick={() => navigate('/mypage')}
                >
                  <img
                    className="absolute w-4 h-8 top-6 sm:top-8 right-6 sm:right-8"
                    alt="Vector"
                    src={vector3}
                  />
                  
                  <div className="font-['Pretendard-Bold'] font-bold text-[#4E2B1A] text-xl sm:text-2xl lg:text-3xl mb-4">
                    마이페이지
                  </div>
                  
                  <div className="font-['Pretendard-Regular'] font-normal text-[#4E2B1A] text-base sm:text-lg lg:text-xl pr-8">
                    나의 대화·중재 기록을 확인하고 관리해요
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        </div>
        
        {/* Detailed Services Section with Footer - Full Width */}
        <div className="relative w-full" style={{background: 'linear-gradient(to top, #f0f4ff 0%, #ffffff 100%)'}}>
        <section id="section-4" className="relative w-full pt-[0px] left-0" style={{minHeight: '100vh', scrollSnapAlign: 'start'}}>
          <div className="w-full max-w-[1296px] mx-auto relative">
          
          <img
            className="absolute w-[409px] h-[409px] top-[644px] left-[42px] object-cover z-10"
            alt="Image"
            src={image10}
          />

          <img
            className="absolute w-[95px] h-[122px] top-[240px] left-[432px] object-cover cursor-pointer group z-10"
            onClick={() => navigate('/comfort')}
            alt="Image"
            src={todak}
          />

          <div 
            className="absolute top-[227px] left-[109px] cursor-pointer group z-10"
            onClick={() => navigate('/comfort')}
          >
            <div className="w-[289px] h-[27px] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[38px] leading-5 tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              토닥토닥 서비스
            </div>
            <div className="w-[276px] h-[52px] mt-[44px] font-['Pretendard-Medium'] font-medium text-black text-[22px] leading-[23px] tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
            </div>
          </div>

          <div className="absolute w-[810px] h-[83px] top-[20px] left-[243px]  font-['Pretendard-SemiBold'] font-semibold text-[86px] leading-5 tracking-[0] z-10"
          >
            <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
            <span className="text-[#333333]">의 서비스</span>
          </div>

          <img
            className="absolute w-[95px] h-[122px] top-[618px] right-[70px] object-cover cursor-pointer group z-10"
            onClick={() => navigate('/conflicts/create')}
            alt="Image"
            src={image9}
          />

          <div 
            className="absolute top-[603px] left-[704px] cursor-pointer group z-10"
            onClick={() => navigate('/conflicts/create')}
          >
            <div className="w-[437px] h-[28px] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[38px] leading-5 tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              참견도치와 갈등 해결하기
            </div>
            <div className="w-[380px] h-[53px] mt-[55px] font-['Pretendard-Medium'] font-medium text-black text-[22px] tracking-[0] leading-[23px] group-hover:text-[#FFAF53] transition-colors">
              화상 대화 속 감정과 대화을 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
            </div>
          </div>

          <img
            className="absolute w-[95px] h-[122px] top-[837px] right-[70px] object-cover cursor-pointer group z-10"
            onClick={() => navigate('/community')}
            alt="Image"
            src={image18}
          />

          <div 
            className="absolute top-[835px] left-[704px] cursor-pointer group z-10"
            onClick={() => navigate('/community')}
          >
            <div className="w-[437px] h-[27px] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[38px] leading-5 tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              커뮤니티
            </div>
            <div className="w-[276px] h-[53px] mt-[54px] font-['Pretendard-Medium'] font-medium text-[#3d2b1f] text-[22px] leading-normal tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              비슷한 고민을 가진 사람들과 이야기해보세요
            </div>
          </div>

          <img
            className="absolute w-[118px] h-[704px] top-[292px] left-[567px] z-10"
            alt="line"
            src={line}
          />

          </div>
        </section>
        
        {/* Footer Section */}
        <div className="relative w-full h-[370px]">
          <div className="w-full max-w-[1296px] mx-auto relative">

          <div className="absolute w-[323px] top-[240px] left-[124px] font-['Pretendard-Regular'] font-normal text-gray-600 text-sm tracking-[0] leading-[20px] z-10">
            AI 갈등 도우미 참견도치가 고민을 들어두고 해결을 위한 다양한 서비스를 제공해 드립니다.

          </div>

          <div className="absolute w-[114px] top-[195px] left-[122px] [-webkit-text-stroke:0.3px_#000000] font-['Pretendard-Regular'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap z-10">
            About Team DDabong-Dochi
          </div>

          <img
            className="absolute w-[136px] h-[16px] top-[344px] left-[124px] z-10"
            alt="Social"
            src={social}
          />

          {/* Footer Links */}
          <div className="absolute w-[125px] h-[167px] top-[196px] left-[617px] z-10">
            
            <div className="absolute w-[113px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Team Members
            </div>
          </div>

          <div className="absolute w-[150px] h-[167px] top-[196px] left-[798px] z-10">
            <div className="absolute w-[147px] top-[37px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-9">
              <span className="text-zinc-800">Sunwoo Park<br /></span>
              <span className="text-zinc-900">Dahye Lee<br /></span>
              <span className="text-zinc-800">Yongbin Kim</span>
            </div>
            <div className="absolute w-[42px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Front-End
            </div>
          </div>

          <div className="absolute w-[147px] h-[167px] top-[196px] left-[1016px] z-10">
            <div className="absolute w-[143px] text-gray-900 top-[37px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-9">
              TaeYoung Kim<br />
              Junho Shin<br />
              Soyeon Kim<br />
            </div>
            <div className="absolute w-[83px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Back-End
            </div>
          </div>
          </div>
        </div>
        </div>
    </div>
  );
};

export default MainPage;