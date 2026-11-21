import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Clock,
  Compass,
  Hammer,
  HelpCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

export const AboutPage: React.FC = () => {
  const { state } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const homePath =
    state.activeRole === UserRole.Worker
      ? '/worker'
      : state.activeRole === UserRole.Customer
        ? '/customer'
        : '/';

  return (
    <div className="mx-auto max-w-[820px] space-y-6">
      <div>
        <Button variant="outline" size="md" onClick={() => navigate(homePath)}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>
      </div>

      <section className="space-y-2 rounded-2xl border border-[#E3EAF3] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
            <Info className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('about.title')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('about.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <Card className="space-y-3">
        <h2 className="text-xl font-bold text-[#102A43]">{t('about.problemTitle')}</h2>
        <p className="text-base leading-relaxed text-[#172B4D]">{t('about.problemBody')}</p>
      </Card>

      {/* How HunarLink Helps */}
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-[#102A43]">{t('about.howTitle')}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#D2E3FC] bg-[#F8FBFF] p-4 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1769E0]">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-base leading-relaxed text-[#172B4D]">{t('about.howCustomer')}</p>
          </div>

          <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4]/60 p-4 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#16865B] border border-[#BBF7D0]">
              <Hammer className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-base leading-relaxed text-[#172B4D]">{t('about.howWorker')}</p>
          </div>
        </div>
      </Card>

      {/* Vision */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#102A43]">{t('about.visionTitle')}</h2>
        </div>
        <p className="text-base leading-relaxed text-[#172B4D]">{t('about.visionBody')}</p>
      </Card>

      {/* What Is Planned (clearly marked Planned, not available yet) */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-[#D99018]" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[#102A43]">{t('about.plannedTitle')}</h2>
          </div>
          <span className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-sm font-bold text-[#92400E]">
            {t('about.plannedBadge')}
          </span>
        </div>

        <ul className="space-y-2.5">
          {[t('about.planned1'), t('about.planned2'), t('about.planned3')].map((item, idx) => (
            <li
              key={idx}
              className="flex items-start justify-between gap-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-4 py-3 text-base text-[#172B4D]"
            >
              <span>{item}</span>
              <span className="shrink-0 text-xs font-bold text-[#92400E]">
                {t('about.plannedBadge')}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Explicit Demo Notice */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-base font-semibold text-[#92400E]"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t('about.demoDisclaimer')}</span>
      </div>

      {/* Helpful Links */}
      <div className="flex flex-wrap gap-3">
        <Link to="/safety">
          <Button variant="secondary" size="md">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span>{t('safety.title')}</span>
          </Button>
        </Link>
        <Link to="/help">
          <Button variant="outline" size="md">
            <HelpCircle className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
            <span>{t('help.title')}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
