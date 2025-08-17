import React, { useState, useEffect } from 'react';

const LadderGame = ({ onBack }) => {
  const [players, setPlayers] = useState(['참가자1', '참가자2']);
  const [rewards, setRewards] = useState(['상품1', '상품2']);
  const [newPlayer, setNewPlayer] = useState('');
  const [newReward, setNewReward] = useState('');
  const [ladderData, setLadderData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [editPlayerValue, setEditPlayerValue] = useState('');
  const [editRewardValue, setEditRewardValue] = useState('');

  // 사다리 생성
  const generateLadder = () => {
    if (players.length !== rewards.length) {
      alert('참가자 수와 상품 수가 같아야 합니다!');
      return;
    }

    if (players.length < 2) {
      alert('최소 2명 이상의 참가자가 필요합니다!');
      return;
    }

    const numPlayers = players.length;
    const numRows = Math.max(8, numPlayers * 2); // 최소 8개 행, 참가자 수에 따라 증가
    const ladder = [];

    for (let row = 0; row < numRows; row++) {
      const ladderRow = [];
      let lastHadBridge = false;

      for (let col = 0; col < numPlayers - 1; col++) {
        // 연속된 다리를 방지하고, 적절한 확률로 다리 생성
        const shouldHaveBridge = !lastHadBridge && Math.random() > 0.5;
        ladderRow.push(shouldHaveBridge);
        lastHadBridge = shouldHaveBridge;
      }
      ladder.push(ladderRow);
    }

    setLadderData(ladder);
    setIsPlaying(true);
    setResults([]);
  };

  // 경로 추적 및 애니메이션
  const tracePath = async (startCol) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedPlayer(startCol);
    
    let currentCol = startCol;
    const path = [{ row: -1, col: currentCol }]; // 시작점

    for (let row = 0; row < ladderData.length; row++) {
      // 현재 위치 추가
      path.push({ row, col: currentCol });

      // 왼쪽 다리 확인 (현재 col > 0이고 왼쪽에 다리가 있는 경우)
      if (currentCol > 0 && ladderData[row][currentCol - 1]) {
        currentCol = currentCol - 1;
        path.push({ row, col: currentCol, bridge: true });
      }
      // 오른쪽 다리 확인 (현재 위치에 다리가 있는 경우)
      else if (currentCol < ladderData[0].length && ladderData[row][currentCol]) {
        currentCol = currentCol + 1;
        path.push({ row, col: currentCol, bridge: true });
      }
    }

    // 도착점 추가
    path.push({ row: ladderData.length, col: currentCol });

    // 애니메이션으로 경로 표시
    setCurrentPath([]);
    for (let i = 0; i < path.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setCurrentPath(prev => [...prev, path[i]]);
    }

    // 결과 저장
    const newResult = {
      player: players[startCol],
      reward: rewards[currentCol],
      playerIndex: startCol,
      rewardIndex: currentCol
    };
    
    setResults(prev => [...prev, newResult]);
    setIsAnimating(false);
    setSelectedPlayer(null);
  };

  // 참가자 추가
  const addPlayer = (e) => {
    e.preventDefault();
    if (newPlayer.trim() && players.length < 6) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  // 상품 추가
  const addReward = (e) => {
    e.preventDefault();
    if (newReward.trim() && rewards.length < 6) {
      setRewards([...rewards, newReward.trim()]);
      setNewReward('');
    }
  };

  // 참가자 삭제
  const removePlayer = (index) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  // 상품 삭제
  const removeReward = (index) => {
    if (rewards.length > 2) {
      setRewards(rewards.filter((_, i) => i !== index));
    }
  };

  // 참가자 편집 시작
  const startEditingPlayer = (index) => {
    setEditingPlayer(index);
    setEditPlayerValue(players[index]);
  };

  // 참가자 편집 저장
  const savePlayerEdit = (index) => {
    if (editPlayerValue.trim()) {
      const newPlayers = [...players];
      newPlayers[index] = editPlayerValue.trim();
      setPlayers(newPlayers);
    }
    setEditingPlayer(null);
    setEditPlayerValue('');
  };

  // 참가자 편집 취소
  const cancelPlayerEdit = () => {
    setEditingPlayer(null);
    setEditPlayerValue('');
  };

  // 상품 편집 시작
  const startEditingReward = (index) => {
    setEditingReward(index);
    setEditRewardValue(rewards[index]);
  };

  // 상품 편집 저장
  const saveRewardEdit = (index) => {
    if (editRewardValue.trim()) {
      const newRewards = [...rewards];
      newRewards[index] = editRewardValue.trim();
      setRewards(newRewards);
    }
    setEditingReward(null);
    setEditRewardValue('');
  };

  // 상품 편집 취소
  const cancelRewardEdit = () => {
    setEditingReward(null);
    setEditRewardValue('');
  };

  // 게임 리셋
  const resetGame = () => {
    setIsPlaying(false);
    setCurrentPath([]);
    setResults([]);
    setLadderData([]);
    setSelectedPlayer(null);
  };

  // 경로가 포함되어 있는지 확인
  const isInPath = (row, col, isBridge = false) => {
    return currentPath.some(point => 
      point.row === row && point.col === col && (isBridge ? point.bridge : !point.bridge)
    );
  };

  return (
    <div className="w-full">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-[#bf7d2c] hover:bg-orange-50 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          게임 선택으로 돌아가기
        </button>
      </div>

      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-[#bf7d2c]">
          참견도치 사다리타기
        </h1>
        <p className="text-lg text-gray-600">공정한 선택을 위한 사다리타기 게임!</p>
      </div>

      {!isPlaying ? (
        /* 설정 화면 */
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 참가자 설정 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                👥 참가자 ({players.length}/6)
              </h3>
              
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    {editingPlayer === index ? (
                      // 편집 모드
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editPlayerValue}
                          onChange={(e) => setEditPlayerValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              savePlayerEdit(index);
                            }
                            if (e.key === 'Escape') {
                              cancelPlayerEdit();
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => savePlayerEdit(index)}
                          className="text-green-600 hover:text-green-800 font-bold text-sm px-2"
                          title="저장"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelPlayerEdit}
                          className="text-gray-500 hover:text-gray-700 font-bold text-sm px-2"
                          title="취소"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      // 보기 모드
                      <>
                        <span className="font-medium text-blue-800 flex-1">{player}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditingPlayer(index)}
                            className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                            title="수정"
                          >
                            ✏️
                          </button>
                          {players.length > 2 && (
                            <button
                              onClick={() => removePlayer(index)}
                              className="text-red-500 hover:text-red-700 font-bold text-lg px-2"
                              title="삭제"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {players.length < 6 && (
                <form onSubmit={addPlayer} className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                    placeholder="참가자 이름"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newPlayer.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </form>
              )}
            </div>

            {/* 상품 설정 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🎁 상품 ({rewards.length}/6)
              </h3>
              
              <div className="space-y-2">
                {rewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    {editingReward === index ? (
                      // 편집 모드
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editRewardValue}
                          onChange={(e) => setEditRewardValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveRewardEdit(index);
                            }
                            if (e.key === 'Escape') {
                              cancelRewardEdit();
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRewardEdit(index)}
                          className="text-green-600 hover:text-green-800 font-bold text-sm px-2"
                          title="저장"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelRewardEdit}
                          className="text-gray-500 hover:text-gray-700 font-bold text-sm px-2"
                          title="취소"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      // 보기 모드
                      <>
                        <span className="font-medium text-green-800 flex-1">{reward}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditingReward(index)}
                            className="text-green-500 hover:text-green-700 text-sm px-2 py-1"
                            title="수정"
                          >
                            ✏️
                          </button>
                          {rewards.length > 2 && (
                            <button
                              onClick={() => removeReward(index)}
                              className="text-red-500 hover:text-red-700 font-bold text-lg px-2"
                              title="삭제"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {rewards.length < 6 && (
                <form onSubmit={addReward} className="flex gap-2">
                  <input
                    type="text"
                    value={newReward}
                    onChange={(e) => setNewReward(e.target.value)}
                    placeholder="상품 이름"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!newReward.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 사다리 생성 버튼 */}
          <div className="text-center mt-8">
            <button
              onClick={generateLadder}
              className="px-8 py-3 bg-[#bf7d2c] text-white rounded-lg text-lg font-bold hover:bg-[#a66a25] transition-colors duration-200"
            >
              사다리 생성하기
            </button>
          </div>
        </div>
      ) : (
        /* 게임 화면 */
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 사다리 */}
          <div className="overflow-x-auto mb-8">
            <div className="min-w-max mx-auto" style={{ width: `${players.length * 100 + 20}px` }}>
              {/* 참가자 이름 */}
              <div className="flex justify-between mb-4">
                {players.map((player, index) => (
                  <button
                    key={index}
                    onClick={() => tracePath(index)}
                    disabled={isAnimating}
                    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${
                      selectedPlayer === index
                        ? 'bg-blue-500 text-white'
                        : isAnimating
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                    }`}
                    style={{ width: '100px' }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg mb-[-2px]">🦔</span>
                      <span className="text-xs">{player}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 사다리 구조 */}
              <div className="relative">
                {/* 세로 선 */}
                {players.map((_, index) => (
                  <div
                    key={index}
                    className="absolute bg-gray-400"
                    style={{
                      left: `${index * 100 + 50}px`,
                      top: '0px',
                      width: '2px',
                      height: `${ladderData.length * 40}px`
                    }}
                  />
                ))}

                {/* 사다리 가로선들 */}
                {ladderData.map((row, rowIndex) => (
                  <div key={rowIndex} style={{ height: '40px', position: 'relative' }}>
                    {row.map((hasBridge, colIndex) => (
                      hasBridge && (
                        <div
                          key={colIndex}
                          className={`absolute bg-gray-400 transition-all duration-300 ${
                            isInPath(rowIndex, colIndex, true) ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{
                            left: `${colIndex * 100 + 52}px`,
                            top: '19px',
                            width: '96px',
                            height: '2px'
                          }}
                        />
                      )
                    ))}
                  </div>
                ))}

                {/* 경로 표시를 위한 고슴도치 */}
                {currentPath.map((point, index) => (
                  !point.bridge && (
                    <div
                      key={index}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{
                        left: `${point.col * 100 + 51}px`,
                        top: `${(point.row + 1) * 40 - 20}px`,
                        animation: `fadeIn 0.3s ease-in-out`
                      }}
                    >
                      <span className="text-2xl">🦔</span>
                    </div>
                  )
                ))}
              </div>

              {/* 상품 */}
              <div className="flex justify-between mt-4">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 rounded-lg font-bold text-center transition-all duration-200 ${
                      results.some(r => r.rewardIndex === index)
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-800'
                    }`}
                    style={{ width: '100px' }}
                  >
                    {reward}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 표시 */}
          {results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">결과</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <span className="font-medium text-blue-800">{result.player}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium text-green-800">{result.reward}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 제어 버튼 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              다시 설정하기
            </button>
            <button
              onClick={() => setCurrentPath([])}
              disabled={isAnimating}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              경로 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LadderGame;