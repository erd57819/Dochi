import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      
      logIn: (user) => set({ isLoggedIn: true, user }),
      logOut: () => set({ isLoggedIn: false, user: null }),
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
      getStorage: () => localStorage, // 저장소 선택
    }
  )
);

export default useAuthStore;