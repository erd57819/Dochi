import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';

// 인증 헤더 생성
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 현재 사용자 ID 가져오기
const getCurrentUserId = () => {
  const user = useAuthStore.getState().user;
  return user?.id || localStorage.getItem('userId') || 1;
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

// 커뮤니티 API
export const communityApi = {
  // 게시글 목록 조회
  async getPosts(page = 0, size = 10, search = '', category = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(category && { category })
      });
      
      const response = await fetch(`${API_BASE_URL}/api/community?${params}`);
      const data = await response.json();
      
      console.log('게시글 목록 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '게시글 조회 실패');
      }
      
      // 응답 데이터 구조 확인 및 변환
      const result = data.data || data;
      
      return {
        content: (result.content || []).map(post => ({
          ...post,
          author: `사용자${post.userId}`, // 임시 작성자명
          createdAt: formatDate(post.createdAt),
          tags: post.tags ? post.tags.split(',') : [], // 태그 문자열을 배열로 변환
          likeCount: 0, // 초기값
          dislikeCount: 0, // 초기값
          userLikeType: null // 초기값
        })),
        totalPages: result.totalPages || 0,
        totalElements: result.totalElements || 0,
        pageNumber: result.pageNumber || 0
      };
    } catch (error) {
      console.error('게시글 조회 에러:', error);
      throw error;
    }
  },

// 게시글 상세 조회 - 디버깅 강화
async getPost(postId) {
  try {
    console.log('API: 게시글 상세 조회 시작, postId:', postId);
    const url = `${API_BASE_URL}/api/community/${postId}`;
    console.log('API: 요청 URL:', url);
    
    const response = await fetch(url);
    console.log('API: 응답 상태:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('API: 응답 데이터 전체:', data);
    console.log('API: 응답 구조 - success:', data.success);
    console.log('API: 응답 구조 - data:', data.data);
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }
    
    // 백엔드 응답 구조에 맞게 수정
    return data.data; // 또는 data가 직접 게시글 데이터일 수 있음
  } catch (error) {
    console.error('API: 게시글 상세 조회 에러:', error);
    throw error;
  }
},

  // 게시글 작성
  async createPost(postData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          category: postData.category || 'GENERAL'
        })
      });

      const data = await response.json();
      
      console.log('게시글 작성 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '게시글 작성 실패');
      }
      
      return data;
    } catch (error) {
      console.error('게시글 작성 에러:', error);
      throw error;
    }
  }
};

// 댓글 API
export const commentApi = {
  // 댓글 목록 조회
  async getComments(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/post/${postId}`);
      const data = await response.json();
      
      console.log('댓글 목록 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 조회 실패');
      }
      
      const comments = data.data || [];
      
      return comments.map(comment => ({
        ...comment,
        author: comment.userName || `사용자${comment.userId}`,
        createdAt: formatDate(comment.createdAt),
        likeCount: 0, // 초기값
        dislikeCount: 0, // 초기값
        userLikeType: null // 초기값
      }));
    } catch (error) {
      console.error('댓글 조회 에러:', error);
      throw error;
    }
  },

  // 댓글 작성
  async createComment(postId, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          postId: postId,
          userId: getCurrentUserId(),
          content: content
        })
      });

      const data = await response.json();
      
      console.log('댓글 작성 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 작성 실패');
      }
      
      return data;
    } catch (error) {
      console.error('댓글 작성 에러:', error);
      throw error;
    }
  }
};

// 좋아요 API
export const likeApi = {
  // 게시글 좋아요 토글
  async togglePostLike(postId, likeType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          postId: postId,
          userId: getCurrentUserId(),
          likeType: likeType
        })
      });

      const data = await response.json();
      
      console.log('게시글 좋아요 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '좋아요 처리 실패');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('게시글 좋아요 에러:', error);
      throw error;
    }
  },

  // 댓글 좋아요 토글
  async toggleCommentLike(commentId, likeType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          commentId: commentId,
          userId: getCurrentUserId(),
          likeType: likeType
        })
      });

      const data = await response.json();
      
      console.log('댓글 좋아요 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 좋아요 처리 실패');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('댓글 좋아요 에러:', error);
      throw error;
    }
  },

  // 게시글 좋아요 통계 조회
  async getPostLikeStats(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/posts/${postId}?userId=${getCurrentUserId()}`);
      const data = await response.json();
      
      console.log('게시글 좋아요 통계 API 응답:', data);
      
      if (!response.ok) {
        // 좋아요 통계가 없는 경우는 에러가 아님
        return {
          likeCount: 0,
          dislikeCount: 0,
          userLikeType: null
        };
      }
      
      return data.data || data;
    } catch (error) {
      console.error('게시글 좋아요 통계 에러:', error);
      // 에러 발생 시 기본값 반환
      return {
        likeCount: 0,
        dislikeCount: 0,
        userLikeType: null
      };
    }
  },

  // 댓글 좋아요 통계 조회
  async getCommentLikeStats(commentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/comments/${commentId}?userId=${getCurrentUserId()}`);
      const data = await response.json();
      
      console.log('댓글 좋아요 통계 API 응답:', data);
      
      if (!response.ok) {
        return {
          likeCount: 0,
          dislikeCount: 0,
          userLikeType: null
        };
      }
      
      return data.data || data;
    } catch (error) {
      console.error('댓글 좋아요 통계 에러:', error);
      return {
        likeCount: 0,
        dislikeCount: 0,
        userLikeType: null
      };
    }
  }
};