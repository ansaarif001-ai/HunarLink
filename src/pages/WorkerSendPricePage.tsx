import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CheckCircle2,
  Info,
  MapPin,
  Minus,
  Plus,
  Send,
} from 'lucide-react';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedLocationLabel } from '../i18n';
import { UserRole } from '../types';
import { getMatchingJobsWithDetails } from '../utils/matching';
import { calculateOurFee, formatPkr } from '../utils/pricing';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

export const WorkerSendPricePage: React.FC = () => {
  const { jobId: paramJobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const worker = activeWorker || state.workers[0];
  const openJobs = useMemo(
    () =>
      getMatchingJobsWithDetails(state.jobs, worker, state.categories, {}, lang).map(
        (m) => m.job
      ),
    [state.jobs, worker, state.categories, lang]
  );

  const fallbackJob =
    state.jobs.find(
      (j) => j.id === paramJobId && j.status !== 'Cancelled' && j.status !== 'Completed'
    ) ||
    openJobs[0] ||
    state.jobs.find((j) => j.status === 'Published' || j.status === 'Offers Received');

  const [selectedJobId, setSelectedJobId] = useState<string>(fallbackJob?.id || '');
  const activeJob = state.jobs.find((j) => j.id === selectedJobId) || fallbackJob;

  const initialPrice =
    activeJob?.budget && activeJob.budget >= 500
      ? activeJob.budget
      : worker.priceHintPkr || 1800;
  const [pricePkr, setPricePkr] = useState<number>(initialPrice);
  const [daysNeeded, setDaysNeeded] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submittedOfferPrice, setSubmittedOfferPrice] = useState<number | null>(null);

  const feePreview = calculateOurFee(pricePkr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeJob) {
      setError(t('sendPrice.errSelectJob'));
      return;
    }
    if (!Number.isFinite(pricePkr) || pricePkr < INPUT_LIMITS.MIN_PKR) {
      setError(t('sendPrice.errPrice'));
      return;
    }
    if (pricePkr > INPUT_LIMITS.MAX_PKR) {
      setError(t('sendPrice.errPriceMax', { max: formatPkr(INPUT_LIMITS.MAX_PKR, lang) }));
      return;
    }

    dispatch({
      type: 'SEND_OFFER',
      jobId: activeJob.id,
      workerId: worker.id,
      pricePkr,
      daysNeeded,
      workersCount: worker.teamSize,
      note: sanitizeText(note, INPUT_LIMITS.MESSAGE_MAX),
    });

    setSubmittedOfferPrice(feePreview.jobValue);
  };

  if (submittedOfferPrice !== null) {
    return (
      <RoleGuard allowedRole={UserRole.Worker}>
        <div className="mx-auto max-w-xl py-6">
          <Card className="space-y-5 p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16865B]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43]">
              {t('sendPrice.sentTitle')}
            </h1>
            <p className="text-base text-[#62748A]">
              {t('sendPrice.sentDesc', { price: formatPkr(submittedOfferPrice, lang) })}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/prices')}>
                <Banknote className="h-5 w-5" aria-hidden="true" />
                <span>{t('sendPrice.seeMyPrices')}</span>
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/worker/jobs')}>
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                <span>{t('nav.jobsNearMe')}</span>
              </Button>
            </div>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Button variant="outline" size="md" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.back')}</span>
          </Button>
        </div>

        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('sendPrice.title')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('sendPrice.subtitle')}</p>
          </div>

          {!activeJob ? (
            <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-6 text-center">
              <p className="text-base font-semibold text-[#102A43]">
                {t('sendPrice.noOpenJobs')}
              </p>
              <div className="mt-4 flex justify-center">
                <Button variant="primary" size="md" onClick={() => navigate('/worker/jobs')}>
                  <span>{t('workerJobDetail.back')}</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Job picker if user opened /worker/send-price without :jobId */}
              {!paramJobId && openJobs.length > 1 && (
                <div className="space-y-1.5">
                  <label htmlFor="sp-job" className="block text-base font-bold text-[#102A43]">
                    {t('sendPrice.chooseJobLabel')}
                  </label>
                  <select
                    id="sp-job"
                    value={activeJob.id}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  >
                    {openJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {isUrdu && j.titleUr ? j.titleUr : j.title} (
                        {getLocalizedLocationLabel(j.area, j.city, SAMPLE_AREAS, lang)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Job Summary */}
              <div className="space-y-1 rounded-xl border border-[#D2E3FC] bg-[#EFF6FF] p-4">
                <p className="text-sm font-bold text-[#1769E0]">
                  {t('sendPrice.selectedReq')}
                </p>
                <p className="text-lg font-extrabold text-[#102A43]">
                  {isUrdu && activeJob.titleUr ? activeJob.titleUr : activeJob.title}
                </p>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#62748A]">
                  <MapPin className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                  <span>
                    {getLocalizedLocationLabel(
                      activeJob.area,
                      activeJob.city,
                      SAMPLE_AREAS,
                      lang
                    )}{' '}
                    ·{' '}
                    {t('sendPrice.customerEstimate', {
                      price: activeJob.budget
                        ? formatPkr(activeJob.budget, lang)
                        : t('common.openPrice'),
                    })}
                  </span>
                </p>
              </div>

              {/* Price Input with +/- buttons */}
              <div className="space-y-2">
                <label htmlFor="sp-price" className="block text-base font-bold text-[#102A43]">
                  {t('sendPrice.yourPriceLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={t('sendPrice.decreasePriceAria')}
                    onClick={() => setPricePkr((p) => Math.max(INPUT_LIMITS.MIN_PKR, p - 200))}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#CBD5E1] bg-white text-[#102A43] hover:border-[#1769E0] cursor-pointer"
                  >
                    <Minus className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <input
                    id="sp-price"
                    type="number"
                    min={INPUT_LIMITS.MIN_PKR}
                    max={INPUT_LIMITS.MAX_PKR}
                    step={50}
                    value={pricePkr || ''}
                    onChange={(e) => setPricePkr(Number(e.target.value))}
                    className="ltr-num min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 font-mono text-xl font-extrabold text-[#102A43] tabular-nums focus:border-[#1769E0] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={t('sendPrice.increasePriceAria')}
                    onClick={() =>
                      setPricePkr((p) => Math.min(INPUT_LIMITS.MAX_PKR, (p || 0) + 200))
                    }
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#CBD5E1] bg-white text-[#102A43] hover:border-[#1769E0] cursor-pointer"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Clear 5% Our Fee Preview Before Submitting/Confirming */}
              <div className="space-y-2 rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                  <Info className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                  <span>{t('sendPrice.feePreviewHeading')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-[#E3EAF3] bg-white p-2.5">
                    <p className="text-xs font-semibold text-[#62748A]">
                      {t('sendPrice.jobValueLabel')}
                    </p>
                    <p className="ltr-num font-mono text-base font-extrabold text-[#102A43] tabular-nums">
                      {formatPkr(feePreview.jobValue, lang)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E3EAF3] bg-white p-2.5">
                    <p className="text-xs font-semibold text-[#62748A]">
                      {t('sendPrice.ourFeeLabel')}
                    </p>
                    <p className="ltr-num font-mono text-base font-extrabold text-[#D99018] tabular-nums">
                      {formatPkr(feePreview.fee, lang)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-2.5">
                    <p className="text-xs font-semibold text-[#16865B]">
                      {t('sendPrice.youReceiveLabel')}
                    </p>
                    <p className="ltr-num font-mono text-base font-extrabold text-[#16865B] tabular-nums">
                      {formatPkr(feePreview.net, lang)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#62748A]">{t('sendPrice.exampleText')}</p>
              </div>

              {/* Days Needed */}
              <div className="space-y-1.5">
                <label htmlFor="sp-days" className="block text-base font-bold text-[#102A43]">
                  {t('sendPrice.daysLabel')}
                </label>
                <input
                  id="sp-days"
                  type="number"
                  min={1}
                  max={90}
                  value={daysNeeded}
                  onChange={(e) =>
                    setDaysNeeded(Math.max(1, Math.min(90, Number(e.target.value) || 1)))
                  }
                  className="ltr-num min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base font-bold text-[#102A43] focus:border-[#1769E0] focus:outline-none"
                />
              </div>

              {/* Short Note */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sp-note" className="text-base font-bold text-[#102A43]">
                    {t('sendPrice.noteLabel')}
                  </label>
                  <span className="text-xs text-[#62748A] tabular-nums">
                    {t('post.charCount', {
                      n: note.length,
                      max: INPUT_LIMITS.MESSAGE_MAX,
                    })}
                  </span>
                </div>
                <textarea
                  id="sp-note"
                  rows={3}
                  value={note}
                  maxLength={INPUT_LIMITS.MESSAGE_MAX}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('sendPrice.notePlaceholder')}
                  className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-base font-semibold text-[#D64545]"
                >
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-[52px]">
                <Send className="h-5 w-5" aria-hidden="true" />
                <span>{t('sendPrice.submitBtn')}</span>
              </Button>
            </form>
          )}
        </Card>
      </div>
    </RoleGuard>
  );
};
