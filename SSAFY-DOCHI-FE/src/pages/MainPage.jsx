import React from "react";
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

export const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full max-w-[1440px] relative">
        
        {/* Main Hero Section - Swiper */}
        <div className="relative w-full h-[1100px] bg-white">
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
              <div className="relative w-full max-w-[1600px] h-[900px] top-[100px] left-1/2 transform -translate-x-1/2 px-16">
                {/* Main Title */}
                <div className="absolute top-[80px] left-16">
                  <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-8xl leading-normal">
                    나만의{" "}
                    <span className="bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                      고민해결
                    </span>{" "}
                    플랫폼,
                  </div>
                  <div className="font-['Pretendard-SemiBold'] font-semibold text-[#333333] text-[115px] leading-normal">
                    참견도치 🦔
                  </div>
                </div>

                {/* Main Hedgehog Image */}
                <img
                  className="absolute w-[489px] h-[489px] top-[280px] right-16 object-cover"
                  alt="Main Hedgehog"
                  src={image65}
                />

                {/* CTA Buttons */}
                <div className="absolute top-[720px] left-16">
                  <div 
                    className="w-[295px] h-20 bg-[#bf7d2c] rounded-[20px] flex items-center justify-center cursor-pointer hover:bg-[#a66a25] transition-colors"
                    onClick={() => navigate('/service')}
                  >
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-white text-[26px] leading-normal">
                      참견도치 사용해보기
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-[740px] left-[403px] font-['Pretendard-SemiBold'] font-semibold text-[#3d2b1f] text-[26px] leading-normal underline cursor-pointer hover:text-[#bf7d2c] transition-colors">
                  더 둘러보기 →
                </div>
              </div>
            </SwiperSlide>

            {/* Slide 2: 좁혀지지 않는 갈등 */}
            <SwiperSlide>
              <div className="relative w-full h-[900px] top-[100px] px-8">
                <div className="w-full max-w-none h-full flex flex-col justify-start items-end pr-8 pt-20">
                  <div className="text-right space-y-4">
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-black text-6xl lg:text-8xl leading-tight">
                      좁혀지지 않는 갈등
                    </div>
                    <div className="font-['Pretendard-SemiBold'] font-semibold text-8xl lg:text-[115px] leading-tight">
                      <span className="text-black">참견도치가 </span>
                      <span className="text-[#bf7d2c]">참견</span>
                      <span className="text-black">해드립니다</span>
                    </div>
                  </div>
                </div>
                <img
                  className="absolute w-[400px] h-[500px] top-[350px] left-8 object-cover"
                  alt="Image"
                  src={image9}
                />
              </div>
            </SwiperSlide>

            {/* Slide 3: 고민이 있다면? */}
            <SwiperSlide>
              <div className="relative w-full h-[1100px] px-16">
                <header className="absolute top-[150px] left-24 text-black text-[115px] w-[1047px] font-['Pretendard-SemiBold'] font-semibold leading-normal">
                  고민이 있다면?
                </header>
                <main className="absolute w-full h-[600px] top-[350px] left-24 right-24">
                  <div className="absolute top-[200px] left-0 text-8xl w-[1047px] font-['Pretendard-SemiBold'] font-semibold leading-normal">
                    <span className="text-[#bf7d2c]">비밀보장</span>
                    <span className="text-black">되는</span>
                    <br />
                    <span className="text-[#030303]">참견도치</span>
                    <span className="text-black">가 들어줄게요</span>
                  </div>
                  <img
                    className="absolute w-[522px] h-[522px] top-0 right-24 object-cover"
                    alt="참견도치 캐릭터 이미지"
                    src={image10}
                  />
                </main>
              </div>
            </SwiperSlide>

          </Swiper>
          
          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev-custom absolute -left-16 top-0 bottom-0 w-20 flex items-center justify-center cursor-pointer z-10">
            <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#bf7d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="swiper-button-next-custom absolute -right-16 top-0 bottom-0 w-20 flex items-center justify-center cursor-pointer z-10">
            <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#bf7d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Custom Pagination */}
          <div className="swiper-pagination-custom absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"></div>
        </div>

        {/* Service Cards Section */}
        <div className="relative w-full h-[600px]">
          {/* Community Card */}
          <div 
            className="absolute w-[645px] h-[223px] top-[50px] left-[52px] cursor-pointer"
            onClick={() => navigate('/community')}
          >
            <div className="w-[645px] h-[204px] bg-[#f8d6b3] rounded-[20px] relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <img
                className="absolute w-[18px] h-[38px] top-[77px] right-[72px]"
                alt="Vector"
                src={vector}
              />
              
              <div className="absolute w-[453px] top-[124px] left-[43px] font-['Pretendard-Regular'] font-normal text-[#3d2b1f] text-2xl leading-normal">
                비슷한 고민을 가진 사람들과 이야기해보세요
              </div>
              
              <div className="absolute top-[43px] left-[43px] font-['Pretendard-Bold'] font-bold text-[#3d2b1f] text-4xl leading-normal whitespace-nowrap">
                참견도치 커뮤니티
              </div>
            </div>
          </div>

          {/* Conflict Resolution Card */}
          <div 
            className="absolute w-[645px] h-[368px] top-[288px] left-[52px] bg-[#83673f] rounded-[20px] cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate('/conflict-resolution')}
          >
            <img
              className="absolute w-[18px] h-[38px] top-[104px] right-[72px]"
              alt="Vector"
              src={vector2}
            />
            
            <div className="absolute w-[446px] top-[123px] left-[43px] font-['Pretendard-Regular'] font-normal text-white text-2xl leading-[35px]">
              화상 대화 속 감정과 대화을 읽고, AI 갈등 도우미참견도치가 갈등 중재를 도와줘요
            </div>
            
            <div className="absolute top-[49px] left-[43px] font-['Pretendard-Bold'] font-bold text-white text-4xl leading-normal whitespace-nowrap">
              참견도치와 갈등 해결하기
            </div>
          </div>

          {/* Comfort Service Card */}
          <div 
            className="absolute w-[645px] h-[368px] top-[50px] right-[51px] bg-[#7f5539] rounded-[20px] cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate('/comfort')}
          >
            <img
              className="absolute w-[19px] h-[38px] top-[98px] right-[70px]"
              alt="Vector"
              src={vector2}
            />
            
            <div className="absolute w-[448px] top-[124px] left-[45px] font-['Pretendard-Regular'] font-normal text-white text-2xl leading-normal">
              참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
            </div>
            
            <div className="absolute top-[46px] left-[45px] font-['Pretendard-Bold'] font-bold text-white text-4xl leading-normal whitespace-nowrap">
              토닥토닥 서비스
            </div>
          </div>

          {/* My Page Card */}
          <div 
            className="absolute w-[645px] h-[214px] top-[447px] right-[51px] cursor-pointer"
            onClick={() => navigate('/mypage')}
          >
            <div className="w-[645px] h-[204px] bg-[#cd9f6e] rounded-[20px] relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute w-[506px] top-[115px] left-[43px] font-['Pretendard-Regular'] font-normal text-[#4E2B1A] text-2xl leading-normal">
                나의 대화·중재 기록을 확인하고 관리해요
              </div>
              
              <div className="absolute top-12 left-[45px] font-['Pretendard-Bold'] font-bold text-[#4E2B1A] text-4xl leading-normal whitespace-nowrap">
                마이페이지
              </div>
              
              <img
                className="absolute w-[18px] h-[37px] top-[79px] right-[69px]"
                alt="Vector"
                src={vector3}
              />
            </div>
          </div>
        </div>

        {/* Detailed Services Section */}
        <div className="relative w-full h-[1758px] top-[200px] left-0">
          <div className="w-full h-[1310px] bg-[linear-gradient(158deg,rgba(255,255,255,1)_0%,rgba(246,250,255,1)_100%)] absolute top-0 left-0" />

          <img
            className="absolute w-[454px] h-[454px] top-[715px] left-[47px] object-cover"
            alt="Image"
            src={image10}
          />

          <img
            className="absolute w-[106px] h-[136px] top-[378px] left-[480px] object-cover"
            alt="Image"
            src={image9}
          />

          <div 
            className="absolute w-[321px] h-[30px] top-[363px] left-[121px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[42px] leading-5 tracking-[0] cursor-pointer hover:text-[#a66a25] transition-colors"
            onClick={() => navigate('/todak')}
          >
            토닥토닥 서비스
          </div>

          <div className="absolute w-[900px] h-[92px] top-[135px] left-[270px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-SemiBold'] font-semibold text-8xl leading-5 tracking-[0]">
            <span className="text-[#bf7d2c]">참견도치</span>
            <span className="text-[#333333]">의 서비스</span>
          </div>

          <div className="absolute w-[307px] h-[58px] top-[442px] left-[121px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-Medium'] font-medium text-black text-2xl leading-[25px] tracking-[0]">
            참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
          </div>

          <img
            className="absolute w-[106px] h-[136px] top-[687px] right-[152px] object-cover"
            alt="Image"
            src={image17}
          />

          <div 
            className="absolute w-[485px] h-[31px] top-[670px] left-[782px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[42px] leading-5 tracking-[0] cursor-pointer hover:text-[#a66a25] transition-colors"
            onClick={() => navigate('/emotion')}
          >
            참견도치와 갈등 해결하기
          </div>

          <div className="absolute w-[422px] h-[59px] top-[762px] left-[782px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-Medium'] font-medium text-black text-2xl tracking-[0] leading-[25px]">
            화상 대화 속 감정과 대화을 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
          </div>

          <img
            className="absolute w-[106px] h-[136px] top-[930px] right-[152px] object-cover"
            alt="Image"
            src={image18}
          />

          <div 
            className="absolute w-[485px] h-[30px] top-[928px] left-[782px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-SemiBold'] font-semibold text-[#bf7d2c] text-[42px] leading-5 tracking-[0] cursor-pointer hover:text-[#a66a25] transition-colors"
            onClick={() => navigate('/community')}
          >
            커뮤니티
          </div>

          <div className="absolute w-[307px] h-[59px] top-[1018px] left-[782px] [text-shadow:0px_4px_4px_#00000040] font-['Pretendard-Regular'] font-normal text-[#3d2b1f] text-2xl leading-normal tracking-[0]">
            비슷한 고민을 가진 사람들과 이야기해보세요
          </div>

          <img
            className="absolute w-[131px] h-[782px] top-[324px] left-[630px]"
            alt="line"
            src={line}
          />

          {/* Footer Section */}
          <div className="absolute w-full h-[522px] top-[1236px] left-0 bg-[#f6faff]" />

          <div className="absolute w-[359px] top-[1535px] left-[138px] font-['Pretendard-Regular'] font-normal text-gray-600 text-sm tracking-[0] leading-[22px]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
            dictum aliquet accumsan porta lectus ridiculus in mattis. Netus
            sodales in volutpat ullamcorper amet adipiscing fermentum.
          </div>

          <div className="absolute w-[127px] top-[1485px] left-[136px] [text-shadow:0px_4px_4px_#00000040] [-webkit-text-stroke:1px_#000000] font-['Pretendard-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
            About Rareblocks
          </div>

          <img
            className="absolute w-[151px] h-[18px] top-[1651px] left-[138px]"
            alt="Social"
            src={social}
          />

          {/* Footer Links */}
          <div className="absolute w-[139px] h-[186px] top-[1487px] left-[686px]">
            <div className="absolute w-[135px] top-[41px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-gray-900 text-sm tracking-[0] leading-10">
              About<br />
              Features<br />
              Works<br />
              Career
            </div>
            <div className="absolute w-[126px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Company
            </div>
          </div>

          <div className="absolute w-[167px] h-[186px] top-[1487px] left-[887px]">
            <div className="absolute w-[163px] top-[41px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-10">
              <span className="text-zinc-800">Customer Support<br /></span>
              <span className="text-zinc-900">Delivery Details<br /></span>
              <span className="text-zinc-800">Terms & Conditions<br />Privacy Policy</span>
            </div>
            <div className="absolute w-[47px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Help
            </div>
          </div>

          <div className="absolute w-[163px] h-[186px] top-[1487px] left-[1129px]">
            <div className="absolute w-[159px] text-gray-900 top-[41px] left-0 font-['Plus_Jakarta_Sans-Regular'] font-normal text-sm tracking-[0] leading-10">
              Free eBooks<br />
              Development Tutorial<br />
              How to - Blog<br />
              Youtube Playlist
            </div>
            <div className="absolute w-[92px] top-0 left-0 font-['Plus_Jakarta_Sans-Bold'] font-bold text-gray-900 text-base tracking-[0] leading-6 whitespace-nowrap">
              Resources
            </div>
          </div>

          {/* CTA Section */}
          <div className="absolute w-[1178px] h-[76px] top-[1310px] left-[137px]">
            <div className="absolute w-[367px] top-0 left-0 font-['Pretendard-Bold'] font-bold text-gray-900 text-[32px] tracking-[0] leading-[42px]">
              Learn how to grow 💪audience fast in Twitter
            </div>
            
            <div className="absolute top-6 right-[195px] w-[193px] h-[45px] bg-gray-900 rounded-[60px] border-[1.5px] border-solid border-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
              <div className="font-['Plus_Jakarta_Sans-Bold'] font-bold text-white text-sm tracking-[0] leading-[22px] whitespace-nowrap">
                Download Free Chapter
              </div>
            </div>
          </div>

          <img
            className="absolute w-[1175px] h-px top-[1435px] left-[138px] object-cover"
            alt="Line"
            src={line203}
          />
        </div>
      </div>
    </div>
  );
};

export default MainPage;