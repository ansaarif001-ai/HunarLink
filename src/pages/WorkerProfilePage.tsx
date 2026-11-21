import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_AREAS, SAMPLE_CITIES, getAreasForCity } from '../data/locations';
import { CITIES, WORKER_LANGUAGES } from '../data/seedData';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  getLocalizedAreaName,
  getLocalizedCategoryName,
  getLocalizedCityName,
  getLocalizedLocationLabel,
} from '../i18n';
import { PakistaniCity, WorkerType } from '../types';
import { processSafeImageFiles } from '../utils/photoSafety';
import { formatPkr } from '../utils/pricing';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

const WORKER_TYPE_KEY_MAP: Record<WorkerType, string> = {
  'One person': 'workerType.one',
  Contractor: 'workerType.contractor',
  Team: 'workerType.team',
};

export const WorkerProfilePage: React.FC = () => {
  const { state, dispatch, activeWorker, storageError } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const worker = activeWorker || state.workers[0];
  const workerPortfolioCount = state.portfolioItems.filter(
    (p) => p.workerId === worker.id
  ).length;

  // Editable form state synced to activeWorker
  const [name, setName] = useState(worker.name);
  const [headline, setHeadline] = useState(worker.headline);
  const [bio, setBio] = useState(worker.bio);
  const [categoryId, setCategoryId] = useState(worker.categoryId);
  const [skills, setSkills] = useState<string[]>(worker.skills);
  const [newSkillText, setNewSkillText] = useState('');
  const [yearsExperience, setYearsExperience] = useState(String(worker.yearsExperience));
  const [city, setCity] = useState<PakistaniCity>(worker.city);
  const [serviceAreas, setServiceAreas] = useState<string[]>(worker.serviceAreas);
  const [freeToWorkNow, setFreeToWorkNow] = useState(worker.freeToWorkNow);
  const [priceHintPkr, setPriceHintPkr] = useState(String(worker.priceHintPkr));
  const [priceUnit, setPriceUnit] = useState<'visit' | 'day' | 'job'>(worker.priceUnit);
  const [languages, setLanguages] = useState<string[]>(worker.languages);
  const [workerType, setWorkerType] = useState<WorkerType>(worker.workerType);
  const [teamSize, setTeamSize] = useState(String(Math.max(2, worker.teamSize)));
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(
    worker.profilePhotoUrl
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | undefined>(
    worker.coverPhotoUrl
  );

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setName(worker.name);
    setHeadline(worker.headline);
    setBio(worker.bio);
    setCategoryId(worker.categoryId);
    setSkills(worker.skills);
    setYearsExperience(String(worker.yearsExperience));
    setCity(worker.city);
    setServiceAreas(worker.serviceAreas);
    setFreeToWorkNow(worker.freeToWorkNow);
    setPriceHintPkr(String(worker.priceHintPkr));
    setPriceUnit(worker.priceUnit);
    setLanguages(worker.languages);
    setWorkerType(worker.workerType);
    setTeamSize(String(Math.max(2, worker.teamSize)));
    setProfilePhotoUrl(worker.profilePhotoUrl);
    setCoverPhotoUrl(worker.coverPhotoUrl);
    setFormErrors([]);
    setPhotoErrors([]);
  }, [worker.id]);

  // Dynamic Profile Completeness Bar + One Actionable Tip
  const completeness = useMemo(() => {
    const checks = [
      { done: Boolean(name.trim()), weight: 15, tip: t('workerProfile.tipName') },
      { done: Boolean(headline.trim()), weight: 15, tip: t('workerProfile.tipHeadline') },
      {
        done: Boolean(bio.trim() && bio.trim().length >= 15),
        weight: 15,
        tip: t('workerProfile.tipBio'),
      },
      { done: skills.length >= 2, weight: 10, tip: t('workerProfile.tipSkills') },
      { done: serviceAreas.length >= 1, weight: 15, tip: t('workerProfile.tipAreas') },
      { done: languages.length >= 1, weight: 10, tip: t('workerProfile.tipLanguages') },
      { done: Boolean(profilePhotoUrl), weight: 10, tip: t('workerProfile.tipPhoto') },
      { done: workerPortfolioCount >= 3, weight: 10, tip: t('workerProfile.tipPortfolio') },
    ];
    const percent = checks.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
    const nextTip = checks.find((c) => !c.done)?.tip || t('workerProfile.tipGreat');
    return { percent, nextTip };
  }, [
    name,
    headline,
    bio,
    skills,
    serviceAreas,
    languages,
    profilePhotoUrl,
    workerPortfolioCount,
    t,
  ]);

  const selectedCategory = state.categories.find((c) => c.id === categoryId);

  const toggleServiceArea = (areaName: string) => {
    setServiceAreas((prev) =>
      prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
    );
    setSavedNotice('');
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setSavedNotice('');
  };

  const handleAddCustomSkill = () => {
    const clean = sanitizeText(newSkillText, INPUT_LIMITS.SKILL_MAX);
    if (!clean) return;
    if (!skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkills((prev) => [...prev, clean]);
    }
    setNewSkillText('');
  };

  const toggleLanguage = (langItem: string) => {
    setLanguages((prev) =>
      prev.includes(langItem) ? prev.filter((l) => l !== langItem) : [...prev, langItem]
    );
    setSavedNotice('');
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'avatar' | 'cover'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoErrors([]);
    const res = await processSafeImageFiles([files[0]], {
      maxWidth: target === 'avatar' ? 600 : 1000,
      maxCount: 1,
      existingCount: 0,
      lang,
    });
    if (res.errors.length > 0) {
      setPhotoErrors(res.errors);
    }
    if (res.photos[0]?.dataUrl) {
      if (target === 'avatar') setProfilePhotoUrl(res.photos[0].dataUrl);
      else setCoverPhotoUrl(res.photos[0].dataUrl);
    }
    e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    if (!sanitizeText(name, INPUT_LIMITS.NAME_MAX)) {
      errs.push(t('workerProfile.errName'));
    }
    if (!sanitizeText(headline, INPUT_LIMITS.HEADLINE_MAX)) {
      errs.push(t('workerProfile.errHeadline'));
    }
    if (skills.length === 0) {
      errs.push(t('workerProfile.errSkills'));
    }
    if (serviceAreas.length === 0) {
      errs.push(t('workerProfile.errAreas'));
    }
    const priceNum = Number(priceHintPkr);
    if (!Number.isFinite(priceNum) || priceNum < INPUT_LIMITS.MIN_PKR) {
      errs.push(t('workerProfile.errPriceMin', { min: INPUT_LIMITS.MIN_PKR }));
    }
    if (languages.length === 0) {
      errs.push(t('workerProfile.errLanguages'));
    }

    if (errs.length > 0) {
      setFormErrors(errs);
      setSavedNotice('');
      return;
    }

    setFormErrors([]);
    dispatch({
      type: 'UPDATE_WORKER_PROFILE',
      workerId: worker.id,
      updates: {
        name,
        headline,
        bio,
        categoryId,
        skills,
        yearsExperience: Number(yearsExperience) || 0,
        city,
        area: serviceAreas[0] || worker.area,
        serviceAreas,
        freeToWorkNow,
        priceHintPkr: Math.round(priceNum),
        priceUnit,
        languages,
        workerType,
        teamSize: workerType === 'One person' ? 1 : Number(teamSize) || 2,
        profilePhotoUrl,
        coverPhotoUrl,
      },
    });
    setSavedNotice(t('workerProfile.savedMsg'));
    showToast(t('workerProfile.savedMsg'), 'success');
    setIsEditing(false);
    if (searchParams.has('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCancelEdit = () => {
    setName(worker.name);
    setHeadline(worker.headline);
    setBio(worker.bio);
    setCategoryId(worker.categoryId);
    setSkills(worker.skills);
    setYearsExperience(String(worker.yearsExperience));
    setCity(worker.city);
    setServiceAreas(worker.serviceAreas);
    setFreeToWorkNow(worker.freeToWorkNow);
    setPriceHintPkr(String(worker.priceHintPkr));
    setPriceUnit(worker.priceUnit);
    setLanguages(worker.languages);
    setWorkerType(worker.workerType);
    setTeamSize(String(Math.max(2, worker.teamSize)));
    setProfilePhotoUrl(worker.profilePhotoUrl);
    setCoverPhotoUrl(worker.coverPhotoUrl);
    setFormErrors([]);
    setPhotoErrors([]);
    setIsEditing(false);
    if (searchParams.has('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const displayName = isUrdu ? worker.nameUr || worker.name : worker.name;
  const displayHeadline = isUrdu ? worker.headlineUr || worker.headline : worker.headline;
  const displayBio = isUrdu ? worker.bioUr || worker.bio : worker.bio;
  const roleLabel =
    worker.workerType === 'Contractor' || worker.workerType === 'Team'
      ? t('common.contractor')
      : t('common.worker');
  const priceUnitLabel =
    worker.priceUnit === 'visit'
      ? t('common.perVisit')
      : worker.priceUnit === 'day'
        ? t('common.perDay')
        : t('common.perJob');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="md" onClick={() => navigate('/worker')}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate(`/workers/${worker.id}`)}
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span>{t('workerProfile.viewPublic')}</span>
        </Button>
      </div>

      {/* LinkedIn-style Profile Header Card */}
      <Card padding="none" className="overflow-hidden">
        <div className="relative h-36 w-full bg-gradient-to-r from-[#1769E0] via-[#3B82F6] to-[#60A5FA] sm:h-44">
          {coverPhotoUrl && (
            <img
              src={coverPhotoUrl}
              alt={t('workerProfile.coverPhotoLabel')}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-full bg-white p-1 shadow-sm">
              <Avatar name={displayName} src={profilePhotoUrl} size="xl" shape="circle" />
            </div>

            {!isEditing ? (
              <Button variant="secondary" size="md" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                <span>{t('custProfile.editProfile')}</span>
              </Button>
            ) : (
              <Button variant="outline" size="md" onClick={handleCancelEdit}>
                <X className="h-4 w-4" aria-hidden="true" />
                <span>{t('app.cancel')}</span>
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {displayName}
              </h1>
              <Badge tone="primary">{roleLabel}</Badge>
              {worker.checkedDemo && (
                <Badge tone="success" icon={ShieldCheck}>
                  {t('common.checked')}
                </Badge>
              )}
            </div>

            {displayHeadline && (
              <p className="text-base font-semibold text-[#172B4D]">{displayHeadline}</p>
            )}

            <p className="flex items-center gap-1.5 text-base text-[#62748A]">
              <MapPin className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>
                {getLocalizedLocationLabel(worker.area, worker.city, SAMPLE_AREAS, lang)}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Completeness Bar */}
      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-bold text-[#102A43] tabular-nums">
            {t('workerProfile.completenessPercent', { n: completeness.percent })}
          </span>
          <span className="text-sm font-semibold text-[#1769E0]">
            {t('workerProfile.tipPrefix', { tip: completeness.nextTip })}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-[#BFDBFE] bg-[#EFF6FF]">
          <div
            className="h-full rounded-full bg-[#1769E0] transition-all duration-300"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>

        {storageError && (
          <div
            role="alert"
            className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{storageError}</span>
          </div>
        )}
      </Card>

      {/* View Mode vs Edit Mode */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Quick Links moved from top nav */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/worker/work"
              className="flex items-center justify-between rounded-2xl border border-[#DCE7F5] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#93C5FD]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#102A43]">
                    {t('profileMenu.myWork')}
                  </p>
                  <p className="text-sm text-[#62748A]">{workerPortfolioCount}</p>
                </div>
              </div>
              <Badge tone="primary">{t('profileMenu.myWork')}</Badge>
            </Link>

            <Link
              to="/worker/earnings"
              className="flex items-center justify-between rounded-2xl border border-[#DCE7F5] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#93C5FD]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16865B]">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#102A43]">
                    {t('profileMenu.earnings')}
                  </p>
                  <p className="text-sm text-[#62748A]">{t('workerHome.statsEarnings')}</p>
                </div>
              </div>
              <Badge tone="success">{t('profileMenu.earnings')}</Badge>
            </Link>
          </div>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-[#102A43]">
                {t('workerProfile.workDetailsTitle')}
              </h2>
              <Badge tone={worker.freeToWorkNow ? 'success' : 'neutral'}>
                {worker.freeToWorkNow ? t('workerHome.freeYes') : t('workerHome.freeNo')}
              </Badge>
            </div>

            {displayBio && <p className="text-base leading-relaxed text-[#172B4D]">{displayBio}</p>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3.5">
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerProfile.categoryLabel')}
                </p>
                <p className="mt-0.5 text-base font-bold text-[#102A43]">
                  {selectedCategory ? getLocalizedCategoryName(selectedCategory, lang) : ''}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3.5">
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('workerProfile.priceLabel')}
                </p>
                <p className="ltr-num mt-0.5 text-base font-bold text-[#102A43]">
                  {formatPkr(worker.priceHintPkr)} {priceUnitLabel}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-[#62748A]">{t('workerPublic.skills')}</p>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((sk) => (
                  <Badge key={sk} tone="primary">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-[#62748A]">
                {t('workerProfile.areasSectionTitle')}
              </p>
              <div className="flex flex-wrap gap-2">
                {worker.serviceAreas.map((areaName) => (
                  <Badge key={areaName} tone="neutral" icon={MapPin}>
                    {getLocalizedAreaName(areaName, SAMPLE_AREAS, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Main Edit Form */
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Photos: Profile & Cover */}
          <Card className="space-y-4">
          <h2 className="text-lg font-bold text-[#102A43]">
            {t('workerProfile.photosCardTitle')}
          </h2>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm font-medium text-[#92400E]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('post.photoSafetyNote')}</span>
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePhotoUpload(e, 'cover')}
            className="sr-only"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePhotoUpload(e, 'avatar')}
            className="sr-only"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Profile Photo */}
            <div className="space-y-2.5 rounded-xl border border-[#E3EAF3] p-4">
              <p className="text-base font-bold text-[#102A43]">
                {t('workerProfile.profilePhotoLabel')}
              </p>
              <div className="flex items-center gap-3">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-full border-2 border-[#1769E0] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D2E3FC] bg-[#EFF6FF] font-display text-xl font-bold text-[#1769E0]">
                    {name.slice(0, 2).toUpperCase() || 'WK'}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <span>{t('workerProfile.uploadBtn')}</span>
                  </Button>
                  {profilePhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProfilePhotoUrl(undefined)}
                    >
                      <Trash2 className="h-4 w-4 text-[#D64545]" aria-hidden="true" />
                      <span>{t('workerProfile.removeBtn')}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Photo */}
            <div className="space-y-2.5 rounded-xl border border-[#E3EAF3] p-4">
              <p className="text-base font-bold text-[#102A43]">
                {t('workerProfile.coverPhotoLabel')}
              </p>
              {coverPhotoUrl ? (
                <img
                  src={coverPhotoUrl}
                  alt={t('workerProfile.coverPhotoLabel')}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-16 w-full rounded-lg border border-[#E3EAF3] object-cover"
                />
              ) : (
                <div className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#62748A]">
                  {t('workerProfile.defaultCover')}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>{t('workerProfile.uploadCoverBtn')}</span>
                </Button>
                {coverPhotoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverPhotoUrl(undefined)}
                  >
                    <Trash2 className="h-4 w-4 text-[#D64545]" aria-hidden="true" />
                    <span>{t('workerProfile.removeBtn')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

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
        </Card>

        {/* Basic Info */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-[#102A43]">
            {t('workerProfile.basicInfoTitle')}
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="wp-name" className="block text-base font-bold text-[#172B4D]">
              {t('workerProfile.nameLabel')} *
            </label>
            <input
              id="wp-name"
              type="text"
              value={name}
              maxLength={INPUT_LIMITS.NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wp-headline" className="block text-base font-bold text-[#172B4D]">
              {t('workerProfile.headlineLabel')} *
            </label>
            <input
              id="wp-headline"
              type="text"
              value={headline}
              maxLength={INPUT_LIMITS.HEADLINE_MAX}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t('workerProfile.headlinePlaceholder')}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="wp-bio" className="text-base font-bold text-[#172B4D]">
                {t('workerProfile.bioLabel')}
              </label>
              <span className="text-sm text-[#62748A] tabular-nums">
                {t('post.charCount', {
                  n: bio.length,
                  max: INPUT_LIMITS.BIO_MAX,
                })}
              </span>
            </div>
            <textarea
              id="wp-bio"
              rows={3}
              value={bio}
              maxLength={INPUT_LIMITS.BIO_MAX}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('workerProfile.bioPlaceholder')}
              className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
          </div>

          {/* Main Category & Experience */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="wp-category" className="block text-base font-bold text-[#172B4D]">
                {t('workerProfile.categoryLabel')} *
              </label>
              <select
                id="wp-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                {state.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getLocalizedCategoryName(cat, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wp-years" className="block text-base font-bold text-[#172B4D]">
                {t('workerProfile.experienceLabel')}
              </label>
              <input
                id="wp-years"
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="ltr-num min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              />
            </div>
          </div>

          {/* Extra Skills */}
          <div className="space-y-2.5 border-t border-[#E3EAF3] pt-4">
            <p className="text-base font-bold text-[#102A43]">
              {t('workerPublic.skills')} *
            </p>
            {selectedCategory && (
              <div className="flex flex-wrap gap-2">
                {selectedCategory.subSkills.map((sk) => {
                  const active = skills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSkill(sk)}
                      className={`min-h-[48px] rounded-xl border-2 px-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                          : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {sk}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected skills display */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] px-3 py-1.5 text-sm font-semibold text-[#1769E0]"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      aria-label={`${t('workerProfile.removeBtn')} ${sk}`}
                      className="rounded hover:bg-white/70 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillText}
                maxLength={INPUT_LIMITS.SKILL_MAX}
                onChange={(e) => setNewSkillText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder={t('workerProfile.addSkillPlaceholder')}
                className="min-h-[48px] flex-1 rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              />
              <Button type="button" variant="secondary" size="md" onClick={handleAddCustomSkill}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t('workerProfile.addBtn')}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Worker Type, Team Size, Price Hint, Availability, Languages */}
        <Card className="space-y-5">
          <h2 className="text-lg font-bold text-[#102A43]">
            {t('workerProfile.workDetailsTitle')}
          </h2>

          {/* Worker Type & Team Size */}
          <div className="space-y-2">
            <p className="text-base font-bold text-[#172B4D]">
              {t('workerProfile.workerTypeLabel')}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {(['One person', 'Contractor', 'Team'] as WorkerType[]).map((wt) => (
                <button
                  key={wt}
                  type="button"
                  aria-pressed={workerType === wt}
                  onClick={() => setWorkerType(wt)}
                  className={`min-h-[48px] rounded-xl border-2 px-4 text-base font-bold transition-colors cursor-pointer ${
                    workerType === wt
                      ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                      : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                  }`}
                >
                  {t(WORKER_TYPE_KEY_MAP[wt] as never)}
                </button>
              ))}
            </div>
          </div>

          {workerType !== 'One person' && (
            <div className="space-y-1.5">
              <label htmlFor="wp-team-size" className="block text-base font-bold text-[#172B4D]">
                {t('workerProfile.teamSizeLabel')}
              </label>
              <input
                id="wp-team-size"
                type="number"
                min={2}
                max={50}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="ltr-num min-h-[48px] w-full max-w-xs rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              />
            </div>
          )}

          {/* Price Hint */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="wp-price" className="block text-base font-bold text-[#172B4D]">
                {t('workerProfile.priceLabel')} *
              </label>
              <input
                id="wp-price"
                type="number"
                min={INPUT_LIMITS.MIN_PKR}
                max={INPUT_LIMITS.MAX_PKR}
                value={priceHintPkr}
                onChange={(e) => setPriceHintPkr(e.target.value)}
                className="ltr-num min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wp-price-unit" className="block text-base font-bold text-[#172B4D]">
                {t('workerProfile.priceUnitLabel')}
              </label>
              <select
                id="wp-price-unit"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value as 'visit' | 'day' | 'job')}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
              >
                <option value="visit">{t('common.perVisit')}</option>
                <option value="day">{t('common.perDay')}</option>
                <option value="job">{t('common.perJob')}</option>
              </select>
            </div>
          </div>

          {/* Free to work now */}
          <button
            type="button"
            role="switch"
            aria-checked={freeToWorkNow}
            onClick={() => setFreeToWorkNow((prev) => !prev)}
            className={`flex min-h-[56px] w-full items-center justify-between gap-4 rounded-xl border-2 px-5 py-3 text-start transition-colors cursor-pointer ${
              freeToWorkNow
                ? 'border-[#16865B] bg-[#F0FDF4] text-[#16865B]'
                : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#62748A]'
            }`}
          >
            <div className="flex items-center gap-3">
              {freeToWorkNow ? (
                <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
              )}
              <div>
                <span className="block text-base font-bold">
                  {t('workerHome.freeToggleLabel')}
                </span>
                <span className="block text-sm">
                  {freeToWorkNow ? t('workerHome.freeYes') : t('workerHome.freeNo')}
                </span>
              </div>
            </div>

            <span
              dir="ltr"
              aria-hidden="true"
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                freeToWorkNow ? 'bg-[#16865B]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  freeToWorkNow ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>

          {/* Languages */}
          <div className="space-y-2">
            <p className="text-base font-bold text-[#172B4D]">
              {t('workerProfile.languagesLabel')} *
            </p>
            <div className="flex flex-wrap gap-2">
              {WORKER_LANGUAGES.map((langItem) => {
                const active = languages.includes(langItem);
                return (
                  <button
                    key={langItem}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLanguage(langItem)}
                    className={`min-h-[48px] rounded-xl border-2 px-4 text-sm font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                        : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {langItem}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Home City & Service Areas */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#102A43]">
                <MapPin className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
                <span>{t('workerProfile.areasSectionTitle')} *</span>
              </h2>
              <p className="mt-1 text-base text-[#62748A]">
                {t('workerProfile.areasSectionDesc')}
              </p>
            </div>
            <span className="text-base font-bold text-[#1769E0] tabular-nums">
              {t('workerProfile.selectedCount', { n: serviceAreas.length })}
            </span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wp-city" className="block text-base font-bold text-[#172B4D]">
              {t('workerProfile.cityLabel')}
            </label>
            <select
              id="wp-city"
              value={city}
              onChange={(e) => setCity(e.target.value as PakistaniCity)}
              className="min-h-[48px] w-full max-w-xs rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {getLocalizedCityName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {SAMPLE_CITIES.map((cName) => {
              const areas = getAreasForCity(cName);
              return (
                <div key={cName} className="space-y-2 border-t border-[#E3EAF3] pt-3">
                  <h3 className="text-base font-bold text-[#102A43]">
                    {getLocalizedCityName(cName, lang)}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {areas.map((area) => {
                      const checked = serviceAreas.includes(area.name);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() => toggleServiceArea(area.name)}
                          className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border-2 px-4 py-2 text-start text-base font-semibold transition-colors cursor-pointer ${
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
        </Card>

        {formErrors.length > 0 && (
          <div
            role="alert"
            className="space-y-1 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
          >
            {formErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        {savedNotice && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-semibold text-[#16865B]"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" size="lg" className="min-h-[54px] px-8">
            <Save className="h-5 w-5" aria-hidden="true" />
            <span>{t('workerProfile.saveBtn')}</span>
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={handleCancelEdit}>
            <span>{t('app.cancel')}</span>
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};
