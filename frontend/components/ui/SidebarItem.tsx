import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  to?: string;
}

export function SidebarItem({ icon, label, active, onClick, to, badge }: SidebarItemProps) {
  const className = `flex items-center gap-4 px-3 py-3 rounded-full transition-colors w-full hover:bg-[#1e293b] ${
    active ? 'font-bold' : ''
  }`;

  const labelNode = (
    <span className="flex-1 text-[16px] leading-[20px] text-[#f7f9f9] text-left">{label}</span>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {icon}
        {labelNode}
        {badge ? <div className="ml-auto">{badge}</div> : null}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {labelNode}
      {badge ? <div className="ml-auto">{badge}</div> : null}
    </button>
  );
}
