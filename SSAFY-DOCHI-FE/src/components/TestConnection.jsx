import React, { useState } from 'react';
import { noticeApi } from '../services/noticeApi';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await noticeApi.getNotices(0, 5);
      setResult(JSON.stringify(response, null, 2));
      console.log('백엔드 연결 성공:', response);
    } catch (error) {
      setResult(`연결 실패: ${error.message}`);
      console.error('백엔드 연결 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>백엔드 연결 테스트</h2>
      <button onClick={testConnection} disabled={loading}>
        {loading ? '테스트 중...' : '공지사항 API 테스트'}
      </button>
      
      {result && (
        <pre style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5',
          border: '1px solid #ccc',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
};

export default TestConnection;