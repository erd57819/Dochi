import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Swiper CSS imports
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const MainPage = () => {
  const navigate = useNavigate();

  const slideData = [
    {
      id: 1,
      title: "나만의 ",
      highlightTitle: "고민해결",
      subtitle: " 플랫폼,",
      brandName: "참견도치",
      buttonText: "참견도치 서비스하기",
      secondaryButton: "고객센터"
    },
    {
      id: 2,
      title: "충돌하지 않는 갈등",
      subtitle: "참견도치가 참견해드립니다"
    },
    {
      id: 3,
      title: "고민이 있다면?",
      subtitle: "비밀보장되는 참견도치가 들어줄게요"
    }
  ];

  const serviceCards = [
    {
      id: 1,
      title: '참견도치 커뮤니티',
      description: '나만의 고민을 참견도치 팀과 익명의 유저들이 함께 고민 상담을 합니다',
      path: '/community',
      bgColor: 'bg-amber-700',
      textColor: 'text-white'
    },
    {
      id: 2,
      title: '토닥토닥 서비스',
      description: '부끄러워 아무도 모르게 혼자 힐링하고 싶다면 참견도치의 위로를 받아보세요',
      path: '/todak',
      bgColor: 'bg-amber-600',
      textColor: 'text-white'
    },
    {
      id: 3,
      title: '참견도치와 감정 해결하기',
      description: '나의 감정을 스스로 치유할 수 있도록 도와드립니다. 순서대로 따라 와보세요',
      path: '/emotion',
      bgColor: 'bg-amber-700',
      textColor: 'text-white'
    },
    {
      id: 4,
      title: '데이터리뷰',
      description: '나만의 감정을 어떤 감정들이 있는지 재밌게 확인해봐요',
      path: '/review',
      bgColor: 'bg-amber-300',
      textColor: 'text-gray-800'
    }
  ];

  const bottomServices = [
    {
      id: 1,
      title: '토닥토닥 서비스',
      description: '참견도치가 직접 대화로 위로를 하며 나만의 감정을 풀어내요',
      bgColor: 'bg-orange-100'
    },
    {
      id: 2,
      title: '참견도치와 감정 해결하기',
      description: '한걸음 한걸음 따라하면서 부끄러운 사연이나 참견도치가 직접 감정을 풀어줍니다',
      bgColor: 'bg-orange-100'
    },
    {
      id: 3,
      title: '커뮤니티',
      description: '익명의 사용자와 고민을 나누고 답변과 응원을 받아보세요',
      bgColor: 'bg-orange-100'
    }
  ];

  const HedgehogImage = ({ size = "w-32 h-32" }) => (
    <div className={`${size} flex items-center justify-center`}>
      <span className="text-6xl">🦔</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Slider Section */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="h-[500px]">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={true}
            pagination={{ 
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active'
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            loop={true}
            className="w-full h-full"
            speed={500}
            threshold={10}
            resistanceRatio={0.85}
            touchRatio={1}
            preventInteractionOnTransition={true}
            touchStartPreventDefault={false}
            touchMoveStopPropagation={true}
            onSlideChange={() => console.log('slide change')}
            onSwiper={(swiper) => console.log(swiper)}
          >
            {slideData.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="w-full h-full flex items-center justify-center px-8">
                  <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center">
                      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        {slide.title}
                        {slide.highlightTitle && (
                          <span className="text-orange-500">{slide.highlightTitle}</span>
                        )}
                        {slide.subtitle}
                      </h1>
                      {slide.brandName && (
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-3">
                          {slide.brandName}
                          <span className="text-6xl">🦔</span>
                        </h2>
                      )}
                      
                      {slide.buttonText && (
                        <div className="flex gap-4 justify-center">
                          <button 
                            onClick={() => navigate('/service')}
                            className="bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
                          >
                            {slide.buttonText}
                          </button>
                          {slide.secondaryButton && (
                            <button className="border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-full font-semibold hover:bg-amber-50 transition-colors">
                              {slide.secondaryButton}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Service Cards Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {serviceCards.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(service.path)}
                className={`${service.bgColor} ${service.textColor} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
              >
                <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex justify-end mt-6">
                  <span className="text-2xl opacity-70">→</span>
                </div>
              </div>
            ))}
          </div>

          {/* 참견도치의 서비스 Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">참견도치의 서비스</h2>
          </div>

          <div className="space-y-12">
            {bottomServices.map((service, index) => (
              <div key={service.id} className="flex flex-col md:flex-row items-center gap-8">
                {index % 2 === 0 ? (
                  <>
                    <div className={`${service.bgColor} p-8 rounded-2xl shadow-lg flex-1`}>
                      <h3 className="text-xl font-bold mb-4 text-gray-800">{service.title}</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                    <div className="w-32 h-32 flex items-center justify-center">
                      <span className="text-7xl">🦔</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 flex items-center justify-center order-2 md:order-1">
                      <span className="text-7xl">🦔</span>
                    </div>
                    <div className={`${service.bgColor} p-8 rounded-2xl shadow-lg flex-1 order-1 md:order-2`}>
                      <h3 className="text-xl font-bold mb-4 text-gray-800">{service.title}</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🦔</span>
                <h4 className="font-bold">참견도치</h4>
              </div>
              <p className="text-sm text-gray-400">
                Learn how to grow audience fast in Twitter
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Features</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Tweets</li>
                <li>Threads</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Resources</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Blog</li>
                <li>Help</li>
                <li>Terms & Privacy</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About</li>
                <li>Contact</li>
                <li>Refund Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex justify-between items-center">
            <p className="text-sm text-gray-400">© 2023 Hypefury, Inc.</p>
            <div className="flex gap-4">
              <span className="text-gray-400 cursor-pointer hover:text-white">f</span>
              <span className="text-gray-400 cursor-pointer hover:text-white">t</span>
              <span className="text-gray-400 cursor-pointer hover:text-white">in</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;