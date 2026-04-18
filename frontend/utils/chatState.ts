import { create } from 'zustand';

export type ChatFileMetadata = {
  kind: 'chat_pdf';
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  fileUrl: string;
};

export type PongInviteMetadata = {
  kind: 'pong_invite';
  inviteId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELED';
  expiresAt: string;
  game: 'pong';
};

export type PongNotificationMetadata = {
  kind: 'pong_notification';
  event:
    | 'invite_accepted'
    | 'invite_declined'
    | 'match_result'
    | 'opponent_left'
    | 'opponent_disconnected';
  inviteId: string;
  game: 'pong';
  matchId?: string;
  finalScore?: { p1: number; p2: number };
  winnerUsername?: string;
  endedByUsername?: string;
};

export type ChatMessage = {
  id: string;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
  metadata?: ChatFileMetadata | PongInviteMetadata | PongNotificationMetadata | Record<string, any>;
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
  unreadByUser: Record<string, number>;
  setTargetUsername: (username: string) => void;
  clearTargetUsername: () => void;
  setPanelOpen: (isOpen: boolean) => void;
  setMessagesForUser: (username: string, msgs: ChatMessage[]) => void;
  appendMessageForUser: (username: string, msg: ChatMessage) => void;
  clearMessagesForUser: (username: string) => void;
  markMessageDeleted: (messageId: string, replacementText?: string) => void;
  incrementUnreadForUser: (username: string, by?: number) => void;
  setUnreadForUser: (username: string, count: number) => void;
  clearUnreadForUser: (username: string) => void;
  getTotalUnread: () => number;
}

const useChatStore = create<ChatState>()((set, get) => ({
  targetUsername: null,
  panelOpen: false,
  messagesByUser: {},
  unreadByUser: {},
  setTargetUsername: (username) =>
    set((state) => {
      const nextUnread = { ...state.unreadByUser };
      if (username in nextUnread) delete nextUnread[username];
      return { targetUsername: username, unreadByUser: nextUnread };
    }),
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
  markMessageDeleted: (messageId, replacementText = 'Attachment deleted') =>
    set((state) => {
      let changed = false;
      const nextMessagesByUser = Object.fromEntries(
        Object.entries(state.messagesByUser).map(([username, messages]) => {
          const nextMessages = messages.map((message) => {
            if (message.id !== messageId) {
              return message;
            }

            changed = true;

            return {
              ...message,
              message: message.message?.trim() ? message.message : replacementText,
              metadata: undefined,
            };
          });

          return [username, nextMessages];
        }),
      );

      if (!changed) {
        return state;
      }

      return {
        messagesByUser: nextMessagesByUser,
      };
    }),
  incrementUnreadForUser: (username, by = 1) =>
    set((state) => ({
      unreadByUser: {
        ...state.unreadByUser,
        [username]: (state.unreadByUser[username] ?? 0) + by,
      },
    })),
  setUnreadForUser: (username, count) =>
    set((state) => {
      const next = { ...state.unreadByUser };
      if (!username) return { unreadByUser: next };
      if (count <= 0) delete next[username];
      else next[username] = count;
      return { unreadByUser: next };
    }),
  clearUnreadForUser: (username) =>
    set((state) => {
      const next = { ...state.unreadByUser };
      delete next[username];
      return { unreadByUser: next };
    }),
  getTotalUnread: () => {
    const state = get();
    return Object.values(state.unreadByUser).reduce((a, b) => a + b, 0);
  },
}));

export default useChatStore;
