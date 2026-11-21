import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { useAppStore } from '../hooks/useAppStore';
import { scrollAppToTop } from '../utils/scroll';

export const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const { state } = useAppStore();

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && typeof activeEl.blur === 'function' && activeEl !== document.body) {
      activeEl.blur();
    }

    scrollAppToTop();

    const rafId = window.requestAnimationFrame(() => {
      scrollAppToTop();
    });
    const t0 = window.setTimeout(() => {
      scrollAppToTop();
    }, 0);
    const t150 = window.setTimeout(() => {
      scrollAppToTop();
    }, 150);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t0);
      window.clearTimeout(t150);
    };
  }, [
    location.pathname,
    location.search,
    location.hash,
    state.activeRole,
    state.activeCustomerId,
    state.activeWorkerId,
    state.language,
  ]);

  return null;
};
