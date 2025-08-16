import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';

const ConflictListPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const [conflicts, setConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 로그인 확인
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchConflicts();
  }, [isLoggedIn, navigate]);

  const fetchConflicts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/conflict/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const conflictData = result.data || result.response?.response || [];
        setConflicts(conflictData);
      } else {
        throw new Error('갈등 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('갈등 목록 조회 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getConflictTypeText = (type) => {
    const types = {
      WORK: '직장/업무',
      FAMILY: '가족',
      FRIEND: '친구',
      COUPLE: '연인/부부',
      NEIGHBOR: '이웃',
      FINANCIAL: '금전',
      ONLINE: '온라인',
      ETC: '기타'
    };
    return types[type] || '기타';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      RELATIONSHIP: 'bg-blue-100 text-blue-800',
      SOLUTION: 'bg-green-100 text-green-800',
      SELF_CARE: 'bg-purple-100 text-purple-800',
      PREVENTION: 'bg-orange-100 text-orange-800',
      NONE: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityText = (priority) => {
    const texts = {
      RELATIONSHIP: '관계 유지',
      SOLUTION: '문제 해결',
      SELF_CARE: '자기 보호',
      PREVENTION: '재발 방지',
      NONE: '선택 안함'
    };
    return texts[priority] || '선택 안함';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">갈등 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🦔</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">내 갈등 목록</h1>
                <p className="text-gray-600">저장된 갈등들을 확인하고 관리해보세요</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/conflicts/create')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              새 갈등 추가
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">총 갈등 수</h3>
                <p className="text-2xl font-bold text-blue-600">{conflicts.length}개</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">해결 완료</h3>
                <p className="text-2xl font-bold text-green-600">0개</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">진행 중</h3>
                <p className="text-2xl font-bold text-orange-600">{conflicts.length}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* 갈등 목록 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {conflicts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😌</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">아직 등록된 갈등이 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 갈등을 등록하고 AI의 도움을 받아보세요!</p>
            <button
              onClick={() => navigate('/conflicts/create')}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              갈등 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conflicts.map((conflict, index) => (
              <div key={conflict.id || index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div 
                  className="p-6"
                  onClick={() => navigate(`/conflicts/${conflict.id}`)}
                >
                  {/* 갈등 유형 및 우선순위 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {getConflictTypeText(conflict.conflictType)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(conflict.priority)}`}>
                      {getPriorityText(conflict.priority)}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {conflict.title}
                  </h3>

                  {/* 설명 */}
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {conflict.description}
                  </p>

                  {/* 갈등 강도 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>갈등 강도</span>
                      <span>{conflict.intensity}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full"
                        style={{ width: `${(conflict.intensity / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 생성일 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>생성일: {formatDate(conflict.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>분석 완료</span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/conflicts/${conflict.id}/solutions`);
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <span>💡</span>
                      <span>해결방안</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('화상 채팅 기능은 준비 중입니다! 🎥');
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <span>🎥</span>
                      <span>화상채팅</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConflictListPage;