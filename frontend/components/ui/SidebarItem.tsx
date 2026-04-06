import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  to?: string;
}

export function SidebarItem({ icon, label, active, onClick, to }: SidebarItemProps) {
  const className = `flex items-center gap-4 px-3 py-3 rounded-full transition-colors w-full hover:bg-[#1e293b] ${
    active ? 'font-bold' : ''
  }`;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {icon}
        <span className="text-[16px] leading-[20px] text-[#f7f9f9]">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      <span className="text-[16px] leading-[20px] text-[#f7f9f9]">{label}</span>
    </button>
  );
}
