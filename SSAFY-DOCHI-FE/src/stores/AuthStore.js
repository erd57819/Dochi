import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      get token() {
        // localStorage에서 실시간으로 토큰을 가져옴
        return localStorage.getItem('accessToken');
      },
      
      logIn: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ isLoggedIn: true, user });
      },
      logOut: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ isLoggedIn: false, user: null });
      },
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
      getStorage: () => localStorage, // 저장소 선택
    }
  )
);

export { useAuthStore };
export default useAuthStore;