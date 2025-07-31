import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';

// 인증 헤더 생성
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || useAuthStore.getState().token;
  console.log('🔐 마이페이지 API 토큰:', token ? '토큰 있음' : '토큰 없음');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 에러 처리 헬퍼 함수
const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      console.warn('에러 응답 파싱 실패:', parseError);
    }
    throw new Error(errorMessage);
  }
};

// 마이페이지 API
export const myPageApi = {
  
  // === 사용자 정보 관련 API ===
  
  /**
   * 사용자 정보 조회
   * @returns {Promise<Object>} 사용자 정보
   */
  async getUserInfo() {
    try {
      console.log('👤 사용자 정보 조회 시작');
      
      const response = await fetch(`${API_BASE_URL}/user/info`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      console.log('✅ 사용자 정보 조회 성공:', data);
      
      return {
        success: true,
        data: data.data // UserInfoResDto 구조
      };
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 정보 수정
   * @param {Object} userData - 수정할 사용자 정보
   * @returns {Promise<Object>} 수정 결과
   */
  async updateUserInfo(userData) {
    try {
      console.log('✏️ 사용자 정보 수정 시작:', userData);
      
      // UserUpdateReqDto 구조에 맞게 변환
      const requestData = {
        name: userData.name,
        nickname: userData.nickname || userData.name, // nickname이 없으면 name 사용
        email: userData.email,
        address: userData.address,
        age: userData.age,
        gender: userData.gender || 'M' // 기본값
      };
      
      const response = await fetch(`${API_BASE_URL}/user/info`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      console.log('✅ 사용자 정보 수정 성공:', data);
      
      return {
        success: true,
        message: '정보가 성공적으로 수정되었습니다.'
      };
    } catch (error) {
      console.error('❌ 사용자 정보 수정 실패:', error);
      throw error;
    }
  },

  // === 갈등 관련 API ===
  
  /**
   * 사용자의 갈등 개수 조회
   * @returns {Promise<number>} 갈등 개수
   */
  async getUserConflictCount() {
    try {
      console.log('📋 사용자 갈등 개수 조회 시작');
      
      const response = await fetch(`${API_BASE_URL}/conflict/count`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      console.log('✅ 갈등 개수 조회 성공:', data);
      
      // 백엔드에서 Integer로 바로 반환
      const count = data.data || 0;
      
      return {
        success: true,
        count: count
      };
    } catch (error) {
      console.error('❌ 갈등 개수 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 갈등 목록 조회 (필요시 사용)
   * @returns {Promise<Array>} 갈등 목록
   */
  async getUserConflicts() {
    try {
      console.log('📋 사용자 갈등 목록 조회 시작');
      
      const response = await fetch(`${API_BASE_URL}/conflict/list`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      console.log('✅ 갈등 목록 조회 성공:', data);
      
      // ConflictResDto 배열 구조
      const conflicts = (data.data || []).map(conflict => ({
        id: conflict.id,
        title: conflict.title,
        description: conflict.description,
        conflictType: conflict.conflictType,
        createdAt: conflict.createdAt,
        // 날짜 포맷팅
        formattedDate: conflict.createdAt ? 
          new Date(conflict.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit'
          }).replace(/\. /g, '.').replace(/\.$/, '') : null
      }));
      
      return {
        success: true,
        data: conflicts
      };
    } catch (error) {
      console.error('❌ 갈등 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 갈등 상세 조회
   * @param {number} conflictId - 갈등 ID
   * @returns {Promise<Object>} 갈등 상세 정보
   */
  async getConflictDetail(conflictId) {
    try {
      console.log('📄 갈등 상세 조회 시작:', conflictId);
      
      const response = await fetch(`${API_BASE_URL}/conflict/${conflictId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      console.log('✅ 갈등 상세 조회 성공:', data);
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('❌ 갈등 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 비밀번호 변경 (현재 미구현)
   * @param {Object} passwordData - 비밀번호 변경 데이터
   * @returns {Promise<Object>} 변경 결과
   */
  async changePassword(passwordData) {
    // 현재 백엔드에 비밀번호 변경 API가 없어서 임시 에러 반환
    throw new Error('비밀번호 변경 기능이 아직 구현되지 않았습니다. 백엔드 개발자에게 문의해주세요.');
    
    // 나중에 API가 추가되면 아래 코드 사용:
    /*
    try {
      console.log('🔐 비밀번호 변경 시작');
      
      const response = await fetch(`${API_BASE_URL}/user/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.password,
          newPassword: passwordData.newpassword
        })
      });
      
      await handleApiError(response);
      const data = await response.json();
      
      return {
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      };
    } catch (error) {
      console.error('❌ 비밀번호 변경 실패:', error);
      throw error;
    }
    */
  }
};

export default myPageApi;