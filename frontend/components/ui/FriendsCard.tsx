import type { FriendUser } from '../../types/users';
import { User } from './User';
import { Link } from 'react-router-dom';

interface FriendsCardProps {
  friends: FriendUser[];
}

export function FriendsCard({ friends }: FriendsCardProps) {
  const renderFriend = (friend: FriendUser) => {
    const isOnline = Boolean(friend.isOnline);

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
              avatar={friend.avatarUrl ?? '/uploads/avatars/default.png'}
              name={friend.displayname ?? friend.username}
              username={friend.username}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#8b98a5]">
            {friend.friendStatus === 'friend' && <span>Friend</span>}
            {friend.friendStatus === 'requested' && <span>Requested</span>}
          </div>
        </div>
        <Link
          to={`/users/${friend.username}`}
          className="h-9 shrink-0 rounded-full border border-[#39444d] px-4 text-[13px] font-medium text-[#f7f9f9] transition-colors hover:bg-[#1e293b] flex items-center justify-center"
        >
          View
        </Link>
      </div>
    );
  };

  return <div className="space-y-3">{friends.map((friend) => renderFriend(friend))}</div>;
}
