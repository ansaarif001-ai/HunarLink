import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import { RoleGuard } from '../components/RoleGuard';
import { WorkerJobCard } from '../components/WorkerJobCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedAreaName, getLocalizedCategoryName } from '../i18n';
import { UserRole } from '../types';
import {
  JobBudgetFilter,
  JobSortOption,
  JobWorkersFilter,
  getMatchingJobsWithDetails,
} from '../utils/matching';
import { INPUT_LIMITS } from '../utils/validation';

export const WorkerJobsPage: React.FC = () => {
  const { state, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const worker = activeWorker || state.workers[0];

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [budgetRange, setBudgetRange] = useState<JobBudgetFilter>('ALL');
  const [workersFilter, setWorkersFilter] = useState<JobWorkersFilter>('ALL');
  const [sortBy, setSortBy] = useState<JobSortOption>('newest');

  const totalMatching = useMemo(
    () => getMatchingJobsWithDetails(state.jobs, worker, state.categories, {}, lang),
    [state.jobs, worker, state.categories, lang]
  );

  const filteredMatching = useMemo(
    () =>
      getMatchingJobsWithDetails(
        state.jobs,
        worker,
        state.categories,
        {
          query,
          categoryId,
          area,
          budgetRange,
          workersFilter,
          sortBy,
        },
        lang
      ),
    [state.jobs, worker, state.categories, query, categoryId, area, budgetRange, workersFilter, sortBy, lang]
  );

  const workerCategory = state.categories.find((c) => c.id === worker.categoryId);
  const localizedSkill = workerCategory
    ? getLocalizedCategoryName(workerCategory, lang)
    : t('common.worker');
  const localizedAreasList =
    worker.serviceAreas.length > 0
      ? worker.serviceAreas
          .map((sa) => getLocalizedAreaName(sa, SAMPLE_AREAS, lang))
          .join(isUrdu ? '، ' : ', ')
      : t('workerJobs.noAreasSelected');

  const hasFilters =
    Boolean(query.trim()) ||
    categoryId !== 'ALL' ||
    area !== 'ALL' ||
    budgetRange !== 'ALL' ||
    workersFilter !== 'ALL';

  const clearFilters = () => {
    setQuery('');
    setCategoryId('ALL');
    setArea('ALL');
    setBudgetRange('ALL');
    setWorkersFilter('ALL');
    setSortBy('newest');
  };

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/worker')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.backHome')}</span>
          </Button>

          <Button variant="secondary" size="md" onClick={() => navigate('/worker/profile')}>
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span>{t('workerJobs.changeAreasBtn')}</span>
          </Button>
        </div>

        {/* Not Free Now Note (still shows jobs as required) */}
        {!worker.freeToWorkNow && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-base font-semibold text-[#92400E]"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('workerJobs.notFreeBanner')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/worker')}>
              <span>{t('workerJobs.turnOnHome')}</span>
            </Button>
          </div>
        )}

        {/* Header + Search + Filters + Sort */}
        <section className="space-y-5 rounded-2xl border border-[#E3EAF3] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('workerJobs.title')}
              </h1>
              <p className="mt-1 text-base text-[#62748A]">
                {t('workerJobs.matchingSummary', {
                  skill: localizedSkill,
                  areas: localizedAreasList,
                })}
              </p>
            </div>

            <span className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-base font-bold text-[#1769E0] tabular-nums">
              {filteredMatching.length === 1
                ? t('workerJobs.matchingCountOne')
                : t('workerJobs.matchingCountMany', { n: filteredMatching.length })}
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#62748A]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              maxLength={INPUT_LIMITS.SEARCH_MAX}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('workerJobs.searchPlaceholder')}
              aria-label={t('workerJobs.searchAria')}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white ps-12 pe-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
          </div>

          {/* Filters + Sort */}
          <div className="grid grid-cols-1 gap-3 border-t border-[#E3EAF3] pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="wj-cat" className="mb-1 block text-sm font-bold text-[#102A43]">
                {t('workerJobs.filterCategory')}
              </label>
              <select
                id="wj-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="ALL">{t('workerJobs.categoryAll')}</option>
                {state.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getLocalizedCategoryName(cat, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wj-area" className="mb-1 block text-sm font-bold text-[#102A43]">
                {t('workerJobs.filterArea')}
              </label>
              <select
                id="wj-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="ALL">{t('workerJobs.areaAll')}</option>
                {worker.serviceAreas.map((sa) => (
                  <option key={sa} value={sa}>
                    {getLocalizedAreaName(sa, SAMPLE_AREAS, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wj-budget" className="mb-1 block text-sm font-bold text-[#102A43]">
                {t('workerJobs.filterPrice')}
              </label>
              <select
                id="wj-budget"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value as JobBudgetFilter)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="ALL">{t('workerJobs.priceAll')}</option>
                <option value="OPEN">{t('workerJobs.priceOpen')}</option>
                <option value="UNDER_5K">{t('workerJobs.priceUnder5k')}</option>
                <option value="5K_TO_25K">{t('workerJobs.price5k25k')}</option>
                <option value="OVER_25K">{t('workerJobs.priceOver25k')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="wj-workers" className="mb-1 block text-sm font-bold text-[#102A43]">
                {t('workerJobs.filterWorkers')}
              </label>
              <select
                id="wj-workers"
                value={workersFilter}
                onChange={(e) => setWorkersFilter(e.target.value as JobWorkersFilter)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="ALL">{t('workerJobs.workersAll')}</option>
                <option value="ONE">{t('workerJobs.workersOne')}</option>
                <option value="TWO_PLUS">{t('workerJobs.workersTwoPlus')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="wj-sort" className="mb-1 block text-sm font-bold text-[#102A43]">
                {t('workerJobs.sortNewest')}
              </label>
              <select
                id="wj-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as JobSortOption)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="newest">{t('workerJobs.sortNewest')}</option>
                <option value="highest_price">{t('workerJobs.sortHighest')}</option>
                <option value="closest_area">{t('workerJobs.sortClosest')}</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-[#1769E0] hover:underline cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{t('workerJobs.clearFilters')}</span>
              </button>
            </div>
          )}
        </section>

        {/* Results or Friendly Empty State */}
        {totalMatching.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
              <Briefcase className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#102A43]">
              {t('workerJobs.emptyTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base text-[#62748A]">
              {t('workerJobs.emptyDesc')}
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/profile')}>
                <MapPin className="h-5 w-5" aria-hidden="true" />
                <span>{t('workerJobs.changeAreasBtn')}</span>
              </Button>
            </div>
          </Card>
        ) : filteredMatching.length === 0 ? (
          <Card className="py-12 text-center">
            <h2 className="text-xl font-bold text-[#102A43]">
              {t('workerJobs.noFilterMatchTitle')}
            </h2>
            <p className="mt-2 text-base text-[#62748A]">
              {t('workerJobs.noFilterMatchDesc', { n: totalMatching.length })}
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="primary" size="lg" onClick={clearFilters}>
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                <span>{t('workerJobs.clearFilters')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredMatching.map((item) => (
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
      </div>
    </RoleGuard>
  );
};
