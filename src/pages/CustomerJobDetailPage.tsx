import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  ThumbsUp,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { PhotoTile } from '../components/PhotoTile';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusBadge';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { BookingStatus, JobStatus, PhotoMedia, UserRole } from '../types';
import { formatTimeLeft } from '../utils/expiry';
import { formatRelativeTime } from '../utils/id';
import { getJobEffectivePrice } from '../utils/matching';
import {
  evaluateOfferActions,
  getOfferNegotiationsChronological,
} from '../utils/negotiations';
import { formatPkr } from '../utils/pricing';
import { REVIEW_TAGS, canCustomerReviewBooking, getLocalizedReviewTag } from '../utils/reviews';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

const PROGRESS_LINE: JobStatus[] = [
  'Published',
  'Offers Received',
  'Price Talk',
  'Worker Chosen',
  'Confirmed Job',
  'Work Started',
  'In Progress',
  'Completed',
  'Cancelled',
];

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

const BOOKING_STATUS_KEY: Record<BookingStatus, `bookingStatus.${BookingStatus}`> = {
  Confirmed: 'bookingStatus.Confirmed',
  Started: 'bookingStatus.Started',
  'In Progress': 'bookingStatus.In Progress',
  Completed: 'bookingStatus.Completed',
  Cancelled: 'bookingStatus.Cancelled',
};

