import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import {
  Home,
  Gamepad2,
  Users,
  Bell,
  MessageSquare,
  Bookmark,
  User as UserIcon,
  ShieldCheck,
  FileText,
} from 'lucide-react';

import { SidebarItem } from './ui/SidebarItem';
import { AuthedImage } from './ui/AuthedImage';
import { useUserStore } from '../utils/userStore';
import type { UserStore } from '../utils/userStore';
import useChatStore from '../utils/chatState';
import useNotificationStore from '../utils/notificationStore';
import useFriendRequestStore from '../utils/friendRequestStore';
import { logout } from '../utils/api';
import showToast from '../utils/toast';

function Logo() {
  return (
    <div className="px-3 py-4">
      <Gamepad2 className="size-6 text-[var(--color-1)]" />
    </div>
  );
}

interface LeftSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewPost: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function LeftSidebar({
  activeTab,
  onTabChange,
  onNewPost,
  mobileOpen = false,
  onMobileClose,
}: LeftSidebarProps) {
  interface MeResponse {
    id?: string;
    username?: string;
    displayname?: string | null;
    avatarUrl?: string | null;
  }

  const [me, setMe] = useState<MeResponse | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useUserStore((s: UserStore) => s.setUser);
  const storeUser = useUserStore((s: UserStore) => s.user);
  const effectiveMe = (storeUser as MeResponse | null) ?? me;
  const notifUnread = useNotificationStore((s) => s.unreadCount);
  const totalUnread = useChatStore((s) => Object.values(s.unreadByUser).reduce((a, b) => a + b, 0));
  const incomingRequests = useFriendRequestStore((s) => s.incomingCount);
  const onRootRoute = location.pathname === '/';
  const onGameRoute = location.pathname === '/game';
  const onProfileRoute = location.pathname.startsWith('/users/');

  const closeMobile = () => {
    onMobileClose?.();
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    closeMobile();
  };

  const handleProfileNavigate = async () => {
    onTabChange('profile');
    if (effectiveMe?.username) {
      navigate(`/users/${effectiveMe.username}`);
      closeMobile();
      return;
    }

    try {
      const res = await apiFetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.username) navigate(`/users/${data.username}`);
        setUser(data);
        closeMobile();
      }
    } catch {}
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setMe(data);
          setUser(data);
        }
      } catch {}
    }

    void load();
  }, [setUser]);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await apiFetch('/api/notifications/unread_count');
        if (!mounted || !res.ok) return;
        const data = await res.json();
        useNotificationStore.getState().setUnreadCount(data.unreadCount ?? 0);
      } catch {}
    }

    void fetchUnread();

    async function fetchFriendRequests() {
      try {
        const res = await apiFetch('/api/me/friends/requests');
        if (!mounted || !res.ok) return;
        const data = await res.json();
        const count = (data.items || []).filter((it: any) => it.friendRequestIncoming).length;
        useFriendRequestStore.getState().setIncomingCount(count);
      } catch {}
    }

    void fetchFriendRequests();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className={`fixed left-0 top-0 z-[1200] flex h-screen w-[220px] flex-col gap-3 overflow-y-auto border-r border-[#39444d] bg-[#0f172a] px-4 pb-4 pt-0 transition-transform duration-300 md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <Logo />

      <div className="flex flex-col gap-1">
        <SidebarItem
          icon={<Home className="size-6" />}
          label="Home"
          active={onRootRoute && activeTab === 'home'}
          to="/"
          onClick={() => handleTabClick('home')}
        />
        <SidebarItem
          icon={<Gamepad2 className="size-6" />}
          label="Game"
          active={onGameRoute}
          to="/game"
          onClick={() => handleTabClick('home')}
        />
        <SidebarItem
          icon={<Bell className="size-6" />}
          label="Notifications"
          active={activeTab === 'notifications' || location.pathname === '/notifications'}
          onClick={() => handleTabClick('notifications')}
          badge={
            notifUnread > 0 ? (
              <div className="bg-red-600 text-[#f7f9f9] text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {notifUnread}
              </div>
            ) : undefined
          }
        />
        <SidebarItem
          icon={<MessageSquare className="size-6" />}
          label="Messages"
          active={onRootRoute && activeTab === 'messages'}
          to="/"
          onClick={() => handleTabClick('messages')}
          badge={
            totalUnread > 0 ? (
              <div className="bg-red-600 text-[#f7f9f9] text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {totalUnread}
              </div>
            ) : undefined
          }
        />
        <SidebarItem
          icon={<Users className="size-6" />}
          label="Friends"
          active={onRootRoute && activeTab === 'friends'}
          to="/"
          onClick={() => handleTabClick('friends')}
          badge={
            incomingRequests > 0 ? (
              <div className="bg-red-600 text-[#f7f9f9] text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {incomingRequests}
              </div>
            ) : undefined
          }
        />
        <SidebarItem
          icon={<Bookmark className="size-6" />}
          label="Saved"
          active={onRootRoute && activeTab === 'saved'}
          to="/"
          onClick={() => handleTabClick('saved')}
        />
        <SidebarItem
          icon={<UserIcon className="size-6" />}
          label="Profile"
          active={onProfileRoute}
          onClick={handleProfileNavigate}
        />
        <SidebarItem
          icon={<ShieldCheck className="size-6" />}
          label="Privacy"
          active={location.pathname === '/privacy'}
          to="/privacy"
          onClick={() => handleTabClick('privacy')}
        />
        <SidebarItem
          icon={<FileText className="size-6" />}
          label="Terms"
          active={location.pathname === '/terms'}
          to="/terms"
          onClick={() => handleTabClick('terms')}
        />
      </div>

      <button
        onClick={() => {
          onNewPost();
          closeMobile();
        }}
        className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-3 px-6 transition-colors mt-2"
      >
        <span className="font-bold text-[15px]">Write a post</span>
      </button>
      <button
        onClick={async () => {
          try {
            await logout();
          } catch {
            showToast('Logout failed. Please try again.', 'error');
          } finally {
            showToast('Logged out successfully!', 'success');
          }
        }}
        className="bg-transparent border border-[#39444d] text-[#f7f9f9] rounded-full py-2 px-4 transition-colors"
      >
        Logout
      </button>

      <div className="mt-auto">
        <div
          className="flex items-center gap-3 py-4 hover:bg-[#1e293b] rounded-full px-3 cursor-pointer transition-colors"
          onClick={handleProfileNavigate}
          role="button"
        >
          {me?.avatarUrl ? (
            <div className="size-10 rounded-full overflow-hidden shrink-0">
              <AuthedImage
                src={effectiveMe?.avatarUrl ?? '/uploads/avatars/default.png'}
                alt={effectiveMe?.displayname ?? effectiveMe?.username ?? ''}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] flex items-center justify-center shrink-0">
              <UserIcon className="size-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-bold text-[15px] text-[#f7f9f9] truncate">
                {effectiveMe?.displayname ?? 'Player One'}
              </p>
            </div>
            <p className="text-[13px] text-[#8b98a5] truncate">
              {effectiveMe?.username ? `@${effectiveMe.username}` : '@playerone'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
