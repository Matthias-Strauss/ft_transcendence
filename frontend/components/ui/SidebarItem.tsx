import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
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
