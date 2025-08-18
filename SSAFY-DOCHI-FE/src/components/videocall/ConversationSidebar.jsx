import React, { useState, useEffect, useRef } from 'react';

const ConversationSidebar = ({ 
  emotionScores,
  conflictLevel,
  conversations,
  sttEnabled,
  aiMediationEnabled,
  toggleSTT,
  toggleAIMediation,
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
          <div className="bg-gradient-to-r from-[#E8DCC0] to-[#F2EDE2] rounded-lg p-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="bg-[#BF7D2C] text-white px-2 py-1 rounded-full text-xs mr-2">AI 코칭</span>
              <span className="text-[#4D280E] font-semibold text-sm">{message.speaker}</span>
              <span className="ml-auto text-[#4A4A4A] text-xs">{message.timestamp}</span>
            </div>
            <p className="text-[#3E1F0A] font-medium text-sm md:text-base">{message.text}</p>
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
              {isRemote && (
                <svg className="inline w-3 h-3 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
              )}
              {isMe && (
                <svg className="inline w-3 h-3 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          </div>
          
          {/* 메시지 버블 */}
          <div className={`px-4 py-3 rounded-2xl ${
            isMe 
              ? 'bg-[#BF7D2C] text-white rounded-br-md' 
              : 'bg-[#F8F5F0] text-[#2A2A2A] rounded-bl-md'
          }`}>
            <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
          </div>
          
          {/* 시간 */}
          <div className={`text-xs mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
            <span className="text-[#4A4A4A] opacity-70">{message.timestamp}</span>
            {message.source && (
              <span className="ml-1 text-[#4A4A4A] opacity-50">
                {message.source === 'sse' && (
                  <svg className="inline w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                )}
                {message.source === 'local' && (
                  <svg className="inline w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                )}
                {message.source === 'livekit' && (
                  <svg className="inline w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 md:w-96 lg:w-[30vw] xl:w-[25vw] bg-gradient-to-b from-[#F8F5F0] to-[#F2EDE2] flex flex-col h-full overflow-hidden shadow-xl">

      {/* 대화 내용 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 탭 헤더 및 컨트롤 */}
        <div className="p-2 flex-shrink-0 bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2">
          <h3 className="text-[#2A2A2A] font-bold flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            참견도치 채팅
          </h3>
          
          {/* 탭 버튼과 AI 중재 컨트롤 */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-[#BF7D2C] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체 대화 ({conversations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('coaching')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === 'coaching' 
                  ? 'bg-[#BF7D2C] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              AI 코칭 ({coachingMessages?.length || 0})
            </button>
            <button
              onClick={toggleAIMediation}
              className={`px-3 py-1 rounded text-sm font-medium ${
                aiMediationEnabled ? 'bg-[#BF7D2C] text-white' : 'bg-gray-400 text-white'
              }`}
            >
              AI 중재 {aiMediationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 메신저 스타일 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#FEFCF8] bg-opacity-30 min-h-0 mx-2 rounded-lg">
          {(() => {
            const displayConversations = activeTab === 'all' ? conversations : coachingMessages;
            
            if (!displayConversations || displayConversations.length === 0) {
              return (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-[#4A4A4A]">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
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