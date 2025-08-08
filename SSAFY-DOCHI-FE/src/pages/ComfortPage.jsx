import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import useComfortStore from '../stores/ComfortStore';
import ChatTitleModal from '../components/ChatTitleModal';
import ChatRoomCard from '../components/ChatRoomCard';
import todakImg from '../assets/todak.png';

const PAGE_SIZE = 6;   // 카드 6개(3열·2행)씩 페이지네이션

const ComfortPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  // 비로그인 시 접근 차단
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  const [showTitleModal, setShowTitleModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    sessions,
    loadChatRooms,
    loadSession,
    createNewSessionWithTitle,
  } = useComfortStore();

  /* ---------- 데이터 초기 로드 ---------- */
  useEffect(() => {
    if (isLoggedIn) {
      loadChatRooms().catch(() => console.warn('채팅방 목록 로드 실패'));
    }
  }, [isLoggedIn, loadChatRooms]);

  /* ---------- 액션 핸들러 ---------- */
  const openRoom = async (roomId) => {
    await loadSession(roomId);
    navigate('/comfort/chat');
  };

  const handleNewChat = () => {
    setShowTitleModal(true);
  };

  const handleCreateWithTitle = async (title) => {
    try {
      await createNewSessionWithTitle(title);
      navigate('/comfort/chat');
    } finally {
      setShowTitleModal(false);
    }
  };

  /* ---------- 페이지네이션 ---------- */
  const totalPages = Math.ceil(sessions.length / PAGE_SIZE) || 1;
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const pagedSessions = sessions.slice(startIdx, startIdx + PAGE_SIZE);

  /* ---------- JSX ---------- */
  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4">
      {/* 헤더 */}
      <div className="flex flex-col items-center mb-12">
        <img src={todakImg} alt="토닥토닥" className="w-24 h-24 mb-4"/>
        <h1 className="text-3xl font-bold text-orange-500 mb-1">참견도치</h1>
        <p className="text-sm text-gray-500">
          최근 5개월 뒤의 대화방은 자동 삭제됩니다
        </p>
        <p>이전 대화 목록</p>
      </div>

      {/* 카드 그리드 */}
      {sessions.length > 0 ? (
        <>
          <div className="w-full max-w-[1200px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 mb-10">
            {pagedSessions.map((room) => (
              <ChatRoomCard
                key={room.id}
                title={room.title}
                date={room.createdAt}
                onOpen={() => openRoom(room.id)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center gap-4 mb-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        /* 대화방이 하나도 없을 때 */
        <div className="flex flex-col items-center gap-8 mb-20">
          <p className="text-lg text-gray-600">당신의 이야기를 들려주세요.</p>
        </div>
      )}

      {/* 새 대화 버튼 */}
      <button
        onClick={handleNewChat}
        className="px-10 py-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all shadow-lg"
      >
        새로운 대화 시작하기
      </button>

      {/* 제목 입력 모달 */}
      <ChatTitleModal
        isOpen={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        onConfirm={handleCreateWithTitle}
      />
    </div>
  );
};

export default ComfortPage;