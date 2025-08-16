import React, { useState, useEffect, useRef } from 'react';

const ConversationSidebar = ({ 
  emotionScores,
  conflictLevel,
  conversations,
  sttEnabled,
  aiMediationEnabled,
  coachingEnabled,
  toggleSTT,
  toggleAIMediation,
  toggleCoaching,
  participantName
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const chatEndRef = useRef(null);

  // 새 메시지가 올 때마다 스크롤을 맨 아래로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // 코칭 메시지만 필터링
  const coachingMessages = conversations?.filter(conv => 
    conv.isCoachingMessage || conv.speaker === '참견도치' || conv.type === 'coaching'
  ) || [];

  // 메신저 스타일 메시지 버블 컴포넌트
  const MessageBubble = ({ message }) => {
    const isMe = message.speaker === participantName;
    const isCoaching = message.isCoachingMessage || message.speaker === '참견도치' || message.type === 'coaching';
    const isRemote = message.isRemote || message.source === 'sse' || message.source === 'livekit';

    if (isCoaching) {
      return (
        <div className="w-full mb-3">
          <div className="bg-gradient-to-r from-[#E8DCC0] to-[#F2EDE2] border-[#5C351A] border-2 rounded-lg p-3 shadow-lg">
            <div className="flex items-center mb-2">
              <span className="mr-2">🤖</span>
              <span className="bg-[#5C351A] text-white px-2 py-1 rounded-full text-xs mr-2">AI 코칭</span>
              <span className="text-[#4D280E] font-semibold text-sm">{message.speaker}</span>
              <span className="ml-auto text-[#4A4A4A] text-xs">{message.timestamp}</span>
            </div>
            <p className="text-[#3E1F0A] font-medium text-sm">{message.text}</p>
            {message.urgency && (
              <div className="mt-2 text-xs text-[#5C351A]">
                <span className="font-semibold">긴급도:</span> {message.urgency}
                {message.triggerType && (
                  <span className="ml-2"><span className="font-semibold">트리거:</span> {message.triggerType}</span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
          {/* 발화자 이름 */}
          <div className={`text-xs mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
            <span className="text-[#4A4A4A] font-medium">
              {message.speaker}
              {isRemote && <span className="ml-1 text-blue-500">🌐</span>}
              {isMe && <span className="ml-1 text-green-500">👤</span>}
            </span>
          </div>
          
          {/* 메시지 버블 */}
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isMe 
              ? 'bg-[#5C351A] text-white rounded-br-md' 
              : 'bg-[#F8F5F0] text-[#2A2A2A] border border-[#D6CDB8] rounded-bl-md'
          }`}>
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          
          {/* 시간 */}
          <div className={`text-xs mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
            <span className="text-[#4A4A4A] opacity-70">{message.timestamp}</span>
            {message.source && (
              <span className="ml-1 text-[#4A4A4A] opacity-50">
                {message.source === 'sse' && '📡'}
                {message.source === 'local' && '💬'}
                {message.source === 'livekit' && '⚡'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-gradient-to-b from-[#F8F5F0] to-[#F2EDE2] flex flex-col h-full overflow-hidden border-l-4 border-[#5C351A] shadow-xl">
      {/* 감정 및 갈등 레벨 표시 */}
      <div className="p-3 border-b border-[#5C351A] flex-shrink-0 max-h-48 overflow-y-auto bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2 shadow-sm">
        <h3 className="text-[#2A2A2A] font-bold mb-2 flex items-center">
          <span className="mr-2">🤖</span>AI 감정 분석
        </h3>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-[#5C351A] font-medium">
            <span>갈등 레벨</span>
            <span>{Math.round(conflictLevel)}%</span>
          </div>
          <div className="w-full bg-[#D6CDB8] rounded-full h-2 shadow-inner">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                conflictLevel > 70 ? 'bg-red-500' :
                conflictLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${conflictLevel}%` }}
            />
          </div>
        </div>
        
        {Object.entries(emotionScores).map(([name, scores]) => (
          <div key={name} className="mb-2 bg-[#FEFCF8] bg-opacity-70 p-2 rounded shadow-sm">
            <p className="text-xs text-[#5C351A] font-semibold">{name}</p>
            <div className="grid grid-cols-3 gap-1 text-xs mt-1">
              {Object.entries(scores).map(([emotion, score]) => (
                <div key={emotion} className="text-center">
                  <div className={`${score > 50 ? 'text-red-600 font-semibold' : 'text-[#4A4A4A]'} text-xs`}>
                    {emotion}: {score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 대화 내용 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 탭 헤더 및 컨트롤 */}
        <div className="p-3 border-b border-[#5C351A] flex-shrink-0 bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2 shadow-sm">
          <h3 className="text-[#2A2A2A] font-bold flex items-center mb-3">
            <span className="mr-2">💬</span>참견도치 채팅
          </h3>
          
          {/* 탭 버튼 */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-[#5C351A] text-white shadow-lg' 
                  : 'bg-[#D6CDB8] text-[#4A4A4A] hover:bg-[#CCC2A7]'
              }`}
            >
              전체 대화 ({conversations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('coaching')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'coaching' 
                  ? 'bg-[#5C351A] text-white shadow-lg' 
                  : 'bg-[#D6CDB8] text-[#4A4A4A] hover:bg-[#CCC2A7]'
              }`}
            >
              AI 코칭 ({coachingMessages?.length || 0})
            </button>
          </div>
          
          {/* 컨트롤 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={toggleSTT}
              className={`px-3 py-1 rounded text-sm font-medium ${
                sttEnabled ? 'bg-green-500 text-white shadow-lg' : 'bg-[#D6CDB8] text-[#4A4A4A] shadow'
              }`}
            >
              STT {sttEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={toggleAIMediation}
              className={`px-3 py-1 rounded text-sm font-medium ${
                aiMediationEnabled ? 'bg-[#5C351A] text-white shadow-lg border-2 border-[#4D280E]' : 'bg-[#D6CDB8] text-[#4A4A4A] shadow'
              }`}
            >
              AI 중재 {aiMediationEnabled ? 'ON' : 'OFF'}
            </button>
            {toggleCoaching && (
              <button
                onClick={toggleCoaching}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  coachingEnabled ? 'bg-[#4D280E] text-white shadow-lg' : 'bg-[#D6CDB8] text-[#4A4A4A] shadow'
                }`}
              >
                코칭 {coachingEnabled ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </div>

        {/* 메신저 스타일 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#FEFCF8] bg-opacity-30 min-h-0">
          {(() => {
            const displayConversations = activeTab === 'all' ? conversations : coachingMessages;
            
            if (!displayConversations || displayConversations.length === 0) {
              return (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-[#4A4A4A]">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-sm">
                      {activeTab === 'all' ? '대화를 시작해보세요!' : '아직 AI 코칭이 없습니다.'}
                    </p>
                    {activeTab === 'coaching' && !aiMediationEnabled && (
                      <p className="text-xs mt-2">AI 중재를 활성화하면 실시간 조언을 받을 수 있습니다.</p>
                    )}
                  </div>
                </div>
              );
            }
            
            return (
              <>
                {displayConversations.map((conv) => (
                  <MessageBubble key={conv.id} message={conv} />
                ))}
                <div ref={chatEndRef} />
              </>
            );
          })()}
        </div>

        {/* 실시간 입력 표시 */}
        {sttEnabled && (
          <div className="p-3 bg-[#F8F5F0] border-t border-[#5C351A]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-[#4A4A4A]">음성 인식 중...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;