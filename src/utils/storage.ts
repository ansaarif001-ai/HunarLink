import {
  CURRENT_SCHEMA_VERSION,
  buildInitialPortfolioItems,
  buildSeedReviews,
  buildSeedWorkUpdates,
  createSeedState,
} from '../data/seedData';
import {
  Alert,
  AlertPreferences,
  AppState,
  Message,
  RequestDelivery,
  Review,
  Transaction,
  UserRole,
  WorkerProfile,
} from '../types';
import { ALERT_TYPE_TO_CATEGORY } from './alerts';
import { getApproxDistanceKm, getMatchingWorkersForJob } from './matching';
import { calculateOurFee } from './pricing';
import { formatReviewerDisplayName } from './reviews';

export const STORAGE_KEY = 'hunarlink_app_v3';

const VALID_ROLES = new Set<string>([UserRole.Guest, UserRole.Customer, UserRole.Worker]);

export function isValidAppState(candidate: unknown): candidate is AppState {
  if (!candidate || typeof candidate !== 'object') return false;
  const s = candidate as Record<string, unknown>;
  if (s.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  if (s.language !== 'en' && s.language !== 'ur') return false;
  if (s.textSize !== 'normal' && s.textSize !== 'large') return false;
  if (!s.alertPreferences || typeof s.alertPreferences !== 'object') return false;
  if (typeof s.activeRole !== 'string' || !VALID_ROLES.has(s.activeRole)) return false;
  if (typeof s.activeCustomerId !== 'string' || typeof s.activeWorkerId !== 'string') return false;

  const loc = s.selectedLocation as Record<string, unknown> | undefined;
  if (!loc || typeof loc.city !== 'string' || typeof loc.area !== 'string') {
    return false;
  }

  const requiredArrays = [
    'categories',
    'users',
    'workers',
    'customers',
    'jobs',
    'requestDeliveries',
    'offers',
    'negotiations',
    'bookings',
    'conversations',
    'messages',
    'notifications',
    'reviews',
    'transactions',
    'workUpdates',
    'portfolioItems',
    'reports',
    'contactMessages',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(s[key])) return false;
  }

  const workers = s.workers as Array<Record<string, unknown>>;
  if (workers.length < 12) return false;
  if (
    !workers.every(
      (w) => Array.isArray(w.serviceAreas) && Array.isArray(w.languages)
    )
  ) {
    return false;
  }

  const jobs = s.jobs as Array<Record<string, unknown>>;
  if (
    !jobs.every(
      (j) =>
        j &&
        typeof j === 'object' &&
        typeof j.id === 'string' &&
        typeof j.status === 'string' &&
        Array.isArray(j.photos) &&
        typeof j.workforceType === 'string'
    )
  ) {
    return false;
  }

  const offers = s.offers as Array<Record<string, unknown>>;
  if (
    !offers.every(
      (o) =>
        o &&
        typeof o === 'object' &&
        typeof o.id === 'string' &&
        typeof o.jobId === 'string' &&
        typeof o.workerId === 'string' &&
        typeof o.pricePkr === 'number' &&
        typeof o.status === 'string'
    )
  ) {
    return false;
  }

  const bookings = s.bookings as Array<Record<string, unknown>>;
  if (
    !bookings.every(
      (b) =>
        b &&
        typeof b === 'object' &&
        typeof b.id === 'string' &&
        typeof b.jobId === 'string' &&
        typeof b.workerId === 'string' &&
        typeof b.status === 'string'
    )
  ) {
    return false;
  }

  const reviews = s.reviews as Array<Record<string, unknown>>;
  if (
    !reviews.every(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof r.id === 'string' &&
        typeof r.bookingId === 'string' &&
        typeof r.workerId === 'string' &&
        typeof r.stars === 'number'
    )
  ) {
    return false;
  }

  const transactions = s.transactions as Array<Record<string, unknown>>;
  if (
    !transactions.every(
      (tx) =>
        tx &&
        typeof tx === 'object' &&
        typeof tx.id === 'string' &&
        typeof tx.bookingId === 'string' &&
        typeof tx.workerId === 'string'
    )
  ) {
    return false;
  }

  return (s.categories as unknown[]).length >= 15;
}

const LEGACY_STATUS_MAP: Record<string, AppState['jobs'][number]['status']> = {
  Open: 'Published',
  'Prices Received': 'Published',
  'Worker Picked': 'Worker Chosen',
  Confirmed: 'Confirmed Job',
  Started: 'Work Started',
  Done: 'Completed',
};

/**
 * Safely migrates Phase 1/2/3 (v3/v4/v5) localStorage state to Phase 6 (v6) without losing
 * user's active role, location, availability toggles, work updates, portfolio items, or jobs.
 */
