import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  Edit3,
  Flag,
  Languages,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { PhotoTile } from '../components/PhotoTile';
import { ReportUpdateModal } from '../components/ReportUpdateModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  getLocalizedAreaName,
  getLocalizedCategoryName,
  getLocalizedCityName,
} from '../i18n';
import { ContentReport, PhotoMedia, UserRole, WorkProgress } from '../types';
import { formatTimelineDate } from '../utils/id';
import { formatPkr } from '../utils/pricing';
import { canWorkerReplyToReview, getLocalizedReviewTag } from '../utils/reviews';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

const PROGRESS_KEY: Record<WorkProgress, 'progress.Started' | 'progress.Half done' | 'progress.Almost done' | 'progress.Finished'> = {
  Started: 'progress.Started',
  'Half done': 'progress.Half done',
  'Almost done': 'progress.Almost done',
  Finished: 'progress.Finished',
};

export const WorkerPreviewPlaceholderPage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const isWorkerViewer = state.activeRole === UserRole.Worker;
  const worker = state.workers.find((w) => w.id === workerId);

  const [lightbox, setLightbox] = useState<{ photo: PhotoMedia; caption?: string } | null>(
    null
  );
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: ContentReport['targetType'];
    label?: string;
  } | null>(null);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const workerPortfolio = useMemo(() => {
    if (!worker) return [];
    return state.portfolioItems
      .filter((p) => p.workerId === worker.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.portfolioItems, worker]);

  const workerUpdates = useMemo(() => {
    if (!worker) return [];
    return state.workUpdates
      .filter((u) => u.workerId === worker.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.workUpdates, worker]);

  const workerReviews = useMemo(() => {
    if (!worker) return [];
    return state.reviews.filter((r) => r.workerId === worker.id);
  }, [state.reviews, worker]);

  if (!worker) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Card className="py-10 text-center">
          <h1 className="text-2xl font-bold text-[#102A43]">
            {t('workerPublic.notFoundTitle')}
          </h1>
          <p className="mt-2 text-base text-[#62748A]">{t('workerPublic.notFoundDesc')}</p>
          <div className="mt-6 flex justify-center">
            <Button variant="primary" size="lg" onClick={() => navigate('/workers')}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              <span>{t('workerPublic.back')}</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const displayName = isUrdu ? worker.nameUr : worker.name;
  const displayHeadline = isUrdu ? worker.headlineUr : worker.headline;
  const displayBio = isUrdu
    ? worker.bioUr || worker.bio || t('workerPublic.defaultBio')
    : worker.bio || t('workerPublic.defaultBio');

  const category = state.categories.find((c) => c.id === worker.categoryId);
  const initials = worker.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const unitLabel =
    worker.priceUnit === 'visit'
      ? t('common.perVisit')
      : worker.priceUnit === 'day'
        ? t('common.perDay')
        : t('common.perJob');

  const workerTypeLabel =
    worker.workerType === 'One person'
      ? t('workerType.one')
      : worker.workerType === 'Contractor'
        ? t('workerType.contractor')
        : t('workerType.team');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button variant="outline" size="md" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.back')}</span>
        </Button>
      </div>

      {/* LinkedIn-style Header Card */}
      <Card padding="none" className="overflow-hidden">
        <div className="relative h-36 w-full sm:h-48">
          {worker.coverPhotoUrl ? (
            <img
              src={worker.coverPhotoUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(120deg, #102A43 0%, #1769E0 65%, #60A5FA 100%)',
              }}
            />
          )}
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {worker.profilePhotoUrl ? (
                <img
                  src={worker.profilePhotoUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="relative h-24 w-24 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-md sm:h-28 sm:w-28"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#EFF6FF] font-display text-2xl font-extrabold text-[#1769E0] shadow-md sm:h-28 sm:w-28"
                >
                  {initials}
                </div>
              )}
            </div>

            {isWorkerViewer ? (
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/worker/work')}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerPublic.addTodaysWork')}</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/worker/profile')}
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerPublic.editMyProfile')}</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (state.activeRole !== UserRole.Customer) {
                      navigate('/chat');
                      return;
                    }
                    const existing = state.conversations.find(
                      (c) =>
                        c.customerId === state.activeCustomerId && c.workerId === worker.id
                    );
                    const convId =
                      existing?.id || `conv_${state.activeCustomerId}_${worker.id}`;
                    dispatch({
                      type: 'OPEN_OR_CREATE_CONVERSATION',
                      conversationId: convId,
                      customerId: state.activeCustomerId,
                      workerId: worker.id,
                    });
                    navigate(`/chat/${convId}`);
                  }}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerPublic.messageBtn')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/invite')}
                >
                  <UserPlus className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                  <span>{t('workerPublic.inviteToJob')}</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/post-request')}
                >
                  <Banknote className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerPublic.askForPrice')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() =>
                    setReportTarget({
                      id: worker.id,
                      type: 'worker',
                      label: t('workerPublic.reportWorkerTitle', { name: displayName }),
                    })
                  }
                  className="text-[#62748A] hover:text-[#D64545]"
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerPublic.reportWorker')}</span>
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {displayName}
              </h1>
              {worker.checkedDemo && (
                <span className="inline-flex items-center gap-1 text-base font-semibold text-[#16865B]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  <span>
                    {t('common.checked')} ({t('common.demo')})
                  </span>
                </span>
              )}
            </div>

            <p className="text-lg font-medium text-[#172B4D]">{displayHeadline}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-base">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#102A43] tabular-nums">
                <Star className="h-5 w-5 fill-[#D99018] text-[#D99018]" aria-hidden="true" />
                <span className="ltr-num">
                  {worker.rating.toFixed(1)} ({t('common.demo')})
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium text-[#62748A] tabular-nums">
                <Briefcase className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                <span>{t('common.jobsDone', { n: worker.jobsCompleted })}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 font-semibold text-[#102A43]">
                {worker.workerType === 'One person' ? (
                  <User className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                ) : (
                  <Users className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                )}
                <span>
                  {workerTypeLabel}
                  {worker.workerType !== 'One person' && worker.teamSize > 1
                    ? ` (${t('common.teamOf', { n: worker.teamSize })})`
                    : ''}
                </span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 font-semibold ${
                  worker.freeToWorkNow ? 'text-[#16865B]' : 'text-[#62748A]'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {worker.freeToWorkNow ? t('common.freeToWork') : t('common.busyNow')}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* About, Key Info & Skills */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-5 lg:col-span-2">
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">
              {t('workerPublic.aboutHeading')}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-[#172B4D]">{displayBio}</p>
          </div>

          <div className="border-t border-[#E3EAF3] pt-4">
            <h2 className="text-xl font-bold text-[#102A43]">
              {t('workerPublic.skillsHeading')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {worker.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-[#D2E3FC] bg-[#EFF6FF] px-3.5 py-1.5 text-base font-semibold text-[#1769E0]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[#62748A]">
              {t('workerPublic.typicalPrice')}
            </p>
            <p className="font-mono text-2xl font-extrabold text-[#102A43] tabular-nums">
              <span className="ltr-num">{formatPkr(worker.priceHintPkr, lang)}</span>{' '}
              <span className="font-sans text-base font-normal text-[#62748A]">
                / {unitLabel}
              </span>
            </p>
          </div>

          <div className="border-t border-[#E3EAF3] pt-3">
            <p className="text-sm font-semibold text-[#62748A]">
              {t('workerProfile.categoryLabel')}
            </p>
            <p className="mt-0.5 text-base font-bold text-[#102A43]">
              {category ? getLocalizedCategoryName(category, lang) : t('common.worker')}
            </p>
          </div>

          <div className="border-t border-[#E3EAF3] pt-3">
            <p className="text-sm font-semibold text-[#62748A]">
              {t('workerPublic.experience')}
            </p>
            <p className="mt-0.5 text-base font-bold text-[#102A43] tabular-nums">
              {t('common.yearsExp', { n: worker.yearsExperience })}
            </p>
          </div>

          <div className="border-t border-[#E3EAF3] pt-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#62748A]">
              <MapPin className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
              <span>
                {t('workerPublic.serviceAreas')} ({getLocalizedCityName(worker.city, lang)})
              </span>
            </p>
            <p className="mt-1 text-base font-semibold text-[#102A43]">
              {worker.serviceAreas
                .map((a) => getLocalizedAreaName(a, SAMPLE_AREAS, lang))
                .join(isUrdu ? '، ' : ', ')}
            </p>
          </div>

          <div className="border-t border-[#E3EAF3] pt-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#62748A]">
              <Languages className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
              <span>{t('workerPublic.languages')}</span>
            </p>
            <p className="mt-1 text-base font-semibold text-[#102A43]">
              {worker.languages.join(', ')}
            </p>
          </div>
        </Card>
      </div>

      {/* My Work Gallery */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">
              {t('workerPublic.myWorkTab', { n: workerPortfolio.length })}
            </h2>
            <p className="text-base text-[#62748A]">{t('workerPublic.tapBigger')}</p>
          </div>
        </div>

        {workerPortfolio.length === 0 ? (
          <p className="text-base text-[#62748A]">{t('workerPublic.noPortfolio')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workerPortfolio.map((item) => {
              const cat = state.categories.find((c) => c.id === item.categoryId);
              const caption = isUrdu && item.captionUr ? item.captionUr : item.caption;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-[#E3EAF3] bg-white"
                >
                  <PhotoTile
                    photo={item.photos[0]}
                    alt={caption}
                    className="h-44 rounded-none border-0"
                    onClick={() => setLightbox({ photo: item.photos[0], caption })}
                  />
                  {item.photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-1.5 border-t border-[#E3EAF3] bg-[#F8FAFC] p-2">
                      {item.photos.slice(1).map((extra) => (
                        <PhotoTile
                          key={extra.id}
                          photo={extra}
                          alt={caption}
                          className="h-12"
                          onClick={() => setLightbox({ photo: extra, caption })}
                        />
                      ))}
                    </div>
                  )}
                  <div className="p-3.5">
                    <p className="text-xs font-semibold text-[#1769E0]">
                      {cat ? getLocalizedCategoryName(cat, lang) : t('nav.myWork')}
                    </p>
                    <p className="mt-0.5 text-base font-bold text-[#102A43]">{caption}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Work Updates */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#102A43]">
            {t('workerPublic.recentUpdatesHeading', { n: workerUpdates.length })}
          </h2>
          <p className="text-base text-[#62748A]">
            {t('workerPublic.recentUpdatesSub', { name: displayName })}
          </p>
        </div>

        {workerUpdates.length === 0 ? (
          <p className="text-base text-[#62748A]">{t('workerPublic.noUpdates')}</p>
        ) : (
          <div className="space-y-4">
            {workerUpdates.map((upd) => {
              const note = isUrdu && upd.noteUr ? upd.noteUr : upd.note;
              return (
                <div
                  key={upd.id}
                  className="space-y-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5 text-sm">
                      <span className="inline-flex items-center gap-1 font-bold text-[#102A43]">
                        <Clock className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                        <span>{formatTimelineDate(upd.createdAt, lang)}</span>
                      </span>
                      <span className="rounded-md border border-[#BFDBFE] bg-white px-2.5 py-0.5 font-bold text-[#1769E0]">
                        {t(PROGRESS_KEY[upd.progress])}
                      </span>
                      <span className="font-medium text-[#62748A]">
                        {t('workerPublic.postedBy', { name: displayName })}
                      </span>
                    </div>

                    {!isWorkerViewer && (
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            id: upd.id,
                            type: 'work_update',
                            label: t('workerPublic.reportUpdateTitle', { name: displayName }),
                          })
                        }
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#62748A] hover:bg-white hover:text-[#D64545] cursor-pointer"
                      >
                        <Flag className="h-4 w-4" aria-hidden="true" />
                        <span>{t('workerPublic.reportWorker')}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-base text-[#172B4D]">{note}</p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {upd.photos.map((ph) => (
                      <PhotoTile
                        key={ph.id}
                        photo={ph}
                        alt={note}
                        className="h-28"
                        onClick={() => setLightbox({ photo: ph, caption: note })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Reviews Area */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#102A43]">
            {t('workerPublic.reviewsHeading', { n: workerReviews.length })}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#102A43]">
            <Star className="h-5 w-5 fill-[#D99018] text-[#D99018]" aria-hidden="true" />
            <span className="ltr-num">{worker.rating.toFixed(1)}</span> ·{' '}
            {t('common.reviewsCount', { n: workerReviews.length })}
          </span>
        </div>

        {workerReviews.length === 0 ? (
          <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 text-base text-[#62748A]">
            {t('workerPublic.noReviews')}
          </div>
        ) : (
          <div className="space-y-3">
            {workerReviews.map((rev) => {
              const canReply =
                activeWorker &&
                canWorkerReplyToReview(rev, activeWorker.id, state.activeRole).allowed;
              const revStars = rev.stars || rev.rating || 5;
              const revText = isUrdu
                ? rev.textUr || rev.text || rev.comment || ''
                : rev.text || rev.comment || '';

              return (
                <div
                  key={rev.id}
                  className="space-y-2.5 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-[#102A43]">
                        {rev.customerName || t('common.customer')}
                        {rev.areaName
                          ? ` · ${getLocalizedAreaName(rev.areaName, SAMPLE_AREAS, lang)}`
                          : ''}
                      </span>
                      {rev.isDemo && (
                        <span className="rounded border border-[#E3EAF3] bg-white px-2 py-0.5 text-xs font-bold text-[#62748A]">
                          {t('common.demo')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[#102A43] tabular-nums">
                        <Star className="h-4 w-4 fill-[#D99018] text-[#D99018]" aria-hidden="true" />
                        <span className="ltr-num">{revStars.toFixed(1)}</span>
                      </span>
                      {!isWorkerViewer && (
                        <button
                          type="button"
                          onClick={() =>
                            setReportTarget({
                              id: rev.id,
                              type: 'review',
                              label: t('workerPublic.reportReviewTitle'),
                            })
                          }
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#62748A] hover:bg-white hover:text-[#D64545] cursor-pointer"
                        >
                          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('workerPublic.reportWorker')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rev.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-bold text-[#1769E0]"
                        >
                          {getLocalizedReviewTag(tag, lang)}
                        </span>
                      ))}
                    </div>
                  )}

                  {revText && <p className="text-base text-[#172B4D]">{revText}</p>}

                  <p className="text-xs text-[#62748A]">
                    {formatTimelineDate(rev.createdAt, lang)}
                  </p>

                  {rev.reply ? (
                    <div className="mt-2 space-y-1 rounded-xl border border-[#D2E3FC] bg-white p-3">
                      <p className="text-xs font-bold text-[#1769E0]">
                        {t('workerPublic.replyFrom', { name: displayName })}
                      </p>
                      <p className="text-sm text-[#172B4D]">{rev.reply.text}</p>
                    </div>
                  ) : canReply ? (
                    replyReviewId === rev.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clean = sanitizeText(replyText, INPUT_LIMITS.REVIEW_REPLY_MAX);
                          if (!clean) return;
                          dispatch({
                            type: 'REPLY_TO_REVIEW',
                            reviewId: rev.id,
                            text: clean,
                          });
                          setReplyReviewId(null);
                          setReplyText('');
                        }}
                        className="mt-2 space-y-2 rounded-xl border border-[#D2E3FC] bg-white p-3"
                      >
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={`reply-${rev.id}`}
                            className="text-sm font-bold text-[#102A43]"
                          >
                            {t('workerPublic.sayThanksHeading')}
                          </label>
                          <span className="text-xs text-[#62748A] tabular-nums ltr-num">
                            {replyText.length}/{INPUT_LIMITS.REVIEW_REPLY_MAX}
                          </span>
                        </div>
                        <input
                          id={`reply-${rev.id}`}
                          type="text"
                          value={replyText}
                          maxLength={INPUT_LIMITS.REVIEW_REPLY_MAX}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t('workerPublic.replyPlaceholder')}
                          className="min-h-[44px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D]"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="primary" size="sm">
                            <span>{t('workerPublic.sendReply')}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyReviewId(null);
                              setReplyText('');
                            }}
                          >
                            <span>{t('app.cancel')}</span>
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyReviewId(rev.id);
                            setReplyText('');
                          }}
                        >
                          <span>{t('workerPublic.sayThanks')}</span>
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Lightbox Modal */}
      <Modal
        isOpen={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.photo.title || t('workerPublic.workPhotoTitle')}
        maxWidthClass="max-w-2xl"
      >
        {lightbox && (
          <div className="space-y-4">
            <PhotoTile photo={lightbox.photo} className="h-72 sm:h-96" />
            {lightbox.caption && (
              <p className="text-base font-medium text-[#172B4D]">{lightbox.caption}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Customer Report Modal */}
      <ReportUpdateModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        updateId={reportTarget?.id || ''}
        targetType={reportTarget?.type || 'work_update'}
        targetLabel={reportTarget?.label}
        workerId={worker.id}
        workerName={displayName}
      />
    </div>
  );
};
