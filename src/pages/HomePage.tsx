import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Mail,
  MapPin,
  MessageSquare,
  Quote,
  Search,
  ShieldCheck,
  Star,
  Tag,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { CategoryArtwork } from '../components/CategoryArtwork';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName, getLocalizedLocationLabel } from '../i18n';
import { UserRole } from '../types';

interface PendingAction {
  customerPath: string;
  workerPath: string;
  title: string;
}

export const HomePage: React.FC = () => {
  const { state } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (state.activeRole === UserRole.Customer) {
      navigate('/customer', { replace: true });
    } else if (state.activeRole === UserRole.Worker) {
      navigate('/worker', { replace: true });
    }
  }, [state.activeRole, navigate]);

  const featuredWorkers = state.workers.slice(0, 4);

  const handleChooseRoleForPending = (role: 'customer' | 'worker') => {
    if (!pendingAction) {
      navigate(`/login?role=${role}`);
      return;
    }
    const targetNext =
      role === 'customer' ? pendingAction.customerPath : pendingAction.workerPath;
    setPendingAction(null);
    navigate(`/login?role=${role}&next=${encodeURIComponent(targetNext)}`);
  };

  const howSteps = [
    {
      icon: ClipboardList,
      title: t('publicHome.step1Title'),
      desc: t('publicHome.step1Desc'),
    },
    {
      icon: Tag,
      title: t('publicHome.step2Title'),
      desc: t('publicHome.step2Desc'),
    },
    {
      icon: MessageSquare,
      title: t('publicHome.step3Title'),
      desc: t('publicHome.step3Desc'),
    },
    {
      icon: CheckCircle2,
      title: t('publicHome.step4Title'),
      desc: t('publicHome.step4Desc'),
    },
  ];

  const whyPoints = [
    {
      icon: Banknote,
      title: t('publicHome.why1Title'),
      desc: t('publicHome.why1Desc'),
    },
    {
      icon: Camera,
      title: t('publicHome.why2Title'),
      desc: t('publicHome.why2Desc'),
    },
    {
      icon: Star,
      title: t('publicHome.why3Title'),
      desc: t('publicHome.why3Desc'),
    },
    {
      icon: Users,
      title: t('publicHome.why4Title'),
      desc: t('publicHome.why4Desc'),
    },
  ];

  const testimonials = [
    {
      quote: t('publicHome.testi1Quote'),
      name: t('publicHome.testi1Name'),
      role: t('publicHome.testi1Role'),
    },
    {
      quote: t('publicHome.testi2Quote'),
      name: t('publicHome.testi2Name'),
      role: t('publicHome.testi2Role'),
    },
    {
      quote: t('publicHome.testi3Quote'),
      name: t('publicHome.testi3Name'),
      role: t('publicHome.testi3Role'),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#172B4D]">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E3EAF3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0]"
          >
            <BrandLogo size="sm" />
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitch compact />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="whitespace-nowrap"
            >
              <UserCheck className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
              <span>{t('auth.signInBtn')}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/register')}
              className="whitespace-nowrap"
            >
              <Hammer className="h-4 w-4" aria-hidden="true" />
              <span>{t('auth.createAccountBtn')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="border-b border-[#E3EAF3] bg-gradient-to-b from-[#EFF6FF] via-[#F7FAFF] to-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-5xl sm:leading-[1.15]">
                {t('publicHome.heroHeadline')}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[#475569] sm:text-xl">
                {t('publicHome.heroSubtitle')}
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="min-h-[56px] px-7 text-lg"
                >
                  <UserCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{t('auth.createAccountBtn')}</span>
                  <ArrowRight className="h-5 w-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="min-h-[56px] px-7 text-lg"
                >
                  <span>{t('auth.signInBtn')}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/login?mode=guest')}
                  className="min-h-[56px] border-2 border-[#93C5FD] px-7 text-lg"
                >
                  <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{t('auth.continueGuestBtn')}</span>
                </Button>
              </div>
              <p className="mt-4 text-sm font-medium text-[#62748A]">
                {t('auth.demoDeviceNotice')}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How It Works (4 Simple Steps) */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('publicHome.howTitle')}
              </h2>
              <p className="mt-2 text-base text-[#62748A] sm:text-lg">
                {t('publicHome.howSubtitle')}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {howSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col rounded-2xl border border-[#E3EAF3] bg-white p-6 shadow-[0_2px_8px_rgba(16,42,67,0.03)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1769E0]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#102A43]">{step.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-[#62748A]">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: 15 Picture Service Categories */}
        <section className="border-y border-[#E3EAF3] bg-[#F8FAFC] py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('publicHome.categoriesTitle')}
              </h2>
              <p className="mt-2 text-base text-[#62748A] sm:text-lg">
                {t('publicHome.categoriesSubtitle')}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {state.categories.map((cat) => {
                const name = getLocalizedCategoryName(cat, lang);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setPendingAction({
                        customerPath: `/category/${cat.slug}`,
                        workerPath: '/worker/jobs',
                        title: name,
                      })
                    }
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#E3EAF3] bg-white text-start shadow-[0_1px_3px_rgba(16,42,67,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-[0_6px_16px_rgba(16,42,67,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer"
                  >
                    <CategoryArtwork category={cat} />
                    <div className="flex flex-1 items-center justify-between gap-2 p-3.5">
                      <span className="text-base font-bold text-[#102A43] group-hover:text-[#1769E0]">
                        {name}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-[#62748A] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1769E0] rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 4: Featured Workers (4 Cards, Demo Labels) */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('publicHome.featuredTitle')}
              </h2>
              <p className="mt-2 text-base text-[#62748A] sm:text-lg">
                {t('publicHome.featuredSubtitle')}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredWorkers.map((worker) => {
                const displayName = isUrdu ? worker.nameUr || worker.name : worker.name;
                const displayHeadline = isUrdu
                  ? worker.headlineUr || worker.headline
                  : worker.headline;
                const areaLabel = getLocalizedLocationLabel(
                  worker.area,
                  worker.city,
                  SAMPLE_AREAS,
                  lang
                );

                return (
                  <article
                    key={worker.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E3EAF3] bg-white p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={displayName}
                          src={worker.profilePhotoUrl}
                          size="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold text-[#102A43]">
                            {displayName}
                          </h3>
                          <p className="line-clamp-2 text-sm font-medium text-[#62748A]">
                            {displayHeadline}
                          </p>
                        </div>
                      </div>

                      {worker.checkedDemo && (
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#16865B]">
                          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {t('common.checked')} ({t('common.demo')})
                          </span>
                        </p>
                      )}

                      <div className="space-y-1.5 border-t border-[#E3EAF3] pt-3 text-sm">
                        <p className="inline-flex items-center gap-1.5 font-semibold text-[#102A43] tabular-nums">
                          <Star
                            className="h-4 w-4 fill-[#D99018] text-[#D99018]"
                            aria-hidden="true"
                          />
                          <span>
                            {worker.rating.toFixed(1)} ({t('common.demo')})
                          </span>
                          <span className="font-normal text-[#62748A]">
                            · {t('common.jobsDone', { n: worker.jobsCompleted })}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[#62748A]">
                          <MapPin className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
                          <span className="truncate">{areaLabel}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#E3EAF3] pt-4">
                      <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        onClick={() =>
                          setPendingAction({
                            customerPath: `/workers/${worker.id}`,
                            workerPath: '/worker/jobs',
                            title: displayName,
                          })
                        }
                      >
                        <span>{t('publicHome.viewProfileAction')}</span>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 rtl:rotate-180"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 5: Why HunarLink + Demo Numbers */}
        <section className="border-y border-[#E3EAF3] bg-[#F8FAFC] py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] space-y-10 px-4 sm:px-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('publicHome.whyTitle')}
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {whyPoints.map((pt, idx) => {
                  const Icon = pt.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#E3EAF3] bg-white p-5 space-y-2.5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1769E0]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-bold text-[#102A43]">{pt.title}</h3>
                      <p className="text-base leading-relaxed text-[#62748A]">{pt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demo Numbers Strip */}
            <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-6 sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#1769E0]">
                {t('publicHome.demoNumbersTitle')}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  t('publicHome.statServices'),
                  t('publicHome.statCities'),
                  t('publicHome.statFee'),
                  t('publicHome.statDemoLabel'),
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#D2E3FC] bg-white px-4 py-4 text-center text-base font-extrabold text-[#102A43] sm:text-lg"
                  >
                    {stat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Sample Testimonials */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('publicHome.testimonialsTitle')}
              </h2>
              <span className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-sm font-bold text-[#1769E0]">
                {t('publicHome.sampleBadge')}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.map((item, idx) => (
                <figure
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-[#E3EAF3] bg-white p-6 shadow-[0_2px_8px_rgba(16,42,67,0.03)]"
                >
                  <div>
                    <Quote className="h-6 w-6 text-[#93C5FD]" aria-hidden="true" />
                    <blockquote className="mt-3 text-base leading-relaxed text-[#172B4D]">
                      {item.quote}
                    </blockquote>
                  </div>
                  <figcaption className="mt-5 border-t border-[#E3EAF3] pt-3">
                    <p className="text-base font-bold text-[#102A43]">{item.name}</p>
                    <p className="text-sm text-[#62748A]">{item.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Public Website Footer */}
      <footer className="border-t border-[#E3EAF3] bg-[#F8FAFC] py-10 text-[#62748A]">
        <div className="mx-auto max-w-[1200px] space-y-6 px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <BrandLogo size="sm" />
              <p className="text-sm text-[#62748A]">{t('app.tagline')}</p>
            </div>

            <nav aria-label={t('nav.mainMenu')} className="flex flex-wrap items-center gap-5 text-base font-semibold">
              <Link to="/about" className="text-[#172B4D] hover:text-[#1769E0]">
                {t('publicHome.footerAbout')}
              </Link>
              <Link to="/safety" className="text-[#172B4D] hover:text-[#1769E0]">
                {t('publicHome.footerSafety')}
              </Link>
              <Link to="/help" className="text-[#172B4D] hover:text-[#1769E0]">
                {t('publicHome.footerHelp')}
              </Link>
              <Link
                to="/demo-helper"
                className="inline-flex items-center gap-1.5 text-[#1769E0] hover:underline"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                <span>{t('publicHome.footerDemo')}</span>
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3EAF3] pt-5 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>{t('home.demoFooterNote')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#475569]">
              <Mail className="h-4 w-4 shrink-0 text-[#1769E0]" aria-hidden="true" />
              <span>{t('publicHome.footerContact')}</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Role Choice Prompt Modal when a Guest taps a Category or Featured Worker */}
      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.title || t('publicHome.roleModalTitle')}
        description={t('publicHome.roleModalDesc')}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => handleChooseRoleForPending('customer')}
          >
            <UserCheck className="h-5 w-5" aria-hidden="true" />
            <span>{t('home.continueCustomer')}</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => handleChooseRoleForPending('worker')}
          >
            <Hammer className="h-5 w-5" aria-hidden="true" />
            <span>{t('home.continueWorker')}</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => setPendingAction(null)}
          >
            <span>{t('app.cancel')}</span>
          </Button>
        </div>
      </Modal>
    </div>
  );
};
