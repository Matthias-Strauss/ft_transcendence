import { create } from 'zustand';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthStore = {
  status: AuthStatus;
  isRefreshing: boolean;
  lastSessionRefreshAt: number | null;
  setStatus: (status: AuthStatus) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  markAuthenticated: (refreshedAt?: number) => void;
  markAnonymous: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  isRefreshing: false,
  lastSessionRefreshAt: null,
  setStatus: (status) => set({ status }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  markAuthenticated: (refreshedAt = Date.now()) =>
    set({
      status: 'authenticated',
      isRefreshing: false,
      lastSessionRefreshAt: refreshedAt,
    }),
  markAnonymous: () =>
    set({
      status: 'anonymous',
      isRefreshing: false,
      lastSessionRefreshAt: null,
    }),
}));

export default useAuthStore;
