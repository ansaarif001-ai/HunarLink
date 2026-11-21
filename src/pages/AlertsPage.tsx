import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, CheckCheck, Clock, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { AlertCategory, UserRole } from '../types';
import { AlertFilterTab, getAlertsForActiveUser } from '../utils/alerts';
import { formatRelativeTime } from '../utils/id';

const FILTER_TAB_KEYS: { key: AlertFilterTab; labelKey: string }[] = [
  { key: 'all', labelKey: 'alerts.tabAll' },
  { key: 'unread', labelKey: 'alerts.tabUnread' },
  { key: 'jobs', labelKey: 'alerts.tabJobs' },
  { key: 'prices', labelKey: 'alerts.tabPrices' },
  { key: 'chat', labelKey: 'alerts.tabChat' },
  { key: 'reviews', labelKey: 'alerts.tabReviews' },
];

const CATEGORY_BADGE_KEYS: Record<AlertCategory, string> = {
  jobs: 'alerts.tabJobs',
  prices: 'alerts.tabPrices',
  chat: 'alerts.tabChat',
  reviews: 'alerts.tabReviews',
};

export const AlertsPage: React.FC = () => {
  const { state, dispatch, unreadAlertsCount } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const navigate = useNavigate();

  const isWorker = state.activeRole === UserRole.Worker;
  const isCustomer = state.activeRole === UserRole.Customer;
  const [filter, setFilter] = useState<AlertFilterTab>('all');

  const alerts = useMemo(() => {
    return getAlertsForActiveUser(
      state.notifications,
      state.activeRole,
      state.activeCustomerId,
      state.activeWorkerId,
      state.alertPreferences,
      filter
    );
  }, [
    state.notifications,
    state.activeRole,
    state.activeCustomerId,
    state.activeWorkerId,
    state.alertPreferences,
    filter,
  ]);

  const homePath = isWorker ? '/worker' : isCustomer ? '/customer' : '/';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="md" onClick={() => navigate(homePath)}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
            <span>{t('alerts.settingsBtn')}</span>
          </Button>
          {unreadAlertsCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => dispatch({ type: 'MARK_ALL_ALERTS_READ' })}
            >
              <CheckCheck className="h-5 w-5" aria-hidden="true" />
              <span>{t('alerts.markAllRead')}</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-[#102A43]">{t('alerts.title')}</h1>
          {unreadAlertsCount > 0 && (
            <span className="rounded-lg bg-[#FEF2F2] px-3 py-1 text-sm font-bold text-[#D64545] tabular-nums">
              {t('nav.unreadCount', { n: unreadAlertsCount })}
            </span>
          )}
        </div>
        <p className="text-base text-[#62748A]">
          {isWorker ? t('alerts.subtitleWorker') : t('alerts.subtitleCustomer')}
        </p>

        {/* Filter Tabs: All | Unread | Jobs | Prices | Chat | Reviews */}
        <div
          role="tablist"
          aria-label={t('alerts.filterAria')}
          className="flex flex-wrap gap-2 border-t border-[#E3EAF3] pt-3"
        >
          {FILTER_TAB_KEYS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.key)}
                className={`min-h-[48px] rounded-xl border-2 px-3.5 text-sm font-bold transition-colors cursor-pointer ${
                  active
                    ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                    : 'border-[#E3EAF3] bg-white text-[#62748A] hover:text-[#102A43]'
                }`}
              >
                {t(tab.labelKey as never)}
              </button>
            );
          })}
        </div>
      </Card>

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('alerts.emptyDropdown')}
          description={filter === 'all' ? t('alerts.caughtUp') : t('alerts.emptyFiltered')}
          action={
            filter !== 'all' ? (
              <Button variant="primary" size="lg" onClick={() => setFilter('all')}>
                <span>{t('alerts.tabAll')}</span>
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={() => navigate(homePath)}>
                <span>{t('app.backHome')}</span>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const displayTitle = isUrdu && alert.titleUr ? alert.titleUr : alert.title;
            const displayBody = isUrdu && alert.bodyUr ? alert.bodyUr : alert.body;
            const badgeKey = CATEGORY_BADGE_KEYS[alert.category] || 'alerts.tabJobs';
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  dispatch({ type: 'MARK_ALERT_READ', alertId: alert.id });
                  if (alert.link) navigate(alert.link);
                }}
                className={`flex w-full items-start justify-between gap-4 rounded-xl border-2 p-4 text-start transition-colors cursor-pointer ${
                  alert.read
                    ? 'border-[#E3EAF3] bg-white hover:border-[#CBD5E1]'
                    : 'border-[#93C5FD] bg-[#EFF6FF] hover:border-[#1769E0]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!alert.read && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full bg-[#D64545]"
                      />
                    )}
                    <span className="rounded border border-[#D2E3FC] bg-white px-2 py-0.5 text-xs font-bold uppercase text-[#1769E0]">
                      {t(badgeKey as never)}
                    </span>
                    <p className="text-base font-bold text-[#102A43]">{displayTitle}</p>
                  </div>
                  <p className="text-base text-[#172B4D]">{displayBody}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#62748A]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatRelativeTime(alert.createdAt, lang)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
