import { create } from 'zustand';

export type ChatFileMetadata = {
  kind: 'chat_pdf';
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  fileUrl: string;
};

export type ChatMessage = {
  id: string;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
  metadata?: ChatFileMetadata | Record<string, any>;
};

function dedupeMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  const next: ChatMessage[] = [];

  for (const message of messages) {
    if (seen.has(message.id)) {
      continue;
    }

    seen.add(message.id);
    next.push(message);
  }

  return next;
}

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
    set((state) => ({
      messagesByUser: { ...state.messagesByUser, [username]: dedupeMessages(msgs) },
    })),
  appendMessageForUser: (username, msg) =>
    set((state) => {
      const currentMessages = state.messagesByUser[username] || [];

      if (currentMessages.some((existing) => existing.id === msg.id)) {
        return state;
      }

      return {
        messagesByUser: {
          ...state.messagesByUser,
          [username]: [...currentMessages, msg],
        },
      };
    }),
  clearMessagesForUser: (username) =>
    set((state) => {
      const next = { ...state.messagesByUser };
      delete next[username];
      return { messagesByUser: next };
    }),
}));

export default useChatStore;
