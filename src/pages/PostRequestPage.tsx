import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  ImagePlus,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  PlusCircle,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { CategoryArtwork } from '../components/CategoryArtwork';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { PhotoTile } from '../components/PhotoTile';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SAMPLE_AREAS, findNearestSampleArea } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { JobUrgency, Location, PhotoMedia, UserRole, WorkforceType } from '../types';
import { suggestCategoryFromText } from '../utils/matching';
import { processSafeImageFiles } from '../utils/photoSafety';
import { formatPkr } from '../utils/pricing';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

export const PostRequestPage: React.FC = () => {
  const { state, dispatch, storageError } = useAppStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCatId = useMemo(() => {
    const param = searchParams.get('cat');
    if (param && state.categories.some((c) => c.id === param)) return param;
    return '';
  }, [searchParams, state.categories]);

  const [step, setStep] = useState<number>(1);
  const [posted, setPosted] = useState(false);

  const [description, setDescription] = useState(() => searchParams.get('desc') || '');
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [location, setLocation] = useState<Location>(state.selectedLocation);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const [workforceType, setWorkforceType] = useState<WorkforceType>('one');
  const [workersNeeded, setWorkersNeeded] = useState<number>(2);

  const [openPrice, setOpenPrice] = useState<boolean>(false);
  const [budgetPkr, setBudgetPkr] = useState<number>(5000);
  const [materialsIncluded, setMaterialsIncluded] = useState<boolean>(false);

  const [urgency, setUrgency] = useState<JobUrgency>('This week');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoMedia[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [stepError, setStepError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const workforceOptions: Array<{
    value: WorkforceType;
    label: string;
    hint: string;
  }> = [
    { value: 'one', label: t('workforce.one'), hint: t('post.workforceOneHint') },
    { value: 'several', label: t('workforce.several'), hint: t('post.workforceSeveralHint') },
    { value: 'team', label: t('workforce.team'), hint: t('post.workforceTeamHint') },
    {
      value: 'contractor',
      label: t('workforce.contractor'),
      hint: t('post.workforceContractorHint'),
    },
    { value: 'either', label: t('workforce.either'), hint: t('post.workforceEitherHint') },
  ];

  const urgencyOptions: Array<{ value: JobUrgency; label: string }> = [
    { value: 'Today', label: t('urgency.Today') },
    { value: 'This week', label: t('urgency.This week') },
    { value: 'Flexible', label: t('urgency.Flexible') },
  ];

  const suggestedCategory = useMemo(() => {
    if (categoryId) return null;
    return suggestCategoryFromText(description, state.categories);
  }, [description, categoryId, state.categories]);

  const selectedCategory = state.categories.find((c) => c.id === categoryId);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsNotice(t('loc.locationErrorUnsupported'));
      setLocationModalOpen(true);
      return;
    }
    setGpsLoading(true);
    setGpsNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const matched = findNearestSampleArea(pos.coords.latitude, pos.coords.longitude);
        setLocation(matched);
        dispatch({ type: 'SET_CUSTOMER_LOCATION', location: matched });
        setGpsLoading(false);
        setGpsNotice(t('loc.detectedArea', { area: matched.area, city: matched.city }));
      },
      () => {
        setGpsLoading(false);
        setGpsNotice(t('loc.locationErrorDenied'));
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setProcessingPhotos(true);
    setPhotoErrors([]);
    const res = await processSafeImageFiles(files, {
      maxWidth: 1000,
      maxCount: 4,
      existingCount: photos.length,
      lang,
    });
    setPhotos((prev) => [...prev, ...res.photos].slice(0, 4));
    if (res.errors.length > 0) {
      setPhotoErrors(res.errors);
    }
    setProcessingPhotos(false);
    e.target.value = '';
  };

  const handleNext = () => {
    setStepError('');

    if (step === 1) {
      const cleanDesc = sanitizeText(description, INPUT_LIMITS.JOB_DESCRIPTION_MAX);
      if (!cleanDesc) {
        setStepError(t('post.errDesc'));
        return;
      }
      if (!categoryId) {
        if (suggestedCategory) {
          setStepError(
            t('post.errConfirmSuggested', {
              name: getLocalizedCategoryName(suggestedCategory.category, lang),
            })
          );
        } else {
          setStepError(t('post.errCategory'));
        }
        return;
      }
    }

    if (step === 2) {
      if (!location.area || !location.city) {
        setStepError(t('post.errArea'));
        return;
      }
    }

    if (step === 3) {
      if (
        (workforceType === 'several' || workforceType === 'team' || workforceType === 'contractor') &&
        (workersNeeded < 2 || workersNeeded > 20)
      ) {
        setStepError(t('post.errWorkersRange'));
        return;
      }
    }

    if (step === 4 && !openPrice) {
      if (!Number.isFinite(budgetPkr) || budgetPkr < INPUT_LIMITS.MIN_PKR) {
        setStepError(t('post.errPriceMin', { min: INPUT_LIMITS.MIN_PKR }));
        return;
      }
    }

    setStep((prev) => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setStepError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handlePostRequest = () => {
    const cleanDesc = sanitizeText(description, INPUT_LIMITS.JOB_DESCRIPTION_MAX);
    if (!cleanDesc || !categoryId || !location.area) {
      setStepError(t('post.errAllSteps'));
      return;
    }

    const finalWorkersCount =
      workforceType === 'one' || workforceType === 'either'
        ? 1
        : Math.max(2, Math.min(20, Math.round(workersNeeded)));

    dispatch({
      type: 'CREATE_JOB',
      description: cleanDesc,
      categoryId,
      city: location.city,
      area: location.area,
      budget: openPrice ? undefined : Math.round(budgetPkr),
      materialsIncluded,
      workforceType,
      workersNeeded: finalWorkersCount,
      urgency,
      preferredDate: preferredDate || undefined,
      photos,
      notes: extraNotes ? sanitizeText(extraNotes, INPUT_LIMITS.JOB_NOTES_MAX) : undefined,
    });

    setPosted(true);
  };

  const resetForm = () => {
    setStep(1);
    setPosted(false);
    setDescription('');
    setCategoryId('');
    setLocation(state.selectedLocation);
    setWorkforceType('one');
    setWorkersNeeded(2);
    setOpenPrice(false);
    setBudgetPkr(5000);
    setMaterialsIncluded(false);
    setUrgency('This week');
    setPreferredDate('');
    setPhotos([]);
    setPhotoErrors([]);
    setExtraNotes('');
    setStepError('');
  };

  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <RoleGuard allowedRole={UserRole.Customer}>
      <div className="mx-auto max-w-3xl space-y-6">
        {posted ? (
          <Card className="space-y-6 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16865B]">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('post.liveTitle')}
              </h1>
            </div>

            <div className="mx-auto max-w-md rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4 text-start text-base">
              <p className="font-bold text-[#102A43]">
                {sanitizeText(description, INPUT_LIMITS.JOB_TITLE_MAX)}
              </p>
              <p className="mt-1 text-sm text-[#62748A]">
                {selectedCategory ? getLocalizedCategoryName(selectedCategory, lang) : ''} ·{' '}
                {getLocalizedLocationLabel(location.area, location.city, SAMPLE_AREAS, lang)} ·{' '}
                <span className="ltr-num">
                  {openPrice ? t('common.openPrice') : formatPkr(budgetPkr, lang)}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/my-requests')}
                className="min-h-[52px]"
              >
                <FileText className="h-5 w-5" aria-hidden="true" />
                <span>{t('post.seeMyRequests')}</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={resetForm}
                className="min-h-[52px]"
              >
                <PlusCircle className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
                <span>{t('post.postAnother')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Top Bar + Progress Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="md" onClick={() => navigate('/customer')}>
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                <span>{t('app.backHome')}</span>
              </Button>

              <span className="text-base font-bold text-[#1769E0] tabular-nums">
                {step <= 5 ? t('post.stepOf', { step }) : t('post.summaryLabel')}
              </span>
            </div>

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-extrabold text-[#102A43]">{t('post.title')}</h1>
                <span className="text-sm font-semibold text-[#62748A] tabular-nums ltr-num">
                  {Math.min(100, Math.round((step / 6) * 100))}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-[#BFDBFE] bg-[#EFF6FF]">
                <div
                  className="h-full rounded-full bg-[#1769E0] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((step / 6) * 100))}%` }}
                />
              </div>

              {storageError && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-base font-semibold text-[#D64545]"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{storageError}</span>
                </div>
              )}
            </Card>

            {/* STEP 1: WHAT WORK DO YOU NEED? */}
            {step === 1 && (
              <Card className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="job-desc-input"
                    className="block text-xl font-extrabold text-[#102A43]"
                  >
                    1. {t('post.step1Title')}
                  </label>
                  <p className="text-base text-[#62748A]">{t('post.workDescHint')}</p>
                  <div className="relative">
                    <textarea
                      id="job-desc-input"
                      rows={4}
                      value={description}
                      maxLength={INPUT_LIMITS.JOB_DESCRIPTION_MAX}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setStepError('');
                      }}
                      placeholder={t('post.descPlaceholder')}
                      className="w-full rounded-xl border-2 border-[#93C5FD] bg-[#EFF6FF]/40 p-4 text-base text-[#172B4D] placeholder:text-[#62748A] focus:border-[#1769E0] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end text-sm text-[#62748A] tabular-nums ltr-num">
                    {description.length}/{INPUT_LIMITS.JOB_DESCRIPTION_MAX}
                  </div>
                </div>

                {suggestedCategory && (
                  <div className="flex flex-col gap-3 rounded-xl border-2 border-[#93C5FD] bg-[#EFF6FF] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <Sparkles
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]"
                        aria-hidden="true"
                      />
                      <p className="text-base font-bold text-[#102A43]">
                        {t('post.suggestedCat', {
                          name: getLocalizedCategoryName(suggestedCategory.category, lang),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setCategoryId(suggestedCategory.category.id);
                        setStepError('');
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {t('post.useSuggestion', {
                          name: getLocalizedCategoryName(suggestedCategory.category, lang),
                        })}
                      </span>
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-base font-bold text-[#102A43]">
                    {t('post.pickCategoryLabel')}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {state.categories.map((cat) => {
                      const active = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setStepError('');
                          }}
                          className={`overflow-hidden rounded-xl border-2 text-start transition-colors cursor-pointer ${
                            active
                              ? 'border-[#1769E0] bg-[#EFF6FF] ring-2 ring-[#BFDBFE]'
                              : 'border-[#E3EAF3] bg-white hover:border-[#1769E0]'
                          }`}
                        >
                          <CategoryArtwork category={cat} />
                          <div className="flex items-start justify-between gap-2 p-3">
                            <span className="block text-sm font-bold leading-snug text-[#102A43]">
                              {getLocalizedCategoryName(cat, lang)}
                            </span>
                            {active && (
                              <CheckCircle2
                                className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 2: WHERE? */}
            {step === 2 && (
              <Card className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    2. {t('post.step2Title')}
                  </h2>
                  <p className="mt-1 text-base text-[#62748A]">{t('post.areaSafetyNote')}</p>
                </div>

                <div className="rounded-xl border-2 border-[#BFDBFE] bg-[#EFF6FF] p-5">
                  <p className="text-sm font-semibold text-[#62748A]">
                    {t('post.selectedAreaLabel')}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-[#102A43]">
                    <MapPin className="h-6 w-6 shrink-0 text-[#1769E0]" aria-hidden="true" />
                    <span>
                      {getLocalizedLocationLabel(location.area, location.city, SAMPLE_AREAS, lang)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleUseCurrentLocation}
                    disabled={gpsLoading}
                  >
                    <LocateFixed className="h-5 w-5" aria-hidden="true" />
                    <span>{gpsLoading ? t('loc.findingArea') : t('loc.useCurrent')}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setLocationModalOpen(true)}
                  >
                    <MapPin className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
                    <span>{t('loc.changeLocation')}</span>
                  </Button>
                </div>

                {gpsNotice && (
                  <p role="status" className="text-base font-semibold text-[#16865B]">
                    {gpsNotice}
                  </p>
                )}
              </Card>
            )}

            {/* STEP 3: HOW MANY WORKERS? */}
            {step === 3 && (
              <Card className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    3. {t('post.step3Title')}
                  </h2>
                  <p className="mt-1 text-base text-[#62748A]">{t('post.step3Desc')}</p>
                </div>

                <div className="space-y-3">
                  {workforceOptions.map((opt) => {
                    const active = workforceType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setWorkforceType(opt.value);
                          if (opt.value === 'team' && workersNeeded < 2) setWorkersNeeded(5);
                          if (opt.value === 'several' && workersNeeded < 2) setWorkersNeeded(2);
                          if (opt.value === 'contractor' && workersNeeded < 2) setWorkersNeeded(3);
                          setStepError('');
                        }}
                        className={`flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-start transition-colors cursor-pointer ${
                          active
                            ? 'border-[#1769E0] bg-[#EFF6FF]'
                            : 'border-[#E3EAF3] bg-white hover:border-[#1769E0]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {opt.value === 'one' ? (
                            <User
                              className="mt-0.5 h-6 w-6 shrink-0 text-[#1769E0]"
                              aria-hidden="true"
                            />
                          ) : (
                            <Users
                              className="mt-0.5 h-6 w-6 shrink-0 text-[#1769E0]"
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <span className="block text-base font-bold text-[#102A43]">
                              {opt.label}
                            </span>
                            <span className="mt-0.5 block text-sm text-[#62748A]">
                              {opt.hint}
                            </span>
                          </div>
                        </div>
                        {active && (
                          <CheckCircle2
                            className="h-6 w-6 shrink-0 text-[#1769E0]"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {(workforceType === 'several' ||
                  workforceType === 'team' ||
                  workforceType === 'contractor') && (
                  <div className="space-y-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                    <label
                      htmlFor="workers-needed-input"
                      className="block text-base font-bold text-[#102A43]"
                    >
                      {t('post.howManyLabel')}
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => setWorkersNeeded((n) => Math.max(2, n - 1))}
                        aria-label={t('post.decreaseWorkersAria')}
                      >
                        <Minus className="h-5 w-5" aria-hidden="true" />
                      </Button>
                      <input
                        id="workers-needed-input"
                        type="number"
                        min={2}
                        max={20}
                        value={workersNeeded}
                        onChange={(e) =>
                          setWorkersNeeded(Math.max(2, Math.min(20, Number(e.target.value) || 2)))
                        }
                        className="ltr-num min-h-[48px] w-24 rounded-xl border-2 border-[#CBD5E1] bg-white text-center font-mono text-xl font-bold text-[#102A43] focus:border-[#1769E0] focus:outline-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => setWorkersNeeded((n) => Math.min(20, n + 1))}
                        aria-label={t('post.increaseWorkersAria')}
                      >
                        <Plus className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 4: YOUR PRICE (OPTIONAL) */}
            {step === 4 && (
              <Card className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    4. {t('post.step4Title')}
                  </h2>
                  <p className="mt-1 text-base text-[#62748A]">{t('post.step4Desc')}</p>
                </div>

                {!openPrice && (
                  <div className="space-y-3 rounded-xl border-2 border-[#BFDBFE] bg-[#EFF6FF]/60 p-5">
                    <label
                      htmlFor="budget-input"
                      className="block text-base font-bold text-[#102A43]"
                    >
                      {t('post.enterPriceLabel')}
                    </label>
                    <p className="font-mono text-3xl font-extrabold text-[#1769E0] tabular-nums ltr-num">
                      {formatPkr(budgetPkr, lang)}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() =>
                          setBudgetPkr((p) => Math.max(INPUT_LIMITS.MIN_PKR, p - 500))
                        }
                        aria-label={t('post.decreasePriceAria')}
                      >
                        <Minus className="h-5 w-5" aria-hidden="true" />
                        <span className="ltr-num">500</span>
                      </Button>

                      <input
                        id="budget-input"
                        type="number"
                        min={INPUT_LIMITS.MIN_PKR}
                        max={INPUT_LIMITS.MAX_PKR}
                        step={500}
                        value={budgetPkr === 0 ? '' : budgetPkr}
                        placeholder="25000"
                        onChange={(e) => {
                          const raw = e.target.value;
                          setBudgetPkr(
                            raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0))
                          );
                        }}
                        className="ltr-num min-h-[48px] w-40 rounded-xl border-2 border-[#CBD5E1] bg-white px-4 font-mono text-xl font-bold text-[#102A43] focus:border-[#1769E0] focus:outline-none"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() =>
                          setBudgetPkr((p) => Math.min(INPUT_LIMITS.MAX_PKR, p + 500))
                        }
                        aria-label={t('post.increasePriceAria')}
                      >
                        <Plus className="h-5 w-5" aria-hidden="true" />
                        <span className="ltr-num">500</span>
                      </Button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={openPrice}
                  onClick={() => {
                    setOpenPrice((prev) => !prev);
                    setStepError('');
                  }}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-start text-base font-bold transition-colors cursor-pointer ${
                    openPrice
                      ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                      : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                  }`}
                >
                  <span>{t('post.notSurePrice')}</span>
                  {openPrice && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
                </button>

                <label className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 border-[#E3EAF3] bg-[#F8FAFC] px-4 py-3 text-base font-semibold text-[#102A43] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={materialsIncluded}
                    onChange={(e) => setMaterialsIncluded(e.target.checked)}
                    className="h-5 w-5 accent-[#1769E0]"
                  />
                  <span>{t('common.materialsIncluded')}</span>
                </label>
              </Card>
            )}

            {/* STEP 5: WHEN AND HOW SOON? + PHOTOS + EXTRA NOTES */}
            {step === 5 && (
              <Card className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    5. {t('post.step5Title')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {urgencyOptions.map((opt) => {
                    const active = urgency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setUrgency(opt.value)}
                        className={`min-h-[60px] rounded-xl border-2 p-3 text-center transition-colors cursor-pointer ${
                          active
                            ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                            : 'border-[#E3EAF3] bg-white text-[#102A43] hover:border-[#1769E0]'
                        }`}
                      >
                        <span className="block text-base font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="preferred-date"
                    className="block text-base font-bold text-[#102A43]"
                  >
                    {t('post.preferredDateLabel')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
                    <input
                      id="preferred-date"
                      type="date"
                      min={todayDateStr}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="min-h-[48px] rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#E3EAF3] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-bold text-[#102A43]">
                      {t('post.photosLabel')} (<span className="ltr-num">{photos.length}/4</span>)
                    </p>
                    <span className="text-sm text-[#62748A]">{t('post.photosMax5Mb')}</span>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm font-medium text-[#92400E]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('post.photoSafetyNote')}</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoPick}
                    className="sr-only"
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={processingPhotos || photos.length >= 4}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {processingPhotos ? t('post.preparingPhotos') : t('post.addPhotos')}
                    </span>
                  </Button>

                  {photoErrors.length > 0 && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm font-semibold text-[#D64545]"
                    >
                      {photoErrors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {photos.map((ph) => (
                        <div key={ph.id} className="relative">
                          <PhotoTile photo={ph} className="h-28" />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== ph.id))}
                            aria-label={t('post.removePhoto')}
                            className="end-1.5 top-1.5 absolute flex h-8 w-8 items-center justify-center rounded-lg bg-[#102A43]/80 text-white hover:bg-[#D64545] cursor-pointer"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-[#E3EAF3] pt-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="job-extra-notes"
                      className="text-base font-bold text-[#102A43]"
                    >
                      {t('post.extraNotesLabel')}
                    </label>
                    <span className="text-sm text-[#62748A] tabular-nums ltr-num">
                      {extraNotes.length}/{INPUT_LIMITS.JOB_NOTES_MAX}
                    </span>
                  </div>
                  <textarea
                    id="job-extra-notes"
                    rows={2}
                    value={extraNotes}
                    maxLength={INPUT_LIMITS.JOB_NOTES_MAX}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    placeholder={t('post.extraNotesPlaceholder')}
                    className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  />
                </div>
              </Card>
            )}

            {/* FINAL SUMMARY SCREEN */}
            {step === 6 && (
              <Card className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    {t('post.summaryCheckTitle')}
                  </h2>
                  <p className="mt-1 text-base text-[#62748A]">
                    {t('post.summaryCheckDesc')}
                  </p>
                </div>

                <div className="divide-y divide-[#E3EAF3] rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-4">
                  <div className="py-3">
                    <p className="text-sm font-semibold text-[#62748A]">
                      {t('post.summaryWorkNeeded')}
                    </p>
                    <p className="text-base font-bold text-[#102A43]">{description}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#1769E0]">
                      {selectedCategory ? getLocalizedCategoryName(selectedCategory, lang) : ''}
                    </p>
                  </div>

                  <div className="py-3">
                    <p className="text-sm font-semibold text-[#62748A]">
                      {t('post.summaryArea')}
                    </p>
                    <p className="text-base font-bold text-[#102A43]">
                      {getLocalizedLocationLabel(location.area, location.city, SAMPLE_AREAS, lang)}
                    </p>
                  </div>

                  <div className="py-3">
                    <p className="text-sm font-semibold text-[#62748A]">
                      {t('post.summaryWorkersNeeded')}
                    </p>
                    <p className="text-base font-bold text-[#102A43]">
                      {workforceOptions.find((o) => o.value === workforceType)?.label} (
                      {workforceType === 'one' || workforceType === 'either'
                        ? t('common.workerCountOne')
                        : t('common.workerCountMany', { n: workersNeeded })}
                      )
                    </p>
                  </div>

                  <div className="py-3">
                    <p className="text-sm font-semibold text-[#62748A]">
                      {t('post.summaryYourPrice')}
                    </p>
                    <p className="text-base font-bold text-[#102A43]">
                      <span className="ltr-num">
                        {openPrice ? t('post.summaryOpenPrice') : formatPkr(budgetPkr, lang)}
                      </span>{' '}
                      ·{' '}
                      {materialsIncluded
                        ? t('common.materialsIncluded')
                        : t('common.materialsSeparate')}
                    </p>
                  </div>

                  <div className="py-3">
                    <p className="text-sm font-semibold text-[#62748A]">
                      {t('post.summaryWhenSoon')}
                    </p>
                    <p className="text-base font-bold text-[#102A43]">
                      {urgencyOptions.find((u) => u.value === urgency)?.label || urgency}
                      {preferredDate
                        ? ` · ${t('post.summaryPrefDate', { date: preferredDate })}`
                        : ''}
                    </p>
                    {extraNotes && <p className="mt-1 text-sm text-[#62748A]">{extraNotes}</p>}
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {photos.map((ph) => (
                      <PhotoTile key={ph.id} photo={ph} className="h-24" />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {stepError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
              >
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{stepError}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {step > 1 ? (
                <Button type="button" variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                  <span>{t('app.back')}</span>
                </Button>
              ) : (
                <div />
              )}

              {step <= 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  className="min-h-[52px] px-7"
                >
                  <span>{t('app.next')}</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handlePostRequest}
                  className="min-h-[54px] px-8 text-lg"
                >
                  <Send className="h-5 w-5" aria-hidden="true" />
                  <span>{t('post.submitBtn')}</span>
                </Button>
              )}
            </div>
          </>
        )}

        <LocationPickerModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          currentLocation={location}
          onSelectLocation={(loc) => {
            setLocation(loc);
            dispatch({ type: 'SET_CUSTOMER_LOCATION', location: loc });
            setGpsNotice(t('loc.detectedArea', { area: loc.area, city: loc.city }));
            setStepError('');
          }}
        />
      </div>
    </RoleGuard>
  );
};
