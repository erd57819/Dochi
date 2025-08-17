import React, { useState, useEffect, useRef } from 'react';
import hedgehogImg from '../../assets/image-65.png';
import mangchidochi from '../../assets/mangchidochi.png';
const WhackAMoleGame = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moles, setMoles] = useState(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState('normal');
  
  const gameIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const moleTimeoutsRef = useRef({});
  const isPlayingRef = useRef(false);

  // 게임 설정 - 난이도 대폭 상향
  const gameSettings = {
    easy: { 
      popUpInterval: 800,      // 더 빠른 생성
      popUpDuration: 1800,     // 약간 더 오래 보임
      timeBonus: 40, 
      points: 10,
      maxMoles: 2              // 동시에 최대 2개
    },
    normal: { 
      popUpInterval: 500,      // 매우 빠른 생성
      popUpDuration: 1200,     // 짧은 노출 시간
      timeBonus: 30, 
      points: 15,
      maxMoles: 3              // 동시에 최대 3개
    },
    hard: { 
      popUpInterval: 300,      // 극도로 빠른 생성
      popUpDuration: 800,      // 매우 짧은 노출
      timeBonus: 20, 
      points: 20,
      maxMoles: 4              // 동시에 최대 4개
    }
  };

  // 고슴도치 상태: null (없음), 'normal' (일반), 'crying' (우는중)
  
  // 랜덤 위치에 고슴도치 생성
  const popUpMole = () => {
    if (!isPlayingRef.current) return;
    
    setMoles(currentMoles => {
      const emptyHoles = currentMoles.map((mole, index) => 
        mole === null ? index : -1
      ).filter(index => index !== -1);
      
      const activeMoles = currentMoles.filter(m => m !== null).length;
      const settings = gameSettings[difficulty];
      
      // 최대 고슴도치 수를 초과하면 생성하지 않음
      if (emptyHoles.length === 0 || activeMoles >= settings.maxMoles) return currentMoles;
      
      const randomIndex = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
      const newMoles = [...currentMoles];
      newMoles[randomIndex] = 'normal';
      
      // 일정 시간 후 자동으로 사라지게
      const timeout = setTimeout(() => {
        setMoles(prev => {
          const updatedMoles = [...prev];
          if (updatedMoles[randomIndex] === 'normal') {
            updatedMoles[randomIndex] = null;
          }
          return updatedMoles;
        });
        delete moleTimeoutsRef.current[randomIndex];
      }, settings.popUpDuration);
      
      moleTimeoutsRef.current[randomIndex] = timeout;
      
      return newMoles;
    });
  };

  // 게임 시작
  const startGame = () => {
    // 초기화
    setIsPlaying(true);
    isPlayingRef.current = true;
    setGameOver(false);
    setScore(0);
    setTimeLeft(gameSettings[difficulty].timeBonus);
    setMoles(Array(9).fill(null));
    
    // 모든 타임아웃 클리어
    Object.values(moleTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    moleTimeoutsRef.current = {};

    // 타이머 시작
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 즉시 첫 고슴도치 생성
    setTimeout(() => {
      popUpMole();
      // 난이도에 따라 추가 고슴도치 생성
      if (difficulty !== 'easy') {
        setTimeout(popUpMole, 200);
      }
      if (difficulty === 'hard') {
        setTimeout(popUpMole, 400);
      }
    }, 100);

    // 고슴도치 주기적으로 생성
    gameIntervalRef.current = setInterval(() => {
      popUpMole();
    }, gameSettings[difficulty].popUpInterval);
  };

  // 게임 종료
  const endGame = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setGameOver(true);
    setMoles(Array(9).fill(null));
    
    // 모든 타임아웃과 인터벌 클리어
    Object.values(moleTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    moleTimeoutsRef.current = {};
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 최고 점수 업데이트
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('hedgehogGameHighScore', score.toString());
    }
  };

  // 고슴도치 클릭
  const whackMole = (index) => {
    if (!isPlaying || moles[index] !== 'normal') return;
    
    // 점수 증가
    const points = gameSettings[difficulty].points;
    setScore(prev => prev + points);
    
    // 기존 타임아웃 클리어
    if (moleTimeoutsRef.current[index]) {
      clearTimeout(moleTimeoutsRef.current[index]);
      delete moleTimeoutsRef.current[index];
    }
    
    // 고슴도치를 우는 상태로 변경
    setMoles(prev => {
      const newMoles = [...prev];
      newMoles[index] = 'crying';
      return newMoles;
    });
    
    // 잠시 후 사라지게
    const timeout = setTimeout(() => {
      setMoles(prev => {
        const newMoles = [...prev];
        if (newMoles[index] === 'crying') {
          newMoles[index] = null;
        }
        return newMoles;
      });
      delete moleTimeoutsRef.current[index];
    }, 600);
    
    moleTimeoutsRef.current[index] = timeout;
  };

  // 컴포넌트 마운트 시 최고 점수 로드
  useEffect(() => {
    const savedHighScore = localStorage.getItem('hedgehogGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      Object.values(moleTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="w-full">
      <style>{`
        @keyframes popUp {
          0% { 
            transform: translateY(120%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translateY(-10%) scale(1.05);
            opacity: 1;
          }
          100% { 
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(-3px) translateY(0) rotate(-2deg); }
          75% { transform: translateX(3px) translateY(0) rotate(2deg); }
        }
        
        @keyframes tearDrop {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
          50% {
            transform: translateY(15px) scale(1.2); 
            opacity: 0.8; 
          }
          100% { 
            transform: translateY(25px) scale(0.8); 
            opacity: 0; 
          }
        }
        
        .mole-normal {
          animation: popUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        .mole-crying {
          animation: shake 0.5s ease-in-out;
        }
        
        .tear {
          animation: tearDrop 0.8s ease-out forwards;
        }
      `}</style>

      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 transition-colors duration-200"
          style={{ color: '#bf7d2c' }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fff7ed')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          게임 선택으로 돌아가기
        </button>
      </div>

      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src={mangchidochi} 
            alt="고슴도치" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#333333' }}>
          고슴도치 잡기
        </h1>
        <p className="text-lg" style={{ color: '#666666' }}>빠르게 튀어나오는 고슴도치를 잡아보세요!</p>
      </div>

      <div className="bg-white p-8">
        {/* 게임 정보 */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          <div className="text-center px-6 py-3" style={{ backgroundColor: '#fff7ed' }}>
            <div className="text-3xl font-bold" style={{ color: '#bf7d2c' }}>{score}</div>
            <div className="text-sm mt-1" style={{ color: '#666666' }}>점수</div>
          </div>
          <div className="text-center px-6 py-3" style={{ backgroundColor: '#eff6ff' }}>
            <div className="text-3xl font-bold" style={{ color: '#2563eb' }}>{timeLeft}초</div>
            <div className="text-sm mt-1" style={{ color: '#666666' }}>남은 시간</div>
          </div>
          <div className="text-center px-6 py-3" style={{ backgroundColor: '#f0fdf4' }}>
            <div className="text-3xl font-bold" style={{ color: '#16a34a' }}>{highScore}</div>
            <div className="text-sm mt-1" style={{ color: '#666666' }}>최고 기록</div>
          </div>
        </div>

        {/* 난이도 선택 */}
        {!isPlaying && !gameOver && (
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">난이도를 선택하세요!</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDifficulty('easy')}
                className={`px-8 py-4 font-bold transition-all duration-200 ${
                  difficulty === 'easy'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: difficulty === 'easy' ? '#10b981' : undefined
                }}
              >
                <div className="text-2xl mb-1">😊</div>
                <div>쉬움</div>
                <div className="text-xs mt-1">10점 / 40초</div>
                <div className="text-[10px] text-gray-500">최대 2마리</div>
              </button>
              <button
                onClick={() => setDifficulty('normal')}
                className={`px-8 py-4 font-bold transition-all duration-200 ${
                  difficulty === 'normal'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: difficulty === 'normal' ? '#f97316' : undefined
                }}
              >
                <div className="text-2xl mb-1">😐</div>
                <div>보통</div>
                <div className="text-xs mt-1">15점 / 30초</div>
                <div className="text-[10px] text-gray-100">최대 3마리</div>
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={`px-8 py-4 font-bold transition-all duration-200 ${
                  difficulty === 'hard'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: difficulty === 'hard' ? '#ef4444' : undefined
                }}
              >
                <div className="text-2xl mb-1">😤</div>
                <div>어려움</div>
                <div className="text-xs mt-1">20점 / 20초</div>
                <div className="text-[10px] text-gray-100">최대 4마리</div>
              </button>
            </div>
          </div>
        )}

        {/* 게임 보드 */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="grid grid-cols-3 gap-4 p-6" style={{ backgroundColor: '#f0fdf4' }}>
            {moles.map((mole, index) => (
              <div
                key={index}
                className="relative aspect-square cursor-pointer"
                onClick={() => whackMole(index)}
              >
                {/* 구멍 */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-inner"></div>
                <div className="absolute inset-2 bg-gradient-to-b from-amber-700 to-black rounded-full shadow-inner"></div>
                
                {/* 고슴도치 컨테이너 */}
                <div className="absolute inset-0 flex items-end justify-center overflow-hidden pb-1">
                  {mole && (
                    <div
                      className={`relative ${
                        mole === 'normal' ? 'mole-normal' : 
                        mole === 'crying' ? 'mole-crying' : ''
                      }`}
                      style={{
                        marginBottom: '8px',
                        transform: mole === 'normal' ? 'scale(1)' : 'scale(0.95)'
                      }}
                    >
                      {/* 고슴도치 이미지 */}
                      <img 
                        src={hedgehogImg} 
                        alt="고슴도치"
                        className="w-16 h-16 object-contain"
                      />
                      
                      {/* 눈물 효과 - 눈 위치에서 나오도록 */}
                      {mole === 'crying' && (
                        <>
                          <div className="absolute left-[14px] top-[28px] text-[10px] tear">💧</div>
                          <div className="absolute right-[14px] top-[28px] text-[10px] tear" style={{animationDelay: '0.2s'}}>💧</div>
                          <div className="absolute left-1/2 transform -translate-x-1/2 top-[35px]">
                            <span className="text-2xl">😢</span>
                          </div>
                        </>
                      )}
                      
                      {/* 점수 표시 */}
                      {mole === 'crying' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xl font-bold text-yellow-400 animate-pulse">
                          +{gameSettings[difficulty].points}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 게임 제어 버튼 */}
        <div className="text-center">
          {!isPlaying && !gameOver && (
            <button
              onClick={startGame}
              className="group px-12 py-5 text-white text-2xl font-bold transition-all duration-300"
              style={{ backgroundColor: '#bf7d2c' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#a66a25')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
            >
              <span className="flex items-center gap-3">
                게임 시작! 
                <span className="text-3xl group-hover:animate-bounce">🎮</span>
              </span>
            </button>
          )}
          
          {isPlaying && (
            <button
              onClick={endGame}
              className="px-8 py-4 text-white text-xl font-bold transition-all duration-200"
              style={{ backgroundColor: '#ef4444' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ef4444')}
            >
              게임 종료 🛑
            </button>
          )}
          
          {gameOver && (
            <div className="space-y-6">
              <div className="p-8" style={{ backgroundColor: '#fdf2f8' }}>
                <h3 className="text-3xl font-bold text-gray-800 mb-3">게임 종료! 🎊</h3>
                <p className="text-2xl text-gray-600 mb-2">
                  최종 점수: <span className="font-bold text-[#bf7d2c] text-3xl">{score}점</span>
                </p>
                {score === highScore && score > 0 && (
                  <div className="mt-4 text-green-600 font-bold text-xl animate-pulse">
                    🎉 새로운 최고 기록! 🎉
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setGameOver(false);
                  setScore(0);
                  setTimeLeft(gameSettings[difficulty].timeBonus);
                }}
                className="group px-12 py-5 text-white text-2xl font-bold transition-all duration-300"
                style={{ backgroundColor: '#bf7d2c' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#a66a25')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
              >
                <span className="flex items-center gap-3">
                  다시 도전! 
                  <span className="text-3xl group-hover:animate-bounce">🔄</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 게임 설명 */}
        {!isPlaying && (
          <div className="mt-8 p-6 text-center" style={{ backgroundColor: '#eff6ff' }}>
            <h4 className="font-bold text-lg mb-3 text-gray-800">🎮 게임 방법</h4>
            <div className="space-y-2 text-gray-600">
              <p>1. 구멍에서 빠르게 나오는 고슴도치를 클릭하세요!</p>
              <p>2. 고슴도치를 클릭하면 눈물을 흘리며 점수를 얻습니다 😢</p>
              <p>3. 난이도가 높을수록 여러 마리가 동시에 나타납니다!</p>
              <p className="text-sm text-gray-500 mt-3">
                💡 팁: 어려움 모드는 최대 4마리가 동시에 나타나요!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhackAMoleGame;