import { t } from '../i18n';
import { LanguageCode } from '../types';

export const OFFER_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function computeExpiresAt(submittedAtIso: string): string {
  const submittedMs = Date.parse(submittedAtIso);
  const baseMs = Number.isFinite(submittedMs) ? submittedMs : Date.now();
  return new Date(baseMs + OFFER_EXPIRY_MS).toISOString();
}

export function isOfferExpired(expiresAtIso: string, nowMs: number = Date.now()): boolean {
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) return true;
  return expiresMs <= nowMs;
}

export function formatTimeLeft(
  expiresAtIso: string,
  lang: LanguageCode = 'en',
  nowMs: number = Date.now()
): string {
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) return t('common.timeOver', lang);
  const diffMs = expiresMs - nowMs;
  if (diffMs <= 0) return t('common.timeOver', lang);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) {
    return hours === 1
      ? t('common.hourLeft', lang, { n: 1 })
      : t('common.hoursLeft', lang, { n: hours });
  }
  const mins = Math.max(1, minutes);
  return mins === 1
    ? t('common.minLeft', lang, { n: 1 })
    : t('common.minsLeft', lang, { n: mins });
}
