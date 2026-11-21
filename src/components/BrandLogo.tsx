import React from 'react';
import { Hammer, Link2 } from 'lucide-react';

export const BrandLogo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <span
        className={`relative flex items-center justify-center rounded-xl bg-[#1769E0] text-white ${
          size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'
        }`}
        aria-hidden="true"
      >
        <Hammer className="h-4 w-4 -translate-x-0.5 -translate-y-0.5" />
        <Link2 className="h-3.5 w-3.5 translate-x-1 translate-y-1 text-[#DBEAFE]" />
      </span>
      <span
        className={`font-display font-bold tracking-tight text-[#102A43] ${
          size === 'sm' ? 'text-lg' : 'text-xl'
        }`}
      >
        HunarLink
      </span>
    </span>
  );
};
