import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Play,
  RotateCcw,
  UserCheck,
  Users,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { DemoAccountKey, UserRole } from '../types';

export const DemoHelperPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleEnterAccount = (account: DemoAccountKey) => {
    dispatch({ type: 'ENTER_DEMO_ACCOUNT', account });
    navigate(account === 'customer' ? '/customer' : '/worker');
  };

  const handleRunScenario = (scenario: 'A' | 'B') => {
    dispatch({ type: 'RUN_DEMO_SCENARIO', scenario });
    navigate('/worker/jobs');
  };

  const handleBackHome = () => {
    if (state.activeRole === UserRole.Customer) {
      navigate('/customer');
    } else if (state.activeRole === UserRole.Worker) {
      navigate('/worker');
    } else {
      navigate('/');
    }
  };

  const content = (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-[#DCE7F5] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
          {t('demoHelper.title')}
        </h1>
        <p className="mt-1 text-base text-[#62748A]">{t('demoHelper.subtitle')}</p>
      </section>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-bold text-[#16865B]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3 Fixed Demo Accounts */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-[#102A43]">
            {t('demoHelper.accountsTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleEnterAccount('customer')}
            className={`flex min-h-[112px] flex-col justify-between rounded-2xl border-2 p-4 text-start transition-colors cursor-pointer ${
              state.activeRole === UserRole.Customer
                ? 'border-[#1769E0] bg-[#EFF6FF]'
                : 'border-[#E3EAF3] bg-white hover:border-[#1769E0]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <UserCheck className="h-6 w-6 text-[#1769E0]" aria-hidden="true" />
              <ArrowRight className="h-4 w-4 text-[#1769E0] rtl:rotate-180" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-[#102A43]">{t('home.roleCustomerTitle')}</p>
              <p className="mt-0.5 text-sm text-[#62748A]">{t('home.roleCustomerSub')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleEnterAccount('worker')}
            className={`flex min-h-[112px] flex-col justify-between rounded-2xl border-2 p-4 text-start transition-colors cursor-pointer ${
              state.activeRole === UserRole.Worker && state.activeWorkerId === 'wrk_ali_raza'
                ? 'border-[#1769E0] bg-[#EFF6FF]'
                : 'border-[#E3EAF3] bg-white hover:border-[#1769E0]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Hammer className="h-6 w-6 text-[#1769E0]" aria-hidden="true" />
              <ArrowRight className="h-4 w-4 text-[#1769E0] rtl:rotate-180" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-[#102A43]">{t('home.roleWorkerTitle')}</p>
              <p className="mt-0.5 text-sm text-[#62748A]">{t('home.roleWorkerSub')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleEnterAccount('contractor')}
            className={`flex min-h-[112px] flex-col justify-between rounded-2xl border-2 p-4 text-start transition-colors cursor-pointer ${
              state.activeRole === UserRole.Worker && state.activeWorkerId === 'wrk_hassan_team'
                ? 'border-[#16865B] bg-[#F0FDF4]'
                : 'border-[#E3EAF3] bg-white hover:border-[#16865B]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Building2 className="h-6 w-6 text-[#16865B]" aria-hidden="true" />
              <ArrowRight className="h-4 w-4 text-[#16865B] rtl:rotate-180" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-[#102A43]">{t('home.roleContractorTitle')}</p>
              <p className="mt-0.5 text-sm text-[#62748A]">{t('home.roleContractorSub')}</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Scenario A */}
      <Card className="space-y-3 border-[#D2E3FC] bg-[#F8FBFF]">
        <h2 className="text-lg font-extrabold text-[#102A43]">
          {t('demoHelper.scenarioATitle')}
        </h2>
        <p className="text-base text-[#172B4D]">{t('demoHelper.scenarioADesc')}</p>
        <div>
          <Button variant="primary" size="lg" onClick={() => handleRunScenario('A')}>
            <Play className="h-5 w-5" aria-hidden="true" />
            <span>{t('demoHelper.scenarioABtn')}</span>
          </Button>
        </div>
      </Card>

      {/* Scenario B */}
      <Card className="space-y-3 border-[#BBF7D0] bg-[#F0FDF4]/60">
        <h2 className="text-lg font-extrabold text-[#102A43]">
          {t('demoHelper.scenarioBTitle')}
        </h2>
        <p className="text-base text-[#172B4D]">{t('demoHelper.scenarioBDesc')}</p>
        <div>
          <Button variant="secondary" size="lg" onClick={() => handleRunScenario('B')}>
            <Play className="h-5 w-5" aria-hidden="true" />
            <span>{t('demoHelper.scenarioBBtn')}</span>
          </Button>
        </div>
      </Card>

      {/* 3-Minute Demo Script */}
      <Card className="space-y-3 border-[#E3EAF3] bg-white">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-[#102A43]">
            {t('demoHelper.scriptTitle')}
          </h2>
        </div>
        <ol className="space-y-2 text-base leading-relaxed text-[#172B4D]">
          {[
            t('demoHelper.scriptStep1'),
            t('demoHelper.scriptStep2'),
            t('demoHelper.scriptStep3'),
            t('demoHelper.scriptStep4'),
          ].map((step, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] px-4 py-3"
            >
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {/* Reset Demo Data */}
      <Card className="space-y-3 border-[#FECACA] bg-[#FEF2F2]">
        <h2 className="text-lg font-extrabold text-[#D64545]">{t('demoHelper.resetTitle')}</h2>
        <p className="text-base text-[#172B4D]">{t('demoHelper.resetDesc')}</p>
        <div>
          <Button variant="danger" size="lg" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            <span>{t('settings.resetBtn')}</span>
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET_DEMO_DATA' });
          setFeedback(t('settings.resetSuccess'));
        }}
        title={t('settings.resetConfirmTitle')}
        message={t('settings.resetConfirmMsg')}
        confirmLabel={t('settings.resetConfirmYes')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />
    </div>
  );

  if (state.activeRole === UserRole.Guest) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#EFF6FF] via-[#F6FAFF] to-white text-[#172B4D]">
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBackHome}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              <span>{t('app.back')}</span>
            </Button>
            <BrandLogo size="sm" />
          </div>
          <LanguageSwitch compact />
        </header>
        <main className="px-4 py-8 sm:px-6">{content}</main>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-3xl">
        <Button variant="outline" size="md" onClick={handleBackHome}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>
      </div>
      {content}
    </div>
  );
};
