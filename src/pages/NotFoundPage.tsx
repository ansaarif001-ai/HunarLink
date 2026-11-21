import React from 'react';
import { Link } from 'react-router';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

export const NotFoundPage: React.FC = () => {
  const { state } = useAppStore();
  const { t } = useTranslation();

  const homePath =
    state.activeRole === UserRole.Worker
      ? '/worker'
      : state.activeRole === UserRole.Customer
        ? '/customer'
        : '/';

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card className="py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#102A43]">{t('notFound.title')}</h1>
        <p className="mt-2 text-base text-[#62748A]">{t('notFound.desc')}</p>
        <div className="mt-6 flex justify-center">
          <Link to={homePath}>
            <Button variant="primary" size="lg">
              <Home className="h-5 w-5" aria-hidden="true" />
              <span>{t('error.goHome')}</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
