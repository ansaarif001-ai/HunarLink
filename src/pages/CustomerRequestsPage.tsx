import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Banknote,
  Clock,
  Eye,
  FileText,
  MapPin,
  PlusCircle,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusText } from '../components/ui/StatusBadge';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { JobStatus, UserRole } from '../types';
import { formatRelativeTime } from '../utils/id';
import { getJobEffectivePrice } from '../utils/matching';
import { formatPkr } from '../utils/pricing';

type RequestsTab = 'open' | 'done' | 'cancelled';

const OPEN_STATUSES = new Set<JobStatus>([
  'Published',
  'Offers Received',
  'Price Talk',
  'Worker Chosen',
  'Confirmed Job',
  'Work Started',
  'In Progress',
]);

const STATUS_KEY: Record<JobStatus, `status.${JobStatus}`> = {
  Published: 'status.Published',
  'Offers Received': 'status.Offers Received',
  'Price Talk': 'status.Price Talk',
  'Worker Chosen': 'status.Worker Chosen',
  'Confirmed Job': 'status.Confirmed Job',
  'Work Started': 'status.Work Started',
  'In Progress': 'status.In Progress',
  Completed: 'status.Completed',
  Cancelled: 'status.Cancelled',
};

export const CustomerRequestsPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<RequestsTab>('open');
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const myJobs = useMemo(() => {
    return state.jobs
      .filter((j) => j.customerId === state.activeCustomerId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.jobs, state.activeCustomerId]);

  const openJobs = myJobs.filter((j) => OPEN_STATUSES.has(j.status));
  const doneJobs = myJobs.filter((j) => j.status === 'Completed');
  const cancelledJobs = myJobs.filter((j) => j.status === 'Cancelled');

  const activeList = tab === 'open' ? openJobs : tab === 'done' ? doneJobs : cancelledJobs;

  const getStatusTone = (status: JobStatus) => {
    if (status === 'Cancelled') return 'error' as const;
    if (status === 'Completed' || status === 'Confirmed Job') return 'success' as const;
    return 'primary' as const;
  };

  return (
    <RoleGuard allowedRole={UserRole.Customer}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#E3EAF3] bg-white p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('myReq.title')}
              </h1>
              <p className="mt-1 text-base text-[#62748A]">{t('myReq.subtitle')}</p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/post-request')}
              className="min-h-[52px]"
            >
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
              <span>{t('myReq.newBtn')}</span>
            </Button>
          </div>

          <div
            role="tablist"
            aria-label={t('myReq.title')}
            className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-[#F1F5F9] p-1.5 sm:inline-grid sm:w-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'open'}
              onClick={() => setTab('open')}
              className={`min-h-[48px] rounded-lg px-4 text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'open'
                  ? 'bg-white text-[#1769E0] shadow-xs'
                  : 'text-[#62748A] hover:text-[#102A43]'
              }`}
            >
              {t('myReq.tabOpen', { n: openJobs.length })}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'done'}
              onClick={() => setTab('done')}
              className={`min-h-[48px] rounded-lg px-4 text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'done'
                  ? 'bg-white text-[#1769E0] shadow-xs'
                  : 'text-[#62748A] hover:text-[#102A43]'
              }`}
            >
              {t('myReq.tabDone', { n: doneJobs.length })}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'cancelled'}
              onClick={() => setTab('cancelled')}
              className={`min-h-[48px] rounded-lg px-4 text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'cancelled'
                  ? 'bg-white text-[#1769E0] shadow-xs'
                  : 'text-[#62748A] hover:text-[#102A43]'
              }`}
            >
              {t('myReq.tabCancelled', { n: cancelledJobs.length })}
            </button>
          </div>
        </section>

        {activeList.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#102A43]">
              {tab === 'open'
                ? t('myReq.emptyTitle')
                : tab === 'done'
                  ? t('myReq.emptyDone')
                  : t('myReq.emptyCancelled')}
            </h2>
            <p className="mt-2 text-base text-[#62748A]">
              {tab === 'open' ? t('myReq.emptyDesc') : t('myReq.emptyOtherDesc')}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/post-request')}>
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
                <span>{t('myReq.newBtn')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeList.map((job) => {
              const cat = state.categories.find((c) => c.id === job.categoryId);
              const price = getJobEffectivePrice(job);
              const offersCount = state.offers.filter(
                (o) => o.jobId === job.id && o.status !== 'withdrawn'
              ).length;
              const booking = state.bookings.find((b) => b.jobId === job.id);
              const needsReview =
                booking &&
                booking.status === 'Completed' &&
                !state.reviews.some((r) => r.bookingId === booking.id);
              const displayTitle = isUrdu && job.titleUr ? job.titleUr : job.title;

              return (
                <Card key={job.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusText
                          label={t(STATUS_KEY[job.status])}
                          tone={getStatusTone(job.status)}
                          className="text-sm"
                        />
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1769E0]">
                          <Wrench className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {cat ? getLocalizedCategoryName(cat, lang) : t('nav.myWork')}
                          </span>
                        </span>
                        {needsReview && (
                          <span className="rounded-lg bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-bold text-[#1769E0]">
                            {t('myReq.rateThisJob')}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-[#102A43]">{displayTitle}</h2>
                    </div>

                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#62748A]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>{formatRelativeTime(job.createdAt, lang)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 border-t border-[#E3EAF3] pt-3 text-base sm:grid-cols-4">
                    <div className="flex items-center gap-2 text-[#172B4D]">
                      <MapPin className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
                      <span className="font-medium">
                        {getLocalizedLocationLabel(job.area, job.city, SAMPLE_AREAS, lang)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono font-bold text-[#102A43] tabular-nums">
                      <Banknote className="h-4 w-4 shrink-0 text-[#16865B]" aria-hidden="true" />
                      <span className="ltr-num">
                        {booking
                          ? t('myReq.agreedSuffix', {
                              price: formatPkr(booking.agreedPricePkr, lang),
                            })
                          : price > 0
                            ? formatPkr(price, lang)
                            : t('common.openPrice')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#172B4D]">
                      <Users className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
                      <span className="font-semibold">
                        {job.workersNeeded === 1
                          ? t('common.workerCountOne')
                          : t('common.workerCountMany', { n: job.workersNeeded })}
                      </span>
                    </div>

                    <div className="font-semibold text-[#62748A]">
                      {booking
                        ? t('myReq.customerNoFee')
                        : offersCount === 1
                          ? t('myReq.priceReceivedOne')
                          : t('myReq.priceReceivedMany', { n: offersCount })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-[#E3EAF3] pt-4">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate(`/my-requests/${job.id}`)}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {needsReview ? t('myReq.rateThisJob') : t('myReq.viewJob')}
                      </span>
                    </Button>

                    {OPEN_STATUSES.has(job.status) && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setCancelTargetId(job.id)}
                        className="text-[#D64545] hover:bg-[#FEF2F2]"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>{t('jobDetail.cancelBtn')}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(cancelTargetId)}
          onClose={() => setCancelTargetId(null)}
          onConfirm={() => {
            if (cancelTargetId) {
              dispatch({ type: 'CANCEL_JOB', jobId: cancelTargetId });
            }
          }}
          title={t('jobDetail.cancelConfirmTitle')}
          message={t('jobDetail.cancelConfirmMsg')}
          confirmLabel={t('jobDetail.cancelConfirmYes')}
          cancelLabel={t('myReq.keepRequest')}
          tone="danger"
        />
      </div>
    </RoleGuard>
  );
};
