import React, { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import { useTranslation } from '../../hooks/useTranslation';
import { ConfirmDialog } from './ConfirmDialog';

export const DemoBanner: React.FC = () => {
  const { dispatch, storageError, clearStorageError } = useAppStore();
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
        role="region"
        aria-label={t('app.demoBadge')}
        className="border-b border-[#D2E3FC] bg-[#EFF6FF] px-4 py-2 text-sm text-[#102A43]"
      >
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span className="font-medium">{t('app.demoBanner')}</span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[#1769E0] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('settings.resetBtn')}</span>
          </button>
        </div>

        {storageError && (
          <div className="mx-auto mt-2 flex max-w-[1200px] items-center justify-between gap-3 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#D64545]">
            <span>{storageError}</span>
            <button
              type="button"
              onClick={clearStorageError}
              className="font-semibold underline cursor-pointer shrink-0"
            >
              {t('app.close')}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => dispatch({ type: 'RESET_DEMO_DATA' })}
        title={t('settings.resetConfirmTitle')}
        message={t('settings.resetConfirmMsg')}
        confirmLabel={t('settings.resetConfirmYes')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />
    </>
  );
};
