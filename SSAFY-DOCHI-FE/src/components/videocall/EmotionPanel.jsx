import React from 'react';

const EmotionPanel = ({
  isEmotionDetectionActive,
  currentEmotion,
  emotionHistory,
  toggleEmotionDetection
}) => {
  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    fearful: '😰',
    disgusted: '🤢',
    neutral: '😐'
  };

  const emotionLabels = {
    happy: '기쁨',
    sad: '슬픔',
    angry: '화남',
    surprised: '놀람',
    fearful: '두려움',
    disgusted: '혐오',
    neutral: '무표정'
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'text-yellow-500',
      sad: 'text-blue-500',
      angry: 'text-red-500',
      surprised: 'text-purple-500',
      fearful: 'text-gray-500',
      disgusted: 'text-green-500',
      neutral: 'text-gray-400'
    };
    return colors[emotion] || 'text-gray-400';
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* 감정 분석 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">감정 분석</h3>
          <button
            onClick={toggleEmotionDetection}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isEmotionDetectionActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isEmotionDetectionActive ? '분석 중지' : '분석 시작'}
          </button>
        </div>

        {/* 현재 감정 표시 */}
        {isEmotionDetectionActive && currentEmotion && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {emotionEmojis[currentEmotion.emotion] || '😐'}
              </div>
              <div className={`font-medium ${getEmotionColor(currentEmotion.emotion)}`}>
                {emotionLabels[currentEmotion.emotion] || '중립'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                신뢰도: {Math.round((currentEmotion.confidence || 0) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 감정 히스토리 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">감정 변화</h4>
        
        {emotionHistory.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p>감정 분석을 시작하면</p>
            <p>감정 변화가 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emotionHistory.slice(-10).map((emotion, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="text-xl mr-2">
                    {emotionEmojis[emotion.emotion] || '😐'}
                  </span>
                  <div>
                    <div className={`text-sm font-medium ${getEmotionColor(emotion.emotion)}`}>
                      {emotionLabels[emotion.emotion] || '중립'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((emotion.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(emotion.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 감정 분석 상태 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className={`flex items-center text-sm ${
          isEmotionDetectionActive ? 'text-green-600' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isEmotionDetectionActive ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          {isEmotionDetectionActive ? '감정 분석 활성' : '감정 분석 비활성'}
        </div>
      </div>
    </div>
  );
};

export default EmotionPanel;