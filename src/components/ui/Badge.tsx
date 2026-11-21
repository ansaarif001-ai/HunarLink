import React from 'react';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

const TONE_MAP: Record<BadgeTone, string> = {
  neutral: 'border-[#E3EAF3] bg-[#F8FAFC] text-[#475569]',
  primary: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1769E0]',
  success: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16865B]',
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
  danger: 'border-[#FECACA] bg-[#FEF2F2] text-[#D64545]',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  icon: Icon,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold whitespace-nowrap shrink-0 ${TONE_MAP[tone]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
