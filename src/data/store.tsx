import React, { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AuthSession, authService } from '../services/authService';
import { AppState, CustomerProfile, UserRole, WorkerProfile } from '../types';
import { getAlertsForActiveUser } from '../utils/alerts';
import { getTotalUnreadChatCount } from '../utils/chatSafety';
import { loadAppState, saveAppState, subscribeToStorageSync } from '../utils/storage';
import { AppAction, appReducer } from './reducer';

export interface AppStoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activeCustomer: CustomerProfile | undefined;
  activeWorker: WorkerProfile | undefined;
  authSession: AuthSession | null;
  isGuestSession: boolean;
  unreadAlertsCount: number;
  unreadChatCount: number;
  storageError: string | null;
  clearStorageError: () => void;
}

export const AppStoreContext = createContext<AppStoreContextValue | null>(null);

const SAMPLE_IDS = new Set(['cust_demo', 'wrk_ali_raza', 'wrk_hassan_team']);

function reconcileStateWithSession(baseState: AppState, session: AuthSession | null): {
  nextState: AppState;
  validSession: AuthSession | null;
} {
  if (!session) {
    if (baseState.activeRole === UserRole.Guest) {
      return { nextState: baseState, validSession: null };
    }
    return {
      nextState: { ...baseState, activeRole: UserRole.Guest },
      validSession: null,
    };
  }

  if (session.type === 'registered') {
    const account = authService.getAccountById(session.userId);
    if (!account) {
      authService.signOut();
      return {
        nextState: { ...baseState, activeRole: UserRole.Guest },
        validSession: null,
      };
    }
    const nextState = appReducer(baseState, {
      type: 'APPLY_AUTH_SESSION',
      userId: account.id,
      role: account.role,
      fullName: account.fullName,
      isGuest: false,
      city: account.city,
      area: account.area,
      categoryId: account.categoryId,
    });
    return { nextState, validSession: session };
  }

  // Guest session: either a sample account or a local guest profile
  if (SAMPLE_IDS.has(session.userId)) {
    const sampleAccountKey =
      session.userId === 'cust_demo'
        ? 'customer'
        : session.userId === 'wrk_hassan_team'
          ? 'contractor'
          : 'worker';
    const nextState = appReducer(baseState, {
      type: 'ENTER_DEMO_ACCOUNT',
      account: sampleAccountKey,
    });
    return { nextState, validSession: session };
  }

  const guest = authService.getGuestById(session.userId);
  if (!guest) {
    authService.signOut();
    return {
      nextState: { ...baseState, activeRole: UserRole.Guest },
      validSession: null,
    };
  }

  const nextState = appReducer(baseState, {
    type: 'APPLY_AUTH_SESSION',
    userId: guest.id,
    role: guest.role,
    fullName: guest.fullName,
    isGuest: true,
    city: guest.city,
    area: guest.area,
    categoryId: guest.categoryId,
  });
  return { nextState, validSession: session };
}

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialBoot = useMemo(() => {
    const loaded = loadAppState();
    const session = authService.getSession();
    return reconcileStateWithSession(loaded, session);
  }, []);

  const [state, rawDispatch] = useReducer(appReducer, initialBoot.nextState);
  const [authSession, setAuthSession] = useState<AuthSession | null>(initialBoot.validSession);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [storageError, setStorageError] = useState<string | null>(null);

  // Sync RTL direction and document lang immediately whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = state.language === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = state.language;
    }
  }, [state.language]);

  // Persist to localStorage synchronously inside dispatch wrapper + effect so role switches never read stale data
  const dispatch = useCallback((action: AppAction) => {
    let baseState = stateRef.current;
    if (
      action.type === 'SET_ROLE' ||
      action.type === 'ENTER_DEMO_ACCOUNT' ||
      action.type === 'APPLY_AUTH_SESSION' ||
      action.type === 'LOG_OUT' ||
      action.type === 'SELECT_WORKER' ||
      action.type === 'SELECT_CUSTOMER' ||
      action.type === 'RESET_DEMO_DATA'
    ) {
      baseState = loadAppState();
    }

    if (action.type === 'LOG_OUT') {
      authService.signOut();
      setAuthSession(null);
    } else if (action.type === 'RESET_DEMO_DATA') {
      authService.clearGuests();
      authService.signOut();
      setAuthSession(null);
    } else if (action.type === 'ENTER_DEMO_ACCOUNT') {
      const sampleUserId =
        action.account === 'customer'
          ? 'cust_demo'
          : action.account === 'contractor'
            ? 'wrk_hassan_team'
            : 'wrk_ali_raza';
      const sampleRole = action.account === 'customer' ? 'customer' : 'worker';
      const res = authService.startSampleAccount(sampleUserId, sampleRole);
      if (res.ok && res.data) {
        setAuthSession(res.data.session);
      }
    } else if (action.type === 'APPLY_AUTH_SESSION') {
      setAuthSession(authService.getSession());
    }

    const nextState = appReducer(baseState, action);
    stateRef.current = nextState;
    const res = saveAppState(nextState);
    if (!res.ok && res.error) {
      setStorageError(res.error);
    } else {
      setStorageError(null);
    }
    rawDispatch({ type: 'HYDRATE_FROM_STORAGE', state: nextState });
  }, []);

  useEffect(() => {
    const res = saveAppState(state);
    if (!res.ok && res.error) {
      setStorageError(res.error);
    }
  }, [state]);

  // Cross-tab shared data sync
  useEffect(() => {
    return subscribeToStorageSync((externalState) => {
      const session = authService.getSession();
      const { nextState, validSession } = reconcileStateWithSession(externalState, session);
      stateRef.current = nextState;
      setAuthSession(validSession);
      rawDispatch({ type: 'HYDRATE_FROM_STORAGE', state: nextState });
    });
  }, []);

  // Cross-tab session sync (logging out in one tab logs out the other)
  useEffect(() => {
    return authService.subscribeToSessionSync((nextSession) => {
      const { nextState, validSession } = reconcileStateWithSession(stateRef.current, nextSession);
      stateRef.current = nextState;
      setAuthSession(validSession);
      rawDispatch({ type: 'HYDRATE_FROM_STORAGE', state: nextState });
    });
  }, []);

  const activeCustomer = useMemo(
    () => state.customers.find((c) => c.id === state.activeCustomerId),
    [state.customers, state.activeCustomerId]
  );

  const activeWorker = useMemo(
    () => state.workers.find((w) => w.id === state.activeWorkerId),
    [state.workers, state.activeWorkerId]
  );

  const isGuestSession = Boolean(authSession && authSession.type === 'guest');

  const unreadAlertsCount = useMemo(() => {
    return getAlertsForActiveUser(
      state.notifications,
      state.activeRole,
      state.activeCustomerId,
      state.activeWorkerId,
      state.alertPreferences,
      'unread'
    ).length;
  }, [
    state.notifications,
    state.activeRole,
    state.activeCustomerId,
    state.activeWorkerId,
    state.alertPreferences,
  ]);

  const unreadChatCount = useMemo(() => {
    const actorId =
      state.activeRole === UserRole.Customer
        ? state.activeCustomerId
        : state.activeRole === UserRole.Worker
          ? state.activeWorkerId
          : '';
    return getTotalUnreadChatCount(state.conversations, state.messages, actorId);
  }, [state.conversations, state.messages, state.activeRole, state.activeCustomerId, state.activeWorkerId]);

  const value = useMemo<AppStoreContextValue>(
    () => ({
      state,
      dispatch,
      activeCustomer,
      activeWorker,
      authSession,
      isGuestSession,
      unreadAlertsCount,
      unreadChatCount,
      storageError,
      clearStorageError: () => setStorageError(null),
    }),
    [
      state,
      dispatch,
      activeCustomer,
      activeWorker,
      authSession,
      isGuestSession,
      unreadAlertsCount,
      unreadChatCount,
      storageError,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};
