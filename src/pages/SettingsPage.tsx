import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_AREAS, SAMPLE_CITIES, getAreasForCity } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCityName, getLocalizedLocationLabel } from '../i18n';
import { Location, UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { state, dispatch, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isWorker = state.activeRole === UserRole.Worker;
  const homePath = isWorker ? '/worker' : '/customer';
  const editProfilePath = isWorker ? '/worker/profile?edit=1' : '/profile?edit=1';

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [serviceAreasOpen, setServiceAreasOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [draftServiceAreas, setDraftServiceAreas] = useState<string[]>(
    activeWorker?.serviceAreas || []
  );

  useEffect(() => {
    if (activeWorker) {
      setDraftServiceAreas(activeWorker.serviceAreas);
    }
  }, [activeWorker?.id, activeWorker?.serviceAreas]);

  const notificationsEnabled = Object.values(state.alertPreferences).some(Boolean);

  const customerAreaLabel = getLocalizedLocationLabel(
    state.selectedLocation.area,
    state.selectedLocation.city,
    SAMPLE_AREAS,
    lang
  );

  const handleToggleAllAlerts = () => {
    dispatch({ type: 'TOGGLE_ALL_ALERTS', enabled: !notificationsEnabled });
  };

  const handleSelectCustomerLocation = (loc: Location) => {
    dispatch({ type: 'SET_CUSTOMER_LOCATION', location: loc });
    const formatted = getLocalizedLocationLabel(loc.area, loc.city, SAMPLE_AREAS, lang);
    showToast(t('settings.locationSaved', { area: formatted }), 'success');
  };

  const toggleDraftArea = (areaName: string) => {
    setDraftServiceAreas((prev) =>
      prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
    );
  };

  const handleSaveServiceAreas = () => {
    if (draftServiceAreas.length === 0 || !activeWorker) return;
    dispatch({
      type: 'UPDATE_WORKER_SERVICE_AREAS',
      workerId: activeWorker.id,
      serviceAreas: draftServiceAreas,
    });
    setServiceAreasOpen(false);
    showToast(t('settings.serviceAreasSaved'), 'success');
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    dispatch({ type: 'LOG_OUT' });
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div>
        <Button variant="outline" size="md" onClick={() => navigate(homePath)}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>
      </div>

      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
          {t('settings.title')}
        </h1>
      </section>

      {/* Group 1: Account */}
      <div className="space-y-2">
        <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-[#62748A]">
          {t('settings.groupAccount')}
        </h2>
        <Card padding="none" className="divide-y divide-[#E3EAF3] overflow-hidden">
          <button
            type="button"
            onClick={() => navigate(editProfilePath)}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('custProfile.editProfile')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.editProfileSub')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isWorker) {
                setDraftServiceAreas(activeWorker?.serviceAreas || []);
                setServiceAreasOpen(true);
              } else {
                setLocationModalOpen(true);
              }
            }}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {isWorker ? t('workerHome.changeServiceAreas') : t('custProfile.areaFieldLabel')}
                </p>
                <p className="truncate text-sm text-[#62748A]">
                  {isWorker
                    ? t('settings.serviceAreasSub', {
                        n: activeWorker?.serviceAreas.length || 0,
                      })
                    : t('settings.areaAccountSub', { area: customerAreaLabel })}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>
        </Card>
      </div>

      {/* Group 2: Preferences */}
      <div className="space-y-2">
        <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-[#62748A]">
          {t('settings.groupPreferences')}
        </h2>
        <Card padding="none" className="divide-y divide-[#E3EAF3] overflow-hidden">
          <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <Globe className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('settings.languageTitle')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.languageSub')}</p>
              </div>
            </div>
            <LanguageSwitch compact />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={handleToggleAllAlerts}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('settings.notificationsTitle')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.notificationsSub')}</p>
              </div>
            </div>

            <span
              dir="ltr"
              aria-hidden="true"
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-[#1769E0]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </Card>
      </div>

      {/* Group 3: Support */}
      <div className="space-y-2">
        <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-[#62748A]">
          {t('settings.groupSupport')}
        </h2>
        <Card padding="none" className="divide-y divide-[#E3EAF3] overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('settings.helpReportTitle')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.helpReportSub')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/about')}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <Info className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('settings.aboutTitle')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.aboutSub')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/safety')}
            className="flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors hover:bg-[#F8FAFC] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#102A43]">
                  {t('settings.safetyTitle')}
                </p>
                <p className="text-sm text-[#62748A]">{t('settings.safetySub')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#62748A] rtl:rotate-180" aria-hidden="true" />
          </button>
        </Card>
      </div>

      {/* Bottom: Red Outlined Log Out Button */}
      <div className="pt-2">
        <Button
          variant="dangerOutline"
          size="lg"
          fullWidth
          onClick={() => setLogoutConfirmOpen(true)}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>{t('profileMenu.logOut')}</span>
        </Button>
      </div>

      {/* Customer Location Picker Modal */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={state.selectedLocation}
        onSelectLocation={handleSelectCustomerLocation}
      />

      {/* Worker Service Areas Modal */}
      <Modal
        isOpen={serviceAreasOpen}
        onClose={() => setServiceAreasOpen(false)}
        title={t('workerHome.changeServiceAreas')}
        description={t('workerProfile.areasSectionDesc')}
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4">
          <div className="max-h-80 space-y-4 overflow-y-auto pe-1">
            {SAMPLE_CITIES.map((cityName) => {
              const areas = getAreasForCity(cityName);
              return (
                <div key={cityName} className="space-y-2">
                  <h3 className="text-base font-bold text-[#102A43]">
                    {getLocalizedCityName(cityName, lang)}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {areas.map((area) => {
                      const checked = draftServiceAreas.includes(area.name);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() => toggleDraftArea(area.name)}
                          className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border-2 px-3.5 py-2 text-start text-base font-semibold transition-colors cursor-pointer ${
                            checked
                              ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                              : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                          }`}
                        >
                          <span className="truncate">
                            {isUrdu ? area.nameUr : area.name}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                              checked
                                ? 'border-[#1769E0] bg-[#1769E0] text-white'
                                : 'border-[#CBD5E1] bg-white'
                            }`}
                          >
                            {checked && <Check className="h-4 w-4" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#E3EAF3] pt-4">
            <Button variant="outline" size="md" onClick={() => setServiceAreasOpen(false)}>
              <span>{t('app.cancel')}</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={draftServiceAreas.length === 0}
              onClick={handleSaveServiceAreas}
            >
              <span>{t('settings.saveAreasBtn')}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log Out Confirmation */}
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title={t('profileMenu.logOutConfirmTitle')}
        message={t('profileMenu.logOutConfirmMsg')}
        confirmLabel={t('profileMenu.logOutConfirmYes')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />
    </div>
  );
};
