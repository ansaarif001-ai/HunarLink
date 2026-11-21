import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Edit3,
  FileText,
  MapPin,
  PlusCircle,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/FormControls';
import { StatusText } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { Location } from '../types';
import { formatRelativeTime } from '../utils/id';
import { processSafeImageFiles } from '../utils/photoSafety';
import { formatPkr } from '../utils/pricing';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

export const ProfilePage: React.FC = () => {
  const { state, dispatch, activeCustomer } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const customer = activeCustomer || state.customers[0];

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [name, setName] = useState(customer?.name || '');
  const [location, setLocation] = useState<Location>({
    city: customer?.city || state.selectedLocation.city,
    area: customer?.area || state.selectedLocation.area,
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(
    customer?.profilePhotoUrl
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | undefined>(
    customer?.coverPhotoUrl
  );
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setLocation({ city: customer.city, area: customer.area });
    setProfilePhotoUrl(customer.profilePhotoUrl);
    setCoverPhotoUrl(customer.coverPhotoUrl);
  }, [customer?.id, customer?.name, customer?.city, customer?.area, customer?.profilePhotoUrl, customer?.coverPhotoUrl]);

  const myJobs = useMemo(
    () =>
      state.jobs
        .filter((j) => j.customerId === customer?.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [state.jobs, customer?.id]
  );

  const myReviews = useMemo(
    () =>
      state.reviews
        .filter((r) => r.customerId === customer?.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [state.reviews, customer?.id]
  );

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, INPUT_LIMITS.NAME_MAX);
    if (!cleanName) {
      setNameError(t('login.errName'));
      return;
    }
    setNameError('');
    dispatch({
      type: 'UPDATE_CUSTOMER_PROFILE',
      updates: {
        name: cleanName,
        city: location.city,
        area: location.area,
        profilePhotoUrl,
        coverPhotoUrl,
      },
    });
    setIsEditing(false);
    if (searchParams.has('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
    showToast(t('custProfile.savedMsg'), 'success');
  };

  const handleCancelEdit = () => {
    if (customer) {
      setName(customer.name);
      setLocation({ city: customer.city, area: customer.area });
      setProfilePhotoUrl(customer.profilePhotoUrl);
      setCoverPhotoUrl(customer.coverPhotoUrl);
    }
    setPhotoErrors([]);
    setNameError('');
    setIsEditing(false);
    if (searchParams.has('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const displayLocation = getLocalizedLocationLabel(
    location.area,
    location.city,
    SAMPLE_AREAS,
    lang
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="outline" size="md" onClick={() => navigate('/customer')}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>
      </div>

      {/* LinkedIn-style Profile Header Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-36 w-full bg-gradient-to-r from-[#1769E0] via-[#3B82F6] to-[#60A5FA] sm:h-44">
          {coverPhotoUrl && (
            <img
              src={coverPhotoUrl}
              alt={t('custProfile.coverPhoto')}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Overlapping Round Avatar + Name + Edit Button */}
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-full bg-white p-1 shadow-sm">
              <Avatar
                name={customer?.name || t('common.customer')}
                src={profilePhotoUrl}
                size="xl"
                shape="circle"
              />
            </div>

            {!isEditing && (
              <Button variant="secondary" size="md" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                <span>{t('custProfile.editProfile')}</span>
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {customer?.name || t('common.customer')}
              </h1>
              <Badge tone="primary">{t('common.customer')}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-base text-[#62748A]">
              <MapPin className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>{displayLocation}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Profile Form OR Clean Details & History Cards */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-[#102A43]">
                {t('custProfile.editProfile')}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" aria-hidden="true" />
                <span>{t('app.cancel')}</span>
              </Button>
            </div>

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

            {/* Profile & Cover Photos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-[#E3EAF3] p-4">
                <p className="text-base font-bold text-[#102A43]">
                  {t('custProfile.profilePhoto')}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={name || t('common.customer')} src={profilePhotoUrl} size="lg" />
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

              <div className="space-y-3 rounded-xl border border-[#E3EAF3] p-4">
                <p className="text-base font-bold text-[#102A43]">
                  {t('custProfile.coverPhoto')}
                </p>
                {coverPhotoUrl ? (
                  <img
                    src={coverPhotoUrl}
                    alt={t('custProfile.coverPhoto')}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-14 w-full rounded-lg border border-[#E3EAF3] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#62748A]">
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
                {photoErrors.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <Input
              id="customer-profile-name"
              label={t('custProfile.nameLabel')}
              value={name}
              maxLength={INPUT_LIMITS.NAME_MAX}
              required
              error={nameError}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
            />

            <div className="space-y-1.5">
              <p className="text-base font-bold text-[#172B4D]">
                {t('custProfile.areaFieldLabel')}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3">
                <span className="flex items-center gap-2 text-base font-semibold text-[#102A43]">
                  <MapPin className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
                  <span>{displayLocation}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLocationModalOpen(true)}
                >
                  <span>{t('loc.changeLocation')}</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="primary" size="lg">
                <Save className="h-5 w-5" aria-hidden="true" />
                <span>{t('custProfile.saveBtn')}</span>
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleCancelEdit}>
                <span>{t('app.cancel')}</span>
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <>
          {/* Account Details Card */}
          <Card className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#102A43]">
              {t('custProfile.detailsTitle')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3.5">
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('custProfile.nameLabel')}
                </p>
                <p className="mt-0.5 text-base font-bold text-[#102A43]">
                  {customer?.name || t('common.customer')}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3.5">
                <p className="text-sm font-semibold text-[#62748A]">
                  {t('custProfile.areaFieldLabel')}
                </p>
                <p className="mt-0.5 text-base font-bold text-[#102A43]">{displayLocation}</p>
              </div>
            </div>
          </Card>

          {/* Requests Summary Card */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#102A43]">
                {t('custProfile.myRequestsSummary', { n: myJobs.length })}
              </h2>
              <Link
                to="/my-requests"
                className="text-sm font-bold text-[#1769E0] hover:underline"
              >
                {t('nav.myRequests')}
              </Link>
            </div>

            {myJobs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('custProfile.noRequestsYet')}
                description={t('login.customerSubtitle')}
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/post-request')}
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{t('nav.postRequest')}</span>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {myJobs.slice(0, 4).map((job) => {
                  const cat = state.categories.find((c) => c.id === job.categoryId);
                  return (
                    <Link
                      key={job.id}
                      to={`/my-requests/${job.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E3EAF3] bg-white p-3.5 transition-colors hover:border-[#93C5FD] hover:bg-[#F8FAFC]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-[#102A43]">{job.title}</p>
                        <p className="text-sm text-[#62748A]">
                          {cat ? getLocalizedCategoryName(cat, lang) : ''} ·{' '}
                          {getLocalizedLocationLabel(job.area, job.city, SAMPLE_AREAS, lang)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.budget ? (
                          <span className="ltr-num text-sm font-bold text-[#102A43]">
                            {formatPkr(job.budget)}
                          </span>
                        ) : null}
                        <StatusText label={job.status} tone="primary" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Reviews Sent Card */}
          <Card className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#102A43]">
              {t('custProfile.myReviewsSummary', { n: myReviews.length })}
            </h2>

            {myReviews.length === 0 ? (
              <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-5 text-center text-base text-[#62748A]">
                {t('custProfile.noReviewsYet')}
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map((rev) => {
                  const worker = state.workers.find((w) => w.id === rev.workerId);
                  const workerName = worker
                    ? isUrdu
                      ? worker.nameUr
                      : worker.name
                    : t('common.worker');
                  return (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-[#E3EAF3] bg-white p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-base font-bold text-[#102A43]">{workerName}</span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#B45309]">
                          <Star
                            className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]"
                            aria-hidden="true"
                          />
                          <span className="ltr-num">{rev.rating}/5</span>
                          <span className="text-[#62748A] font-normal">
                            · {formatRelativeTime(rev.createdAt, lang)}
                          </span>
                        </span>
                      </div>
                      {rev.text && <p className="text-base text-[#172B4D]">{rev.text}</p>}
                      {rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map((tag) => (
                            <Badge key={tag} tone="primary" icon={CheckCircle2}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={(loc) => setLocation(loc)}
      />
    </div>
  );
};
