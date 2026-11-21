export const INPUT_LIMITS = {
  SEARCH_MAX: 80,
  NAME_MAX: 80,
  HEADLINE_MAX: 120,
  TITLE_MAX: 120,
  JOB_TITLE_MAX: 60,
  AREA_MAX: 80,
  SKILL_MAX: 40,
  BIO_MAX: 300,
  UPDATE_NOTE_MAX: 200,
  JOB_NOTES_MAX: 200,
  CAPTION_MAX: 140,
  REPORT_NOTE_MAX: 300,
  CONTACT_MESSAGE_MAX: 300,
  JOB_LINK_MAX: 120,
  REVIEW_MAX: 300,
  REVIEW_REPLY_MAX: 150,
  JOB_DESCRIPTION_MAX: 500,
  DESCRIPTION_MAX: 500,
  MESSAGE_MAX: 500,
  LOGIN_ID_MAX: 80,
  PASSWORD_MAX: 64,
  MIN_PKR: 500,
  MAX_PKR: 25_000_000,
} as const;

export function sanitizeText(input: string, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}
