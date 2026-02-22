import { Friends, Player } from '@/mock_data/mock';
import { User } from './User';

interface FriendsCardProps {
  friends: Friends;
}

export function FriendsCard({ friends }: FriendsCardProps) {
  const renderFriend = (friend: Player, status: 'online' | 'offline') => {
    const isOnline = status === 'online';

    return (
      <div
        key={friend.id}
        className="flex items-start justify-between gap-3 rounded-xl border border-[#39444d] bg-[#0f172a]/40 px-4 py-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-[#8b98a5]'}`}
            />
            <span className="text-[12px] uppercase tracking-wide text-[#8b98a5]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="mt-2">
            <User
              avatar={friend.avatar}
              name={friend.name}
              username={friend.username}
              verified={friend.verified}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#8b98a5]">
            <span>Level {friend.level}</span>
            <span>•</span>
            <span>{friend.wins} Wins</span>
          </div>
        </div>
        <button className="h-9 shrink-0 rounded-full border border-[#39444d] px-4 text-[13px] font-medium text-[#f7f9f9] transition-colors hover:bg-[#1e293b]">
          {friend.following ? 'Following' : 'Follow'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {friends.online.map((friend) => renderFriend(friend, 'online'))}
      {friends.offline.map((friend) => renderFriend(friend, 'offline'))}
    </div>
  );
}
