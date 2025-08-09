import React from 'react';

const TranscriptTab = ({ transcriptData }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">전체 대화 내용</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
        {transcriptData?.data && transcriptData.data.length > 0 ? (
          <div className="space-y-2">
            {transcriptData.data.map((line, idx) => {
              const [speaker, ...textParts] = line.split(':');
              const text = textParts.join(':');
              
              return (
                <div key={idx} className="border-l-2 border-gray-300 pl-4 py-2">
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
        총 {transcriptData?.total_lines || 0}개의 대화가 기록되었습니다.
      </div>
    </div>
  );
};

export default TranscriptTab;