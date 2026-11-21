import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, CheckCircle2, MapPin, RotateCcw, SearchX } from 'lucide-react';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { SearchBar } from '../components/SearchBar';
import { WorkerCard } from '../components/WorkerCard';
import { Button } from '../components/ui/Button';
import { SAMPLE_AREAS } from '../data/locations';
import { CITIES } from '../data/seedData';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  getLocalizedAreaName,
  getLocalizedCategoryName,
  getLocalizedCityName,
  getLocalizedLocationLabel,
} from '../i18n';
import { WorkerType } from '../types';
import { getMatchingWorkersForCustomer } from '../utils/matching';

export const CategoryWorkersPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const activeCategory = slug
    ? state.categories.find((c) => c.slug === slug)
    : undefined;

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState<string>(
    () => searchParams.get('city') || 'ALL'
  );
  const [onlyChosenArea, setOnlyChosenArea] = useState<boolean>(
    () => Boolean(searchParams.get('area'))
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [freeNowOnly, setFreeNowOnly] = useState<boolean>(false);
  const [workerType, setWorkerType] = useState<WorkerType | 'ALL'>('ALL');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    const cityParam = searchParams.get('city');
    if (cityParam) setSelectedCity(cityParam);
  }, [searchParams]);

  const handleQueryChange = (next: string) => {
    setQuery(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next.trim()) {
      nextParams.set('q', next);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCity('ALL');
    setOnlyChosenArea(false);
    setMinRating(0);
    setFreeNowOnly(false);
    setWorkerType('ALL');
    setSearchParams({}, { replace: true });
  };

  const chosenArea = searchParams.get('area') || state.selectedLocation.area;
  const localizedChosenArea = getLocalizedAreaName(chosenArea, SAMPLE_AREAS, lang);

  const filtered = getMatchingWorkersForCustomer(state.workers, state.categories, {
    query,
    categoryId: activeCategory?.id,
    city: selectedCity,
    area: onlyChosenArea ? chosenArea : undefined,
    minRating,
    freeNowOnly,
    workerType,
  });

  if (slug && !activeCategory) {
    return (
      <div className="rounded-2xl border border-[#E3EAF3] bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-[#102A43]">
          {t('workersPage.notFoundTitle')}
        </h1>
        <p className="mt-2 text-base text-[#62748A]">{t('workersPage.notFoundDesc')}</p>
        <div className="mt-5 flex justify-center">
          <Button variant="primary" onClick={() => navigate('/customer')}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.backHome')}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="md" onClick={() => navigate('/customer')}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.back')}</span>
        </Button>

        {activeCategory && (
          <Button variant="secondary" size="md" onClick={() => navigate('/workers')}>
            <span>{t('workersPage.showAllServices')}</span>
          </Button>
        )}
      </div>

      {/* Chosen Area Bar + Search + Filters */}
      <section className="space-y-5 rounded-2xl border border-[#E3EAF3] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D2E3FC] bg-[#EFF6FF] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-[#102A43]">
            <MapPin className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
            <span>
              {t('custHome.locationLabel')}{' '}
              {getLocalizedLocationLabel(
                state.selectedLocation.area,
                state.selectedLocation.city,
                SAMPLE_AREAS,
                lang
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyChosenArea((prev) => !prev)}
              aria-pressed={onlyChosenArea}
              className={`min-h-[48px] rounded-xl border px-3.5 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                onlyChosenArea
                  ? 'border-[#1769E0] bg-[#1769E0] text-white'
                  : 'border-[#CBD5E1] bg-white text-[#172B4D] hover:border-[#1769E0]'
              }`}
            >
              {onlyChosenArea
                ? t('workersPage.onlyArea', { area: localizedChosenArea })
                : t('workersPage.filterAreaBtn', { area: localizedChosenArea })}
            </button>
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="min-h-[48px] rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-sm font-semibold text-[#1769E0] hover:border-[#1769E0] cursor-pointer whitespace-nowrap"
            >
              {t('loc.changeLocation')}
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
            {activeCategory
              ? getLocalizedCategoryName(activeCategory, lang)
              : t('workersPage.allTitle')}
          </h1>
          <p className="mt-1.5 text-base text-[#62748A]">
            {activeCategory && !isUrdu
              ? activeCategory.subSkills.join(' · ')
              : t('workersPage.searchSubtitle')}
          </p>
        </div>

        <SearchBar value={query} onChange={handleQueryChange} />

        {/* Filters: City, Rating, Worker Type, Free to work now */}
        <div className="grid grid-cols-1 gap-3 border-t border-[#E3EAF3] pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filter-city"
              className="mb-1.5 block text-base font-semibold text-[#172B4D]"
            >
              {t('workersPage.cityLabel')}
            </label>
            <select
              id="filter-city"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setOnlyChosenArea(false);
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            >
              <option value="ALL">{t('workersPage.allCities')}</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {getLocalizedCityName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-rating"
              className="mb-1.5 block text-base font-semibold text-[#172B4D]"
            >
              {t('workersPage.minStars')}
            </label>
            <select
              id="filter-rating"
              value={String(minRating)}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            >
              <option value="0">{t('workersPage.anyRating')}</option>
              <option value="4.5">{t('workersPage.rating45Plus')}</option>
              <option value="4.8">{t('workersPage.rating48Plus')}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-worker-type"
              className="mb-1.5 block text-base font-semibold text-[#172B4D]"
            >
              {t('workersPage.filterType')}
            </label>
            <select
              id="filter-worker-type"
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value as WorkerType | 'ALL')}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            >
              <option value="ALL">{t('workersPage.allTypes')}</option>
              <option value="One person">{t('workerType.one')}</option>
              <option value="Contractor">{t('workerType.contractor')}</option>
              <option value="Team">{t('workerType.team')}</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              aria-pressed={freeNowOnly}
              onClick={() => setFreeNowOnly((prev) => !prev)}
              className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-base font-semibold transition-colors cursor-pointer ${
                freeNowOnly
                  ? 'border-[#16865B] bg-[#F0FDF4] text-[#16865B]'
                  : 'border-[#CBD5E1] bg-white text-[#172B4D] hover:bg-[#F8FAFC]'
              }`}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('workersPage.freeNowOnly')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-base font-semibold text-[#62748A]">
        <span className="tabular-nums text-[#102A43]">
          {filtered.length === 1
            ? t('workersPage.workerFoundOne')
            : t('workersPage.workerFoundMany', { n: filtered.length })}
        </span>
        {(query ||
          selectedCity !== 'ALL' ||
          onlyChosenArea ||
          minRating > 0 ||
          freeNowOnly ||
          workerType !== 'ALL') && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-lg px-2 text-base font-semibold text-[#1769E0] hover:underline cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{t('workersPage.clearSearch')}</span>
          </button>
        )}
      </div>

      {/* Results Grid or Friendly Empty Message */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E3EAF3] bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#102A43]">
            {t('workersPage.emptyTitleNew')}
          </h2>
          <p className="mt-2 text-base text-[#62748A]">{t('workersPage.emptyDescNew')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="lg" onClick={clearAllFilters}>
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              <span>{t('workersPage.clearSearch')}</span>
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/customer')}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              <span>{t('app.backHome')}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={state.selectedLocation}
        onSelectLocation={(loc) => {
          dispatch({ type: 'SET_CUSTOMER_LOCATION', location: loc });
          setSelectedCity(loc.city);
          setOnlyChosenArea(true);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('city', loc.city);
          nextParams.set('area', loc.area);
          setSearchParams(nextParams, { replace: true });
        }}
      />
    </div>
  );
};
