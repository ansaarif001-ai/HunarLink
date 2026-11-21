import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AirVent,
  BrickWall,
  Droplets,
  Hammer,
  LayoutGrid,
  LocateFixed,
  MapPin,
  PaintRoller,
  PlusCircle,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { CategoryCard } from '../components/CategoryCard';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { WorkerCard } from '../components/WorkerCard';
import { Button } from '../components/ui/Button';
import { SAMPLE_AREAS, findNearestSampleArea } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  getLocalizedCategoryName,
  getLocalizedLocationLabel,
} from '../i18n';
import { INPUT_LIMITS } from '../utils/validation';

interface QuickServiceItem {
  id: string;
  categorySlug: string | null;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_SERVICES: QuickServiceItem[] = [
  { id: 'qs_electrician', categorySlug: 'electrical-services', icon: Zap },
  { id: 'qs_plumber', categorySlug: 'plumbing-water-services', icon: Droplets },
  { id: 'qs_carpenter', categorySlug: 'carpentry-woodwork', icon: Hammer },
  { id: 'qs_painter', categorySlug: 'painting-wall-finishing', icon: PaintRoller },
  { id: 'qs_mason', categorySlug: 'construction-house-building', icon: BrickWall },
  { id: 'qs_ac', categorySlug: 'ac-appliance-repair', icon: AirVent },
  { id: 'qs_cleaning', categorySlug: 'cleaning-household-services', icon: Sparkles },
  { id: 'qs_all', categorySlug: null, icon: LayoutGrid },
];

export const CustomerHomePage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const categoriesRef = useRef<HTMLElement>(null);

  const [workText, setWorkText] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<{ type: 'ok' | 'info'; text: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const chosenLocation = state.selectedLocation;
  const selectedQuickService = QUICK_SERVICES.find((s) => s.id === selectedServiceId);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsNotice({
        type: 'info',
        text: t('loc.locationErrorUnsupported'),
      });
      setLocationModalOpen(true);
      return;
    }

