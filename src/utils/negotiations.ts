import { BookingStatus, Job, Negotiation, Offer, UserRole } from '../types';
import { isOfferExpired } from './expiry';

export const MAX_PRICE_TALK_ROUNDS = 10;

export const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  Confirmed: ['Started', 'In Progress', 'Completed', 'Cancelled'],
  Started: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export function isAllowedBookingTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns negotiations for an offer ordered chronologically (oldest -> newest).
 * Because reducer prepends newest negotiations at index 0, equal millisecond
 * timestamps (e.g., fast sequential updates) preserve chronological order via
 * reverse array index tie-breaker.
 */
export function getOfferNegotiationsChronological(
  negotiations: Negotiation[],
  offerId: string
): Negotiation[] {
  return negotiations
    .map((n, index) => ({ n, index }))
    .filter((item) => item.n.offerId === offerId)
    .sort((a, b) => {
      const ta = Date.parse(a.n.createdAt);
      const tb = Date.parse(b.n.createdAt);
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
        return ta - tb;
      }
      return b.index - a.index;
    })
    .map((item) => item.n);
}

export function getCounterRoundsCount(negotiations: Negotiation[], offerId: string): number {
  return negotiations.filter((n) => n.offerId === offerId && n.action === 'your_price').length;
}

export function getExpectedTurnRole(
  offer: Offer,
  negotiations: Negotiation[]
): 'customer' | 'worker' | null {
  if (offer.status !== 'pending' && offer.status !== 'price_talk') {
    return null;
  }
  const ordered = getOfferNegotiationsChronological(negotiations, offer.id);
  for (let i = ordered.length - 1; i >= 0; i--) {
    const entry = ordered[i];
    if (entry.action === 'sent_price' || entry.action === 'your_price') {
      return entry.byRole === 'worker' ? 'customer' : 'worker';
    }
  }
  return offer.status === 'pending' ? 'customer' : 'worker';
}

export function canOfferCoverJob(offer: Offer, job: Job): boolean {
  if (job.workersNeeded <= 1) return true;
  return offer.workersCount >= job.workersNeeded;
}

export interface EvaluatedOfferActions {
  isExpired: boolean;
  roundsUsed: number;
  maxRoundsReached: boolean;
  expectedTurn: 'customer' | 'worker' | null;
  canCounter: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canWithdraw: boolean;
  canCoverTeam: boolean;
  isClosedAfterAward: boolean;
}

export function evaluateOfferActions(
  offer: Offer,
  job: Job | undefined,
  negotiations: Negotiation[],
  activeRole: UserRole,
  activeActorId: string,
  hasConfirmedBookingForJob: boolean,
  nowMs: number = Date.now()
): EvaluatedOfferActions {
  const expired =
    offer.status === 'expired' ||
    ((offer.status === 'pending' || offer.status === 'price_talk') &&
      isOfferExpired(offer.expiresAt, nowMs));

  const roundsUsed = getCounterRoundsCount(negotiations, offer.id);
  const maxRoundsReached = roundsUsed >= MAX_PRICE_TALK_ROUNDS;
  const expectedTurn = expired ? null : getExpectedTurnRole(offer, negotiations);
  const canCoverTeam = job ? canOfferCoverJob(offer, job) : true;

  const isClosedAfterAward =
    offer.status === 'declined' &&
    (hasConfirmedBookingForJob ||
      job?.status === 'Confirmed Job' ||
      job?.status === 'Work Started' ||
      job?.status === 'In Progress' ||
      job?.status === 'Completed');

  const isJobOpenForOffers =
    Boolean(job) &&
    job!.status !== 'Cancelled' &&
    job!.status !== 'Confirmed Job' &&
    job!.status !== 'Work Started' &&
    job!.status !== 'In Progress' &&
    job!.status !== 'Completed' &&
    !hasConfirmedBookingForJob;

  const isOpenOffer = offer.status === 'pending' || offer.status === 'price_talk';

  const isOwningCustomer =
    activeRole === UserRole.Customer && Boolean(job) && job!.customerId === activeActorId;
  const isOwningWorker =
    activeRole === UserRole.Worker && offer.workerId === activeActorId;

  const canCounter =
    isJobOpenForOffers &&
    isOpenOffer &&
    !expired &&
    !maxRoundsReached &&
    ((isOwningCustomer && expectedTurn === 'customer') ||
      (isOwningWorker && expectedTurn === 'worker'));

  const canAccept =
    isJobOpenForOffers && isOpenOffer && !expired && isOwningCustomer && canCoverTeam;

  const canDecline = isJobOpenForOffers && isOpenOffer && !expired && isOwningCustomer;

  const canWithdraw = isJobOpenForOffers && isOpenOffer && !expired && isOwningWorker;

  return {
    isExpired: expired,
    roundsUsed,
    maxRoundsReached,
    expectedTurn,
    canCounter,
    canAccept,
    canDecline,
    canWithdraw,
    canCoverTeam,
    isClosedAfterAward,
  };
}
