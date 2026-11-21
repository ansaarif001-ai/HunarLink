import { useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { t as translate, TranslationKey } from '../i18n';

export function useTranslation() {
  const { state } = useAppStore();
  const lang = state.language;
  const isUrdu = lang === 'ur';

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(key, lang, vars),
    [lang]
  );

  return {
    t,
    lang,
    isUrdu,
    dir: isUrdu ? ('rtl' as const) : ('ltr' as const),
  };
}
