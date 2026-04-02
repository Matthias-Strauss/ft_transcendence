import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProps {
  avatar: string | undefined;
  name: string;
  username: string;
  verified: boolean | undefined;
}

export function User({ avatar, name, verified, username }: UserProps) {
  const clean = username?.startsWith('@') ? username.slice(1) : username;

  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="size-12 rounded-full overflow-hidden shrink-0">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-columns items-center">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <Link to={`/users/${clean}`} className="font-bold text-[15px] text-[#f7f9f9] truncate">
              {name}
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
