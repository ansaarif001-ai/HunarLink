import React from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  MapPin,
  Send,
  Users,
  Wrench,
} from 'lucide-react';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { Job, WorkforceType } from '../types';
import { formatRelativeTime } from '../utils/id';
import { getJobEffectivePrice } from '../utils/matching';
import { formatPkr } from '../utils/pricing';
import { Button } from './ui/Button';

export interface WorkerJobCardProps {
  job: Job;
  workforceLabel?: string;
  whySeeingReason?: string;
  availabilityNote?: string;
}

export const WorkerJobCard: React.FC<WorkerJobCardProps> = React.memo(({
  job,
  workforceLabel,
  whySeeingReason,
  availabilityNote,
}) => {
  const { state } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const category = state.categories.find((c) => c.id === job.categoryId);
  const effectivePrice = getJobEffectivePrice(job);
  const pricesReceivedCount = state.offers.filter(
    (o) => o.jobId === job.id && o.status !== 'withdrawn'
  ).length;

  const workforceChipMap: Record<WorkforceType, string> = {
    one: t('workforce.one'),
    several: t('workforce.several'),
    team: t('workforce.team'),
    contractor: t('workforce.contractor'),
    either: t('workforce.either'),
  };

  const urgencyKey = `urgency.${job.urgency || job.howSoon}` as const;
  const displayTitle = isUrdu && job.titleUr ? job.titleUr : job.title;
  const displayArea = getLocalizedLocationLabel(job.area, job.city, SAMPLE_AREAS, lang);

  return (
    <article className="flex flex-col justify-between rounded-xl border border-[#E3EAF3] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,67,0.04)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#62748A]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1769E0]">
            <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {getLocalizedCategoryName(category, lang)}
              {job.requiredSkill ? ` · ${job.requiredSkill}` : ''}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formatRelativeTime(job.createdAt, lang)}</span>
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#102A43]">{displayTitle}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[#D2E3FC] bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1769E0]">
            {workforceChipMap[job.workforceType]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-[#E3EAF3] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#102A43]">
            <Calendar className="h-3.5 w-3.5 text-[#1769E0]" aria-hidden="true" />
            <span>{t(urgencyKey as never)}</span>
          </span>
          <span className="text-xs font-semibold text-[#62748A] tabular-nums">
            {t('myReq.offersCount', { n: pricesReceivedCount })}
          </span>
        </div>

        {whySeeingReason && (
          <div className="flex items-start gap-2 rounded-lg border border-[#E3EAF3] bg-[#F8FAFC] px-3 py-2 text-xs text-[#486581]">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>
              <strong className="text-[#102A43]">{t('workerJobs.whySeeingLabel')} </strong>
              {whySeeingReason}
            </span>
          </div>
        )}

        {workforceLabel && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#F0FDF4] px-3 py-2 text-sm font-semibold text-[#16865B]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{workforceLabel}</span>
          </div>
        )}

        {availabilityNote && (
          <div className="flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-sm font-semibold text-[#92400E]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{availabilityNote}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 border-t border-[#E3EAF3] pt-3 text-base text-[#172B4D] sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span className="truncate font-medium">{displayArea}</span>
          </div>

          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 shrink-0 text-[#16865B]" aria-hidden="true" />
            <span className="ltr-num font-mono text-sm font-bold text-[#102A43] tabular-nums">
              {effectivePrice > 0 ? formatPkr(effectivePrice, lang) : t('common.openPrice')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span className="text-sm font-semibold tabular-nums">
              {job.workersNeeded === 1
                ? t('common.workerCountOne')
                : t('common.workerCountMany', { n: job.workersNeeded })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-[#E3EAF3] pt-4 sm:grid-cols-2">
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={() => navigate(`/worker/jobs/${job.id}`)}
        >
          <Eye className="h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
          <span>{t('workerJobs.viewJob')}</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => navigate(`/worker/send-price/${job.id}`)}
        >
          <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{t('workerJobs.sendPrice')}</span>
        </Button>
      </div>
    </article>
  );
});

WorkerJobCard.displayName = 'WorkerJobCard';
