import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        'rounded-2xl bg-white border border-[#E3EAF3] shadow-[0_2px_8px_rgba(16,42,67,0.04)]',
        interactive
          ? 'transition-all duration-150 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-[0_8px_20px_rgba(23,105,224,0.08)]'
          : '',
        PADDING_CLASSES[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};