    setGpsLoading(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const matched = findNearestSampleArea(pos.coords.latitude, pos.coords.longitude);
        dispatch({ type: 'SET_CUSTOMER_LOCATION', location: matched });
        setGpsLoading(false);
        setGpsNotice({
          type: 'ok',
          text: t('loc.detectedArea', {
            area: matched.area,
            city: matched.city,
          }),
        });
      },
      () => {
        setGpsLoading(false);
        setGpsNotice({
          type: 'info',
          text: t('loc.locationErrorDenied'),
        });
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  const handleQuickServiceTap = (item: QuickServiceItem) => {
    if (item.categorySlug === null) {
      categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSelectedServiceId((prev) => (prev === item.id ? null : item.id));
  };

  const handleFindNearbyWorkers = () => {
    const params = new URLSearchParams();
    params.set('city', chosenLocation.city);
    params.set('area', chosenLocation.area);
    const trimmed = workText.trim();
    if (trimmed) {
      params.set('q', trimmed);
    }

    if (selectedQuickService?.categorySlug) {
      navigate(`/category/${selectedQuickService.categorySlug}?${params.toString()}`);
      return;
    }

    navigate(`/workers?${params.toString()}`);
  };

  // Prioritize workers in the chosen area/city for "Top workers near you"
  const topWorkersNearYou = useMemo(() => {
    const scored = [...state.workers].map((w) => {
      const sameArea =
        w.area.toLowerCase() === chosenLocation.area.toLowerCase() ||
        w.serviceAreas.some((sa) => sa.toLowerCase() === chosenLocation.area.toLowerCase());
      const sameCity = w.city === chosenLocation.city;
      const score = (sameArea ? 100 : sameCity ? 50 : 0) + w.rating;
      return { worker: w, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((item) => item.worker);
  }, [state.workers, chosenLocation]);

  const workerCountByCategory = (categoryId: string) =>
    state.workers.filter((w) => w.categoryId === categoryId).length;

  return (
    <div className="space-y-10">
      {/* Main Simple Customer Action Box */}
      <section className="rounded-2xl border border-[#E3EAF3] bg-white p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] sm:p-8">
        {/* 1. Where do you need a worker? */}
        <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-base font-bold text-[#102A43]">
                {t('custHome.locationBoxTitle')}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-[#1769E0]">
                <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  {getLocalizedLocationLabel(
                    chosenLocation.area,
                    chosenLocation.city,
                    SAMPLE_AREAS,
                    lang
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={handleUseCurrentLocation}
                disabled={gpsLoading}
              >
                <LocateFixed className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  {gpsLoading ? t('loc.findingArea') : t('loc.useCurrent')}
                </span>
              </Button>

              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="min-h-[48px] rounded-xl border border-[#CBD5E1] bg-white px-4 text-base font-semibold text-[#172B4D] hover:border-[#1769E0] hover:text-[#1769E0] cursor-pointer whitespace-nowrap"
              >
                {t('loc.changeLocation')}
              </button>
            </div>
          </div>

          {gpsNotice && (
            <p
              role="status"
              className={`mt-3 text-base font-semibold ${
                gpsNotice.type === 'ok' ? 'text-[#16865B]' : 'text-[#D99018]'
              }`}
            >
              {gpsNotice.text}
            </p>
          )}
        </div>

        {/* 2. What work do you need? */}
        <div className="mt-6 space-y-2">
          <label
            htmlFor="customer-work-input"
            className="block text-xl font-extrabold text-[#102A43] sm:text-2xl"
          >
            {t('custHome.workInputLabel')}
          </label>
          <textarea
            id="customer-work-input"
            rows={3}
            value={workText}
            maxLength={INPUT_LIMITS.DESCRIPTION_MAX}
            onChange={(e) => setWorkText(e.target.value)}
            placeholder={t('post.descPlaceholder')}
            className="w-full rounded-xl border-2 border-[#93C5FD] bg-[#EFF6FF] p-4 text-base text-[#172B4D] placeholder:text-[#62748A] focus:border-[#1769E0] focus:bg-white focus:outline-none"
          />
        </div>

        {/* 3. Or choose a service */}
        <div className="mt-6 space-y-3">
          <p className="text-base font-bold text-[#102A43]">{t('custHome.orPickService')}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_SERVICES.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServiceId === service.id;
              const cat = service.categorySlug
                ? state.categories.find((c) => c.slug === service.categorySlug)
                : undefined;
              const label = cat
                ? getLocalizedCategoryName(cat, lang)
                : t('custHome.seeAllServicesShort');

              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={service.categorySlug ? isSelected : undefined}
                  onClick={() => handleQuickServiceTap(service)}
                  className={`flex min-h-[68px] items-center gap-3 rounded-xl border-2 p-3.5 text-start transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                      : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-[#1769E0] text-white' : 'bg-[#EFF6FF] text-[#1769E0]'
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="min-w-0 text-base font-bold leading-snug line-clamp-2">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Two Big Buttons: Find Nearby Workers & Post My Request */}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleFindNearbyWorkers}
            className="min-h-[56px] text-lg"
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('custHome.findWorkersBtn')}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => {
              const params = new URLSearchParams();
              const trimmed = workText.trim();
              if (trimmed) params.set('desc', trimmed);
              if (selectedQuickService?.categorySlug) {
                const matchedCat = state.categories.find(
                  (c) => c.slug === selectedQuickService.categorySlug
                );
                if (matchedCat) params.set('cat', matchedCat.id);
              }
              const qs = params.toString();
              navigate(qs ? `/post-request?${qs}` : '/post-request');
            }}
            className="min-h-[56px] border-2 border-[#CBD5E1] text-lg"
          >
            <PlusCircle className="h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>{t('custHome.postRequestBtn')}</span>
          </Button>
        </div>
      </section>

      {/* 15 Picture Categories */}
      <section
        ref={categoriesRef}
        aria-labelledby="customer-categories-title"
        className="space-y-4"
      >
        <h2
          id="customer-categories-title"
          className="text-xl font-bold text-[#102A43] sm:text-2xl"
        >
          {t('custHome.all15Title')}
        </h2>
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {state.categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              workerCount={workerCountByCategory(cat.id)}
            />
          ))}
        </div>
      </section>

      {/* Top Workers Near You */}
      <section aria-labelledby="top-workers-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="top-workers-title" className="text-xl font-bold text-[#102A43] sm:text-2xl">
              {t('custHome.topWorkersNear', {
                area: chosenLocation.area,
                city: chosenLocation.city,
              })}
            </h2>
            <p className="mt-0.5 text-base text-[#62748A]">{t('custHome.topWorkersSub')}</p>
          </div>
          <Button variant="outline" size="md" onClick={() => navigate('/workers')}>
            <Users className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
            <span>{t('custHome.seeAllWorkers')}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topWorkersNearYou.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      </section>

      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={chosenLocation}
        onSelectLocation={(loc) => {
          dispatch({ type: 'SET_CUSTOMER_LOCATION', location: loc });
          setGpsNotice({
            type: 'ok',
            text: t('loc.detectedArea', { area: loc.area, city: loc.city }),
          });
        }}
      />
    </div>
  );
};
