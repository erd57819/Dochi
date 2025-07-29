import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../stores/AuthStore';

const ConflictCreatePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    conflictType: 'ETC',
    conflictWhen: '',
    conflictFrequency: '',
    participants: '',
    desiredOutcome: '',
    priority: 'NONE',
    talkWillingness: 'NONE',
    initialEmotion: 'ETC',
    intensity: 5
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // 로그인 확인
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAiSummary = async () => {
    if (!formData.description.trim()) {
      alert('갈등 상황을 먼저 작성해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conflict/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          description: formData.description,
          conflictType: formData.conflictType
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiSummary(result.response || result.summary);
      } else {
        throw new Error('AI 요약 생성에 실패했습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('제목과 갈등 상황을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const conflictData = {
        ...formData,
        conflictWhen: formData.conflictWhen ? parseInt(formData.conflictWhen) : null,
        conflictFrequency: formData.conflictFrequency ? parseInt(formData.conflictFrequency) : null,
        intensity: parseInt(formData.intensity),
        participants: formData.participants ? JSON.stringify(formData.participants.split(',').map(p => p.trim())) : null,
        aiSummary: aiSummary || null
      };

      const response = await fetch(`${API_BASE_URL}/conflict/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(conflictData)
      });

      if (response.ok) {
        alert('갈등 카드가 성공적으로 생성되었습니다!');
        navigate('/conflicts');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '갈등 카드 생성에 실패했습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <span className="text-2xl">🦔</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">갈등 카드 작성</h1>
            <p className="text-gray-600">갈등 상황을 자세히 작성해주세요. AI가 요약해드릴게요!</p>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                갈등 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="갈등 상황을 한 줄로 요약해주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
                required
              />
            </div>

            {/* 갈등 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">갈등 유형</label>
              <select
                name="conflictType"
                value={formData.conflictType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              >
                <option value="WORK">직장/업무</option>
                <option value="FAMILY">가족</option>
                <option value="FRIEND">친구</option>
                <option value="COUPLE">연인/부부</option>
                <option value="NEIGHBOR">이웃</option>
                <option value="FINANCIAL">금전</option>
                <option value="ONLINE">온라인</option>
                <option value="ETC">기타</option>
              </select>
            </div>

            {/* 갈등 상세 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                갈등 상황 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="갈등 상황을 자세히 설명해주세요. 언제, 어디서, 누구와, 어떤 일이 일어났는지 구체적으로 작성해주시면 더 정확한 도움을 받을 수 있습니다."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 resize-none"
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAiSummary}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm"
                >
                  {isLoading ? 'AI 요약 중...' : '🤖 AI 요약 받기'}
                </button>
              </div>
            </div>

            {/* AI 요약 결과 */}
            {aiSummary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">🤖 AI 요약</h3>
                <p className="text-blue-700 text-sm leading-relaxed">{aiSummary}</p>
              </div>
            )}

            {/* 추가 정보 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 발생 시점 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">갈등 발생 시점</label>
                <input
                  type="number"
                  name="conflictWhen"
                  value={formData.conflictWhen}
                  onChange={handleInputChange}
                  placeholder="며칠 전인지 (예: 3)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">며칠 전에 발생했는지 숫자로 입력</p>
              </div>

              {/* 발생 빈도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">갈등 발생 빈도</label>
                <input
                  type="number"
                  name="conflictFrequency"
                  value={formData.conflictFrequency}
                  onChange={handleInputChange}
                  placeholder="월 몇 회 (예: 2)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">한 달에 몇 번 정도 발생하는지</p>
              </div>
            </div>

            {/* 참여자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">갈등 참여자</label>
              <input
                type="text"
                name="participants"
                value={formData.participants}
                onChange={handleInputChange}
                placeholder="갈등에 관련된 사람들 (쉼표로 구분, 예: 동료 김씨, 팀장, 부장)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* 원하는 결과 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">원하는 결과</label>
              <textarea
                name="desiredOutcome"
                value={formData.desiredOutcome}
                onChange={handleInputChange}
                rows={3}
                placeholder="이 갈등이 어떻게 해결되기를 원하시나요?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 resize-none"
              />
            </div>

            {/* 선택 옵션들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">중요한 가치</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="NONE">선택 안함</option>
                  <option value="RELATIONSHIP">관계 유지</option>
                  <option value="SOLUTION">문제 해결</option>
                  <option value="SELF_CARE">자기 보호</option>
                  <option value="PREVENTION">재발 방지</option>
                </select>
              </div>

              {/* 대화 의지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대화 의지</label>
                <select
                  name="talkWillingness"
                  value={formData.talkWillingness}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="NONE">선택 안함</option>
                  <option value="YES">대화하고 싶음</option>
                  <option value="MAYBE">상황에 따라</option>
                  <option value="NO">대화하기 어려움</option>
                </select>
              </div>

              {/* 주된 감정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주된 감정</label>
                <select
                  name="initialEmotion"
                  value={formData.initialEmotion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="ETC">기타</option>
                  <option value="ANGER">분노</option>
                  <option value="SADNESS">슬픔</option>
                  <option value="FRUSTRATION">좌절</option>
                </select>
              </div>
            </div>

            {/* 갈등 강도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                갈등 강도: {formData.intensity}/10
              </label>
              <input
                type="range"
                name="intensity"
                min="1"
                max="10"
                value={formData.intensity}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>매우 약함</span>
                <span>보통</span>
                <span>매우 강함</span>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors font-medium"
              >
                {isLoading ? '저장 중...' : '갈등 카드 생성'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConflictCreatePage;