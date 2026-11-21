import { Category, LanguageCode, SampleArea } from '../types';
import { en, TranslationKey } from './en';
import { ur } from './ur';

export type { TranslationKey };

export const dictionaries: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  ur,
};

function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const val = vars[name];
    return val !== undefined && val !== null ? String(val) : `{${name}}`;
  });
}

/**
 * Single translation lookup function across HunarLink.
 * - Strictly returns English ONLY for 'en' and Urdu ONLY for 'ur'.
 * - Automatically falls back to English and logs console.warn if an Urdu key is missing.
 */
export function t(
  key: TranslationKey,
  lang: LanguageCode = 'en',
  vars?: Record<string, string | number>
): string {
  if (lang === 'ur') {
    const urValue = ur[key];
    if (typeof urValue === 'string' && urValue.length > 0) {
      return interpolate(urValue, vars);
    }
    console.warn(`[i18n] Missing Urdu translation for key "${key}". Falling back to English.`);
  }
  const enValue = en[key];
  if (typeof enValue === 'string') {
    return interpolate(enValue, vars);
  }
  console.warn(`[i18n] Missing translation key "${key}".`);
  return key;
}

export function getLocalizedCategoryName(category: Category | undefined, lang: LanguageCode): string {
  if (!category) return '';
  return lang === 'ur' ? category.nameUr : category.nameEn;
}

export function getLocalizedCityName(city: string, lang: LanguageCode): string {
  const key = `city.${city}` as TranslationKey;
  if (key in en) {
    return t(key, lang);
  }
  return city;
}

export function getLocalizedAreaName(
  areaName: string,
  areas: SampleArea[],
  lang: LanguageCode
): string {
  if (lang !== 'ur') return areaName;
  const found = areas.find((a) => a.name.toLowerCase() === areaName.trim().toLowerCase());
  return found ? found.nameUr : areaName;
}

export function getLocalizedLocationLabel(
  areaName: string,
  cityName: string,
  areas: SampleArea[],
  lang: LanguageCode
): string {
  const a = getLocalizedAreaName(areaName, areas, lang);
  const c = getLocalizedCityName(cityName, lang);
  return lang === 'ur' ? `${a}، ${c}` : `${a}, ${c}`;
}
