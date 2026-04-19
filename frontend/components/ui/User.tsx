import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthedImage } from './AuthedImage';
import { useUserStore } from '../../utils/userStore';
import type { UserStore } from '../../utils/userStore';

interface UserProps {
  avatar?: string | null;
  name: string;
  username: string;
  verified?: boolean;
}

export function User({ avatar, name, verified, username }: UserProps) {
  const clean = username?.startsWith('@') ? username.slice(1) : username;
  const currentUser = useUserStore((s: UserStore) => s.user);

  const isCurrent = Boolean(clean && currentUser?.username && clean === currentUser.username);
  const avatarToUse = isCurrent ? currentUser?.avatarUrl ?? avatar : avatar;
  const nameToUse = isCurrent ? currentUser?.displayname ?? name : name;

  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="size-12 rounded-full overflow-hidden shrink-0">
        <AuthedImage
          src={avatarToUse ?? '/uploads/avatars/default.png'}
          alt={nameToUse}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-columns items-center">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <Link to={`/users/${clean}`} className="font-bold text-[15px] text-[#f7f9f9] truncate">
              {nameToUse}
            </Link>
            {verified && <BadgeCheck className="size-5" color="var(--color-1)" />}
          </div>
        </div>
        <Link to={`/users/${clean}`} className="text-[15px] text-[#8b98a5] truncate">
          {username.startsWith('@') ? username : `@${username}`}
        </Link>
      </div>
    </div>
  );
}
