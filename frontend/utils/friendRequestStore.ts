import { create } from 'zustand';

type FriendRequestState = {
  incomingCount: number;
  setIncomingCount: (n: number) => void;
  incrementIncoming: (delta?: number) => void;
};

const useFriendRequestStore = create<FriendRequestState>((set) => ({
  incomingCount: 0,
  setIncomingCount: (n: number) => set({ incomingCount: n }),
  incrementIncoming: (delta = 1) =>
    set((s) => ({ incomingCount: Math.max(0, s.incomingCount + delta) })),
}));

export default useFriendRequestStore;
