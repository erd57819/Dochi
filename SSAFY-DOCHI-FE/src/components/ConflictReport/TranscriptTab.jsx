import React from 'react';

const TranscriptTab = ({ transcriptData }) => {
  // 중복된 대화 내용 제거 함수
  const removeDuplicates = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    const seen = new Set();
    return data.filter(line => {
      const trimmedLine = line.trim();
      if (seen.has(trimmedLine)) {
        return false;
      }
      seen.add(trimmedLine);
      return true;
    });
  };

  const uniqueData = removeDuplicates(transcriptData?.data);

  return (
    <div className="space-y-6">
      
      <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
        {uniqueData.length > 0 ? (
          <div className="space-y-2">
            {uniqueData.map((line, idx) => {
              const [speaker, ...textParts] = line.split(':');
              const text = textParts.join(':');
              
              return (
                <div key={idx} className="pl-4 py-2">
                  <span className="font-semibold text-[#7f5539]">{speaker}:</span>
                  <span className="text-gray-700 ml-2">{text}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-center">대화 내용이 없습니다.</p>
        )}
      </div>
      
      <div className="text-sm text-gray-600 mt-4">
        총 {uniqueData.length}개의 대화가 기록되었습니다.
      </div>
    </div>
  );
};

export default TranscriptTab;