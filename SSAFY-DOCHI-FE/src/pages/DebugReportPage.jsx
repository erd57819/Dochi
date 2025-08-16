import React, { useState } from 'react';
import { conflictReportApi } from '../services/conflictReportApi';

const DebugReportPage = () => {
  const [roomId, setRoomId] = useState('test-room');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testReportGeneration = async () => {
    if (!roomId) {
      alert('Room ID를 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[디버그] 리포트 요청 시작:', roomId);
      const data = await conflictReportApi.getFullReport(roomId);
      console.log('[디버그] 리포트 응답:', data);
      setResult(data);
    } catch (err) {
      console.error('[디버그] 리포트 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEmotionHistory = () => {
    const emotionHistoryKey = `emotion_history_${roomId}`;
    const history = localStorage.getItem(emotionHistoryKey);
    console.log('[디버그] 로컬스토리지 감정 히스토리:', history);
    
    if (history) {
      const parsed = JSON.parse(history);
      setResult({ 
        type: 'emotion_history', 
        data: parsed,
        summary: `${Object.keys(parsed).length}명의 화자, 총 ${Object.values(parsed).reduce((sum, arr) => sum + arr.length, 0)}개 감정 데이터`
      });
    } else {
      setResult({ type: 'emotion_history', data: null, summary: '감정 히스토리 없음' });
    }
  };

  const testConversationHistory = () => {
    // localStorage에서 대화 히스토리 확인 (있다면)
    const keys = Object.keys(localStorage).filter(key => 
      key.includes(roomId) && (key.includes('conversation') || key.includes('stt'))
    );
    
    console.log('[디버그] 대화 관련 로컬스토리지 키들:', keys);
    
    const conversationData = {};
    keys.forEach(key => {
      conversationData[key] = localStorage.getItem(key);
    });
    
    setResult({ 
      type: 'conversation_history', 
      data: conversationData,
      summary: `${keys.length}개의 대화 관련 키 발견`
    });
  };

  const clearAllData = () => {
    // 해당 roomId 관련 모든 localStorage 데이터 삭제
    const keys = Object.keys(localStorage).filter(key => key.includes(roomId));
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log('[디버그] 삭제됨:', key);
    });
    
    setResult({ type: 'clear', summary: `${keys.length}개 키 삭제됨: ${keys.join(', ')}` });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">갈등 리포트 디버그 도구</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="테스트할 방 ID 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={testReportGeneration}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '요청 중...' : '리포트 생성 테스트'}
          </button>
          
          <button
            onClick={testEmotionHistory}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            감정 히스토리 확인
          </button>
          
          <button
            onClick={testConversationHistory}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            대화 히스토리 확인
          </button>
          
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            데이터 전체 삭제
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>에러:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">결과</h2>
          
          {result.summary && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <strong>요약:</strong> {result.summary}
            </div>
          )}
          
          <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugReportPage;