import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CheckCircle2,
  Info,
  MapPin,
  MessageSquare,
  Play,
  Wallet,
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
import { getLocalizedLocationLabel } from '../i18n';
import { BookingStatus, UserRole } from '../types';
import { formatRelativeTime } from '../utils/id';
import { calculateOurFee, formatPkr } from '../utils/pricing';

export const WorkerBookingsPage: React.FC = () => {
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const worker = activeWorker || state.workers[0];
  const bookings = state.bookings
    .filter((b) => b.workerId === worker.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  const openChat = (customerId: string, jobId: string, jobTitle: string) => {
    const existing = state.conversations.find(
      (c) => c.customerId === customerId && c.workerId === worker.id && c.jobId === jobId
    );
    const convId = existing?.id || `conv_${customerId}_${worker.id}_${jobId}`;
    dispatch({
      type: 'OPEN_OR_CREATE_CONVERSATION',
      conversationId: convId,
      customerId,
      workerId: worker.id,
      jobId,
      jobTitle,
    });
    navigate(`/chat/${convId}`);
  };

  const getTone = (status: BookingStatus) => {
    if (status === 'Completed') return 'success' as const;
    if (status === 'Cancelled') return 'error' as const;
    if (status === 'Confirmed') return 'primary' as const;
    return 'warning' as const;
  };

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/worker')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.backHome')}</span>
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/worker/earnings')}>
            <Wallet className="h-5 w-5" aria-hidden="true" />
            <span>{t('nav.earnings')}</span>
          </Button>
        </div>

        <section className="space-y-3 rounded-2xl border border-[#E3EAF3] bg-white p-6">
          <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
            {t('workerBookings.title')}
          </h1>
          <p className="text-base text-[#62748A]">{t('workerBookings.subtitle')}</p>
          <div className="flex items-start gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5 text-sm font-medium text-[#102A43]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>
              <strong>{t('sendPrice.ourFeeLabel')}: </strong>
              {t('workerBookings.feeExplain')}
            </span>
          </div>
        </section>

        {bookings.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
              <Briefcase className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#102A43]">
              {t('workerBookings.emptyTitle')}
            </h2>
            <p className="mt-2 text-base text-[#62748A]">{t('workerBookings.emptyDesc')}</p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/jobs')}>
                <span>{t('nav.jobsNearMe')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((bk) => {
              const job = state.jobs.find((j) => j.id === bk.jobId);
              const customer = state.customers.find((c) => c.id === bk.customerId);
              const rawTitle = bk.jobTitle || job?.title || t('status.Confirmed Job');
              const jobTitle = isUrdu && job?.titleUr ? job.titleUr : rawTitle;
              const areaText = bk.area || job?.area || '';
              const cityText = bk.city || job?.city || '';
              const feeCalc = calculateOurFee(bk.agreedPricePkr, bk.status === 'Cancelled');
              const customerName = customer ? customer.name : t('common.customer');
              const statusKey = `bookingStatus.${bk.status}` as const;

              return (
                <Card key={bk.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <StatusText label={t(statusKey as never)} tone={getTone(bk.status)} />
                      <h2 className="text-xl font-bold text-[#102A43]">{jobTitle}</h2>
                      <p className="flex flex-wrap items-center gap-2 text-sm text-[#62748A]">
                        <span>
                          {t('workerBookings.customerPrefix', { name: customerName })}
                        </span>
                        {areaText && (
                          <span className="inline-flex items-center gap-1">
                            · <MapPin className="h-3.5 w-3.5 text-[#1769E0]" aria-hidden="true" />
                            {cityText
                              ? getLocalizedLocationLabel(areaText, cityText, SAMPLE_AREAS, lang)
                              : areaText}
                          </span>
                        )}
                      </p>
                    </div>

                    <span className="text-sm text-[#62748A]">
                      {formatRelativeTime(bk.updatedAt, lang)}
                    </span>
                  </div>

                  {/* Agreed price + 5% Our Fee clarity */}
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-[#62748A]">
                        {t('sendPrice.jobValueLabel')}
                      </p>
                      <p className="ltr-num font-mono text-lg font-extrabold text-[#102A43] tabular-nums">
                        {formatPkr(feeCalc.jobValue, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#62748A]">
                        {t('sendPrice.ourFeeLabel')}
                      </p>
                      <p className="ltr-num font-mono text-lg font-extrabold text-[#D99018] tabular-nums">
                        {formatPkr(feeCalc.fee, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#16865B]">
                        {t('sendPrice.youReceiveLabel')}
                      </p>
                      <p className="ltr-num font-mono text-lg font-extrabold text-[#16865B] tabular-nums">
                        {formatPkr(feeCalc.net, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 border-t border-[#E3EAF3] pt-4">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => openChat(bk.customerId, bk.jobId, rawTitle)}
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      <span>{t('workerBookings.openChat')}</span>
                    </Button>

                    {bk.status === 'Confirmed' && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_BOOKING_STATUS',
                            bookingId: bk.id,
                            status: 'Started',
                          })
                        }
                      >
                        <Play className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                        <span>{t('workerBookings.markStarted')}</span>
                      </Button>
                    )}

                    {(bk.status === 'Confirmed' || bk.status === 'Started') && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_BOOKING_STATUS',
                            bookingId: bk.id,
                            status: 'In Progress',
                          })
                        }
                      >
                        <Wrench className="h-4 w-4 text-[#D99018]" aria-hidden="true" />
                        <span>{t('workerBookings.markInProgress')}</span>
                      </Button>
                    )}

                    {(bk.status === 'Confirmed' ||
                      bk.status === 'Started' ||
                      bk.status === 'In Progress') && (
                      <>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_BOOKING_STATUS',
                              bookingId: bk.id,
                              status: 'Completed',
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t('workerBookings.markCompleted')}</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => setCancelBookingId(bk.id)}
                          className="text-[#D64545] hover:bg-[#FEF2F2]"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{t('workerBookings.cancelBooking')}</span>
                        </Button>
                      </>
                    )}

                    {bk.status === 'Completed' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate('/worker/earnings')}
                      >
                        <Banknote className="h-4 w-4" aria-hidden="true" />
                        <span>{t('workerBookings.viewInEarnings')}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(cancelBookingId)}
          onClose={() => setCancelBookingId(null)}
          onConfirm={() => {
            if (cancelBookingId) {
              dispatch({
                type: 'UPDATE_BOOKING_STATUS',
                bookingId: cancelBookingId,
                status: 'Cancelled',
              });
            }
          }}
          title={t('workerBookings.cancelConfirmTitle')}
          message={t('workerBookings.cancelConfirmMsg')}
          confirmLabel={t('workerBookings.cancelConfirmYes')}
          cancelLabel={t('workerBookings.keepJob')}
          tone="danger"
        />
      </div>
    </RoleGuard>
  );
};
