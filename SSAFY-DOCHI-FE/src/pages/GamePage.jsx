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
      icon: '🎯',
      color: 'from-orange-400 to-red-500',
      component: RouletteGame
    },
    {
      id: 'ladder',
      title: '사다리타기',
      description: '공정한 선택을 위한 사다리타기!',
      icon: '🪜',
      color: 'from-blue-400 to-purple-500',
      component: LadderGame
    },
    {
      id: 'whack',
      title: '고슴도치 잡기',
      description: '빠르게 나타나는 고슴도치를 잡아보세요!',
      icon: '🦔',
      color: 'from-green-400 to-teal-500',
      component: WhackAMoleGame
    }
  ];

  if (selectedGame) {
    const GameComponent = selectedGame.component;
    return (
      <div className="w-full min-h-screen bg-gray-50 font-['Pretendard'] text-gray-800" style={{zoom: "75%"}}>
        <div className="w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-12">
          <GameComponent onBack={() => setSelectedGame(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 font-['Pretendard'] text-gray-800" style={{zoom: "75%"}}>
      <div className="w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-12">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-[#bf7d2c]">
            참견도치 게임존
          </h1>
          <p className="text-lg text-gray-600">재미있는 게임을 선택해서 즐겨보세요!</p>
        </div>

        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              {/* 카드 헤더 */}
              <div className={`h-32 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                <div className="text-6xl">{game.icon}</div>
              </div>
              
              {/* 카드 내용 */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{game.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{game.description}</p>
                <div className="flex justify-center">
                  <button className="px-6 py-2 bg-[#bf7d2c] text-white rounded-lg font-medium hover:bg-[#a66a25] transition-colors duration-200">
                    게임 시작
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 게임 설명 */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">게임 소개</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-lg mb-2">참견도치 룰렛</h3>
              <p className="text-gray-600 text-sm">
                여러 고민 중에서 어떤 것부터 해결할지 모르겠을 때! 
                룰렛을 돌려서 참견도치가 선택해드릴게요.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🪜</div>
              <h3 className="font-bold text-lg mb-2">사다리타기</h3>
              <p className="text-gray-600 text-sm">
                공정한 선택이 필요할 때 사용하세요! 
                참가자와 상품을 설정하고 사다리를 타보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🦔</div>
              <h3 className="font-bold text-lg mb-2">고슴도치 잡기</h3>
              <p className="text-gray-600 text-sm">
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
