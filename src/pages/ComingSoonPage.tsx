import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

export interface ComingSoonPageProps {
  title?: string;
  description?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title, description }) => {
  const { state } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roleHomePath =
    state.activeRole === UserRole.Customer
      ? '/customer'
      : state.activeRole === UserRole.Worker
        ? '/worker'
        : '/';

  return (
    <div className="mx-auto max-w-xl py-8">
      <Card className="px-6 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
          <Clock className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-4 text-sm font-semibold text-[#1769E0]">{t('comingSoon.badge')}</p>

        <h1 className="mt-2 text-2xl font-extrabold text-[#102A43]">
          {title || t('comingSoon.inviteTitle')}
        </h1>

        <p className="mt-3 text-base text-[#62748A]">
          {description || t('comingSoon.inviteDesc')}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span>{t('app.back')}</span>
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(roleHomePath)}>
            <Home className="h-5 w-5" aria-hidden="true" />
            <span>{t('error.goHome')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
