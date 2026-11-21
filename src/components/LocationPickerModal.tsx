import React, { useState } from 'react';
import { Check, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { SAMPLE_CITIES, findNearestSampleArea, searchSampleAreas } from '../data/locations';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedAreaName, getLocalizedCityName } from '../i18n';
import { Location, PakistaniCity } from '../types';
import { INPUT_LIMITS } from '../utils/validation';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Location;
  onSelectLocation: (loc: Location) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const { t, lang, isUrdu } = useTranslation();

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<PakistaniCity | 'ALL'>('ALL');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error' | 'matched'>('idle');
  const [gpsMessage, setGpsMessage] = useState('');

  const areas = searchSampleAreas(search, cityFilter);

  const handlePickArea = (city: PakistaniCity, areaName: string) => {
    onSelectLocation({ city, area: areaName });
    setGpsStatus('idle');
    setGpsMessage('');
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage(t('loc.locationErrorUnsupported'));
      return;
    }

    setGpsStatus('loading');
    setGpsMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const matched = findNearestSampleArea(pos.coords.latitude, pos.coords.longitude);
        onSelectLocation(matched);
        setGpsStatus('matched');
        setGpsMessage(
          t('loc.detectedArea', {
            area: getLocalizedAreaName(matched.area, areas, lang),
            city: getLocalizedCityName(matched.city, lang),
          })
        );
        window.setTimeout(() => {
          onClose();
        }, 650);
      },
      () => {
        setGpsStatus('error');
        setGpsMessage(t('loc.locationErrorDenied'));
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('loc.chooseTitle')}
      description={t('loc.chooseHint')}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#D2E3FC] bg-[#EFF6FF] p-3.5">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleUseCurrentLocation}
            disabled={gpsStatus === 'loading'}
          >
            <LocateFixed className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {gpsStatus === 'loading' ? t('loc.findingArea') : t('loc.useCurrent')}
            </span>
          </Button>

          {gpsMessage && (
            <p
              role="status"
              className={`mt-2.5 text-center text-base font-semibold ${
                gpsStatus === 'error' ? 'text-[#D99018]' : 'text-[#16865B]'
              }`}
            >
              {gpsMessage}
            </p>
          )}
        </div>

        <div className="relative">
          <label htmlFor="area-search-input" className="sr-only">
            {t('loc.searchPlaceholder')}
          </label>
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#62748A]"
            aria-hidden="true"
          />
          <input
            id="area-search-input"
            type="text"
            value={search}
            maxLength={INPUT_LIMITS.AREA_MAX}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('loc.searchPlaceholder')}
            className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white ps-11 pe-11 text-base text-[#172B4D] placeholder:text-[#62748A] focus:border-[#1769E0] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('app.close')}
              className="absolute end-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#62748A] hover:bg-[#F1F5F9] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={t('loc.chooseTitle')}>
          <button
            type="button"
            onClick={() => setCityFilter('ALL')}
            className={`min-h-[48px] rounded-xl border px-3.5 text-base font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              cityFilter === 'ALL'
                ? 'border-[#1769E0] bg-[#1769E0] text-white'
                : 'border-[#CBD5E1] bg-white text-[#172B4D] hover:bg-[#F8FAFC]'
            }`}
          >
            {t('loc.allCities')}
          </button>
          {SAMPLE_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setCityFilter(city)}
              className={`min-h-[48px] rounded-xl border px-3.5 text-base font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                cityFilter === city
                  ? 'border-[#1769E0] bg-[#1769E0] text-white'
                  : 'border-[#CBD5E1] bg-white text-[#172B4D] hover:bg-[#F8FAFC]'
              }`}
            >
              {getLocalizedCityName(city, lang)}
            </button>
          ))}
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
          {areas.length === 0 ? (
            <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-6 text-center">
              <p className="text-base font-semibold text-[#102A43]">
                {t('loc.noAreasFound')}
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setCityFilter('ALL');
                  }}
                >
                  <span>{t('workersPage.clearFilters')}</span>
                </Button>
              </div>
            </div>
          ) : (
            areas.map((item) => {
              const isSelected =
                currentLocation.city === item.city && currentLocation.area === item.name;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePickArea(item.city, item.name)}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-start transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#1769E0] bg-[#EFF6FF]'
                      : 'border-[#E3EAF3] bg-white hover:border-[#1769E0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <MapPin
                      className={`h-5 w-5 shrink-0 ${
                        isSelected ? 'text-[#1769E0]' : 'text-[#62748A]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-[#102A43] truncate">
                        {isUrdu ? item.nameUr : item.name}
                      </span>
                      <span className="block text-sm text-[#62748A]">
                        {getLocalizedCityName(item.city, lang)}
                      </span>
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="h-5 w-5 shrink-0 text-[#1769E0]" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
