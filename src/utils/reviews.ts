import { t } from '../i18n';
import { Booking, LanguageCode, Review, UserRole } from '../types';

export const REVIEW_TAGS = [
  'On time',
  'Good work',
  'Fair price',
  'Clean work',
  'Polite',
] as const;

export function getLocalizedReviewTag(tag: string, lang: LanguageCode = 'en'): string {
  switch (tag) {
    case 'On time':
      return t('reviewTag.On time', lang);
    case 'Good work':
      return t('reviewTag.Good work', lang);
    case 'Fair price':
      return t('reviewTag.Fair price', lang);
    case 'Clean work':
      return t('reviewTag.Clean work', lang);
    case 'Polite':
      return t('reviewTag.Polite', lang);
    default:
      return tag;
  }
}

export function formatReviewerDisplayName(fullName?: string): string {
  const clean = (fullName || '').trim();
  if (!clean) return 'Customer';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export function recalculateWorkerRating(reviews: Review[], workerId: string): number {
  const workerReviews = reviews.filter((r) => r.workerId === workerId);
  if (workerReviews.length === 0) return 5.0;
  const sum = workerReviews.reduce((acc, r) => acc + (r.stars || r.rating || 5), 0);
  return Math.round((sum / workerReviews.length) * 10) / 10;
}

export function hasBookingBeenReviewed(reviews: Review[], bookingId: string): boolean {
  return reviews.some((r) => r.bookingId === bookingId);
}

export function canCustomerReviewBooking(
  booking: Booking | undefined,
  customerId: string,
  activeRole: UserRole,
  reviews: Review[]
): { allowed: boolean; reason?: string } {
  if (activeRole !== UserRole.Customer) {
    return { allowed: false, reason: 'Only customers can send a review.' };
  }
  if (!booking) {
    return { allowed: false, reason: 'Confirmed job not found.' };
  }
  if (booking.customerId !== customerId) {
    return { allowed: false, reason: 'Only the customer of this job can review it.' };
  }
  if (booking.status !== 'Completed') {
    return { allowed: false, reason: 'You can rate this job once the worker marks it Completed.' };
  }
  if (hasBookingBeenReviewed(reviews, booking.id)) {
    return { allowed: false, reason: 'You already reviewed this job.' };
  }
  return { allowed: true };
}

export function canWorkerReplyToReview(
  review: Review | undefined,
  workerId: string,
  activeRole: UserRole
): { allowed: boolean; reason?: string } {
  if (activeRole !== UserRole.Worker) {
    return { allowed: false, reason: 'Only the worker can reply to a review.' };
  }
  if (!review) {
    return { allowed: false, reason: 'Review not found.' };
  }
  if (review.workerId !== workerId) {
    return { allowed: false, reason: 'You can only reply to reviews on your own profile.' };
  }
  if (review.reply) {
    return { allowed: false, reason: 'You already replied to this review.' };
  }
  return { allowed: true };
}
