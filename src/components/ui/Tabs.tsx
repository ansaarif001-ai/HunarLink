import React from 'react';
import { scrollAppToTop } from '../../utils/scroll';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  ariaLabel: string;
  fullWidth?: boolean;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  activeKey,
  onChange,
  ariaLabel,
  fullWidth = false,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E3EAF3] bg-[#F1F5F9] p-1 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(item.key);
              scrollAppToTop();
            }}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-4 text-base font-bold whitespace-nowrap transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
              fullWidth ? 'flex-1' : ''
            } ${
              active
                ? 'bg-white text-[#1769E0] shadow-xs'
                : 'text-[#62748A] hover:text-[#102A43]'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
