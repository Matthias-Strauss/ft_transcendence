import { create } from 'zustand';

export type User = {
  id?: string;
  username?: string;
  displayname?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

export type UserStore = {
  user: User | null;
  setUser: (u: User | null) => void;
  update: (patch: Partial<User>) => void;
  clear: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  update: (patch) =>
    set((state) => ({
      user: state.user ? { ...(state.user as User), ...patch } : ({ ...(patch as User) } as User),
    })),
  clear: () => set({ user: null }),
}));

export default useUserStore;
