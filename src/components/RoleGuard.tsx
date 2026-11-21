import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useToast } from './ui/Toast';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

export interface RoleGuardProps {
  allowedRole: UserRole.Customer | UserRole.Worker | 'authenticated';
  allowOwnWorkerIdParam?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRole,
  allowOwnWorkerIdParam,
  children,
}) => {
  const { state } = useAppStore();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const location = useLocation();
  const notifiedPathRef = useRef<string | null>(null);

  const isAllowed =
    allowedRole === 'authenticated'
      ? state.activeRole === UserRole.Customer || state.activeRole === UserRole.Worker
      : state.activeRole === allowedRole ||
        Boolean(
          allowOwnWorkerIdParam &&
            state.activeRole === UserRole.Worker &&
            allowOwnWorkerIdParam === state.activeWorkerId
        );

  const targetHome =
    state.activeRole === UserRole.Worker
      ? '/worker'
      : state.activeRole === UserRole.Customer
        ? '/customer'
        : '/';

  const toastMessage =
    state.activeRole === UserRole.Customer
      ? t('roleGuard.redirectToCustomer')
      : state.activeRole === UserRole.Worker
        ? t('roleGuard.redirectToWorker')
        : t('roleGuard.redirectToLogin');

  useEffect(() => {
    if (!isAllowed && notifiedPathRef.current !== location.pathname) {
      notifiedPathRef.current = location.pathname;
      showToast(toastMessage, 'info');
    }
  }, [isAllowed, location.pathname, showToast, toastMessage]);

  if (!isAllowed) {
    return <Navigate to={targetHome} replace />;
  }

  return <>{children}</>;
};
