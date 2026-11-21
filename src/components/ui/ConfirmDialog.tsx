import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
}) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            tone === 'danger' ? 'bg-[#FEF2F2] text-[#D64545]' : 'bg-[#EFF6FF] text-[#1769E0]'
          }`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-[#62748A]">{message}</p>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel || t('app.cancel')}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel || t('app.confirm')}
        </Button>
      </div>
    </Modal>
  );
};
