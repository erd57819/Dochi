import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityApi, commentApi, likeApi } from '../services/communityApi';
import useAuthStore from '../stores/AuthStore';
import hedgehogImg from '../assets/image-21.png'; // 도치 이미지 추가
import thumbUp from '@/assets/thumb_up.png';
import thumbDown from '@/assets/thumb_down.png';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentSortType, setCommentSortType] = useState('likes'); // 'latest' or 'likes'
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentPage, setCommentPage] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [allComments, setAllComments] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // 펼쳐진 답글들의 commentId 저장
  const COMMENTS_PER_PAGE = 10;

  const categories = {
    'GENERAL': { label: '자유게시판', color: '#7F5539' },
    'CONFLICT_SHARING': { label: '갈등공유', color: '#cd9f6e' },
    'SUCCESS_STORIES': { label: '성공사례', color: '#f8d6b3' },
    'ADVICE_REQUEST': { label: '조언요청', color: '#EE9278' }
  };

  // 작성자 닉네임 또는 이름 표시 함수
  // 작성자 닉네임 또는 이름 표시 함수
  const getDisplayName = (item) => {
    // 삭제된 사용자인 경우
    if (!item.author && !item.authorNickname) {
      return '탈퇴한 회원';
    }
    // 닉네임이 있으면 닉네임을, 없으면 이름을 표시
    return item.authorNickname || item.author || '익명';
  };

  // 베스트 댓글 판별 함수
  const getBestComments = (comments) => {
    // 대댓글을 제외한 부모 댓글들만 대상으로 함
    const parentComments = comments.filter(comment => !comment.parentCommentId);
    
    // 좋아요 점수 계산 (좋아요 - 싫어요)
    const commentsWithScore = parentComments.map(comment => ({
      ...comment,
      likeScore: (comment.likeCount || 0) - (comment.dislikeCount || 0)
    }));
    
    // 좋아요 점수로 정렬하고 상위 3개 선택 (점수가 양수인 것만)
    const sortedByLikes = commentsWithScore
      .filter(comment => comment.likeScore > 0) // 점수가 양수인 댓글만
      .sort((a, b) => b.likeScore - a.likeScore)
      .slice(0, 3);
    
    return sortedByLikes.map(comment => comment.id);
  };

  // 날짜 포맷팅 함수
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '방금 전';
    
    try {
      let date = new Date(dateString);
      
      // 만약 유효하지 않다면 한국어 날짜 형식 시도
      if (isNaN(date.getTime())) {
        const koreanFormat = dateString.replace(/\./g, '-');
        date = new Date(koreanFormat);
      }
      
      if (isNaN(date.getTime())) {
        return dateString; // 원본 그대로 반환
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('날짜 포맷팅 실패:', dateString, error);
      return dateString;
    }
  };

  // 데이터 로드
  useEffect(() => {
    if (postId) {
      loadPostDetail();
    }
  }, [postId]);


  const loadPostDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 게시글 정보 로드
      const postData = await communityApi.getPost(postId);
      setPost(postData);
      setEditTitle(postData.title);
      setEditContent(postData.content);
      setEditCategory(postData.category);
      
      // 댓글 로드 (정렬 타입 포함)
      const commentsData = await commentApi.getComments(postId, commentSortType);
      // 백엔드에서 정렬해서 오므로 프론트엔드 정렬은 필요 없지만, 
      // 백엔드에서 정렬을 지원하지 않을 경우를 대비해 프론트엔드 정렬도 유지
      const sortedComments = sortComments(commentsData, commentSortType);
      
      // 페이지네이션을 위해 전체 댓글 저장
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      // 현재 페이지의 댓글만 표시
      const startIndex = commentPage * COMMENTS_PER_PAGE;
      const endIndex = startIndex + COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
      
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 정렬 함수 (백엔드에서 이미 계층 구조로 온 데이터 정렬)
  const sortComments = (commentsData, sortType) => {
    console.log('=== 댓글 정렬 시작 ===');
    console.log('입력 데이터:', commentsData);
    console.log('정렬 타입:', sortType);
    
    if (!commentsData || !Array.isArray(commentsData)) {
      console.log('댓글 데이터가 없거나 배열이 아님');
      return [];
    }

    // 날짜 파싱 함수 (다양한 형식 지원)
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      // ISO 8601 format이나 다른 표준 포맷 처리
      let date = new Date(dateString);
      
      // 만약 유효하지 않다면 한국어 날짜 형식 시도
      if (isNaN(date.getTime())) {
        // "2024.01.15" 형식 처리
        const koreanFormat = dateString.replace(/\./g, '-');
        date = new Date(koreanFormat);
      }
      
      return isNaN(date.getTime()) ? null : date;
    };

    // 백엔드에서 이미 계층 구조로 온 데이터를 정렬
    const sortedComments = [...commentsData].sort((a, b) => {
      if (sortType === 'likes') {
        // 좋아요순: 좋아요 - 싫어요로 계산
        const aScore = (a.likeCount || 0) - (a.dislikeCount || 0);
        const bScore = (b.likeCount || 0) - (b.dislikeCount || 0);
        if (aScore !== bScore) {
          return bScore - aScore; // 좋아요 많은 순
        }
        // 좋아요 점수가 같으면 최신순으로 2차 정렬
        const aDate = parseDate(a.createdAt);
        const bDate = parseDate(b.createdAt);
        if (aDate && bDate) return bDate - aDate;
        return (b.id || 0) - (a.id || 0);
      } else {
        // 최신순: 최신이 위에 오도록
        const aDate = parseDate(a.createdAt);
        const bDate = parseDate(b.createdAt);
        
        console.log(`댓글 ${a.id}: ${a.createdAt} -> ${aDate}`);
        console.log(`댓글 ${b.id}: ${b.createdAt} -> ${bDate}`);
        
        if (aDate && bDate) {
          const diff = bDate - aDate;
          console.log(`날짜 차이: ${diff} (${diff > 0 ? 'b가 더 최신' : 'a가 더 최신'})`);
          return diff; // 최신이 위에
        }
        
        // 날짜가 없으면 ID로 정렬 (보통 ID가 클수록 최신)
        console.log(`날짜 파싱 실패, ID로 정렬: ${b.id || 0} - ${a.id || 0}`);
        return (b.id || 0) - (a.id || 0);
      }
    });

    // 각 댓글의 대댓글도 최신순으로 정렬
    const sortedWithReplies = sortedComments.map(comment => {
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        console.log(`댓글 ${comment.id}의 대댓글 ${comment.replies.length}개 정렬 중...`);
        
        const sortedReplies = [...comment.replies].sort((a, b) => {
          const aDate = parseDate(a.createdAt);
          const bDate = parseDate(b.createdAt);
          
          if (aDate && bDate) {
            return bDate - aDate; // 대댓글도 최신이 위에
          }
          return (b.id || 0) - (a.id || 0);
        });
        
        return {
          ...comment,
          replies: sortedReplies
        };
      }
      return comment;
    });
    
    console.log(`댓글 정렬 완료 (${sortType}):`, sortedWithReplies.map(c => ({
      id: c.id, 
      content: c.content?.substring(0, 20) + '...', 
      createdAt: c.createdAt,
      likeCount: c.likeCount,
      dislikeCount: c.dislikeCount,
      repliesCount: c.replies?.length || 0,
      hasReplies: !!(c.replies && c.replies.length > 0)
    })));
    console.log('=== 댓글 정렬 완료 ===');
    
    return sortedWithReplies;
  };

  // 댓글 정렬 타입 변경 (백엔드에서 재조회)
  const handleCommentSortChange = async (sortType) => {
    setCommentSortType(sortType);
    setCommentPage(0); // 정렬 변경시 첫 페이지로
    console.log('댓글 정렬 변경:', sortType);
    
    try {
      // 백엔드에서 정렬된 댓글 재조회
      const commentsData = await commentApi.getComments(postId, sortType);
      const sortedComments = sortComments(commentsData, sortType);
      
      // 페이지네이션 적용
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      const startIndex = 0;
      const endIndex = COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
    } catch (error) {
      console.error('댓글 재정렬 실패:', error);
      // 실패 시 프론트엔드 정렬로 폴백
      const sortedComments = sortComments(allComments, sortType);
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      const startIndex = 0;
      const endIndex = COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
    }
  };

  // 댓글 페이지 변경
  const handleCommentPageChange = (newPage) => {
    setCommentPage(newPage);
    const startIndex = newPage * COMMENTS_PER_PAGE;
    const endIndex = startIndex + COMMENTS_PER_PAGE;
    const paginatedComments = allComments.slice(startIndex, endIndex);
    setComments(paginatedComments);
  };

  // 답글 접기/펼치기 토글
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // 게시글 좋아요 처리
  const handlePostLike = async (likeType) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('=== 게시글 좋아요 디버깅 ===');
    console.log('user 객체 전체:', user);
    console.log('user.id:', user?.id);
    console.log('postId:', postId);
    console.log('likeType:', likeType);
    console.log('====================');

    try {
      const result = await likeApi.togglePostLike(postId, user.id, likeType);
      setPost(prev => ({
        ...prev,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        userLikeType: result.userLikeType
      }));
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    const confirmMessage = `게시글 "${post.title}"을 정말로 삭제하시겠습니까?\n\n삭제된 게시글은 복구할 수 없습니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await communityApi.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  // 게시글 수정 모드 토글
  const handleEditPost = () => {
    setIsEditMode(true);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  };

  // 게시글 수정 저장
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!editContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPost = await communityApi.updatePost(postId, {
        title: editTitle,
        content: editContent,
        category: editCategory
      });
      
      setPost(updatedPost);
      setIsEditMode(false);
      alert('게시글이 수정되었습니다.');
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingComment(true);
    
    try {
      await commentApi.createComment(postId, commentText);
      setCommentText('');
      
      // 댓글 목록 새로고침 (페이지네이션 적용)
      const updatedComments = await commentApi.getComments(postId, commentSortType);
      const sortedComments = sortComments(updatedComments, commentSortType);
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      const startIndex = commentPage * COMMENTS_PER_PAGE;
      const endIndex = startIndex + COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
      
      // alert('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 입력창 키 이벤트 핸들러
  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: 줄바꿈 (기본 동작 유지)
        return;
      } else {
        // Enter: 댓글 작성
        e.preventDefault();
        handleCommentSubmit();
      }
    }
  };

  // 댓글 좋아요 처리 (수정됨)
  const handleCommentLike = async (commentId, likeType) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('=== 댓글 좋아요 디버깅 ===');
    console.log('user 객체 전체:', user);
    console.log('user.id:', user?.id);
    console.log('commentId:', commentId);
    console.log('likeType:', likeType);
    console.log('====================');

    try {
      const result = await likeApi.toggleCommentLike(commentId, user.id, likeType);
      
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likeCount: result.likeCount,
              dislikeCount: result.dislikeCount,
              userLikeType: result.userLikeType
            };
          }
          // 대댓글에서 좋아요가 눌린 경우
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId 
                  ? {
                      ...reply,
                      likeCount: result.likeCount,
                      dislikeCount: result.dislikeCount,
                      userLikeType: result.userLikeType
                    }
                  : reply
              )
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error);
      alert('댓글 좋아요 처리에 실패했습니다.');
    }
  };

  // 댓글 수정 시작
  const handleEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  // 댓글 수정 취소
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // 댓글 수정 저장
  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await commentApi.updateComment(commentId, editingCommentText);
      // 댓글 목록 새로고침 (페이지네이션 적용)
      const updatedComments = await commentApi.getComments(postId, commentSortType);
      const sortedComments = sortComments(updatedComments, commentSortType);
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      const startIndex = commentPage * COMMENTS_PER_PAGE;
      const endIndex = startIndex + COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await commentApi.deleteComment(commentId);
      // 댓글 목록 새로고침 (페이지네이션 적용)
      const updatedComments = await commentApi.getComments(postId, commentSortType);
      const sortedComments = sortComments(updatedComments, commentSortType);
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      // 삭제 후 현재 페이지가 비어있다면 이전 페이지로 이동
      const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE);
      const adjustedPage = commentPage >= totalPages ? Math.max(0, totalPages - 1) : commentPage;
      setCommentPage(adjustedPage);
      
      const startIndex = adjustedPage * COMMENTS_PER_PAGE;
      const endIndex = startIndex + COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 대댓글 작성
  const handleReplySubmit = async (parentCommentId) => {
    if (!replyText.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    try {
      await commentApi.createReply(postId, parentCommentId, replyText);
      setReplyText('');
      setReplyToCommentId(null);
      
      // 답글 작성한 댓글의 답글 목록을 자동으로 펼치기
      setExpandedReplies(prev => new Set(prev).add(parentCommentId));
      
      // 댓글 목록 새로고침 (페이지네이션 적용)
      const updatedComments = await commentApi.getComments(postId, commentSortType);
      const sortedComments = sortComments(updatedComments, commentSortType);
      setAllComments(sortedComments);
      setTotalComments(sortedComments.length);
      
      const startIndex = commentPage * COMMENTS_PER_PAGE;
      const endIndex = startIndex + COMMENTS_PER_PAGE;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
      setComments(paginatedComments);
    } catch (error) {
      console.error('답글 작성 실패:', error);
      alert('답글 작성에 실패했습니다.');
    }
  };

  // 대댓글 입력창 키 이벤트 핸들러
  const handleReplyKeyDown = (e, parentCommentId) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: 줄바꿈 (기본 동작 유지)
        return;
      } else {
        // Enter: 답글 작성
        e.preventDefault();
        handleReplySubmit(parentCommentId);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        {/* 배경 */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              backgroundColor: '#F8D6B3',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <img src={hedgehogImg} alt="갈등도치" className="w-16 h-16 mx-auto mb-4 animate-bounce" />
            <p className="text-xl" style={{ color: '#8B4513' }}>게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen relative ">
        {/* 배경 */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              backgroundColor: '#F8D6B3',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <main className="max-w-3xl mx-auto px-2 py-6 relative z-10">
          <div className="bg-white rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#333333' }}>게시글을 찾을 수 없습니다</h2>
            <p className="text-xl mb-8" style={{ color: '#666666' }}>{error || '존재하지 않는 게시글입니다.'}</p>
            <Link 
              to="/community"
              className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg"
              style={{ backgroundColor: '#8B4513' }}
            >
              커뮤니티로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryData = categories[post.category] || { label: '게시글', color: '#8B4513' };
  const postDisplayName = getDisplayName(post);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ minHeight: '100vh' }}>
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0 w-full" style={{ minHeight: '100vh' }}>
        {/* 상단 배경 */}
        <div 
          className="absolute top-0 left-0 w-full bg-gradient-to-br from-orange-50 via-white to-yellow-50" 
          style={{ 
            opacity: 0.14,
            minHeight: '100vh',
            height: '100%'
          }}
        ></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-3xl mx-auto px-2 py-4 relative z-10">
        {/* 헤더 */}
        <div className="flex items-center mb-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={hedgehogImg} alt="갈등도치" className="w-8 h-8 object-contain" />
              <h3 className="text-xl font-bold" style={{ color: '#8B4513' }}>게시글 상세보기</h3>
            </div>
            
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm mt-2" style={{ color: '#666666' }}>
              <Link to="/" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>홈</Link>
              <span>›</span>
              <Link to="/community" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>커뮤니티</Link>
              <span>›</span>
              <span>{categoryData.label}</span>
            </nav>
          </div>

        </div>

        <div className="space-y-4">
          {/* 게시글 헤더 카드 */}
          <div className="bg-white rounded p-5 ">
            <div className="flex items-center gap-4 mb-">
              <div className="flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold pb-3 mb-2 w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
                    style={{ 
                      color: '#333333',
                      borderColor: '#F0F0F0'
                    }}
                    placeholder="제목을 입력하세요"
                  />
                ) : (
                  <h2 className="text-xl font-bold pb-3" style={{ color: '#333333' }}>
                    {post.title}
                  </h2>
                )}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-3" style={{ color: '#666666' }}>
                    {isEditMode ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-xs px-3 py-1 rounded-full font-medium border-2"
                        style={{ borderColor: '#F0F0F0' }}
                      >
                        <option value="GENERAL">자유게시판</option>
                        <option value="CONFLICT_SHARING">갈등공유</option>
                        <option value="SUCCESS_STORIES">성공사례</option>
                        <option value="ADVICE_REQUEST">조언요청</option>
                      </select>
                    ) : (
                      <span 
                        className="text-white text-xs px-2 py-1 rounded font-medium"
                        style={{ backgroundColor: categoryData.color }}
                      >
                        {categoryData.label}
                      </span>
                    )}
                    <span className="text-sm">조회수 {post.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                    <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: postDisplayName === '탈퇴한 회원' ? '#CCCCCC' : '#F8D6B3'
                        }}
                    >
                      <span 
                        className="text-xs font-medium" 
                        style={{ 
                          color: postDisplayName === '탈퇴한 회원' ? '#666666' : '#8B4513'
                        }}
                      >
                        {postDisplayName.charAt(0)}
                      </span>
                    </div>
                    <span 
                      className="font-medium text-sm"
                      style={{
                        color: postDisplayName === '탈퇴한 회원' ? '#999999' : '#666666'
                      }}
                    >
                      {postDisplayName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{formatDisplayDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

          {/* 게시글 내용 */}
          <div className="rounded p-3">
            <div 
              className="pl-2 py-3 min-h-40"
              style={{ borderColor: categoryData.color }}
            >
              {isEditMode ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-base leading-relaxed px-3 py-2 border-2 rounded-lg focus:outline-none resize-none"
                  style={{ 
                    color: '#333333',
                    borderColor: '#F0F0F0',
                    minHeight: '200px'
                  }}
                  placeholder="내용을 입력하세요"
                  rows={10}
                />
              ) : (
                <div 
                  className="text-base leading-relaxed whitespace-pre-wrap"
                  style={{ color: '#333333' }}
                >
                  {post.content}
                </div>
              )}
            </div>
            
            {/* 목록으로, 수정, 삭제 버튼 */}
            <div className="flex items-center justify-between ml-3 pt-2">
              {/* 목록으로 버튼 - 왼쪽 */}
              <Link 
                to="/community"
                className="text-black text-sm hover:text-gray-600 transition-colors"
              >
                ← 목록으로
              </Link>
              
              {/* 수정 삭제 버튼 - 오른쪽 */}
              <div className="flex gap-3">
              {isLoggedIn && user && (post.userId === user.id || user.role === 'ADMIN') && (
                  isEditMode ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 text-sm"
                          style={{ 
                            backgroundColor: '#CD9F6E',
                            color: '#FFFFFF'
                          }}
                        >
                          {isUpdating ? '저장 중...' : '저장'}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 text-sm"
                          style={{ 
                            backgroundColor: '#999999',
                            color: '#FFFFFF'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={handleEditPost}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 text-sm"
                        style={{ 
                          backgroundColor: '#cd9f6e',
                          color: '#FFFFFF'
                        }}
                      >
                        수정
                      </button>
                      <button 
                        onClick={handleDeletePost}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 text-sm"
                        style={{ 
                          backgroundColor: '#7F5539',
                          color: '#FFFFFF'
                        }}
                      >
                        삭제
                      </button>
                    </>
                  )
              )}
              </div>
            </div>
          </div>
          {/* 좋아요/싫어요 통합 바 - 수정 모드에서는 숨김 */}
          {!isEditMode && (
          <div className="w-full mt-4">
            {(() => {
              const likeCount = Number(post?.likeCount ?? 0);
              const dislikeCount = Number(post?.dislikeCount ?? 0);
              const total = likeCount + dislikeCount;

              const likePercent = total === 0 ? 50 : (likeCount / total) * 100;
              const dislikePercent = total === 0 ? 50 : (dislikeCount / total) * 100;

              return (
                <div>
                  {/* 비율 바 제목 */}
                  <div className='flex justify-center mb-3'>
                    <p
                      className="text-lg font-bold mb-2 bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]"
                    >
                      긍정 부정 비율이 그래프로 표시됩니다
                    </p>
                  </div>

                  {/* 추천/비추천 버튼 */}
                  <div className="flex justify-center gap-8 mb-4">
                    {/* 추천 버튼 */}
                    <button
                      onClick={() => isLoggedIn && handlePostLike('LIKE')}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      disabled={!isLoggedIn}
                      style={{
                        backgroundColor: post.userLikeType === 'LIKE' ? 'rgba(255,177,32,0.8)' : 'transparent',
                        border: '1px solid rgba(255,177,32,0.5)'
                      }}
                    >
                      <img
                        src={thumbUp}
                        alt="추천"
                        className="w-8 h-8"
                      />
                    </button>
                    
                    {/* 비추천 버튼 */}
                    <button
                      onClick={() => isLoggedIn && handlePostLike('DISLIKE')}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      disabled={!isLoggedIn}
                      style={{
                        backgroundColor: post.userLikeType === 'DISLIKE' ? 'rgba(191,125,44,0.8)' : 'transparent',
                        border: '1px solid rgba(191,125,44,0.5)'
                      }}
                    >
                      <img
                        src={thumbDown}
                        alt="비추천"
                        className="w-8 h-8"
                      />
                    </button>
                  </div>

                  {/* 비율 바 */}
                  <div className="w-full bg-gray-200 rounded h-6 overflow-hidden flex">
                    {/* 추천 영역 */}
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        flexBasis: `${likePercent}%`,
                        background: `linear-gradient(90deg, rgba(255,177,32,1) 0%, rgba(255,177,32,1) 80%, rgba(223,151,38,1) 100%)`
                      }}
                    />
                    {/* 비추천 영역 */}
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        flexBasis: `${dislikePercent}%`,
                        background: `linear-gradient(90deg, rgba(223,151,38,1) 0%, rgba(191,125,44,1) 20%, rgba(191,125,44,1) 100%)`
                      }}
                    />
                  </div>

                  {/* 비율 텍스트 */}
                  <div className="flex justify-between mt-2 text-sm font-bold text-gray-600">
                    {/* 왼쪽: 좋아요 */}
                    <div className="flex items-center gap-2">
                      <span>좋아요 {likePercent.toFixed(1)}%</span>
                      <span className="text-[rgba(223,151,38,1)]"> {likeCount}표</span>
                    </div>

                    {/* 오른쪽: 싫어요 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[rgba(191,125,44,1)]">{dislikeCount}표</span>
                      <span>싫어요 {dislikePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          )}
          </div>
          

          {/* 댓글 목록 */}
          <div className="bg-white rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#333333' }}>
                댓글 ({totalComments})
              </h3>
              
              {/* 댓글 정렬 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCommentSortChange('latest')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    commentSortType === 'latest'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => handleCommentSortChange('likes')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    commentSortType === 'likes'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  좋아요순
                </button>
              </div>
            </div>
            
            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="건설적이고 따뜻한 댓글을 작성해주세요... (Enter: 작성, Shift+Enter: 줄바꿈)"
                    rows={3}
                    className="w-full h-20 px-3 py-2 border-2 rounded focus:outline-none text-sm placeholder-gray-400 resize-none transition-all"
                    style={{ 
                      borderColor: '#F0F0F0',
                      focusBorderColor: categoryData.color,
                      color: '#5c5c5cff',
                      backgroundColor: '#F8F8F8'
                    }}
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {commentText.length}/500자
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !commentText.trim()}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 disabled:transform-none text-sm"
                        style={{ 
                          backgroundColor: categoryData.color,
                          color: '#FFFFFF'
                        }}
                      >
                        {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#F8F8F8' }}>
                <div className="text-2xl mb-3">🔒</div>
                <p className="text-base mb-4" style={{ color: '#666666' }}>댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link 
                  to="/login"
                  className="px-5 py-2 text-white rounded-lg hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-sm"
                  style={{ backgroundColor: '#8B4513' }}
                >
                  로그인하기
                </Link>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-3">💭</div>
                <h4 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>
                  아직 댓글이 없습니다
                </h4>
                <p className="text-sm" style={{ color: '#666666' }}>
                  첫 댓글을 작성해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const bestCommentIds = getBestComments(allComments); // 전체 댓글에서 베스트 댓글 계산
                  
                  return comments.map((comment, index) => {
                    const commentDisplayName = getDisplayName(comment);
                    const isBestComment = bestCommentIds.includes(comment.id);
                    
                    return (
                    <div 
                      key={comment.id} 
                      className="pl-4 py-2"
                      style={{ borderColor: categoryData.color }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: commentDisplayName === '탈퇴한 회원' ? '#CCCCCC' : '#F8D6B3'
                            }}
                          >
                            <span 
                              className="font-medium" 
                              style={{ 
                                color: commentDisplayName === '탈퇴한 회원' ? '#666666' : '#8B4513'
                              }}
                            >
                              {commentDisplayName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <span 
                              className="font-bold text-sm" 
                              style={{ 
                                color: commentDisplayName === '탈퇴한 회원' ? '#999999' : '#333333'
                              }}
                            >
                              {commentDisplayName}
                            </span>
                            {isBestComment && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white ml-2">
                                ✨ 베스트
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: '#666666' }}>
                            {formatDisplayDate(comment.createdAt)}
                          </span>
                          {/* 수정/삭제 버튼 */}
                          {isLoggedIn && user && (comment.userId === user.id || user.role === 'ADMIN') && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditComment(comment.id, comment.content)}
                                className="text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50 transition-all"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 transition-all"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 댓글 내용 또는 수정 폼 */}
                      {editingCommentId === comment.id ? (
                        <div className="mb-3">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="w-full px-3 py-2 border-2 rounded focus:outline-none text-sm resize-none"
                            style={{ borderColor: '#F0F0F0' }}
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveEditComment(comment.id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-all"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEditComment}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-all"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm mb-3 leading-relaxed whitespace-pre-wrap" style={{ color: '#333333' }}>
                          {comment.content}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCommentLike(comment.id, 'LIKE')}
                            disabled={!isLoggedIn}
                            className={`flex items-center gap-2 transition-all text-sm font-medium ${
                                !isLoggedIn
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : comment.userLikeType === 'LIKE'
                                        ? 'cursor-pointer'
                                        : 'text-gray-500 cursor-pointer'
                            }`}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              padding: '0',
                              color: !isLoggedIn 
                                ? '#d1d5db' 
                                : comment.userLikeType === 'LIKE' 
                                  ? 'rgba(255,177,32,1)' 
                                  : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (isLoggedIn && comment.userLikeType !== 'LIKE') {
                                e.target.style.color = 'rgba(255,177,32,0.7)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isLoggedIn && comment.userLikeType !== 'LIKE') {
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            <img src={thumbUp} alt="따봉" className="w-5 h-5" /> {comment.likeCount || 0}
                          </button>
                          <button
                            onClick={() => handleCommentLike(comment.id, 'DISLIKE')}
                            disabled={!isLoggedIn}
                            className={`flex items-center gap-2 transition-all text-sm font-medium ${
                                !isLoggedIn
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : comment.userLikeType === 'DISLIKE'
                                        ? 'cursor-pointer'
                                        : 'text-gray-500 cursor-pointer'
                            }`}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              padding: '0',
                              color: !isLoggedIn 
                                ? '#d1d5db' 
                                : comment.userLikeType === 'DISLIKE' 
                                  ? 'rgba(191,125,44,1)' 
                                  : '#6b7280'
                            }}
                            onMouseEnter={(e) => {
                              if (isLoggedIn && comment.userLikeType !== 'DISLIKE') {
                                e.target.style.color = 'rgba(191,125,44,0.7)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isLoggedIn && comment.userLikeType !== 'DISLIKE') {
                                e.target.style.color = '#6b7280';
                              }
                            }}
                          >
                            <img src={thumbDown} alt="안따봉" className="w-5 h-5" /> {comment.dislikeCount || 0}
                          </button>
                        </div>
                        
                        {/* 대댓글 버튼 */}
                        {isLoggedIn && (
                          <button
                            onClick={() => {
                              // 답글 목록을 자동으로 펼치기
                              setExpandedReplies(prev => new Set(prev).add(comment.id));
                              // 답글 작성 활성화
                              setReplyToCommentId(comment.id);
                            }}
                            className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1"
                          >
                            💬 답글
                            {comment.replies && comment.replies.length > 0 && (
                              <span className="text-xs text-gray-500">({comment.replies.length})</span>
                            )}
                          </button>
                        )}
                      </div>
                      
                      
                      {/* 대댓글 접기/펼치기 버튼 및 목록 */}
                      {(comment.replies && comment.replies.length > 0) || expandedReplies.has(comment.id) ? (
                        <div className="mt-3 ml-6">
                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors mb-2 p-1 rounded hover:bg-gray-100"
                            >
                              <span className={`transform transition-transform duration-200 ${
                                expandedReplies.has(comment.id) ? 'rotate-90' : 'rotate-0'
                              }`}>
                                ▶
                              </span>
                              <span className="w-4 h-px bg-gray-300"></span>
                              답글 {comment.replies.length}개 {expandedReplies.has(comment.id) ? '접기' : '보기'}
                            </button>
                          )}
                          
                          {expandedReplies.has(comment.id) && (
                            <div className="space-y-2">
                              {/* 답글 작성 폼 - 답글 목록 맨 위에 표시 */}
                              {isLoggedIn && (
                                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400 mb-3">
                                  <div className="text-xs text-blue-600 mb-2">
                                    💬 {getDisplayName(comment)}님에게 답글 작성
                                  </div>
                                  <textarea
                                    value={replyToCommentId === comment.id ? replyText : ''}
                                    onChange={(e) => {
                                      setReplyText(e.target.value);
                                      if (replyToCommentId !== comment.id) {
                                        setReplyToCommentId(comment.id);
                                      }
                                    }}
                                    onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                                    placeholder="답글을 작성해주세요... (Enter: 작성, Shift+Enter: 줄바꿈)"
                                    className="w-full px-3 py-2 border-2 rounded focus:outline-none text-sm resize-none"
                                    style={{ borderColor: '#F0F0F0' }}
                                    rows={2}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleReplySubmit(comment.id)}
                                      className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-all"
                                    >
                                      답글 작성
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyToCommentId(null);
                                        setReplyText('');
                                      }}
                                      className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-all"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* 답글 목록 */}
                              {comment.replies && comment.replies.map((reply) => {
                                const replyDisplayName = getDisplayName(reply);
                                return (
                                  <div key={reply.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center"
                                      style={{ 
                                        backgroundColor: replyDisplayName === '탈퇴한 회원' ? '#CCCCCC' : '#F8D6B3'
                                      }}
                                    >
                                      <span 
                                        className="text-xs font-medium" 
                                        style={{ 
                                          color: replyDisplayName === '탈퇴한 회원' ? '#666666' : '#8B4513'
                                        }}
                                      >
                                        {replyDisplayName.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: '#333333' }}>
                                      {replyDisplayName}
                                    </span>
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                      답글
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: '#666666' }}>
                                      {formatDisplayDate(reply.createdAt)}
                                    </span>
                                    {isLoggedIn && user && (reply.userId === user.id || user.role === 'ADMIN') && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleEditComment(reply.id, reply.content)}
                                          className="text-xs px-1 py-0.5 rounded text-blue-600 hover:bg-blue-50 transition-all"
                                        >
                                          수정
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="text-xs px-1 py-0.5 rounded text-red-600 hover:bg-red-50 transition-all"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {editingCommentId === reply.id ? (
                                  <div>
                                    <textarea
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveEditComment(reply.id);
                                        }
                                      }}
                                      className="w-full px-2 py-1 border rounded focus:outline-none text-sm resize-none"
                                      rows={2}
                                      placeholder="수정할 내용을 입력하세요... (Enter: 저장, Shift+Enter: 줄바꿈)"
                                    />
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() => handleSaveEditComment(reply.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-all"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={handleCancelEditComment}
                                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-all"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2" style={{ color: '#333333' }}>
                                      {reply.content}
                                    </div>
                                    
                                    {/* 대댓글 좋아요 버튼 */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleCommentLike(reply.id, 'LIKE')}
                                        disabled={!isLoggedIn}
                                        className={`flex items-center gap-1 transition-all text-xs font-medium ${
                                          !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : reply.userLikeType === 'LIKE'
                                              ? 'text-orange-500'
                                              : 'text-gray-500 hover:text-orange-400'
                                        }`}
                                      >
                                        👍 {reply.likeCount || 0}
                                      </button>
                                      <button
                                        onClick={() => handleCommentLike(reply.id, 'DISLIKE')}
                                        disabled={!isLoggedIn}
                                        className={`flex items-center gap-1 transition-all text-xs font-medium ${
                                          !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : reply.userLikeType === 'DISLIKE'
                                              ? 'text-red-500'
                                              : 'text-gray-500 hover:text-red-400'
                                        }`}
                                      >
                                        👎 {reply.dislikeCount || 0}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    );
                  });
                })()}
              </div>
            )}
            
            {/* 댓글 페이지네이션 */}
            {totalComments > COMMENTS_PER_PAGE && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleCommentPageChange(commentPage - 1)}
                  disabled={commentPage === 0}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    commentPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  이전
                </button>
                
                {Array.from({ length: Math.ceil(totalComments / COMMENTS_PER_PAGE) }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => handleCommentPageChange(index)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      commentPage === index
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handleCommentPageChange(commentPage + 1)}
                  disabled={commentPage >= Math.ceil(totalComments / COMMENTS_PER_PAGE) - 1}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    commentPage >= Math.ceil(totalComments / COMMENTS_PER_PAGE) - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  다음
                </button>
                
                <div className="ml-4 text-sm text-gray-500">
                  {commentPage * COMMENTS_PER_PAGE + 1} - {Math.min((commentPage + 1) * COMMENTS_PER_PAGE, totalComments)} / {totalComments}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetailPage;