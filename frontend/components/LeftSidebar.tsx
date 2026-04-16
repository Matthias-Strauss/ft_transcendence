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
  MoreHorizontal,
} from 'lucide-react';

import { SidebarItem } from './ui/SidebarItem';
import { AuthedImage } from './ui/AuthedImage';
import { useUserStore } from '../utils/userStore';
import type { UserStore } from '../utils/userStore';
import useChatStore from '../utils/chatState';

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
  const totalUnread = useChatStore((s) => Object.values(s.unreadByUser).reduce((a, b) => a + b, 0));
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
          active={onRootRoute && activeTab === 'notifications'}
          to="/"
          onClick={() => handleTabClick('notifications')}
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
          icon={<MoreHorizontal className="size-6" />}
          label="More"
          active={onRootRoute && activeTab === 'more'}
          to="/"
          onClick={() => handleTabClick('more')}
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
