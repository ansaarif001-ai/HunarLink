import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

export interface StatusTextProps {
  label: string;
  tone?: StatusTone;
  showIcon?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'text-[#62748A]',
  primary: 'text-[#1769E0]',
  success: 'text-[#16865B]',
  warning: 'text-[#D99018]',
  error: 'text-[#D64545]',
};

const TONE_ICONS: Record<StatusTone, React.ComponentType<{ className?: string }>> = {
  neutral: Info,
  primary: Clock,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export const StatusText: React.FC<StatusTextProps> = ({
  label,
  tone = 'neutral',
  showIcon = true,
  className = '',
}) => {
  const Icon = TONE_ICONS[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${TONE_CLASSES[tone]} ${className}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};

export const DemoVerifiedLabel: React.FC<{ verified: boolean }> = ({ verified }) => {
  const { t } = useTranslation();
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16865B] whitespace-nowrap shrink-0">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {t('common.checked')} ({t('common.demo')})
      </span>
    </span>
  );
};
