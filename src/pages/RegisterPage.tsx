import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Hammer,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/FormControls';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import {
  AuthRole,
  authService,
  evaluatePassword,
  isValidEmail,
} from '../services/authService';
import { UserRole } from '../types';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

export const RegisterPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t, lang } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRoleParam = searchParams.get('role');
  const [role, setRole] = useState<AuthRole | null>(
    initialRoleParam === 'customer' || initialRoleParam === 'worker' ? initialRoleParam : null
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [touched, setTouched] = useState({
    role: false,
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    categoryId: false,
    areaId: false,
    terms: false,
  });

  useEffect(() => {
    if (state.activeRole === UserRole.Customer) {
      navigate('/customer', { replace: true });
    } else if (state.activeRole === UserRole.Worker) {
      navigate('/worker', { replace: true });
    }
  }, [state.activeRole, navigate]);

  const skillOptions = useMemo(() => {
    return [
      { value: '', label: t('login.skillPlaceholder') },
      ...state.categories.map((cat) => ({
        value: cat.id,
        label: getLocalizedCategoryName(cat, lang),
      })),
    ];
  }, [state.categories, lang, t]);

  const areaOptions = useMemo(() => {
    return [
      { value: '', label: t('login.areaPlaceholder') },
      ...SAMPLE_AREAS.map((area) => ({
        value: area.id,
        label: getLocalizedLocationLabel(area.name, area.city, SAMPLE_AREAS, lang),
      })),
    ];
  }, [lang, t]);

  const cleanName = sanitizeText(fullName, INPUT_LIMITS.NAME_MAX);
  const normalizedEmail = email.trim().toLowerCase();
  const pwCheck = evaluatePassword(password);
  const emailTaken = normalizedEmail.length > 0 && isValidEmail(normalizedEmail) && authService.isEmailTaken(normalizedEmail);

  const errors = {
    role: !role ? t('auth.errRoleRequired') : '',
    fullName: cleanName.length < 2 || cleanName.length > 60 ? t('auth.errNameLength') : '',
    email: !isValidEmail(normalizedEmail)
      ? t('auth.errEmailInvalid')
      : emailTaken
        ? t('auth.errEmailTaken')
        : '',
    password: !pwCheck.isValid ? t('auth.errPasswordWeak') : '',
    confirmPassword:
      confirmPassword.length === 0 || confirmPassword !== password
        ? t('auth.errPasswordMismatch')
        : '',
    categoryId: role === 'worker' && !categoryId ? t('auth.errSkillRequired') : '',
    areaId: role === 'worker' && !areaId ? t('auth.errAreaRequired') : '',
    terms: !agreedToTerms ? t('auth.errTermsRequired') : '',
  };

  const isFormValid =
    !errors.role &&
    !errors.fullName &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.categoryId &&
    !errors.areaId &&
    !errors.terms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      role: true,
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      categoryId: true,
      areaId: true,
      terms: true,
    });
    setSubmitError('');

    if (!isFormValid || !role) return;

    const chosenArea = SAMPLE_AREAS.find((a) => a.id === areaId);

    setSubmitting(true);
    try {
      const result = await authService.signUp({
        role,
        fullName: cleanName,
        email: normalizedEmail,
        password,
        categoryId: role === 'worker' ? categoryId : undefined,
        city: chosenArea?.city,
        area: chosenArea?.name,
      });

      if (!result.ok || !result.data) {
        if (result.errorCode === 'EMAIL_EXISTS') {
          setSubmitError(t('auth.errEmailTaken'));
        } else if (result.errorCode === 'WEAK_PASSWORD') {
          setSubmitError(t('auth.errPasswordWeak'));
        } else if (result.errorCode === 'INVALID_EMAIL') {
          setSubmitError(t('auth.errEmailInvalid'));
        } else if (result.errorCode === 'INVALID_NAME') {
          setSubmitError(t('auth.errNameLength'));
        } else {
          setSubmitError(t('auth.errInvalidCredentials'));
        }
        return;
      }

      const { account } = result.data;
      setPassword('');
      setConfirmPassword('');

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

      showToast(t('auth.accountCreatedToast'), 'success');
      navigate(account.role === 'worker' ? '/worker' : '/customer', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const strengthColor =
    pwCheck.strength === 'strong'
      ? 'bg-[#16865B]'
      : pwCheck.strength === 'good'
        ? 'bg-[#1769E0]'
        : 'bg-[#D99018]';

  const strengthWidth =
    password.length === 0
      ? 'w-0'
      : pwCheck.strength === 'strong'
        ? 'w-full'
        : pwCheck.strength === 'good'
          ? 'w-2/3'
          : 'w-1/3';

  const strengthLabel =
    pwCheck.strength === 'strong'
      ? t('auth.pwStrong')
      : pwCheck.strength === 'good'
        ? t('auth.pwGood')
        : t('auth.pwWeak');

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

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <Card padding="lg" className="space-y-6 shadow-[0_10px_30px_rgba(16,42,67,0.07)]">
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('auth.registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* 1) Account type: two big cards */}
            <fieldset className="space-y-2">
              <legend className="text-base font-bold text-[#102A43]">
                {t('auth.roleLabel')} <span className="text-[#D64545]">*</span>
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setRole('customer');
                    setTouched((prev) => ({ ...prev, role: true }));
                  }}
                  aria-pressed={role === 'customer'}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
                    role === 'customer'
                      ? 'border-[#1769E0] bg-[#EFF6FF] shadow-sm'
                      : 'border-[#CBD5E1] bg-white hover:border-[#93C5FD]'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1769E0] shadow-xs">
                    <UserCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-base font-extrabold text-[#102A43]">
                    {t('auth.roleCustomerCard')}
                  </span>
                  <span className="text-sm text-[#62748A]">{t('auth.roleCustomerDesc')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('worker');
                    setTouched((prev) => ({ ...prev, role: true }));
                  }}
                  aria-pressed={role === 'worker'}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] ${
                    role === 'worker'
                      ? 'border-[#1769E0] bg-[#EFF6FF] shadow-sm'
                      : 'border-[#CBD5E1] bg-white hover:border-[#93C5FD]'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1769E0] shadow-xs">
                    <Hammer className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-base font-extrabold text-[#102A43]">
                    {t('auth.roleWorkerCard')}
                  </span>
                  <span className="text-sm text-[#62748A]">{t('auth.roleWorkerDesc')}</span>
                </button>
              </div>
              {touched.role && errors.role && (
                <p role="alert" className="text-sm font-semibold text-[#D64545]">
                  {errors.role}
                </p>
              )}
            </fieldset>

            {/* 2) Full name */}
            <Input
              id="reg-full-name"
              label={t('auth.fullNameLabel')}
              placeholder={t('auth.fullNamePlaceholder')}
              value={fullName}
              maxLength={60}
              required
              autoComplete="name"
              error={touched.fullName ? errors.fullName : undefined}
              onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
              onChange={(e) => {
                setFullName(e.target.value);
                if (submitError) setSubmitError('');
              }}
            />

            {/* 3) Email address */}
            <Input
              id="reg-email"
              type="email"
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              maxLength={120}
              required
              autoComplete="email"
              error={touched.email ? errors.email : undefined}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              onChange={(e) => {
                setEmail(e.target.value);
                if (submitError) setSubmitError('');
              }}
            />

            {/* 4) Password with show/hide eye, live checklist, strength bar */}
            <div className="space-y-2">
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                maxLength={INPUT_LIMITS.PASSWORD_MAX}
                required
                autoComplete="new-password"
                error={touched.password ? errors.password : undefined}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitError) setSubmitError('');
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

              {/* Live Strength Bar */}
              <div className="space-y-1.5 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#62748A]">{t('auth.pwStrengthLabel')}</span>
                  <span className="text-[#102A43]">
                    {password.length > 0 ? strengthLabel : '—'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E3EAF3]">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${strengthColor} ${strengthWidth}`}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-xs font-semibold">
                  {[
                    { ok: pwCheck.minLength, label: t('auth.pwRuleLength') },
                    { ok: pwCheck.hasLetter, label: t('auth.pwRuleLetter') },
                    { ok: pwCheck.hasNumber, label: t('auth.pwRuleNumber') },
                  ].map((rule, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-1.5 ${
                        rule.ok ? 'text-[#16865B]' : 'text-[#62748A]'
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          rule.ok ? 'opacity-100' : 'opacity-30'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5) Confirm password with show/hide eye */}
            <Input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              label={t('auth.confirmPasswordLabel')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              maxLength={INPUT_LIMITS.PASSWORD_MAX}
              required
              autoComplete="new-password"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (submitError) setSubmitError('');
              }}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#62748A] hover:bg-[#F1F5F9] hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              }
            />

            {/* 6) Workers only: Main skill and Service area */}
            {role === 'worker' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  id="reg-skill"
                  label={t('login.skillLabel')}
                  value={categoryId}
                  required
                  options={skillOptions}
                  error={touched.categoryId ? errors.categoryId : undefined}
                  onBlur={() => setTouched((prev) => ({ ...prev, categoryId: true }))}
                  onChange={(e) => setCategoryId(e.target.value)}
                />

                <Select
                  id="reg-area"
                  label={t('login.areaLabel')}
                  value={areaId}
                  required
                  options={areaOptions}
                  error={touched.areaId ? errors.areaId : undefined}
                  onBlur={() => setTouched((prev) => ({ ...prev, areaId: true }))}
                  onChange={(e) => setAreaId(e.target.value)}
                />
              </div>
            )}

            {/* 7) Terms checkbox */}
            <div className="space-y-1.5">
              <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-[#CBD5E1] bg-white px-4 py-3">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    setTouched((prev) => ({ ...prev, terms: true }));
                  }}
                  className="h-5 w-5 shrink-0 rounded border-[#CBD5E1] text-[#1769E0] focus:ring-[#1769E0]"
                />
                <span className="text-sm font-semibold text-[#102A43]">
                  {t('auth.termsLabel')} <span className="text-[#D64545]">*</span>
                </span>
              </label>
              {touched.terms && errors.terms && (
                <p role="alert" className="text-sm font-semibold text-[#D64545]">
                  {errors.terms}
                </p>
              )}
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#D64545]"
              >
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isFormValid || submitting}
            >
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              <span>{t('auth.createAccountBtn')}</span>
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg px-3 text-base font-bold text-[#1769E0] hover:underline"
              >
                {t('auth.alreadyHaveAccount')}
              </Link>
            </div>
          </form>

          <p className="flex items-start gap-2 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-3.5 py-3 text-xs font-medium text-[#62748A]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
            <span>{t('auth.demoDeviceNotice')}</span>
          </p>
        </Card>
      </main>
    </div>
  );
};
