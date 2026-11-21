import React, { useState } from 'react';
import { CheckCircle2, Flag } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { ContentReport } from '../types';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export interface ReportUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateId: string;
  targetType?: ContentReport['targetType'];
  targetLabel?: string;
  workerId: string;
  workerName: string;
}

export const ReportUpdateModal: React.FC<ReportUpdateModalProps> = ({
  isOpen,
  onClose,
  updateId,
  targetType = 'work_update',
  targetLabel,
  workerId,
}) => {
  const { dispatch } = useAppStore();
  const { t } = useTranslation();

  const reasons = [
    t('reportReason.personalInfo'),
    t('reportReason.wrongWork'),
    t('reportReason.rude'),
    t('reportReason.other'),
  ];

  const [reason, setReason] = useState<string>(reasons[0]);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setSubmitted(false);
    setNote('');
    setReason(reasons[0]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_CONTENT_REPORT',
      targetType,
      targetId: updateId,
      workerId,
      reason: reason || reasons[0],
      note: sanitizeText(note, INPUT_LIMITS.REPORT_NOTE_MAX),
    });
    setSubmitted(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={targetLabel || t('report.title')}
      maxWidthClass="max-w-md"
    >
      {submitted ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16865B]">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold text-[#102A43]">{t('report.thanks')}</p>
          <div className="pt-2">
            <Button variant="primary" size="md" fullWidth onClick={handleClose}>
              <span>{t('app.done')}</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-base font-bold text-[#102A43]">
              {t('report.reasonLabel')}
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl border-2 px-3.5 py-2 text-base cursor-pointer ${
                    reason === r
                      ? 'border-[#1769E0] bg-[#EFF6FF] font-semibold text-[#102A43]'
                      : 'border-[#E3EAF3] bg-white text-[#172B4D]'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 accent-[#1769E0]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="report-note" className="text-base font-bold text-[#102A43]">
                {t('report.noteLabel')}
              </label>
              <span className="text-xs text-[#62748A] tabular-nums">
                {note.length}/{INPUT_LIMITS.REPORT_NOTE_MAX}
              </span>
            </div>
            <textarea
              id="report-note"
              rows={3}
              value={note}
              maxLength={INPUT_LIMITS.REPORT_NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('report.notePlaceholder')}
              className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="md" onClick={handleClose}>
              <span>{t('app.cancel')}</span>
            </Button>
            <Button type="submit" variant="danger" size="md">
              <Flag className="h-4 w-4" aria-hidden="true" />
              <span>{t('report.submit')}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
