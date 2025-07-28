import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isLoggedIn: false,
  user: null,
  
  logIn: (user) => set({ isLoggedIn: true, user }),
  logOut: () => set({ isLoggedIn: false, user: null }),
}));

export default useAuthStore;