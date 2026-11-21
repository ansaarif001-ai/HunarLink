import { t } from '../i18n';
import { Conversation, LanguageCode, Message } from '../types';

const CNIC_PATTERN = /\b\d{5}[-\s]?\d{7}[-\s]?\d\b/;
const IBAN_PATTERN = /\bPK\d{2}[A-Z0-9]{4,24}\b/i;
const CARD_OR_BANK_PATTERN = /\b(?:\d[-\s]?){12,19}\d\b/;
const PHONE_PATTERN = /(?:\+92[-\s]?3\d{2}[-\s]?\d{7}|\b03\d{2}[-\s]?\d{7}\b)/g;

export interface ChatSafetyCheck {
  blocked: boolean;
  reason?: string;
  hasPhoneWarning: boolean;
  safeDisplayText: string;
}

export function inspectChatMessageSafety(
  rawText: string,
  lang: LanguageCode = 'en'
): ChatSafetyCheck {
  const text = rawText.trim();
  if (!text) {
    return {
      blocked: true,
      reason: t('chat.safetyEmpty', lang),
      hasPhoneWarning: false,
      safeDisplayText: '',
    };
  }

  if (CNIC_PATTERN.test(text) || IBAN_PATTERN.test(text) || CARD_OR_BANK_PATTERN.test(text)) {
    return {
      blocked: true,
      reason: t('chat.safetyBlockedNumbers', lang),
      hasPhoneWarning: false,
      safeDisplayText: text,
    };
  }

  const hasPhoneWarning = PHONE_PATTERN.test(text);
  PHONE_PATTERN.lastIndex = 0;
  const safeDisplayText = hasPhoneWarning
    ? text.replace(PHONE_PATTERN, lang === 'ur' ? '[فون نمبر ڈیمو میں پوشیدہ]' : '[phone hidden in demo]')
    : text;

  return {
    blocked: false,
    hasPhoneWarning,
    safeDisplayText,
  };
}

export function isConversationParticipant(
  conv: Conversation | undefined,
  actorId: string
): boolean {
  if (!conv || !actorId) return false;
  return conv.participantIds.includes(actorId);
}

export function getUnreadCountForConversation(
  messages: Message[],
  conversationId: string,
  viewerId: string
): number {
  if (!viewerId) return 0;
  return messages.filter(
    (m) =>
      m.conversationId === conversationId &&
      m.senderId !== viewerId &&
      !m.readBy.includes(viewerId)
  ).length;
}

export function getTotalUnreadChatCount(
  conversations: Conversation[],
  messages: Message[],
  viewerId: string
): number {
  if (!viewerId) return 0;
  const participantConvIds = new Set(
    conversations.filter((c) => c.participantIds.includes(viewerId)).map((c) => c.id)
  );
  return messages.filter(
    (m) =>
      participantConvIds.has(m.conversationId) &&
      m.senderId !== viewerId &&
      !m.readBy.includes(viewerId)
  ).length;
}

export function formatChatTime(
  isoString: string,
  lang: LanguageCode = 'en',
  nowMs: number = Date.now()
): string {
  const ms = Date.parse(isoString);
  if (!Number.isFinite(ms)) return t('app.now', lang);
  const date = new Date(ms);
  const now = new Date(nowMs);
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(nowMs - 24 * 3600 * 1000);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timePart = date.toLocaleTimeString(lang === 'ur' ? 'ur-PK' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isToday) return timePart;
  if (isYesterday) return t('app.yesterdayTime', lang, { time: timePart });
  return `${date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
  })}, ${timePart}`;
}
