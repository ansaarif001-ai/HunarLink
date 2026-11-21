import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-[#102A43]">{title}</h2>
      <p className="mt-2 max-w-md text-base text-[#62748A]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
};
