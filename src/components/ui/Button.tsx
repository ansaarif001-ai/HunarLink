import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'dangerOutline'
  | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1769E0] text-white hover:bg-[#1357BD] border border-transparent shadow-[0_2px_6px_rgba(23,105,224,0.2)]',
  secondary:
    'bg-[#EFF6FF] text-[#1769E0] hover:bg-[#DCEBFF] border border-[#BFDBFE]',
  outline:
    'bg-white text-[#172B4D] hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#94A3B8]',
  ghost:
    'bg-transparent text-[#62748A] hover:text-[#172B4D] hover:bg-[#F1F5F9] border border-transparent',
  danger:
    'bg-[#D64545] text-white hover:bg-[#B93838] border border-transparent shadow-xs',
  dangerOutline:
    'bg-white text-[#D64545] hover:bg-[#FEF2F2] border-2 border-[#FCA5A5] hover:border-[#D64545]',
  success:
    'bg-[#16865B] text-white hover:bg-[#126F4B] border border-transparent shadow-xs',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[48px] px-4 py-2 text-sm',
  md: 'min-h-[48px] px-5 py-2.5 text-base',
  lg: 'min-h-[54px] px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap shrink-0',
        'transition-all duration-150 cursor-pointer active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
};
