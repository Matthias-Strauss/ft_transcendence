import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
};

interface ChatState {
  targetUsername: string | null;
  panelOpen: boolean;
  messagesByUser: Record<string, ChatMessage[]>;
  setTargetUsername: (username: string) => void;
  clearTargetUsername: () => void;
  setPanelOpen: (isOpen: boolean) => void;
  setMessagesForUser: (username: string, msgs: ChatMessage[]) => void;
  appendMessageForUser: (username: string, msg: ChatMessage) => void;
  clearMessagesForUser: (username: string) => void;
}

const useChatStore = create<ChatState>()((set) => ({
  targetUsername: null,
  panelOpen: false,
  messagesByUser: {},
  setTargetUsername: (username) => set({ targetUsername: username }),
  clearTargetUsername: () => set({ targetUsername: null }),
  setPanelOpen: (isOpen) => set({ panelOpen: isOpen }),
  setMessagesForUser: (username, msgs) =>
    set((state) => ({ messagesByUser: { ...state.messagesByUser, [username]: msgs } })),
  appendMessageForUser: (username, msg) =>
    set((state) => ({
      messagesByUser: {
        ...state.messagesByUser,
        [username]: [...(state.messagesByUser[username] || []), msg],
      },
    })),
  clearMessagesForUser: (username) =>
    set((state) => {
      const next = { ...state.messagesByUser };
      delete next[username];
      return { messagesByUser: next };
    }),
}));

export default useChatStore;
