import { BadgeCheck } from 'lucide-react';

interface UserProps {
  avatar: string;
  name: string;
  username: string;
  verified: boolean;
}

export function User({ avatar, name, verified, username }: UserProps) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="size-12 rounded-full overflow-hidden shrink-0">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-columns items-center">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-[15px] text-[#f7f9f9] truncate">{name}</span>
            {verified && <BadgeCheck className="size-5" color="var(--color-1)" />}
          </div>
        </div>
        <span className="text-[15px] text-[#8b98a5] truncate">{username}</span>
      </div>
    </div>
  );
}
