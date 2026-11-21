import React from 'react';
import { useNavigate } from 'react-router';
import { Briefcase, Camera, CheckCircle2, Eye, MapPin, Settings, XCircle } from 'lucide-react';
import { RoleGuard } from '../components/RoleGuard';
import { WorkerJobCard } from '../components/WorkerJobCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  getLocalizedAreaName,
  getLocalizedCategoryName,
  getLocalizedCityName,
} from '../i18n';
import { UserRole } from '../types';
import { getMatchingJobsWithDetails } from '../utils/matching';

export const WorkerHomePage: React.FC = () => {
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const worker = activeWorker || state.workers[0];
  const matchingJobs = getMatchingJobsWithDetails(
    state.jobs,
    worker,
    state.categories,
    {},
    lang
  );
  const category = state.categories.find((c) => c.id === worker.categoryId);
  const workerName = isUrdu ? worker.nameUr : worker.name;
  const localizedAreas = worker.serviceAreas.map((a) =>
    getLocalizedAreaName(a, SAMPLE_AREAS, lang)
  );
  const localizedCity = getLocalizedCityName(worker.city, lang);

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="space-y-8">
        {/* Availability & Quick Actions Card */}
        <section className="rounded-2xl border border-[#E3EAF3] bg-white p-6 shadow-[0_2px_8px_rgba(16,42,67,0.04)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[#1769E0]">
                {category ? getLocalizedCategoryName(category, lang) : t('common.worker')} ·{' '}
                {localizedCity}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {workerName}
              </h1>
            </div>

            {/* Saved "Free to work now" on/off switch */}
            <button
              type="button"
              role="switch"
              aria-checked={worker.freeToWorkNow}
              onClick={() =>
                dispatch({ type: 'TOGGLE_WORKER_FREE_TO_WORK', workerId: worker.id })
              }
              className={`flex min-h-[56px] items-center justify-between gap-4 rounded-xl border-2 px-5 py-3 text-start transition-colors cursor-pointer ${
                worker.freeToWorkNow
                  ? 'border-[#16865B] bg-[#F0FDF4] text-[#16865B]'
                  : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#62748A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {worker.freeToWorkNow ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <span className="block text-base font-bold">
                    {t('workerHome.freeToggleLabel')}
                  </span>
                  <span className="block text-sm font-medium">
                    {worker.freeToWorkNow
                      ? t('workerHome.freeYes')
                      : t('workerHome.freeNo')}
                  </span>
                </div>
              </div>

              <span
                dir="ltr"
                aria-hidden="true"
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  worker.freeToWorkNow ? 'bg-[#16865B]' : 'bg-[#CBD5E1]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    worker.freeToWorkNow ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Quick Worker Actions */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/worker/work')}
            >
              <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('workerHome.quickWork')}</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/worker/bookings')}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('workerHome.quickBookings')}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/worker/prices')}
            >
              <span>{t('workerHome.quickPrices')}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/workers/${worker.id}`)}
            >
              <Eye className="h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>{t('workerHome.myPublicProfile')}</span>
            </Button>
          </div>

          {/* Service Areas Summary */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#62748A]">
                {t('workerHome.yourServiceAreas')}
              </p>
              <div className="flex items-center gap-2 text-base font-bold text-[#102A43]">
                <MapPin className="h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
                <span>
                  {localizedAreas.length > 0
                    ? `${localizedAreas.join(isUrdu ? '، ' : ', ')} (${localizedCity})`
                    : t('workerHome.noAreasChosen')}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/worker/profile')}
            >
              <Settings className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
              <span>{t('workerHome.changeServiceAreas')}</span>
            </Button>
          </div>
        </section>

        {/* Jobs Near You */}
        <section aria-labelledby="worker-jobs-near-you" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="worker-jobs-near-you" className="text-xl font-bold text-[#102A43] sm:text-2xl">
                {t('workerHome.jobsNearYouTitle')}
              </h2>
              <p className="mt-0.5 text-base text-[#62748A] tabular-nums">
                {matchingJobs.length === 1
                  ? t('workerHome.matchingCountOne')
                  : t('workerHome.matchingCountMany', { n: matchingJobs.length })}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/worker/jobs')}
            >
              <Briefcase className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('workerHome.quickJobs')}</span>
            </Button>
          </div>

          {matchingJobs.length === 0 ? (
            <Card className="py-10 text-center">
              <h3 className="text-lg font-bold text-[#102A43]">
                {t('workerHome.noJobsEmpty')}
              </h3>
              <p className="mt-2 text-base text-[#62748A]">
                {t('workerHome.noJobsEmptyDesc')}
              </p>
              <div className="mt-5 flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/worker/profile')}
                >
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  <span>{t('workerHome.changeAreasLink')}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {matchingJobs.map((item) => (
                <WorkerJobCard
                  key={item.job.id}
                  job={item.job}
                  workforceLabel={item.workforceLabel}
                  whySeeingReason={item.whySeeingReason}
                  availabilityNote={item.availabilityNote}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
};
