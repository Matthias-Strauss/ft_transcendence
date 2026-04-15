import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import useChatStore from '../utils/chatState';
import { AuthedImage } from './ui/AuthedImage';
import { socket } from '../socket';
import useUserStore from '../utils/userStore';
import showToast from '../utils/toast';

type ConversationItem = {
  target: {
    id: string;
    username: string;
    displayname?: string | null;
    avatarUrl?: string | null;
  };
  lastMessage?: {
    id: string;
    text?: string | null;
    createdAt?: string;
  };
  unreadCount?: number;
  blockedByMe?: boolean;
  blockedMe?: boolean;
  canMessage?: boolean;
};

export function ConversationsList() {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setTargetUsername = useChatStore((s) => s.setTargetUsername);
  const setPanelOpen = useChatStore((s) => s.setPanelOpen);
  const meUsername = useUserStore((s) => s.user?.username ?? null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/chat/conversations');
        if (!res.ok) {
          setItems([]);
        } else {
          const data = await res.json();
          if (mounted) setItems(data.items || []);
        }
      } catch (e) {
        showToast('Failed to load conversations', 'error');
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onChatMessage = (payload: any) => {
      try {
        if (!payload) return;

        const senderUsername = payload?.sender?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;

        if (!senderUsername || !recipientUsername || !meUsername) return;
        if (senderUsername === recipientUsername) return;

        let otherUsername: string | null = null;
        let fromOtherToMe = false;

        if (senderUsername === meUsername) {
          otherUsername = recipientUsername;
          fromOtherToMe = false;
        } else if (recipientUsername === meUsername) {
          otherUsername = senderUsername;
          fromOtherToMe = true;
        } else {
          return;
        }

        const newLast = {
          id: payload.id,
          text: payload.text,
          createdAt: payload.createdAt,
        };

        setItems((prev) => {
          const idx = prev.findIndex((it) => it.target.username === otherUsername);

          if (idx !== -1) {
            const updated = [...prev];
            const existing = updated[idx];
            if (existing.lastMessage?.id === newLast.id) {
              return prev;
            }
            const unread = fromOtherToMe ? (existing.unreadCount ?? 0) + 1 : existing.unreadCount;

            updated[idx] = { ...existing, lastMessage: newLast, unreadCount: unread };

            const moved = [updated[idx], ...updated.filter((_, i) => i !== idx)];
            return moved;
          }

          const partner = senderUsername === meUsername ? payload.recipient : payload.sender;

          const newItem: ConversationItem = {
            target: {
              id: partner?.id,
              username: partner?.username,
              displayname: partner?.displayname,
              avatarUrl: partner?.avatarUrl,
            },
            lastMessage: newLast,
            unreadCount: fromOtherToMe ? 1 : 0,
            canMessage: true,
          };

          return [newItem, ...prev];
        });
      } catch (e) {
        showToast('Failed to handle incoming chat message', 'error');
      }
    };

    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, [meUsername]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="font-bold text-[20px] text-[#f7f9f9] mb-2">Messages</h2>
        <p className="text-[#8b98a5]">Recent conversations</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-[#8b98a5]">Loading conversations...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#39444d] px-4 py-6 text-center text-[13px] text-[#8b98a5]">
            No conversations yet.
          </div>
        ) : (
          items.map((it) => (
            <button
              key={it.target.username}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#071426] transition-colors"
              onClick={() => {
                if (it.canMessage === false) return;
                setTargetUsername(it.target.username);
                setPanelOpen(true);
              }}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#071426]">
                <AuthedImage
                  src={it.target.avatarUrl ?? '/uploads/avatars/default.png'}
                  alt={it.target.displayname ?? it.target.username}
                  className="w-12 h-12 object-cover"
                />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#f7f9f9]">
                      {it.target.displayname ?? it.target.username}
                    </div>
                    <div className="text-xs text-[#8b98a5]">@{it.target.username}</div>
                  </div>

                  <div className="text-xs text-[#8b98a5]">
                    {it.lastMessage?.createdAt
                      ? new Date(it.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>

                <div className="text-sm text-[#8b98a5] mt-1 truncate">
                  {it.lastMessage?.text ?? ''}
                </div>
              </div>

              {it.unreadCount ? (
                <div className="ml-2 bg-[var(--color-1)] text-[#f7f9f9] px-2 py-1 rounded-full text-xs">
                  {it.unreadCount}
                </div>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationsList;
