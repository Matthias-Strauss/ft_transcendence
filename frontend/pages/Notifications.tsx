import { useCallback, useEffect, useState } from 'react';
import { AuthedImage } from '../components/ui/AuthedImage';
import { apiFetch } from '../utils/api';
import showToast from '../utils/toast';
import { socket } from '../socket';
import useUserStore from '../utils/userStore';
import useNotificationStore from '../utils/notificationStore';

interface Actor {
  id?: string;
  username?: string | null;
  displayname?: string | null;
  avatarPath?: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  recipient?: { username?: string | null } | null;
  post?: { id?: string; content?: string | null } | null;
  comment?: { id?: string; content?: string | null } | null;
  actor?: Actor | null;
  readAt?: string | null;
  createdAt: string;
}

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      showToast('Error loading notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchNotifications();
      try {
        const ok = await markAllRead();
        if (ok) {
          useNotificationStore.getState().setUnreadCount(0);
        }
      } catch (e) {}
    })();
  }, [fetchNotifications]);

  useEffect(() => {
    const onNotification = (payload: NotificationItem) => {
      try {
        const me = useUserStore.getState().user?.username ?? null;
        const recipientUsername = payload?.recipient?.username ?? null;
        if (!me || !recipientUsername || recipientUsername !== me) return;

        setItems((prev) => [payload, ...prev]);
      } catch {}
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, []);

  const markRead = async (id: string) => {
    try {
      const wasUnread = items.find((it) => it.id === id && !it.readAt) != null;
      const res = await apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, readAt: new Date().toISOString() } : it)));
      if (wasUnread) {
        useNotificationStore.getState().incrementUnread(-1);
      }
    } catch {
      showToast('Could not mark notification read', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/mark_all_read', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setItems((prev) => prev.map((it) => ({ ...it, readAt: new Date().toISOString() })));
      useNotificationStore.getState().setUnreadCount(0);
      return true;
    } catch {
      showToast('Could not mark all read', 'error');
      return false;
    }
  };

  const renderMessage = (n: NotificationItem) => {
    const actorName = n.actor?.displayname ?? n.actor?.username ?? 'Someone';

    switch (n.type) {
      case 'POST_LIKE':
        return `${actorName} liked your post.`;
      case 'POST_COMMENT':
        return `${actorName} commented on your post.`;
      case 'POST_SAVE':
        return `${actorName} saved your post.`;
      case 'COMMENT_LIKE':
        if (n.comment && n.post) {
          return `${actorName} liked a comment${n.post ? ' under your post' : ''}.`;
        }
        return `${actorName} liked a comment.`;
      default:
        return 'Someone interacted with your post.';
    }
  };

  return (
    <div className="border-b border-[#39444d]">
      <div className="sticky top-0 backdrop-blur-xl bg-[#0f172a]/80 border-b border-[#39444d] z-10">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[20px] text-[#f7f9f9]">Notifications</h1>
            <p className="text-[#8b98a5] text-sm">Post & comment activity.</p>
          </div>
          <div />
        </div>
      </div>

      {loading && <p className="p-4 text-[#8b98a5]">Loading notifications...</p>}

      {!loading && items.length === 0 && (
        <p className="p-4 text-[#8b98a5]">No notifications yet.</p>
      )}

      {!loading &&
        items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 border-b border-[#28323a] hover:bg-[#071026] transition-colors ${
              n.readAt ? '' : 'bg-[#071726]'
            }`}
            role="button"
            onClick={() => {
              void markRead(n.id);
            }}
          >
            <div className="size-10 rounded-full overflow-hidden shrink-0">
              {n.actor?.avatarPath ? (
                <AuthedImage src={`/files/${n.actor.avatarPath}`} alt={n.actor?.displayname ?? n.actor?.username ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] flex items-center justify-center">
                  <span className="text-white">{(n.actor?.username ?? 'S').charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-[#f7f9f9]">{renderMessage(n)}</p>
              <p className="text-[12px] text-[#8b98a5] truncate mt-1">
                {n.comment?.content ? `${n.comment.content}` : n.post?.content ? `${n.post.content}` : ''}
              </p>
              <p className="text-[11px] text-[#66707a] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
    </div>
  );
}

export default Notifications;
