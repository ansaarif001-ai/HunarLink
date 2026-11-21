import { Alert, AlertCategory, AlertPreferences, AlertType, UserRole } from '../types';
import { createId } from './id';

export type AlertFilterTab = 'all' | 'unread' | 'jobs' | 'prices' | 'chat' | 'reviews';

export const ALERT_TYPE_TO_CATEGORY: Record<AlertType, AlertCategory> = {
  new_job_near_you: 'jobs',
  request_expiring_soon: 'jobs',
  request_expired: 'jobs',
  new_price_received: 'prices',
  new_price_sent_to_you: 'prices',
  price_accepted: 'prices',
  price_said_no: 'prices',
  price_expired: 'prices',
  job_confirmed: 'jobs',
  work_started: 'jobs',
  work_in_progress: 'jobs',
  work_done: 'jobs',
  new_chat_message: 'chat',
  new_review: 'reviews',
  review_reply: 'reviews',
};

export function createAlertItem(params: {
  type: AlertType;
  targetRole: 'customer' | 'worker' | 'all';
  workerId?: string;
  customerId?: string;
  jobId?: string;
  offerId?: string;
  bookingId?: string;
  conversationId?: string;
  title: string;
  titleUr?: string;
  body: string;
  bodyUr?: string;
  link: string;
  createdAt?: string;
  read?: boolean;
}): Alert {
  return {
    id: createId('alrt'),
    type: params.type,
    category: ALERT_TYPE_TO_CATEGORY[params.type],
    targetRole: params.targetRole,
    workerId: params.workerId,
    customerId: params.customerId,
    jobId: params.jobId,
    offerId: params.offerId,
    bookingId: params.bookingId,
    conversationId: params.conversationId,
    title: params.title,
    titleUr: params.titleUr,
    body: params.body,
    bodyUr: params.bodyUr,
    link: params.link,
    read: Boolean(params.read),
    createdAt: params.createdAt || new Date().toISOString(),
  };
}

export function isAlertAllowedByPreferences(
  alert: Alert,
  prefs: AlertPreferences
): boolean {
  const cat = alert.category || ALERT_TYPE_TO_CATEGORY[alert.type] || 'jobs';
  return prefs[cat] !== false;
}

export function getAlertsForActiveUser(
  alerts: Alert[],
  activeRole: UserRole,
  activeCustomerId: string,
  activeWorkerId: string,
  prefs: AlertPreferences,
  filter: AlertFilterTab = 'all'
): Alert[] {
  if (activeRole === UserRole.Guest) return [];

  return alerts
    .filter((a) => {
      if (activeRole === UserRole.Worker) {
        if (a.targetRole !== 'worker' && a.targetRole !== 'all') return false;
        if (a.workerId && a.workerId !== activeWorkerId) return false;
      } else if (activeRole === UserRole.Customer) {
        if (a.targetRole !== 'customer' && a.targetRole !== 'all') return false;
        if (a.customerId && a.customerId !== activeCustomerId) return false;
      }

      if (!isAlertAllowedByPreferences(a, prefs)) return false;

      if (filter === 'unread') return !a.read;
      if (filter === 'jobs' || filter === 'prices' || filter === 'chat' || filter === 'reviews') {
        const cat = a.category || ALERT_TYPE_TO_CATEGORY[a.type] || 'jobs';
        return cat === filter;
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