export const CustomerJobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [lightbox, setLightbox] = useState<PhotoMedia | null>(null);
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(2000);
  const [counterError, setCounterError] = useState('');

  const [stars, setStars] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewError, setReviewError] = useState('');

  const job = state.jobs.find(
    (j) => j.id === jobId && j.customerId === state.activeCustomerId
  );
  const category = job ? state.categories.find((c) => c.id === job.categoryId) : undefined;

  if (!job) {
    return (
      <RoleGuard allowedRole={UserRole.Customer}>
        <div className="mx-auto max-w-xl py-8">
          <Card className="space-y-4 py-10 text-center">
            <h1 className="text-2xl font-bold text-[#102A43]">
              {t('jobDetail.notFoundTitle')}
            </h1>
            <p className="text-base text-[#62748A]">{t('jobDetail.notFoundDesc')}</p>
            <div className="flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/my-requests')}>
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                <span>{t('jobDetail.back')}</span>
              </Button>
            </div>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const jobOffers = state.offers
    .filter((o) => o.jobId === job.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const activeBooking = state.bookings.find(
    (b) => b.jobId === job.id && b.status !== 'Cancelled'
  );
  const booking = activeBooking || state.bookings.find((b) => b.jobId === job.id);
  const bookedWorker = booking
    ? state.workers.find((w) => w.id === booking.workerId)
    : undefined;

  const existingReview = booking
    ? state.reviews.find((r) => r.bookingId === booking.id)
    : undefined;

  const reviewCheck = canCustomerReviewBooking(
    booking,
    state.activeCustomerId,
    state.activeRole,
    state.reviews
  );

  const price = getJobEffectivePrice(job);
  const currentStepIdx = PROGRESS_LINE.indexOf(job.status);
  const displayTitle = isUrdu && job.titleUr ? job.titleUr : job.title;
  const displayDesc = isUrdu && job.descriptionUr ? job.descriptionUr : job.description;
  const bookedWorkerName = bookedWorker
    ? isUrdu
      ? bookedWorker.nameUr
      : bookedWorker.name
    : t('common.worker');

  const openChatWithWorker = (workerId: string) => {
    const existing = state.conversations.find(
      (c) =>
        c.customerId === state.activeCustomerId &&
        c.workerId === workerId &&
        c.jobId === job.id
    );
    const convId = existing?.id || `conv_${state.activeCustomerId}_${workerId}_${job.id}`;
    dispatch({
      type: 'OPEN_OR_CREATE_CONVERSATION',
      conversationId: convId,
      customerId: state.activeCustomerId,
      workerId,
      jobId: job.id,
      jobTitle: job.title,
    });
    navigate(`/chat/${convId}`);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!booking) return;
    if (stars < 1 || stars > 5) {
      setReviewError(t('jobDetail.rateStarsError'));
      return;
    }
    dispatch({
      type: 'SUBMIT_REVIEW',
      bookingId: booking.id,
      stars,
      text: sanitizeText(reviewText, INPUT_LIMITS.REVIEW_MAX),
      tags: selectedTags,
    });
  };

  const urgencyLabel =
    job.urgency === 'Today'
      ? t('urgency.Today')
      : job.urgency === 'This week'
        ? t('urgency.This week')
        : job.urgency === 'Flexible'
          ? t('urgency.Flexible')
          : t('urgency.Anytime');

  const workforceLabel =
    job.workforceType === 'one'
      ? t('workforce.one')
      : job.workforceType === 'several'
        ? t('workforce.several')
        : job.workforceType === 'team'
          ? t('workforce.team')
          : job.workforceType === 'contractor'
            ? t('workforce.contractor')
            : t('workforce.either');

  return (
    <RoleGuard allowedRole={UserRole.Customer}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Button variant="outline" size="md" onClick={() => navigate('/my-requests')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('jobDetail.back')}</span>
          </Button>
        </div>

        <Card className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusText
                  label={t(STATUS_KEY[job.status])}
                  tone={
                    job.status === 'Cancelled'
                      ? 'error'
                      : job.status === 'Completed' || job.status === 'Confirmed Job'
                        ? 'success'
                        : 'primary'
                  }
                  className="text-sm"
                />
                <span className="inline-flex items-center gap-1.5 text-base font-semibold text-[#1769E0]">
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {category ? getLocalizedCategoryName(category, lang) : t('nav.myWork')}
                  </span>
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {displayTitle}
              </h1>
            </div>

            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#62748A]">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>
                {t('jobDetail.posted', { time: formatRelativeTime(job.createdAt, lang) })}
              </span>
            </span>
          </div>

          {/* 9-Status Progress Line */}
          <div className="space-y-2 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4">
            <p className="text-sm font-bold text-[#102A43]">{t('jobDetail.requestStatus')}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PROGRESS_LINE.map((st, idx) => {
                const isActive = st === job.status;
                const isDone =
                  job.status !== 'Cancelled' &&
                  st !== 'Cancelled' &&
                  currentStepIdx > idx;
                return (
                  <div
                    key={st}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold ${
                      isActive
                        ? st === 'Cancelled'
                          ? 'border-[#FECACA] bg-[#FEF2F2] text-[#D64545]'
                          : 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                        : isDone
                          ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16865B]'
                          : 'border-[#E3EAF3] bg-white text-[#62748A]'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t(STATUS_KEY[st])}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmed Job Summary */}
          {booking && (
            <div className="space-y-4 rounded-2xl border-2 border-[#BBF7D0] bg-[#F0FDF4] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#16865B]">
                    {t('jobDetail.confirmedCardTitle')} ({t(BOOKING_STATUS_KEY[booking.status])})
                  </p>
                  <h2 className="text-xl font-extrabold text-[#102A43]">{bookedWorkerName}</h2>
                </div>

                <div className="text-end">
                  <p className="text-xs font-semibold text-[#62748A]">
                    {t('jobDetail.agreedPrice')}
                  </p>
                  <p className="font-mono text-2xl font-extrabold text-[#102A43] tabular-nums ltr-num">
                    {formatPkr(booking.agreedPricePkr, lang)}
                  </p>
                  <p className="text-sm font-bold text-[#16865B]">
                    {t('myReq.customerNoFee')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {bookedWorker && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => openChatWithWorker(bookedWorker.id)}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>{t('jobDetail.chatWithWorker', { name: bookedWorkerName })}</span>
                  </Button>
                )}
                {bookedWorker && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate(`/workers/${bookedWorker.id}`)}
                  >
                    <span>{t('jobDetail.viewWorkerProfile')}</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* RATE THIS JOB CARD */}
          {booking && booking.status === 'Completed' && (
            <div
              id="rate-this-job"
              className="space-y-4 rounded-2xl border-2 border-[#D2E3FC] bg-[#EFF6FF] p-5"
            >
              {existingReview ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-[#16865B]">
                    <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <h2 className="text-xl font-extrabold text-[#102A43]">
                      {t('jobDetail.reviewSaved')}
                    </h2>
                  </div>
                  <div className="space-y-2 rounded-xl border border-[#E3EAF3] bg-white p-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-5 w-5 ${
                            n <= existingReview.stars
                              ? 'fill-[#D99018] text-[#D99018]'
                              : 'text-[#CBD5E1]'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ms-2 text-base font-bold text-[#102A43] ltr-num">
                        {existingReview.stars} / 5
                      </span>
                    </div>
                    {existingReview.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {existingReview.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-sm font-semibold text-[#1769E0]"
                          >
                            {getLocalizedReviewTag(tag, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                    {existingReview.text && (
                      <p className="text-base text-[#172B4D]">{existingReview.text}</p>
                    )}
                  </div>
                </div>
              ) : reviewCheck.allowed ? (
                <form onSubmit={handleSendReview} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#102A43]">
                      {t('jobDetail.rateTitle')}
                    </h2>
                    <p className="mt-1 text-base text-[#62748A]">
                      {t('jobDetail.rateDesc', { name: bookedWorkerName })}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-[#102A43]">
                      {t('jobDetail.rateTapStars')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={t('jobDetail.rateOutOf5', { n })}
                          onClick={() => {
                            setStars(n);
                            setReviewError('');
                          }}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-colors cursor-pointer ${
                            n <= stars
                              ? 'border-[#D99018] bg-[#FFFBEB]'
                              : 'border-[#CBD5E1] bg-white hover:border-[#D99018]'
                          }`}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              n <= stars
                                ? 'fill-[#D99018] text-[#D99018]'
                                : 'text-[#94A3B8]'
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                      {stars > 0 && (
                        <span className="ms-2 text-base font-bold text-[#102A43] ltr-num">
                          {stars} / 5
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-[#102A43]">
                      {t('jobDetail.rateQuickTags')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REVIEW_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`min-h-[48px] rounded-xl border-2 px-3.5 text-sm font-bold transition-colors cursor-pointer ${
                              active
                                ? 'border-[#1769E0] bg-[#1769E0] text-white'
                                : 'border-[#CBD5E1] bg-white text-[#102A43] hover:border-[#1769E0]'
                            }`}
                          >
                            {getLocalizedReviewTag(tag, lang)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="job-review-text" className="text-sm font-bold text-[#102A43]">
                        {t('jobDetail.rateShortReview')}
                      </label>
                      <span className="text-xs text-[#62748A] tabular-nums ltr-num">
                        {reviewText.length}/{INPUT_LIMITS.REVIEW_MAX}
                      </span>
                    </div>
                    <textarea
                      id="job-review-text"
                      rows={3}
                      value={reviewText}
                      maxLength={INPUT_LIMITS.REVIEW_MAX}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={t('jobDetail.ratePlaceholder')}
                      className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                    />
                  </div>

                  {reviewError && (
                    <p
                      role="alert"
                      className="rounded-xl bg-[#FEF2F2] px-4 py-2.5 text-base font-semibold text-[#D64545]"
                    >
                      {reviewError}
                    </p>
                  )}

                  <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-[52px]">
                    <ThumbsUp className="h-5 w-5" aria-hidden="true" />
                    <span>{t('jobDetail.sendReview')}</span>
                  </Button>
                </form>
              ) : null}
            </div>
          )}

          {/* Prices Received from Workers */}
          {!booking && job.status !== 'Cancelled' && (
            <div className="space-y-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-[#102A43]">
                  {t('jobDetail.offersTitle', { n: jobOffers.length })}
                </h2>
              </div>

              {jobOffers.length === 0 ? (
                <p className="text-base text-[#62748A]">
                  {t('jobDetail.noOffersDesc', { area: job.area })}
                </p>
              ) : (
                <div className="space-y-3">
                  {jobOffers.map((offer) => {
                    const offerWorker = state.workers.find((w) => w.id === offer.workerId);
                    const evalOffer = evaluateOfferActions(
                      offer,
                      job,
                      state.negotiations,
                      state.activeRole,
                      state.activeCustomerId,
                      Boolean(activeBooking)
                    );
                    const negHistory = getOfferNegotiationsChronological(
                      state.negotiations,
                      offer.id
                    );
                    const offerWorkerName = offerWorker
                      ? isUrdu
                        ? offerWorker.nameUr
                        : offerWorker.name
                      : t('common.worker');

                    const offerStatusLabel =
                      offer.status === 'withdrawn'
                        ? t('offerStatus.withdrawn')
                        : evalOffer.isClosedAfterAward
                          ? t('offerStatus.closed')
                          : offer.status === 'declined'
                            ? t('offerStatus.declined')
                            : evalOffer.isExpired
                              ? t('offerStatus.expired')
                              : offer.status === 'price_talk'
                                ? t('offerStatus.price_talk')
                                : t('jobDetail.priceSentStatus');

                    return (
                      <div
                        key={offer.id}
                        className="space-y-3 rounded-xl border border-[#E3EAF3] bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-bold text-[#102A43]">
                                {offerWorkerName}
                              </span>
                              {offerWorker?.checkedDemo && (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#16865B]">
                                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                  <span>
                                    {t('common.checked')} ({t('common.demo')})
                                  </span>
                                </span>
                              )}
                              {offerWorker && (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#102A43] ltr-num">
                                  <Star className="h-4 w-4 fill-[#D99018] text-[#D99018]" aria-hidden="true" />
                                  {offerWorker.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#62748A]">
                              {t('jobDetail.estDays', {
                                n: offer.daysNeeded,
                                unit: offer.daysNeeded === 1 ? t('common.day') : t('common.days'),
                              })}{' '}
                              · {offerStatusLabel}
                              {!evalOffer.isExpired &&
                                (offer.status === 'pending' || offer.status === 'price_talk') && (
                                  <> · {formatTimeLeft(offer.expiresAt, lang)}</>
                                )}
                            </p>
                            {job.workersNeeded > 1 && (
                              <p className="text-xs font-semibold text-[#1769E0]">
                                {t('jobDetail.workersIncluded', { n: offer.workersCount })}
                              </p>
                            )}
                          </div>

                          <div className="text-end">
                            <p className="font-mono text-2xl font-extrabold text-[#102A43] tabular-nums ltr-num">
                              {formatPkr(offer.pricePkr, lang)}
                            </p>
                            <p className="text-xs font-semibold text-[#16865B]">
                              {t('myReq.customerNoFee')}
                            </p>
                          </div>
                        </div>

                        <p className="text-base text-[#172B4D]">{offer.note}</p>

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
                                      ? t('common.customer')
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

                        {!evalOffer.canCoverTeam &&
                          (offer.status === 'pending' || offer.status === 'price_talk') && (
                            <p className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-sm font-semibold text-[#92400E]">
                              {t('jobDetail.teamTooSmallNote', {
                                needed: job.workersNeeded,
                                count: offer.workersCount,
                              })}
                            </p>
                          )}

                        {!evalOffer.isExpired &&
                          (offer.status === 'pending' || offer.status === 'price_talk') && (
                            <p className="text-sm font-semibold text-[#62748A]">
                              {evalOffer.maxRoundsReached
                                ? t('jobDetail.maxRoundsNote')
                                : evalOffer.expectedTurn === 'customer'
                                  ? t('jobDetail.yourTurnNote')
                                  : t('jobDetail.waitingWorkerTurn')}
                            </p>
                          )}

                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {(evalOffer.canAccept ||
                            (!evalOffer.canCoverTeam &&
                              !evalOffer.isExpired &&
                              (offer.status === 'pending' || offer.status === 'price_talk'))) && (
                            <Button
                              variant="primary"
                              size="md"
                              disabled={!evalOffer.canAccept}
                              onClick={() => dispatch({ type: 'ACCEPT_OFFER', offerId: offer.id })}
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              <span>{t('jobDetail.acceptAndConfirm')}</span>
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
                              <span>{t('jobDetail.yourPriceBtn')}</span>
                            </Button>
                          )}

                          {evalOffer.canDecline && (
                            <Button
                              variant="outline"
                              size="md"
                              onClick={() => dispatch({ type: 'DECLINE_OFFER', offerId: offer.id })}
                              className="text-[#D64545]"
                            >
                              <XCircle className="h-4 w-4" aria-hidden="true" />
                              <span>{t('jobDetail.sayNo')}</span>
                            </Button>
                          )}

                          {offerWorker && (
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => openChatWithWorker(offerWorker.id)}
                            >
                              <MessageSquare className="h-4 w-4" aria-hidden="true" />
                              <span>{t('nav.chat')}</span>
                            </Button>
                          )}
                        </div>

                        {counterOfferId === offer.id && evalOffer.canCounter && (
                          <div className="space-y-2.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5">
                            <label
                              htmlFor={`cust-counter-${offer.id}`}
                              className="block text-sm font-bold text-[#102A43]"
                            >
                              {t('jobDetail.suggestPrice')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <input
                                id={`cust-counter-${offer.id}`}
                                type="number"
                                min={INPUT_LIMITS.MIN_PKR}
                                max={INPUT_LIMITS.MAX_PKR}
                                step={100}
                                value={counterPrice || ''}
                                onChange={(e) => {
                                  setCounterPrice(Number(e.target.value));
                                  setCounterError('');
                                }}
                                className="ltr-num min-h-[48px] flex-1 rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 font-mono text-lg font-bold text-[#102A43]"
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Key Details */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">{t('post.summaryArea')}</p>
                <p className="text-base font-bold text-[#102A43]">
                  {getLocalizedLocationLabel(job.area, job.city, SAMPLE_AREAS, lang)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-[#16865B]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('post.summaryYourPrice')}
                </p>
                <p className="font-mono text-base font-bold text-[#102A43] tabular-nums">
                  <span className="ltr-num">
                    {price > 0 ? formatPkr(price, lang) : t('common.openPrice')}
                  </span>{' '}
                  ·{' '}
                  {job.materialsIncluded
                    ? t('common.materialsIncluded')
                    : t('common.materialsSeparate')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('post.summaryWorkersNeeded')}
                </p>
                <p className="text-base font-bold text-[#102A43]">
                  {job.workersNeeded === 1
                    ? t('common.workerCountOne')
                    : t('common.workerCountMany', { n: job.workersNeeded })}{' '}
                  ({workforceLabel})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('post.summaryWhenSoon')}
                </p>
                <p className="text-base font-bold text-[#102A43]">
                  {urgencyLabel}
                  {job.preferredDate ? ` · ${job.preferredDate}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#102A43]">{t('jobDetail.workDetails')}</h2>
            <p className="text-base leading-relaxed text-[#172B4D]">{displayDesc}</p>
            {job.notes && (
              <p className="rounded-lg bg-[#F8FAFC] p-3 text-base text-[#62748A]">
                {t('jobDetail.notePrefix', { note: job.notes })}
              </p>
            )}
          </div>

          {job.photos.length > 0 && (
            <div className="space-y-3 border-t border-[#E3EAF3] pt-4">
              <h2 className="text-lg font-bold text-[#102A43]">
                {t('jobDetail.photosHeading')}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {job.photos.map((ph) => (
                  <PhotoTile
                    key={ph.id}
                    photo={ph}
                    className="h-32"
                    onClick={() => setLightbox(ph)}
                  />
                ))}
              </div>
            </div>
          )}

          {job.status !== 'Cancelled' && job.status !== 'Completed' && (
            <div className="border-t border-[#E3EAF3] pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setConfirmCancel(true)}
                className="text-[#D64545] hover:bg-[#FEF2F2]"
              >
                <XCircle className="h-5 w-5" aria-hidden="true" />
                <span>{t('jobDetail.cancelBtn')}</span>
              </Button>
            </div>
          )}
        </Card>

        <ConfirmDialog
          isOpen={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          onConfirm={() => {
            dispatch({ type: 'CANCEL_JOB', jobId: job.id });
          }}
          title={t('jobDetail.cancelConfirmTitle')}
          message={t('jobDetail.cancelConfirmMsg')}
          confirmLabel={t('jobDetail.cancelConfirmYes')}
          cancelLabel={t('myReq.keepRequest')}
          tone="danger"
        />

        <Modal
          isOpen={Boolean(lightbox)}
          onClose={() => setLightbox(null)}
          title={lightbox?.title || t('workerPublic.workPhotoTitle')}
          maxWidthClass="max-w-2xl"
        >
          {lightbox && <PhotoTile photo={lightbox} className="h-72 sm:h-96" />}
        </Modal>
      </div>
    </RoleGuard>
  );
};
