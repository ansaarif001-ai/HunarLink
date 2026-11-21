import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Hammer,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/FormControls';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { AuthRole, authService } from '../services/authService';
import { UserRole } from '../types';
import { INPUT_LIMITS } from '../utils/validation';

function getSafeNextPath(rawNext: string | null, isWorkerRole: boolean): string {
  const defaultPath = isWorkerRole ? '/worker' : '/customer';
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return defaultPath;
  }
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(rawNext)) {
    return defaultPath;
  }
  if (isWorkerRole) {
    if (
      rawNext.startsWith('/worker') ||
      rawNext.startsWith('/chat') ||
      rawNext === '/help' ||
      rawNext === '/about' ||
      rawNext === '/safety' ||
      rawNext === '/alerts' ||
      rawNext === '/settings'
    ) {
      return rawNext;
    }
    return '/worker';
  }
  if (
    rawNext.startsWith('/customer') ||
    rawNext.startsWith('/category/') ||
    rawNext.startsWith('/workers') ||
    rawNext.startsWith('/post-request') ||
    rawNext.startsWith('/my-requests') ||
    rawNext.startsWith('/chat') ||
    rawNext === '/help' ||
    rawNext === '/about' ||
    rawNext === '/safety' ||
    rawNext === '/alerts' ||
    rawNext === '/settings'
  ) {
    return rawNext;
  }
  return '/customer';
}

