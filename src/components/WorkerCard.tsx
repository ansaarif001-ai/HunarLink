import React from 'react';
import {
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedAreaName, getLocalizedLocationLabel } from '../i18n';
import { WorkerProfile } from '../types';
import { formatPkr } from '../utils/pricing';
import { Button } from './ui/Button';

export interface WorkerCardProps {
  worker: WorkerProfile;
}

export const WorkerCard: React.FC<WorkerCardProps> = React.memo(({ worker }) => {
  const { state, dispatch } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const handleOpenChat = () => {
    if (state.activeRole !== 'customer') {
      navigate('/chat');
      return;
    }
    const existing = state.conversations.find(
      (c) => c.customerId === state.activeCustomerId && c.workerId === worker.id
    );
    const convId = existing?.id || `conv_${state.activeCustomerId}_${worker.id}`;
    dispatch({
      type: 'OPEN_OR_CREATE_CONVERSATION',
      conversationId: convId,
      customerId: state.activeCustomerId,
      workerId: worker.id,
    });
    navigate(`/chat/${convId}`);
  };

  const initials = worker.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const workerPortfolio = state.portfolioItems.filter((item) => item.workerId === worker.id);
  const previewPhotos =
    workerPortfolio.length > 0
      ? workerPortfolio.slice(0, 3).map((item) => ({
          id: item.id,
          title: item.caption,
          dataUrl: item.photos[0]?.dataUrl,
          palette: item.photos[0]?.palette || (['#EFF6FF', '#1769E0'] as [string, string]),
        }))
      : worker.workPhotos.slice(0, 3).map((wp) => ({
          id: wp.id,
          title: wp.title,
          dataUrl: wp.dataUrl,
          palette: wp.palette,
        }));

  const workerTypeLabel =
    worker.workerType === 'Contractor'
      ? t('workerType.contractor')
      : worker.workerType === 'Team'
        ? t('workerType.team')
        : t('workerType.one');

  const unitLabel =
    worker.priceUnit === 'visit'
      ? t('common.perVisit')
      : worker.priceUnit === 'day'
        ? t('common.perDay')
        : t('common.perJob');

  const displayName = isUrdu ? worker.nameUr || worker.name : worker.name;
  const displayHeadline = isUrdu ? worker.headlineUr || worker.headline : worker.headline;
  const locText = getLocalizedLocationLabel(worker.area, worker.city, SAMPLE_AREAS, lang);
  const coveredAreas = worker.serviceAreas
    .slice(0, 3)
    .map((a) => getLocalizedAreaName(a, SAMPLE_AREAS, lang))
    .join(isUrdu ? '، ' : ', ');

  return (
    <article className="flex flex-col justify-between rounded-xl border border-[#E3EAF3] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,67,0.04)] transition-shadow duration-150 hover:shadow-[0_6px_16px_rgba(16,42,67,0.08)]">
      <div>
        <div className="flex items-start gap-3.5">
          {worker.profilePhotoUrl ? (
            <img
              src={worker.profilePhotoUrl}
              alt={displayName}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-14 w-14 shrink-0 rounded-xl border border-[#D2E3FC] object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#D2E3FC] bg-[#EFF6FF] font-display text-lg font-bold text-[#1769E0]"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-[#102A43] truncate">{displayName}</h3>
            <p className="mt-0.5 text-base font-medium text-[#62748A] line-clamp-2">
              {displayHeadline}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          {worker.checkedDemo && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#16865B]">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t('common.checked')} ({t('common.demo')})
              </span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 font-medium text-[#102A43]">
            {worker.workerType === 'One person' ? (
              <User className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            ) : (
              <Users className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            )}
            <span>
              {workerTypeLabel}
              {worker.teamSize > 1 ? ` (${worker.teamSize})` : ''}
            </span>
          </span>

          {worker.freeToWorkNow && (
            <span className="inline-flex items-center gap-1 font-medium text-[#16865B]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('common.freeToWork')}</span>
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2 border-t border-[#E3EAF3] pt-3 text-base text-[#172B4D]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
              <Star className="h-4 w-4 fill-[#D99018] text-[#D99018]" aria-hidden="true" />
              <span>
                {worker.rating.toFixed(1)} ({t('common.demo')})
              </span>
              <span className="text-sm font-normal text-[#62748A]">
                · {t('common.jobsDone', { n: worker.jobsCompleted })}
              </span>
            </span>

            <span className="font-mono text-base font-bold text-[#102A43] tabular-nums">
              <span className="ltr-num">{formatPkr(worker.priceHintPkr, lang)}</span>{' '}
              <span className="font-sans text-xs font-normal text-[#62748A]">{unitLabel}</span>
            </span>
          </div>

          <div className="flex items-start gap-1.5 text-sm text-[#62748A]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>
              {locText}
              {worker.serviceAreas.length > 1 ? ` · ${coveredAreas}` : ''}
            </span>
          </div>
        </div>

        <p className="mt-3 text-sm text-[#62748A]">{worker.skills.slice(0, 4).join(' · ')}</p>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-[#62748A]">
            {t('workerPublic.myWorkTab', { n: workerPortfolio.length || previewPhotos.length })}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previewPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative flex h-16 flex-col justify-end overflow-hidden rounded-lg border border-[#E3EAF3]"
                style={
                  photo.dataUrl
                    ? undefined
                    : {
                        background: `linear-gradient(135deg, ${photo.palette[0]} 0%, ${photo.palette[1]}25 100%)`,
                      }
                }
                title={photo.title}
              >
                {photo.dataUrl ? (
                  <img
                    src={photo.dataUrl}
                    alt={photo.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="truncate p-1.5 text-[11px] font-semibold text-[#102A43]">
                    {photo.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E3EAF3] pt-4 sm:grid-cols-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/workers/${worker.id}`)}
          className="col-span-2 px-3 text-sm sm:col-span-1"
        >
          <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('workersPage.viewProfile')}</span>
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleOpenChat}
          className="px-3 text-sm"
        >
          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('nav.chat')}</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/invite')}
          className="px-3 text-sm"
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('comingSoon.inviteTitle')}</span>
        </Button>
      </div>
    </article>
  );
});

WorkerCard.displayName = 'WorkerCard';
