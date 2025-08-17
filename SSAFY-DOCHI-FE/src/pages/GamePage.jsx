import React, { useState } from 'react';
import RouletteGame from '../components/games/RouletteGame.jsx';
import LadderGame from '../components/games/LadderGame.jsx';
import WhackAMoleGame from '../components/games/WhackAMoleGame.jsx';

const GamePage = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: 'roulette',
      title: '참견도치 룰렛',
      description: '고민거리를 룰렛으로 선택해보세요!',
      color: '#83673f',
      component: RouletteGame
    },
    {
      id: 'ladder',
      title: '사다리타기',
      description: '공정한 선택을 위한 사다리타기!',
      color: '#cd9f6e',
      component: LadderGame
    },
    {
      id: 'whack',
      title: '고슴도치 잡기',
      description: '빠르게 나타나는 고슴도치를 잡아보세요!',
      color: '#EE9278',
      component: WhackAMoleGame
    }
  ];

  if (selectedGame) {
    const GameComponent = selectedGame.component;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50" style={{zoom: "75%"}}>
        <div className="max-w-5xl mx-auto px-3 py-10">
          <GameComponent onBack={() => setSelectedGame(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50" style={{zoom: "75%"}}>
      <div className="max-w-5xl mx-auto px-3 py-10">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#333333' }}>
            참견도치 게임존
          </h1>
          <p className="text-lg" style={{ color: '#666666' }}>재미있는 게임을 선택해서 즐겨보세요!</p>
        </div>

        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white cursor-pointer transition-all duration-300 hover:bg-orange-50 p-8"
              onClick={() => setSelectedGame(game)}
            >
              {/* 카드 헤더 - 더 큰 아이콘 */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: game.color }}>
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="55" r="25" fill="white" opacity="0.9"/>
                    <circle cx="50" cy="35" r="15" fill="white" opacity="0.8"/>
                    <circle cx="45" cy="32" r="2" fill="black"/>
                    <circle cx="55" cy="32" r="2" fill="black"/>
                    <circle cx="50" cy="38" r="1" fill="black"/>
                    <path d="M30 25 L35 20 L40 25 L45 20 L50 25 L55 20 L60 25 L65 20 L70 25" stroke="white" strokeWidth="2" fill="none" opacity="0.8"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#333333' }}>{game.title}</h3>
              </div>
              
              {/* 게임 소개 */}
              <div className="text-center mb-8">
                <p className="text-base leading-relaxed mb-6" style={{ color: '#666666' }}>{game.description}</p>
                
                {/* 게임별 상세 소개 */}
                <div className="bg-orange-50 p-4 rounded-lg mb-6">
                  {game.id === 'roulette' && (
                    <div className="space-y-2 text-sm" style={{ color: '#666666' }}>
                      <p>• 여러 고민 중 우선순위를 정해보세요</p>
                      <p>• 룰렛이 공정하게 선택해드립니다</p>
                      <p>• 참견도치의 조언도 함께!</p>
                    </div>
                  )}
                  {game.id === 'ladder' && (
                    <div className="space-y-2 text-sm" style={{ color: '#666666' }}>
                      <p>• 공정한 선택이 필요할 때</p>
                      <p>• 참가자와 상품을 설정하세요</p>
                      <p>• 투명하고 재미있는 결정!</p>
                    </div>
                  )}
                  {game.id === 'whack' && (
                    <div className="space-y-2 text-sm" style={{ color: '#666666' }}>
                      <p>• 스트레스 해소에 완벽!</p>
                      <p>• 3가지 난이도로 도전하세요</p>
                      <p>• 최고 기록을 세워보세요!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 게임 시작 버튼 */}
              <div className="text-center">
                <button 
                  className="w-full py-4 text-white font-bold text-lg transition-colors duration-200 rounded-lg"
                  style={{ backgroundColor: '#bf7d2c' }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#a66a25')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
                >
                  게임 시작하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 게임 설명 */}
        <div className="mt-16 bg-white p-8">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#333333' }}>게임 소개</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4">
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#333333' }}>참견도치 룰렛</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                여러 고민 중에서 어떤 것부터 해결할지 모르겠을 때! 
                룰렛을 돌려서 참견도치가 선택해드릴게요.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4">
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#333333' }}>사다리타기</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                공정한 선택이 필요할 때 사용하세요! 
                참가자와 상품을 설정하고 사다리를 타보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4">
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#333333' }}>고슴도치 잡기</h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                스트레스 해소가 필요할 때! 
                빠르게 나타나는 고슴도치를 잡아서 점수를 쌓아보세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
