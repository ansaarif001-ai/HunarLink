import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Send,
  Users,
  Wrench,
} from 'lucide-react';
import { PhotoTile } from '../components/PhotoTile';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { PhotoMedia, UserRole } from '../types';
import { formatRelativeTime } from '../utils/id';
import {
  getJobEffectivePrice,
  getJobMatchReason,
  getWorkforceMatchInfo,
} from '../utils/matching';
import { formatPkr } from '../utils/pricing';

export const WorkerJobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { state, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const [lightbox, setLightbox] = useState<PhotoMedia | null>(null);

  const worker = activeWorker || state.workers[0];
  const job = state.jobs.find((j) => j.id === jobId);
  const category = job ? state.categories.find((c) => c.id === job.categoryId) : undefined;

  const isOpen =
    job &&
    (job.status === 'Published' ||
      job.status === 'Offers Received' ||
      job.status === 'Price Talk');

  if (!job || !isOpen) {
    return (
      <RoleGuard allowedRole={UserRole.Worker}>
        <div className="mx-auto max-w-xl py-8">
          <Card className="py-10 text-center">
            <h1 className="text-2xl font-bold text-[#102A43]">
              {job?.status === 'Cancelled'
                ? t('workerJobDetail.cancelledTitle')
                : t('workerJobDetail.notFoundTitle')}
            </h1>
            <p className="mt-2 text-base text-[#62748A]">
              {job?.status === 'Cancelled'
                ? t('workerJobDetail.cancelledDesc')
                : t('workerJobDetail.notFoundDesc')}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/jobs')}>
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                <span>{t('workerJobDetail.back')}</span>
              </Button>
            </div>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const effectivePrice = getJobEffectivePrice(job);
  const workforceInfo = getWorkforceMatchInfo(job, worker, lang);
  const matchReason = getJobMatchReason(job, worker, state.categories, lang);
  const existingOffer = state.offers.find(
    (o) => o.jobId === job.id && o.workerId === worker.id && o.status !== 'withdrawn'
  );

  const displayTitle = isUrdu && job.titleUr ? job.titleUr : job.title;
  const displayDesc = isUrdu && job.descriptionUr ? job.descriptionUr : job.description;
  const displayArea = getLocalizedLocationLabel(job.area, job.city, SAMPLE_AREAS, lang);
  const urgencyKey = `urgency.${job.urgency || job.howSoon}` as const;
  const workforceKey = `workforce.${job.workforceType}` as const;

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <Button variant="outline" size="md" onClick={() => navigate('/worker/jobs')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('workerJobDetail.back')}</span>
          </Button>
        </div>

        <Card className="space-y-6">
          <div>
            <p className="inline-flex items-center gap-1.5 text-base font-semibold text-[#1769E0]">
              <Wrench className="h-5 w-5" aria-hidden="true" />
              <span>
                {getLocalizedCategoryName(category, lang)}
                {job.requiredSkill ? ` · ${job.requiredSkill}` : ''}
              </span>
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {displayTitle}
            </h1>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-4 py-3 text-sm text-[#486581]">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>
                <strong className="text-[#102A43]">{t('workerJobs.whySeeingLabel')} </strong>
                {matchReason.summary}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3 text-base font-semibold text-[#16865B]">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{workforceInfo.label}</span>
            </div>
          </div>

          {/* Key Job Details (Read-Only, area name only) */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerJobDetail.areaSafeLabel')}
                </p>
                <p className="text-base font-bold text-[#102A43]">{displayArea}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-[#16865B]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerJobDetail.customerPriceLabel')}
                </p>
                <p className="ltr-num font-mono text-base font-bold text-[#102A43] tabular-nums">
                  {effectivePrice > 0 ? formatPkr(effectivePrice, lang) : t('common.openPrice')} ·{' '}
                  <span className="font-sans text-sm font-semibold text-[#62748A]">
                    {job.materialsIncluded
                      ? t('common.materialsIncluded')
                      : t('common.materialsSeparate')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerJobDetail.workersNeededLabel')}
                </p>
                <p className="text-base font-bold text-[#102A43] tabular-nums">
                  {job.workersNeeded === 1
                    ? t('common.workerCountOne')
                    : t('common.workerCountMany', { n: job.workersNeeded })}{' '}
                  ({t(workforceKey as never)})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerJobDetail.howSoonLabel')}
                </p>
                <p className="text-base font-bold text-[#102A43]">
                  {t(urgencyKey as never)}
                  {job.preferredDate ? ` · ${job.preferredDate}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#102A43]">
              {t('workerJobDetail.workDetails')}
            </h2>
            <p className="text-base leading-relaxed text-[#172B4D]">{displayDesc}</p>
            {job.notes && (
              <p className="rounded-lg bg-[#F8FAFC] p-3 text-base text-[#62748A]">
                {t('workerJobDetail.extraNotePrefix', { note: job.notes })}
              </p>
            )}
            <p className="inline-flex items-center gap-1.5 text-sm text-[#62748A]">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{t('jobDetail.posted', { time: formatRelativeTime(job.createdAt, lang) })}</span>
            </p>
          </div>

          {/* Customer Uploaded Photos */}
          {job.photos && job.photos.length > 0 && (
            <div className="space-y-3 border-t border-[#E3EAF3] pt-4">
              <h2 className="text-lg font-bold text-[#102A43]">
                {t('workerJobDetail.photosTitle')}
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

          {/* Action */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#E3EAF3] pt-5">
            {existingOffer ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-xl bg-[#F0FDF4] px-4 py-2 text-base font-bold text-[#16865B]">
                  {t('workerJobDetail.alreadySentTitle')} (
                  <span className="ltr-num font-mono">
                    {formatPkr(existingOffer.pricePkr, lang)}
                  </span>
                  )
                </span>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/worker/prices')}
                >
                  <span>{t('workerJobDetail.viewMyPrices')}</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/worker/send-price/${job.id}`)}
              >
                <Send className="h-5 w-5" aria-hidden="true" />
                <span>{t('workerJobs.sendPrice')}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/worker/jobs')}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              <span>{t('app.back')}</span>
            </Button>
          </div>
        </Card>

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
