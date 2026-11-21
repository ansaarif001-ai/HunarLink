import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Tag,
  Trash2,
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
import { UserRole } from '../types';
import { formatTimeLeft } from '../utils/expiry';
import { formatRelativeTime } from '../utils/id';
import {
  evaluateOfferActions,
  getOfferNegotiationsChronological,
} from '../utils/negotiations';
import { calculateOurFee, formatPkr } from '../utils/pricing';
import { INPUT_LIMITS } from '../utils/validation';

export const WorkerPricesPage: React.FC = () => {
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const worker = activeWorker || state.workers[0];
  const myOffers = state.offers
    .filter((o) => o.workerId === worker.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(2000);
  const [counterError, setCounterError] = useState('');
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);

  const openChatForOffer = (customerId: string, jobId: string, jobTitle: string) => {
    const existing = state.conversations.find(
      (c) => c.customerId === customerId && c.workerId === worker.id && c.jobId === jobId
    );
    const targetId = existing?.id || `conv_${customerId}_${worker.id}_${jobId}`;
    dispatch({
      type: 'OPEN_OR_CREATE_CONVERSATION',
      conversationId: targetId,
      customerId,
      workerId: worker.id,
      jobId,
      jobTitle,
    });
    navigate(`/chat/${targetId}`);
  };

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/worker')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.backHome')}</span>
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/worker/bookings')}>
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>{t('workerBookings.title')}</span>
          </Button>
        </div>

        <section className="rounded-2xl border border-[#E3EAF3] bg-white p-6">
          <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
            {t('workerPrices.title')}
          </h1>
          <p className="mt-1 text-base text-[#62748A]">{t('workerPrices.subtitle')}</p>
        </section>

        {myOffers.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
              <Tag className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#102A43]">
              {t('workerPrices.emptyTitle')}
            </h2>
            <p className="mt-2 text-base text-[#62748A]">{t('workerPrices.emptyDesc')}</p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/jobs')}>
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                <span>{t('workerPrices.browseJobs')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const job = state.jobs.find((j) => j.id === offer.jobId);
              const customer = job
                ? state.customers.find((c) => c.id === job.customerId)
                : undefined;
              const hasConfirmedBooking = Boolean(
                job &&
                  state.bookings.some(
                    (b) => b.jobId === job.id && b.status !== 'Cancelled'
                  )
              );
              const evalOffer = evaluateOfferActions(
                offer,
                job,
                state.negotiations,
                state.activeRole,
                worker.id,
                hasConfirmedBooking
              );
              const negHistory = getOfferNegotiationsChronological(
                state.negotiations,
                offer.id
              );
              const feeCalc = calculateOurFee(offer.pricePkr);

              const statusLabel =
                offer.status === 'accepted'
                  ? t('status.Confirmed Job')
                  : offer.status === 'withdrawn'
                    ? t('offerStatus.withdrawn')
                    : evalOffer.isClosedAfterAward
                      ? t('offerStatus.closed')
                      : offer.status === 'declined'
                        ? t('offerStatus.declined')
                        : evalOffer.isExpired
                          ? t('offerStatus.expired')
                          : offer.status === 'price_talk'
                            ? t('status.Price Talk')
                            : t('workerPrices.waitingCustomer');

              const statusTone =
                offer.status === 'accepted'
                  ? 'success'
                  : offer.status === 'declined' || offer.status === 'withdrawn'
                    ? 'error'
                    : evalOffer.isExpired
                      ? 'warning'
                      : evalOffer.isClosedAfterAward
                        ? 'neutral'
                        : 'primary';

              const jobDisplayTitle = job
                ? isUrdu && job.titleUr
                  ? job.titleUr
                  : job.title
                : t('common.customer');
              const customerName = customer ? customer.name : t('common.customer');

              return (
                <Card key={offer.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusText label={statusLabel} tone={statusTone} />
                        {!evalOffer.isExpired &&
                          (offer.status === 'pending' || offer.status === 'price_talk') && (
                            <span className="text-xs font-semibold text-[#62748A]">
                              · {formatTimeLeft(offer.expiresAt, lang)}
                            </span>
                          )}
                      </div>
                      <h2 className="text-xl font-bold text-[#102A43]">{jobDisplayTitle}</h2>
                      <p className="text-sm text-[#62748A]">
                        {customerName}
                        {job
                          ? ` · ${getLocalizedLocationLabel(
                              job.area,
                              job.city,
                              SAMPLE_AREAS,
                              lang
                            )}`
                          : ''}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="ltr-num font-mono text-2xl font-extrabold text-[#102A43] tabular-nums">
                        {formatPkr(offer.pricePkr, lang)}
                      </p>
                      <p className="text-xs font-semibold text-[#16865B]">
                        {t('workerPrices.youReceiveLine', {
                          net: formatPkr(feeCalc.net, lang),
                        })}
                      </p>
                    </div>
                  </div>

                  {offer.note && (
                    <p className="rounded-xl bg-[#F8FAFC] p-3 text-base text-[#172B4D]">
                      {offer.note}
                    </p>
                  )}

                  {negHistory.length > 0 && (
                    <div className="space-y-1.5 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3">
                      <p className="text-xs font-bold text-[#102A43]">
                        {t('jobDetail.priceTalkHistory')}
                      </p>
                      <ul className="space-y-1 text-sm text-[#486581]">
                        {negHistory.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <span className="font-semibold text-[#102A43]">
                              {item.byRole === 'customer'
                                ? customerName
                                : item.byName}
                            </span>
                            <span className="ltr-num font-mono font-bold text-[#1769E0]">
                              {formatPkr(item.pricePkr, lang)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!evalOffer.isExpired &&
                    (offer.status === 'pending' || offer.status === 'price_talk') && (
                      <p className="text-sm font-semibold text-[#62748A]">
                        {evalOffer.maxRoundsReached
                          ? t('jobDetail.maxRoundsNote')
                          : evalOffer.expectedTurn === 'worker'
                            ? t('workerPrices.yourTurnNote')
                            : t('workerPrices.waitingCustomerTurn')}
                      </p>
                    )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3EAF3] pt-3">
                    <span className="inline-flex items-center gap-1 text-sm text-[#62748A]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {t('workerPrices.updatedTime', {
                          time: formatRelativeTime(offer.updatedAt, lang),
                        })}
                      </span>
                    </span>

                    <div className="flex flex-wrap gap-2.5">
                      {job && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => openChatForOffer(job.customerId, job.id, job.title)}
                        >
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          <span>{t('nav.chat')}</span>
                        </Button>
                      )}

                      {evalOffer.canCounter && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => {
                            setCounterOfferId(counterOfferId === offer.id ? null : offer.id);
                            setCounterPrice(offer.pricePkr);
                            setCounterError('');
                          }}
                        >
                          <Banknote className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                          <span>{t('workerPrices.newPriceBtn')}</span>
                        </Button>
                      )}

                      {evalOffer.canWithdraw && (
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => setWithdrawTargetId(offer.id)}
                          className="text-[#D64545]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t('workerPrices.withdrawBtn')}</span>
                        </Button>
                      )}

                      {offer.status === 'accepted' && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => navigate('/worker/bookings')}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t('workerPrices.goConfirmedBtn')}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {counterOfferId === offer.id && evalOffer.canCounter && (
                    <div className="space-y-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                      <label
                        htmlFor={`wp-counter-${offer.id}`}
                        className="block text-base font-bold text-[#102A43]"
                      >
                        {t('workerPrices.newPriceInputLabel')}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <input
                          id={`wp-counter-${offer.id}`}
                          type="number"
                          min={INPUT_LIMITS.MIN_PKR}
                          max={INPUT_LIMITS.MAX_PKR}
                          step={100}
                          value={counterPrice || ''}
                          onChange={(e) => {
                            setCounterPrice(Number(e.target.value));
                            setCounterError('');
                          }}
                          className="ltr-num min-h-[48px] flex-1 rounded-xl border-2 border-[#CBD5E1] bg-white px-4 font-mono text-lg font-bold text-[#102A43]"
                        />
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => {
                            if (
                              !Number.isFinite(counterPrice) ||
                              counterPrice < INPUT_LIMITS.MIN_PKR ||
                              counterPrice > INPUT_LIMITS.MAX_PKR
                            ) {
                              setCounterError(
                                t('jobDetail.errPriceRange', {
                                  min: formatPkr(INPUT_LIMITS.MIN_PKR, lang),
                                  max: formatPkr(INPUT_LIMITS.MAX_PKR, lang),
                                })
                              );
                              return;
                            }
                            dispatch({
                              type: 'COUNTER_OFFER',
                              offerId: offer.id,
                              pricePkr: counterPrice,
                            });
                            setCounterOfferId(null);
                            setCounterError('');
                          }}
                        >
                          <Send className="h-4 w-4" aria-hidden="true" />
                          <span>{t('jobDetail.send')}</span>
                        </Button>
                      </div>
                      {counterError && (
                        <p role="alert" className="text-sm font-semibold text-[#D64545]">
                          {counterError}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(withdrawTargetId)}
          onClose={() => setWithdrawTargetId(null)}
          onConfirm={() => {
            if (withdrawTargetId) {
              dispatch({ type: 'WITHDRAW_OFFER', offerId: withdrawTargetId });
            }
          }}
          title={t('workerPrices.withdrawConfirmTitle')}
          message={t('workerPrices.withdrawConfirmMsg')}
          confirmLabel={t('workerPrices.withdrawConfirmYes')}
          cancelLabel={t('app.cancel')}
          tone="danger"
        />
      </div>
    </RoleGuard>
  );
};
