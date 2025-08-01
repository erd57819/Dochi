// src/components/SummaryPage.jsx

import React, { useState } from 'react';
import axios from 'axios';

function SummaryPage() {
  const [originalText, setOriginalText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!originalText.trim()) {
      setError('요약할 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setSummaryText('');
    setError('');

    try {
      // FastAPI 서버의 요약 API 엔드포인트
      const response = await axios.post('/ai/api/summary/', {
        original_text: originalText, 
      });
      setSummaryText(response.data.summary_text);
    } catch (err) {
      console.error("API Error:", err);
      setError('요약문을 가져오는 데 실패했습니다. 서버 상태를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-container">
      <h1>텍스트 요약 모델</h1>
      <form onSubmit={handleSubmit} className="summary-form">
        <textarea
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          placeholder="여기에 요약할 텍스트를 입력하세요..."
          rows="10"
          cols="80"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '요약 중...' : '요약하기'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {summaryText && (
        <div className="summary-result">
          <h2>요약 결과</h2>
          <p>{summaryText}</p>
        </div>
      )}
    </div>
  );
}

export default SummaryPage;