export const LoginPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialGuestMode = searchParams.get('mode') === 'guest';
  const initialRoleParam = searchParams.get('role') === 'worker' ? 'worker' : 'customer';

  useEffect(() => {
    if (state.activeRole === UserRole.Customer) {
      navigate(getSafeNextPath(searchParams.get('next'), false), { replace: true });
    } else if (state.activeRole === UserRole.Worker) {
      navigate(getSafeNextPath(searchParams.get('next'), true), { replace: true });
    }
  }, [state.activeRole, navigate, searchParams]);

  // Sign In form state (never persisted)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Guest Demo panel state
  const [guestPanelOpen, setGuestPanelOpen] = useState(initialGuestMode);
  const [guestRole, setGuestRole] = useState<AuthRole>(initialRoleParam);
  const [guestName, setGuestName] = useState('');
  const [guestCategoryId, setGuestCategoryId] = useState('cat_plumbing');
  const [guestAreaId, setGuestAreaId] = useState(SAMPLE_AREAS[0]?.id || 'area_wah_lalarukh');
  const [showSampleAccounts, setShowSampleAccounts] = useState(false);

  const areaOptions = useMemo(() => {
    return SAMPLE_AREAS.map((area) => ({
      value: area.id,
      label: getLocalizedLocationLabel(area.name, area.city, SAMPLE_AREAS, lang),
    }));
  }, [lang]);

  const skillOptions = useMemo(() => {
    return state.categories.map((cat) => ({
      value: cat.id,
      label: getLocalizedCategoryName(cat, lang),
    }));
  }, [state.categories, lang]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password) {
      setLoginError(t('auth.errInvalidCredentials'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.signIn({ email, password });
      if (!result.ok || !result.data) {
        if (result.errorCode === 'RATE_LIMITED') {
          setLoginError(t('auth.errRateLimited', { s: result.retryAfterSeconds ?? 30 }));
        } else {
          setLoginError(t('auth.errInvalidCredentials'));
        }
        return;
      }

      const { account } = result.data;
      setPassword('');
      dispatch({
        type: 'APPLY_AUTH_SESSION',
        userId: account.id,
        role: account.role,
        fullName: account.fullName,
        isGuest: false,
        city: account.city,
        area: account.area,
        categoryId: account.categoryId,
      });

      const targetPath = getSafeNextPath(searchParams.get('next'), account.role === 'worker');
      navigate(targetPath, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenArea = SAMPLE_AREAS.find((a) => a.id === guestAreaId) || SAMPLE_AREAS[0];
    const res = authService.startGuest({
      role: guestRole,
      fullName: guestName,
      categoryId: guestRole === 'worker' ? guestCategoryId : undefined,
      city: chosenArea?.city,
      area: chosenArea?.name,
    });
    if (!res.ok || !res.data) return;

    const { guest } = res.data;
    dispatch({
      type: 'APPLY_AUTH_SESSION',
      userId: guest.id,
      role: guest.role,
      fullName: guest.fullName,
      isGuest: true,
      city: guest.city,
      area: guest.area,
      categoryId: guest.categoryId,
    });
    navigate(getSafeNextPath(searchParams.get('next'), guest.role === 'worker'), { replace: true });
  };

  const handleSampleAccount = (account: 'customer' | 'worker' | 'contractor') => {
    dispatch({ type: 'ENTER_DEMO_ACCOUNT', account });
    navigate(getSafeNextPath(searchParams.get('next'), account !== 'customer'), { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#EFF6FF] via-[#F6FAFF] to-white text-[#172B4D]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.back')}</span>
          </Button>
          <BrandLogo size="sm" />
        </div>
        <LanguageSwitch compact />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <Card padding="lg" className="space-y-6 shadow-[0_10px_30px_rgba(16,42,67,0.07)]">
          {/* Sign In Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('auth.signInTitle')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
            <Input
              id="signin-email"
              type="email"
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              maxLength={120}
              required
              autoComplete="email"
              onChange={(e) => {
                setEmail(e.target.value);
                if (loginError) setLoginError('');
              }}
            />

            <Input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              maxLength={INPUT_LIMITS.PASSWORD_MAX}
              required
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                if (loginError) setLoginError('');
              }}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#62748A] hover:bg-[#F1F5F9] hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowForgotNotice((v) => !v)}
                className="min-h-[48px] text-sm font-semibold text-[#1769E0] hover:underline cursor-pointer"
              >
                {t('auth.forgotPassword')}
              </button>
              <Link
                to="/register"
                className="inline-flex min-h-[48px] items-center text-sm font-bold text-[#1769E0] hover:underline"
              >
                {t('auth.noAccountLink')}
              </Link>
            </div>

            {showForgotNotice && (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-medium text-[#102A43]">
                {t('auth.forgotPasswordNotice')}
              </div>
            )}

            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#D64545]"
              >
                {loginError}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
              <LogIn className="h-5 w-5" aria-hidden="true" />
              <span>{t('auth.signInBtn')}</span>
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E3EAF3]" />
            <span className="text-sm font-semibold text-[#62748A]">{t('login.orDivider')}</span>
            <div className="h-px flex-1 bg-[#E3EAF3]" />
          </div>

          {/* Guest Demo Mode */}
          {!guestPanelOpen ? (
            <div className="space-y-2 text-center">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setGuestPanelOpen(true)}
                className="border-2 border-[#93C5FD]"
              >
                <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{t('auth.continueGuestBtn')}</span>
              </Button>
              <p className="text-sm text-[#62748A]">{t('auth.guestSubtitle')}</p>
            </div>
          ) : (
            <form
              onSubmit={handleStartGuest}
              className="space-y-4 rounded-2xl border border-[#BFDBFE] bg-[#F8FAFF] p-4"
            >
              <div>
                <h2 className="text-lg font-extrabold text-[#102A43]">{t('auth.guestTitle')}</h2>
                <p className="text-sm text-[#62748A]">{t('auth.guestSubtitle')}</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGuestRole('customer')}
                  aria-pressed={guestRole === 'customer'}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold cursor-pointer ${
                    guestRole === 'customer'
                      ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                      : 'border-[#CBD5E1] bg-white text-[#102A43]'
                  }`}
                >
                  <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t('auth.guestCustomerBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuestRole('worker')}
                  aria-pressed={guestRole === 'worker'}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold cursor-pointer ${
                    guestRole === 'worker'
                      ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                      : 'border-[#CBD5E1] bg-white text-[#102A43]'
                  }`}
                >
                  <Hammer className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t('auth.guestWorkerBtn')}</span>
                </button>
              </div>

              <Input
                id="guest-name"
                label={t('auth.guestNameLabel')}
                placeholder={t('auth.guestNamePlaceholder')}
                value={guestName}
                maxLength={60}
                onChange={(e) => setGuestName(e.target.value)}
              />

              {guestRole === 'worker' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    id="guest-skill"
                    label={t('login.skillLabel')}
                    value={guestCategoryId}
                    options={skillOptions}
                    onChange={(e) => setGuestCategoryId(e.target.value)}
                  />
                  <Select
                    id="guest-area"
                    label={t('login.areaLabel')}
                    value={guestAreaId}
                    options={areaOptions}
                    onChange={(e) => setGuestAreaId(e.target.value)}
                  />
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span>{t('auth.guestStartBtn')}</span>
              </Button>

              <div className="border-t border-[#D2E3FC] pt-3">
                <button
                  type="button"
                  onClick={() => setShowSampleAccounts((v) => !v)}
                  className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-[#1769E0] hover:underline cursor-pointer"
                >
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <span>{t('auth.sampleAccountsToggle')}</span>
                </button>

                {showSampleAccounts && (
                  <div className="mt-2 space-y-2">
                    {(
                      [
                        { key: 'customer', label: t('auth.sampleCustomer') },
                        { key: 'worker', label: t('auth.sampleWorker') },
                        { key: 'contractor', label: t('auth.sampleContractor') },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSampleAccount(item.key)}
                        className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-start text-sm font-bold text-[#102A43] hover:border-[#1769E0] hover:bg-[#EFF6FF] cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <Badge tone="neutral">{t('auth.sampleBadge')}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          <p className="flex items-start gap-2 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-3.5 py-3 text-xs font-medium text-[#62748A]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>{t('auth.demoDeviceNotice')}</span>
          </p>
        </Card>
      </main>
    </div>
  );
};
