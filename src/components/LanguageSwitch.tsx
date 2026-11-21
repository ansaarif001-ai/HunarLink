import React from 'react';
import { Languages } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

export const LanguageSwitch: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { dispatch } = useAppStore();
  const { isUrdu, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('app.languageSwitchAria')}
      className="inline-flex items-center rounded-xl border border-[#E3EAF3] bg-white p-1 shrink-0"
    >
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'en' })}
        aria-pressed={!isUrdu}
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
          compact ? 'min-h-[34px] px-2 text-xs lg:min-h-[38px] lg:px-3 lg:text-sm' : 'min-h-[38px] px-3 text-sm'
        } ${
          !isUrdu
            ? 'bg-[#1769E0] text-white'
            : 'text-[#62748A] hover:text-[#172B4D]'
        }`}
      >
        {!compact && <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span>English</span>
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_LANGUAGE', language: 'ur' })}
        aria-pressed={isUrdu}
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
          compact ? 'min-h-[34px] px-2 text-xs lg:min-h-[38px] lg:px-3 lg:text-sm' : 'min-h-[38px] px-3 text-sm'
        } ${
          isUrdu
            ? 'bg-[#1769E0] text-white'
            : 'text-[#62748A] hover:text-[#172B4D]'
        }`}
      >
        <span>اردو</span>
      </button>
    </div>
  );
};
