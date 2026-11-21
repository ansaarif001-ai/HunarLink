import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${SIZE_MAP[size]} ${radiusClass} shrink-0 border-2 border-[#D2E3FC] bg-white object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${SIZE_MAP[size]} ${radiusClass} flex shrink-0 items-center justify-center border-2 border-[#BFDBFE] bg-[#EFF6FF] font-display font-bold text-[#1769E0] ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
