import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

export const SafetyPage: React.FC = () => {
  const { state } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const homePath =
    state.activeRole === UserRole.Worker
      ? '/worker'
      : state.activeRole === UserRole.Customer
        ? '/customer'
        : '/';

  const safetyTips = [
    t('safety.tip1'),
    t('safety.tip2'),
    t('safety.tip3'),
    t('safety.tip4'),
    t('safety.tip5'),
  ];

  const trustPillars = [
    t('safety.trust1'),
    t('safety.trust2'),
    t('safety.trust3'),
    t('safety.trust4'),
    t('safety.trust5'),
  ];

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16865B]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('safety.title')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('safety.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-[#102A43]">{t('safety.tipsTitle')}</h2>
        <div className="space-y-3">
          {safetyTips.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4"
            >
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-[#16865B]"
                aria-hidden="true"
              />
              <p className="text-base leading-relaxed text-[#172B4D]">{tip}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* How We Build Trust */}
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-[#102A43]">{t('safety.trustTitle')}</h2>
        <div className="space-y-3">
          {trustPillars.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-[#D2E3FC] bg-[#F8FBFF] p-4"
            >
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-[#1769E0]"
                aria-hidden="true"
              />
              <p className="text-base leading-relaxed text-[#172B4D]">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* What Checked (Demo) Means */}
      <div
        role="note"
        className="space-y-2 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-[#92400E]"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-extrabold">{t('safety.checkedExplainTitle')}</h2>
        </div>
        <p className="text-base leading-relaxed">{t('safety.checkedExplainBody')}</p>
      </div>

      {/* Related Links */}
      <div className="flex flex-wrap gap-3">
        <Link to="/help">
          <Button variant="primary" size="md">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
            <span>{t('help.title')}</span>
          </Button>
        </Link>
        <Link to="/about">
          <Button variant="outline" size="md">
            <Info className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
            <span>{t('about.title')}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
