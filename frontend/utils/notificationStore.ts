import { create } from 'zustand';

type NotificationState = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  incrementUnread: (delta?: number) => void;
};

const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n: number) => set({ unreadCount: n }),
  incrementUnread: (delta = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount + delta) })),
}));

export default useNotificationStore;
