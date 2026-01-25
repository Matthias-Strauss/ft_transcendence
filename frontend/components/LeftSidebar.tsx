import {
  Home,
  Gamepad2,
  Trophy,
  Users,
  Bell,
  MessageSquare,
  Bookmark,
  User as UserIcon,
  MoreHorizontal,
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-3 py-3 rounded-full transition-colors w-full hover:bg-[#1e293b] ${
        active ? 'font-bold' : ''
      }`}
    >
      {icon}
      <span className="text-[16px] leading-[20px] text-[#f7f9f9]">{label}</span>
    </button>
  );
}

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
}

export function LeftSidebar({ activeTab, onTabChange, onNewPost }: LeftSidebarProps) {
  return (
    <div className="bg-[#0f172a] flex flex-col gap-3 h-screen fixed left-0 top-0 w-[220px] px-4 pt-0 pb-4 border-r border-[#39444d]">
      <Logo />

      <div className="flex flex-col gap-1">
        <SidebarItem
          icon={<Home className="size-6" />}
          label="Home"
          active={activeTab === 'home'}
          onClick={() => onTabChange('home')}
        />
        <SidebarItem
          icon={<Gamepad2 className="size-6" />}
          label="Games"
          active={activeTab === 'games'}
          onClick={() => onTabChange('games')}
        />
        <SidebarItem
          icon={<Trophy className="size-6" />}
          label="Leaderboard"
          active={activeTab === 'leaderboard'}
          onClick={() => onTabChange('leaderboard')}
        />
        <SidebarItem
          icon={<Bell className="size-6" />}
          label="Notifications"
          active={activeTab === 'notifications'}
          onClick={() => onTabChange('notifications')}
        />
        <SidebarItem
          icon={<MessageSquare className="size-6" />}
          label="Messages"
          active={activeTab === 'messages'}
          onClick={() => onTabChange('messages')}
        />
        <SidebarItem
          icon={<Users className="size-6" />}
          label="Friends"
          active={activeTab === 'friends'}
          onClick={() => onTabChange('friends')}
        />
        <SidebarItem
          icon={<Bookmark className="size-6" />}
          label="Saved"
          active={activeTab === 'saved'}
          onClick={() => onTabChange('saved')}
        />
        <SidebarItem
          icon={<UserIcon className="size-6" />}
          label="Profile"
          active={activeTab === 'profile'}
          onClick={() => onTabChange('profile')}
        />
        <SidebarItem
          icon={<MoreHorizontal className="size-6" />}
          label="More"
          active={activeTab === 'more'}
          onClick={() => onTabChange('more')}
        />
      </div>

      <button
        onClick={onNewPost}
        className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-3 px-6 transition-colors mt-2"
      >
        <span className="font-bold text-[15px]">Post</span>
      </button>

      <div className="mt-auto">
        <div className="flex items-center gap-3 py-4 hover:bg-[#1e293b] rounded-full px-3 cursor-pointer transition-colors">
          <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] flex items-center justify-center shrink-0">
            <UserIcon className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-bold text-[15px] text-[#f7f9f9] truncate">Player One</p>
            </div>
            <p className="text-[13px] text-[#8b98a5] truncate">@playerone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
