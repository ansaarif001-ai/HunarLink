import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CheckCircle2,
  Info,
  Wallet,
} from 'lucide-react';
import { RoleGuard } from '../components/RoleGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatusText } from '../components/ui/StatusBadge';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';
import { formatTimelineDate } from '../utils/id';
import {
  EarningsPeriod,
  filterTransactionsByPeriod,
  formatPkr,
  summarizeEarnings,
} from '../utils/pricing';

export const WorkerEarningsPage: React.FC = () => {
  const { state, activeWorker } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const worker = activeWorker || state.workers[0];
  const [period, setPeriod] = useState<EarningsPeriod>('all');

  const workerTransactions = useMemo(() => {
    return state.transactions
      .filter((tx) => tx.workerId === worker.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.transactions, worker.id]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(workerTransactions, period),
    [workerTransactions, period]
  );

  const summary = useMemo(
    () => summarizeEarnings(filteredTransactions),
    [filteredTransactions]
  );

  return (
    <RoleGuard allowedRole={UserRole.Worker}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/worker')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.backHome')}</span>
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/worker/bookings')}>
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>{t('workerBookings.title')}</span>
          </Button>
        </div>

        <section className="space-y-4 rounded-2xl border border-[#E3EAF3] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
                {t('workerEarnings.title')}
              </h1>
              <p className="mt-1 text-base text-[#62748A]">{t('workerEarnings.subtitle')}</p>
            </div>

            {/* Period Filter */}
            <div
              role="tablist"
              aria-label={t('workerEarnings.periodAria')}
              className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F1F5F9] p-1"
            >
              {(
                [
                  { key: 'week', label: t('workerEarnings.periodWeek') },
                  { key: 'month', label: t('workerEarnings.periodMonth') },
                  { key: 'all', label: t('workerEarnings.periodAll') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={period === tab.key}
                  onClick={() => setPeriod(tab.key)}
                  className={`min-h-[48px] whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors cursor-pointer ${
                    period === tab.key
                      ? 'bg-white text-[#1769E0] shadow-xs'
                      : 'text-[#62748A] hover:text-[#102A43]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-sm font-semibold text-[#92400E]">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('workerEarnings.disclaimer')}</span>
          </div>

          {/* 4 Big Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#62748A]">
                {t('workerEarnings.totalJobValue')}
              </p>
              <p className="ltr-num mt-1 font-mono text-2xl font-extrabold text-[#102A43] tabular-nums">
                {formatPkr(summary.totalJobValue, lang)}
              </p>
            </div>

            <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#62748A]">
                {t('workerEarnings.totalOurFee')}
              </p>
              <p className="ltr-num mt-1 font-mono text-2xl font-extrabold text-[#D99018] tabular-nums">
                {formatPkr(summary.totalFee, lang)}
              </p>
            </div>

            <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
              <p className="text-sm font-bold text-[#16865B]">
                {t('workerEarnings.totalYouGet')}
              </p>
              <p className="ltr-num mt-1 font-mono text-2xl font-extrabold text-[#16865B] tabular-nums">
                {formatPkr(summary.totalNet, lang)}
              </p>
            </div>

            <div className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#62748A]">
                {t('workerPublic.completed')}
              </p>
              <p className="ltr-num mt-1 font-mono text-2xl font-extrabold text-[#102A43] tabular-nums">
                {summary.jobsCount}
              </p>
            </div>
          </div>

          {/* Simple Visual 5% Fee Formula Example */}
          <div className="rounded-xl border border-[#D2E3FC] bg-[#EFF6FF] p-4">
            <p className="text-sm font-bold text-[#102A43]">
              {t('workerEarnings.exampleHeading')}
            </p>
            <p className="mt-1 text-base font-bold text-[#1769E0]">
              {t('sendPrice.exampleText')}
            </p>
          </div>
        </section>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
              <Wallet className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#102A43]">
              {t('workerEarnings.emptyTitle')}
            </h2>
            <p className="mt-2 text-base text-[#62748A]">{t('workerEarnings.emptyDesc')}</p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/worker/bookings')}>
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                <span>{t('workerBookings.title')}</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43]">
              {t('workerEarnings.completedRecordsHeading', { n: filteredTransactions.length })}
            </h2>
            {filteredTransactions.map((tx) => {
              const relatedJob = state.jobs.find((j) => j.id === tx.jobId);
              const displayTitle =
                isUrdu && relatedJob?.titleUr ? relatedJob.titleUr : tx.jobTitle;
              const statusLabel =
                tx.status === 'Pending'
                  ? t('workerEarnings.statusPending')
                  : t('workerEarnings.statusDone');
              return (
                <Card key={tx.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#102A43]">{displayTitle}</h3>
                      <p className="text-sm text-[#62748A]">
                        {formatTimelineDate(tx.createdAt, lang)}
                      </p>
                    </div>
                    <StatusText
                      label={statusLabel}
                      tone={tx.status === 'Pending' ? 'warning' : 'success'}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-[#E3EAF3] pt-3">
                    <div>
                      <p className="text-xs font-semibold text-[#62748A]">
                        {t('sendPrice.jobValueLabel')}
                      </p>
                      <p className="ltr-num font-mono text-base font-bold text-[#102A43] tabular-nums">
                        {formatPkr(tx.jobValue ?? tx.grossPkr, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#62748A]">
                        {t('sendPrice.ourFeeLabel')}
                      </p>
                      <p className="ltr-num font-mono text-base font-bold text-[#D99018] tabular-nums">
                        {formatPkr(tx.fee ?? tx.ourFeePkr, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#16865B]">
                        {t('sendPrice.youReceiveLabel')}
                      </p>
                      <p className="ltr-num font-mono text-base font-extrabold text-[#16865B] tabular-nums">
                        <Banknote className="me-1 inline h-4 w-4" aria-hidden="true" />
                        {formatPkr(tx.net ?? tx.netPkr, lang)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
};