function migrateLegacyState(candidate: unknown): AppState | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const raw = candidate as Record<string, unknown>;
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version < 3 || version >= CURRENT_SCHEMA_VERSION) return null;

  const seed = createSeedState();
  const seedWorkerMap = new Map(seed.workers.map((w) => [w.id, w]));

  const rawWorkers = Array.isArray(raw.workers)
    ? (raw.workers as Array<Partial<WorkerProfile>>)
    : [];

  if (rawWorkers.length < 12) return null;

  const migratedWorkers: WorkerProfile[] = rawWorkers.map((rw, idx) => {
    const fallback = (rw.id && seedWorkerMap.get(rw.id)) || seed.workers[idx % seed.workers.length];
    // Ensure fixed demo workers keep full Wah Cantt / Rawalpindi coverage
    const useSeedCoverage =
      fallback.id === 'wrk_ali_raza' || fallback.id === 'wrk_hassan_team';
    const serviceAreas = useSeedCoverage
      ? Array.from(new Set([...(Array.isArray(rw.serviceAreas) ? rw.serviceAreas : []), ...fallback.serviceAreas]))
      : Array.isArray(rw.serviceAreas)
        ? rw.serviceAreas
        : fallback.serviceAreas;
    const skills = useSeedCoverage
      ? Array.from(new Set([...(Array.isArray(rw.skills) ? rw.skills : []), ...fallback.skills]))
      : Array.isArray(rw.skills)
        ? rw.skills
        : fallback.skills;

    return {
      ...fallback,
      ...rw,
      skills,
      languages:
        Array.isArray(rw.languages) && rw.languages.length > 0
          ? rw.languages
          : fallback.languages,
      serviceAreas,
      workPhotos: Array.isArray(rw.workPhotos) ? rw.workPhotos : fallback.workPhotos,
    };
  });

  const rawJobs = Array.isArray(raw.jobs)
    ? (raw.jobs as Array<Partial<AppState['jobs'][number]>>)
    : seed.jobs;

  const migratedJobs: AppState['jobs'] = rawJobs.map((rj) => {
    const rawStatus = typeof rj.status === 'string' ? rj.status : 'Published';
    const mappedStatus =
      LEGACY_STATUS_MAP[rawStatus] || (rawStatus as AppState['jobs'][number]['status']);
    const workersNeeded =
      typeof rj.workersNeeded === 'number' && rj.workersNeeded >= 1 ? rj.workersNeeded : 1;
    const budget =
      typeof rj.budget === 'number' && rj.budget > 0
        ? rj.budget
        : typeof rj.yourPriceMaxPkr === 'number' && rj.yourPriceMaxPkr > 0
          ? rj.yourPriceMaxPkr
          : typeof rj.yourPriceMinPkr === 'number' && rj.yourPriceMinPkr > 0
            ? rj.yourPriceMinPkr
            : undefined;
    const rawUrgency =
      rj.urgency || (rj.howSoon === 'Anytime' ? 'Flexible' : rj.howSoon) || 'This week';
    const urgency: AppState['jobs'][number]['urgency'] =
      rawUrgency === 'Today' || rawUrgency === 'This week' || rawUrgency === 'Flexible'
        ? rawUrgency
        : 'Flexible';

    return {
      id: rj.id || `job_migrated_${Math.random().toString(36).slice(2, 7)}`,
      customerId: rj.customerId === 'cust_sana' || !rj.customerId ? 'cust_demo' : rj.customerId,
      categoryId: rj.categoryId || 'cat_plumbing',
      requiredSkill: rj.requiredSkill || '',
      title: rj.title || 'Skilled work request',
      titleUr: rj.titleUr,
      description: rj.description || rj.title || '',
      city: rj.city || 'Wah Cantt',
      area: rj.area || 'Lalarukh',
      budget,
      yourPriceMinPkr: budget || rj.yourPriceMinPkr || 0,
      yourPriceMaxPkr: budget || rj.yourPriceMaxPkr || 0,
      materialsIncluded: Boolean(rj.materialsIncluded),
      workforceType:
        rj.workforceType || (workersNeeded >= 5 ? 'team' : workersNeeded >= 2 ? 'several' : 'one'),
      workersNeeded,
      urgency,
      howSoon: urgency === 'Flexible' ? 'Anytime' : urgency,
      preferredDate: rj.preferredDate,
      photos: Array.isArray(rj.photos) ? rj.photos : [],
      notes: rj.notes,
      status: mappedStatus,
      createdAt: rj.createdAt || new Date().toISOString(),
      updatedAt: rj.updatedAt || new Date().toISOString(),
    };
  });

  const locRaw = raw.selectedLocation as { city?: string; area?: string } | undefined;
  const selectedLocation =
    locRaw && typeof locRaw.city === 'string' && typeof locRaw.area === 'string'
      ? { city: locRaw.city as AppState['selectedLocation']['city'], area: locRaw.area }
      : seed.selectedLocation;

  const rawNotifications = Array.isArray(raw.notifications)
    ? (raw.notifications as Array<Partial<Alert>>)
    : [];
  const migratedNotifications: Alert[] =
    rawNotifications.length > 0
      ? rawNotifications.map((n, i) => {
          const fallbackType = n.type || 'new_job_near_you';
          return {
            id: n.id || `alrt_mig_${i}`,
            type: fallbackType,
            category: n.category || ALERT_TYPE_TO_CATEGORY[fallbackType] || 'jobs',
            targetRole: n.targetRole || 'all',
            workerId: n.workerId,
            customerId: n.customerId,
            jobId: n.jobId,
            offerId: n.offerId,
            bookingId: n.bookingId,
            conversationId: n.conversationId,
            title: n.title || 'Alert',
            body: n.body || '',
            link: n.link || '/alerts',
            read: Boolean(n.read),
            createdAt: n.createdAt || new Date().toISOString(),
          };
        })
      : seed.notifications;

  const rawReviews = Array.isArray(raw.reviews) ? (raw.reviews as Array<Partial<Review>>) : [];
  const migratedReviews: Review[] =
    rawReviews.length > 5
      ? rawReviews.map((r, i) => ({
          id: r.id || `rev_mig_${i}`,
          bookingId: r.bookingId || `demo_bk_${i}`,
          customerId: r.customerId || 'cust_sana',
          customerName: formatReviewerDisplayName(r.customerName),
          areaName: r.areaName,
          workerId: r.workerId || 'wrk_ali_raza',
          stars: r.stars || r.rating || 5,
          rating: r.rating || r.stars || 5,
          text: r.text ?? r.comment ?? '',
          comment: r.comment ?? r.text ?? '',
          tags: Array.isArray(r.tags) ? r.tags : [],
          reply: r.reply,
          isDemo: r.isDemo ?? true,
          createdAt: r.createdAt || new Date().toISOString(),
        }))
      : buildSeedReviews();

  const rawTx = Array.isArray(raw.transactions)
    ? (raw.transactions as Array<Partial<Transaction>>)
    : [];
  const migratedTransactions: Transaction[] =
    rawTx.length > 0
      ? rawTx.map((t, i) => {
          const calc = calculateOurFee(t.jobValue ?? t.grossPkr ?? 0);
          return {
            id: t.id || `tx_mig_${i}`,
            bookingId: t.bookingId || `bk_mig_${i}`,
            workerId: t.workerId || 'wrk_ali_raza',
            jobId: t.jobId,
            jobTitle: t.jobTitle || 'Completed job',
            jobValue: calc.jobValue,
            grossPkr: calc.grossPkr,
            fee: calc.fee,
            ourFeePkr: calc.ourFeePkr,
            net: calc.net,
            netPkr: calc.net,
            status: t.status === 'Pending' ? 'Pending' : 'Done (demo)',
            createdAt: t.createdAt || new Date().toISOString(),
          };
        })
      : seed.transactions;

  const rawMsgs = Array.isArray(raw.messages) ? (raw.messages as Array<Partial<Message>>) : [];
  const rawConvs = Array.isArray(raw.conversations)
    ? (raw.conversations as AppState['conversations'])
    : [];

  const existingConvIds = new Set(rawConvs.map((c) => c.id));
  const mergedConversations = [
    ...rawConvs,
    ...seed.conversations.filter((c) => !existingConvIds.has(c.id)),
  ];

  const baseMessages: Message[] =
    rawMsgs.length > 0
      ? rawMsgs.map((m, i) => ({
          id: m.id || `msg_mig_${i}`,
          conversationId: m.conversationId || 'conv_demo_1',
          jobId: m.jobId,
          senderId: m.senderId || 'cust_demo',
          senderRole: m.senderRole,
          receiverId: m.receiverId,
          senderName: m.senderName || 'Demo User',
          text: m.text || '',
          readBy: Array.isArray(m.readBy) ? m.readBy : [m.senderId || 'cust_demo'],
          createdAt: m.createdAt || new Date().toISOString(),
        }))
      : seed.messages;

  const existingMsgIds = new Set(baseMessages.map((m) => m.id));
  const migratedMessages: Message[] = [
    ...baseMessages,
    ...seed.messages.filter(
      (sm) => !existingConvIds.has(sm.conversationId) && !existingMsgIds.has(sm.id)
    ),
  ];

  const rawPrefs = raw.alertPreferences as Partial<AlertPreferences> | undefined;
  const alertPreferences: AlertPreferences = {
    jobs: rawPrefs?.jobs ?? true,
    prices: rawPrefs?.prices ?? true,
    chat: rawPrefs?.chat ?? true,
    reviews: rawPrefs?.reviews ?? true,
  };

  const rawActiveWorkerId = typeof raw.activeWorkerId === 'string' ? raw.activeWorkerId : '';
  const activeWorkerId = migratedWorkers.some((w) => w.id === rawActiveWorkerId)
    ? rawActiveWorkerId
    : seed.activeWorkerId;

  const migratedDeliveries: RequestDelivery[] = [];
  for (const job of migratedJobs) {
    if (job.status !== 'Published') continue;
    const matched = getMatchingWorkersForJob(job, migratedWorkers, seed.categories);
    for (const w of matched) {
      const cat = seed.categories.find((c) => c.id === job.categoryId);
      const km = getApproxDistanceKm(job, w);
      migratedDeliveries.push({
        id: `del_${job.id}_${w.id}`,
        jobId: job.id,
        workerId: w.id,
        customerId: job.customerId,
        categoryId: job.categoryId,
        city: job.city,
        area: job.area,
        matchedSkill: cat?.nameEn || job.requiredSkill || 'Skilled work',
        distanceKmLabel: `about ${km} km`,
        createdAt: job.createdAt,
      });
    }
  }

  const migrated: AppState = {
    ...seed,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    language: raw.language === 'ur' ? 'ur' : 'en',
    textSize: raw.textSize === 'large' ? 'large' : 'normal',
    alertPreferences,
    activeRole:
      typeof raw.activeRole === 'string' && VALID_ROLES.has(raw.activeRole)
        ? (raw.activeRole as UserRole)
        : seed.activeRole,
    activeCustomerId: 'cust_demo',
    activeWorkerId,
    selectedLocation,
    workers: migratedWorkers,
    customers: seed.customers,
    users: seed.users,
    jobs: migratedJobs,
    requestDeliveries: migratedDeliveries,
    offers: Array.isArray(raw.offers) && raw.offers.length > 0 ? (raw.offers as AppState['offers']) : seed.offers,
    negotiations: Array.isArray(raw.negotiations) && raw.negotiations.length > 0 ? (raw.negotiations as AppState['negotiations']) : seed.negotiations,
    bookings: Array.isArray(raw.bookings) && raw.bookings.length > 0 ? (raw.bookings as AppState['bookings']) : seed.bookings,
    conversations: mergedConversations,
    messages: migratedMessages,
    notifications: migratedNotifications,
    workUpdates: Array.isArray(raw.workUpdates)
      ? (raw.workUpdates as AppState['workUpdates'])
      : buildSeedWorkUpdates(),
    portfolioItems: Array.isArray(raw.portfolioItems)
      ? (raw.portfolioItems as AppState['portfolioItems'])
      : buildInitialPortfolioItems(migratedWorkers),
    reviews: migratedReviews,
    transactions: migratedTransactions,
    reports: Array.isArray(raw.reports) ? (raw.reports as AppState['reports']) : [],
    contactMessages: Array.isArray(raw.contactMessages)
      ? (raw.contactMessages as AppState['contactMessages'])
      : [],
    lastUpdatedAt: new Date().toISOString(),
  };

  return isValidAppState(migrated) ? migrated : null;
}

export function loadAppState(): AppState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createSeedState();
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedState();
      saveAppState(seed);
      return seed;
    }
    const parsed: unknown = JSON.parse(raw);
    if (isValidAppState(parsed)) {
      return parsed;
    }
    const migrated = migrateLegacyState(parsed);
    if (migrated) {
      saveAppState(migrated);
      return migrated;
    }
    const seed = createSeedState();
    saveAppState(seed);
    return seed;
  } catch {
    return createSeedState();
  }
}

export function saveAppState(state: AppState): { ok: boolean; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ok: false, error: 'Storage is not available in this browser.' };
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: isQuota
        ? 'Not enough space. Delete old photos'
        : 'Could not save changes to browser storage.',
    };
  }
}

export function subscribeToStorageSync(onExternalState: (next: AppState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed: unknown = JSON.parse(event.newValue);
      if (isValidAppState(parsed)) {
        onExternalState(parsed);
      }
    } catch {
      // Ignore malformed cross-tab update
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
