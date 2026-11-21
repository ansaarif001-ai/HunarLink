import { t } from '../i18n';
import { LanguageCode } from '../types';

export function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`;
}

export function formatRelativeTime(
  isoString: string,
  lang: LanguageCode = 'en',
  nowMs: number = Date.now()
): string {
  const timeMs = Date.parse(isoString);
  if (!Number.isFinite(timeMs)) return t('app.recently', lang);
  const diffSec = Math.max(0, Math.floor((nowMs - timeMs) / 1000));
  if (diffSec < 60) return t('app.justNow', lang);
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin === 1 ? t('app.minAgo', lang, { n: 1 }) : t('app.minsAgo', lang, { n: diffMin });
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return diffHr === 1 ? t('app.hrAgo', lang, { n: 1 }) : t('app.hrsAgo', lang, { n: diffHr });
  }
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return t('app.yesterday', lang);
  if (diffDays < 7) return t('app.daysAgo', lang, { n: diffDays });
  return new Date(timeMs).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimelineDate(
  isoString: string,
  lang: LanguageCode = 'en',
  nowMs: number = Date.now()
): string {
  const timeMs = Date.parse(isoString);
  if (!Number.isFinite(timeMs)) return t('app.recently', lang);
  const diffDays = Math.floor((nowMs - timeMs) / (24 * 3600 * 1000));
  if (diffDays <= 0) return t('app.today', lang);
  if (diffDays === 1) return t('app.yesterday', lang);
  if (diffDays < 7) return t('app.daysAgo', lang, { n: diffDays });
  return new Date(timeMs).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDateTime(
  isoString: string,
  lang: LanguageCode = 'en'
): string {
  const timeMs = Date.parse(isoString);
  if (!Number.isFinite(timeMs)) return '—';
  return new Date(timeMs).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
