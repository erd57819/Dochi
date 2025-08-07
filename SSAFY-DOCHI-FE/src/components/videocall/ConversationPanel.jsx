import React, { useEffect, useRef } from 'react';

const ConversationPanel = ({
  conversation,
  isSTTActive,
  currentTranscript,
  toggleSTT
}) => {
  const conversationEndRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* STT 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">실시간 대화</h3>
          <button
            onClick={toggleSTT}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isSTTActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSTTActive ? 'STT 중지' : 'STT 시작'}
          </button>
        </div>
        
        {/* 실시간 전사 중인 텍스트 */}
        {isSTTActive && currentTranscript && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
            <div className="text-xs text-yellow-600 mb-1">입력 중...</div>
            <div className="text-gray-700">{currentTranscript}</div>
          </div>
        )}
      </div>

      {/* 대화 내용 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <p>STT를 시작하여 대화를 기록해보세요</p>
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.speaker === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.speaker === 'me'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="text-sm font-medium mb-1">
                  {msg.speaker === 'me' ? '나' : msg.speaker}
                </div>
                <div className="text-sm leading-relaxed">{msg.text}</div>
                <div className={`text-xs mt-1 opacity-75 ${
                  msg.speaker === 'me' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={conversationEndRef} />
      </div>

      {/* STT 상태 표시 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className={`flex items-center text-sm ${
          isSTTActive ? 'text-green-600' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isSTTActive ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          {isSTTActive ? '실시간 전사 활성' : '실시간 전사 비활성'}
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;