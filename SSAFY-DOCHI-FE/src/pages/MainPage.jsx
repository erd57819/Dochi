import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
  const containerRef = useRef(null);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout;

    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      isScrolling = true;
      const delta = e.deltaY;
      const currentScrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      // 마지막 섹션(3번째 섹션)에 있는지 확인
      const isInLastSection = currentScrollTop >= window.innerHeight * 2;
      
      if (delta > 0) {
        // 아래로 스크롤
        if (isInLastSection) {
          // 마지막 섹션에서는 자연스럽게 스크롤
          container.scrollBy({
            top: window.innerHeight / 3, // 더 작은 단위로 스크롤
            behavior: 'smooth'
          });
        } else {
          // 처음 두 섹션에서는 전체 화면 단위로 스크롤
          container.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }
      } else {
        // 위로 스크롤
        if (isInLastSection && currentScrollTop < maxScroll - 50) {
          // 마지막 섹션 내에서 위로 스크롤
          container.scrollBy({
            top: -window.innerHeight / 3,
            behavior: 'smooth'
          });
        } else {
          // 섹션 단위로 위로 스크롤
          container.scrollBy({
            top: -window.innerHeight,
            behavior: 'smooth'
          });
        }
      }
      
      // 스크롤 애니메이션 완료 후 플래그 해제 (더 느리게)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        // 스크롤 완료 후 현재 섹션 업데이트
        handleScroll();
      }, 1200); // 1.2초로 조정
    };

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = window.innerHeight;
      
      console.log('Scroll Top:', scrollTop, 'Section Height:', sectionHeight); // 디버깅용
      
      if (scrollTop < sectionHeight * 0.5) {
        setCurrentSection(0);
      } else if (scrollTop < sectionHeight * 1.5) {
        setCurrentSection(1);
      } else {
        setCurrentSection(2);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll);
    
    // 초기 섹션 설정
    handleScroll();
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const scrollToSection = (sectionIndex) => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTo({
      top: sectionIndex * window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div ref={containerRef} className="bg-white flex flex-row justify-center w-full h-screen overflow-y-scroll" style={{scrollSnapType: 'y mandatory', scrollBehavior: 'smooth'}}>
      {/* Sticky Pagination */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 flex flex-col space-y-4">
        {[0, 1, 2].map((index) => (
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
      
      <div className="bg-white w-full max-w-[1296px] relative origin-top">
        
        {/* Main Hero Section - Swiper */}
        <div className="relative w-full h-screen bg-white" style={{scrollSnapAlign: 'start', scrollSnapStop: 'always'}}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            pagination={{ 
              clickable: true,
              el: '.swiper-pagination-custom'
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={true}
            className="w-full h-full"
          >
            
            {/* Slide 1: 나만의 고민해결 플랫폼 */}
            <SwiperSlide>
              <div className="relative w-full h-[990px] px-14">
                {/* Main Title */}
                <div className="absolute top-[135px] left-[86px]">
                  <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-[86px] leading-normal">
                    나만의{" "}
                    <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                      고민해결
                    </span>{" "}
                    플랫폼,
                  </div>
                  <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-[104px] leading-normal">
                    참견도치 🦔
                  </div>
                </div>

                {/* Main Hedgehog Image */}
                <img
                  className="absolute w-[440px] h-[440px] top-[370px] right-[40px] object-cover"
                  alt="Main Hedgehog"
                  src={image65}
                />

                {/* CTA Buttons */}
                <div className="absolute top-[675px] left-[86px]">
                  <div 
                    className="w-[266px] h-[72px] bg-[#bf7d2c] rounded-[18px] flex items-center justify-center cursor-pointer hover:bg-[#a66a25] transition-colors"
                    onClick={() => navigate('/service')}
                  >
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-white text-[23px] leading-normal">
                      참견도치 사용해보기
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-[693px] left-[430px] font-['Pretendard-SemiBold'] font-semibold text-[#3d2b1f] text-[23px] leading-normal underline cursor-pointer hover:text-[#bf7d2c] transition-colors">
                  더 둘러보기 →
                </div>
              </div>
            </SwiperSlide>

            {/* Slide 2: 좁혀지지 않는 갈등 */}
            <SwiperSlide>
              <div className="relative w-full h-[990px] px-14">
                <div className="absolute top-[135px] right-[86px]">
                  <div className="text-right">
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-black text-[104px] lg:text-[120px] leading-tight">
                      좁혀지지 않는 갈등
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-[200px] right-[86px]">
                  <div className="text-right">
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-[58px] lg:text-[86px] leading-tight">
                      <span className="text-black">참견도치가 </span>
                      <br />
                      <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견</span>
                      <span className="text-black">해드립니다</span>
                    </div>
                  </div>
                </div>
                <img
                  className="absolute w-[360px] h-[450px] top-[350px] left-[86px] object-cover"
                  alt="Image"
                  src={image9}
                />
              </div>
            </SwiperSlide>

            {/* Slide 3: 고민이 있다면? */}
            <SwiperSlide>
              <div className="relative w-full h-[990px] px-14">
                <header className="absolute top-[135px] left-[86px] text-black text-[104px] w-[942px] font-['Pretendard-SemiBold'] font-semibold leading-normal">
                  고민이 있다면?
                </header>
                <main className="absolute w-full h-[540px] top-[315px] left-[86px] right-[86px]">
                  <div className="absolute top-[180px] left-0 text-[86px] w-[942px] font-['Pretendard-SemiBold'] font-semibold leading-normal">
                    <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">비밀보장</span>
                    <span className="text-black">되는</span>
                    <br />
                    <span className="text-[#030303]">참견도치</span>
                    <span className="text-black">가 들어줄게요</span>
                  </div>
                  <img
                    className="absolute w-[470px] h-[470px] top-0 right-[86px] object-cover"
                    alt="참견도치 캐릭터 이미지"
                    src={image10}
                  />
                </main>
              </div>
            </SwiperSlide>

          </Swiper>
          
          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev-custom absolute -left-14 top-0 bottom-0 w-[72px] flex items-center justify-center cursor-pointer z-10">
            <div className="w-[58px] h-[58px] bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#bf7d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="swiper-button-next-custom absolute -right-14 top-0 bottom-0 w-[72px] flex items-center justify-center cursor-pointer z-10">
            <div className="w-[58px] h-[58px] bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#bf7d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Custom Pagination */}
          <div className="swiper-pagination-custom absolute bottom-7 left-1/2 transform -translate-x-1/2 z-10"></div>
        </div>

        {/* Service Cards Section */}
        <div className="relative w-full h-screen bg-white flex items-center justify-center" style={{scrollSnapAlign: 'start', scrollSnapStop: 'always'}}>
          <div className="absolute w-full h-[83px] top-[122px] left-0 right-0 font-['Pretendard-SemiBold'] font-semibold text-[86px] leading-5 tracking-[0] whitespace-nowrap text-center"
          >
            <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
            <span className="text-[#333333]"> 서비스 이용해보기</span>
          </div>
          {/* Community Card */}
          <div 
            className="absolute w-[581px] h-[201px] top-[280px] left-[47px] cursor-pointer"
            onClick={() => navigate('/community')}
          >
            <div className="w-[581px] h-[184px] bg-[#f8d6b3] rounded-[18px] relative  transition-all duration-300 hover:-translate-y-1">
              <img
                className="absolute w-[16px] h-[34px] top-[69px] right-[65px]"
                alt="Vector"
                src={vector}
              />
              
              <div className="absolute w-[408px] top-[112px] left-[39px] font-['Pretendard-Regular'] font-normal text-[#3d2b1f] text-[22px] leading-normal">
                비슷한 고민을 가진 사람들과 이야기해보세요
              </div>
              
              <div className="absolute top-[39px] left-[39px] font-['Pretendard-Bold'] font-bold text-[#3d2b1f] text-[34px] leading-normal whitespace-nowrap">
                참견도치 커뮤니티
              </div>
            </div>
          </div>

          {/* Conflict Resolution Card */}
          <div 
            className="absolute w-[581px] h-[331px] top-[494px] left-[47px] bg-[#83673f] rounded-[18px] cursor-pointer transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate('/conflicts/create')}
          >
            <img
              className="absolute w-[16px] h-[34px] top-[94px] right-[65px]"
              alt="Vector"
              src={vector2}
            />
            
            <div className="absolute w-[401px] top-[111px] left-[39px] font-['Pretendard-Regular'] font-normal text-white text-[22px] leading-[32px]">
              화상 대화 속 감정과 대화을 읽고, AI 갈등 도우미참견도치가 갈등 중재를 도와줘요
            </div>
            
            <div className="absolute top-[44px] left-[39px] font-['Pretendard-Bold'] font-bold text-white text-[34px] leading-normal whitespace-nowrap">
              참견도치와 갈등 해결하기
            </div>
          </div>

          {/* Comfort Service Card */}
          <div 
            className="absolute w-[581px] h-[331px] top-[280px] right-[46px] bg-[#7f5539] rounded-[18px] cursor-pointer transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate('/comfort')}
          >
            <img
              className="absolute w-[17px] h-[34px] top-[88px] right-[63px]"
              alt="Vector"
              src={vector2}
            />
            
            <div className="absolute w-[403px] top-[112px] left-[41px] font-['Pretendard-Regular'] font-normal text-white text-[22px] leading-normal">
              참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
            </div>
            
            <div className="absolute top-[41px] left-[41px] font-['Pretendard-Bold'] font-bold text-white text-[34px] leading-normal whitespace-nowrap">
              토닥토닥 서비스
            </div>
          </div>

          {/* My Page Card */}
          <div 
            className="absolute w-[581px] h-[193px] top-[636px] right-[46px] cursor-pointer"
            onClick={() => navigate('/mypage')}
          >
            <div className="w-[581px] h-[184px] bg-[#cd9f6e] rounded-[18px] relative transition-all duration-300 hover:-translate-y-1">
              <div className="absolute w-[455px] top-[104px] left-[39px] font-['Pretendard-Regular'] font-normal text-[#4E2B1A] text-[22px] leading-normal">
                나의 대화·중재 기록을 확인하고 관리해요
              </div>
              
              <div className="absolute top-[43px] left-[41px] font-['Pretendard-Bold'] font-bold text-[#4E2B1A] text-[34px] leading-normal whitespace-nowrap">
                마이페이지
              </div>
              
              <img
                className="absolute w-[16px] h-[33px] top-[71px] right-[62px]"
                alt="Vector"
                src={vector3}
              />
            </div>
          </div>
        </div>

        {/* Detailed Services Section */}
        <div className="relative w-full h-[1582px] bg-white pt-[180px] left-0" style={{scrollSnapAlign: 'start', scrollSnapStop: 'always'}}>
          <div className="w-full h-[1179px] bg-[linear-gradient(158deg,rgba(255,255,255,1)_0%,rgba(246,250,255,1)_100%)] absolute top-0 left-0" />

          <img
            className="absolute w-[409px] h-[409px] top-[644px] left-[42px] object-cover"
            alt="Image"
            src={image10}
          />

          <img
            className="absolute w-[95px] h-[122px] top-[340px] left-[432px] object-cover cursor-pointer group"
            onClick={() => navigate('/comfort')}
            alt="Image"
            src={todak}
          />

          <div 
            className="absolute top-[327px] left-[109px] cursor-pointer group"
            onClick={() => navigate('/comfort')}
          >
            <div className="w-[289px] h-[27px] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[38px] leading-5 tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              토닥토닥 서비스
            </div>
            <div className="w-[276px] h-[52px] mt-[44px] font-['Pretendard-Medium'] font-medium text-black text-[22px] leading-[23px] tracking-[0] group-hover:text-[#FFAF53] transition-colors">
              참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
            </div>
          </div>

          <div className="absolute w-[810px] h-[83px] top-[122px] left-[243px]  font-['Pretendard-SemiBold'] font-semibold text-[86px] leading-5 tracking-[0]"
          >
            <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">참견도치</span>
            <span className="text-[#333333]">의 서비스</span>
          </div>

          <img
            className="absolute w-[95px] h-[122px] top-[618px] right-[70px] object-cover cursor-pointer group"
            onClick={() => navigate('/conflicts/create')}
            alt="Image"
            src={image9}
          />

          <div 
            className="absolute top-[603px] left-[704px] cursor-pointer group"
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
            className="absolute w-[95px] h-[122px] top-[837px] right-[70px] object-cover cursor-pointer group"
            onClick={() => navigate('/community')}
            alt="Image"
            src={image18}
          />

          <div 
            className="absolute top-[835px] left-[704px] cursor-pointer group"
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
            className="absolute w-[118px] h-[704px] top-[292px] left-[567px]"
            alt="line"
            src={line}
          />

          {/* Footer Section */}
          <div className="absolute w-full h-[470px] top-[1112px] left-0 bg-[#f6faff]" />

          <div className="absolute w-[323px] top-[1382px] left-[124px] font-['Pretendard-Regular'] font-normal text-gray-600 text-sm tracking-[0] leading-[20px]">
            AI 갈등 도우미 참견도치가 고민을 들어두고 해결을 위한 다양한 서비스를 제공해 드립니다.

          </div>

          <div className="absolute w-[114px] top-[1337px] left-[122px] [-webkit-text-stroke:0.3px_#000000] font-['Pretendard-Regular'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
            About Team DDabong-Dochi
          </div>

          <img
            className="absolute w-[136px] h-[16px] top-[1486px] left-[124px]"
            alt="Social"
            src={social}
          />

          {/* Footer Links */}
          <div className="absolute w-[125px] h-[167px] top-[1338px] left-[617px]">
            
            <div className="absolute w-[113px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Team Members
            </div>
          </div>

          <div className="absolute w-[150px] h-[167px] top-[1338px] left-[798px]">
            <div className="absolute w-[147px] top-[37px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-9">
              <span className="text-zinc-800">Sunwoo Park<br /></span>
              <span className="text-zinc-900">Dahye Lee<br /></span>
              <span className="text-zinc-800">Yongbin Kim</span>
            </div>
            <div className="absolute w-[42px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Front-End
            </div>
          </div>

          <div className="absolute w-[147px] h-[167px] top-[1338px] left-[1016px]">
            <div className="absolute w-[143px] text-gray-900 top-[37px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-9">
              TaeYoung Kim<br />
              Junho Shin<br />
              Soyeon Kim<br />
            </div>
            <div className="absolute w-[83px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Back-End
            </div>
          </div>
              
          <img
            className="absolute w-[1058px] h-px top-[1292px] left-[124px] object-cover"
            alt="Line"
            src={line203}
          />
        </div>
      </div>
    </div>
  );
};

export default MainPage;