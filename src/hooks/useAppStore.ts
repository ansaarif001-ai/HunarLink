import { useContext } from 'react';
import { AppStoreContext, AppStoreContextValue } from '../data/store';

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return ctx;
}
