import React from 'react';

const ConversationSidebar = ({ 
  emotionScores,
  conflictLevel,
  conversations,
  sttEnabled,
  aiMediationEnabled,
  toggleSTT,
  toggleAIMediation
}) => {
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
        <div className="p-3 border-b border-[#5C351A] flex-shrink-0 bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2 shadow-sm">
          <h3 className="text-[#2A2A2A] font-bold flex items-center">
            <span className="mr-2">💬</span>참견도치
          </h3>
          <div className="flex gap-2 mt-2">
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {/* 대화 기록 */}
          {conversations.slice().reverse().map((conv) => {
            const isCoachingMessage = conv.isCoachingMessage || conv.speaker === '참견도치';
            
            return (
              <div key={conv.id} className={`p-2 rounded-lg shadow border mb-2 ${
                isCoachingMessage 
                  ? 'bg-gradient-to-r from-[#E8DCC0] to-[#F2EDE2] border-[#5C351A] border-2 shadow-lg'
                  : 'bg-[#FEFCF8] bg-opacity-80 border-[#5C351A]'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-semibold flex items-center ${
                    isCoachingMessage ? 'text-[#4D280E]' : 'text-[#5C351A]'
                  }`}>
                    {isCoachingMessage ? (
                      <>
                        <span className="mr-2">🤖</span>
                        <span className="bg-[#5C351A] text-white px-2 py-1 rounded-full text-xs mr-2">참견중</span>
                        {conv.speaker}
                      </>
                    ) : (
                      <>
                        <span className="mr-2">👤</span>
                        {conv.speaker}
                      </>
                    )}
                  </span>
                  <span className="text-[#4A4A4A] text-xs">
                    {conv.timestamp}
                  </span>
                </div>
                <p className={`text-sm ${
                  isCoachingMessage ? 'text-[#3E1F0A] font-medium' : 'text-[#2A2A2A]'
                }`}>
                  {conv.text}
                </p>
                {conv.aiSuggestion && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-[#5C351A] via-[#4D280E] to-[#3E1F0A] rounded-lg shadow-xl border-2 border-[#2A2A2A] relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✨</span>
                    </div>
                    <p className="text-white text-xs font-bold flex items-center mb-1">
                      <span className="mr-1">🤖</span> 참견도치 조언
                    </p>
                    <p className="text-white text-sm font-medium leading-relaxed">{conv.aiSuggestion}</p>
                    <div className="mt-2 text-right">
                      <span className="text-[#F8F5F0] text-xs opacity-80">powered by AI</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;