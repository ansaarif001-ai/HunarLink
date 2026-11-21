import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { INPUT_LIMITS } from '../utils/validation';
import { Button } from './ui/Button';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
}) => {
  const { t } = useTranslation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex flex-col gap-3 sm:flex-row"
      role="search"
    >
      <div className="relative flex-1">
        <label htmlFor="hunarlink-search" className="sr-only">
          {t('custHome.searchPlaceholder')}
        </label>
        <Search
          className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#62748A]"
          aria-hidden="true"
        />
        <input
          id="hunarlink-search"
          type="search"
          value={value}
          maxLength={INPUT_LIMITS.SEARCH_MAX}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t('custHome.searchPlaceholder')}
          className="min-h-[52px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white ps-12 pe-12 text-base text-[#172B4D] placeholder:text-[#62748A] focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('app.close')}
            className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#62748A] hover:bg-[#F1F5F9] hover:text-[#172B4D] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg">
        <Search className="h-5 w-5" aria-hidden="true" />
        <span>{t('custHome.searchButton')}</span>
      </Button>
    </form>
  );
};
