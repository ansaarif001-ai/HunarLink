import { createSeedState } from './seedData';
import { t } from '../i18n';
import {
  Alert,
  AlertPreferences,
  AppState,
  Booking,
  BookingStatus,
  ContentReport,
  Conversation,
  DemoAccountKey,
  Job,
  JobStatus,
  JobUrgency,
  LanguageCode,
  Location,
  Message,
  Negotiation,
  Offer,
  PakistaniCity,
  PhotoMedia,
  RequestDelivery,
  Review,
  TextSize,
  Transaction,
  UserRole,
  WorkProgress,
  WorkerType,
  WorkforceType,
} from '../types';
import { createAlertItem } from '../utils/alerts';
import {
  inspectChatMessageSafety,
  isConversationParticipant,
} from '../utils/chatSafety';
import { computeExpiresAt } from '../utils/expiry';
import { createId } from '../utils/id';
import { getApproxDistanceKm, getMatchingWorkersForJob } from '../utils/matching';
import { evaluateOfferActions, isAllowedBookingTransition } from '../utils/negotiations';
import { calculateOurFee, formatPkr, normalizePkr } from '../utils/pricing';
import {
  REVIEW_TAGS,
  canCustomerReviewBooking,
  canWorkerReplyToReview,
  formatReviewerDisplayName,
  recalculateWorkerRating,
} from '../utils/reviews';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

function clampPkr(amount: number): number {
  return Math.min(INPUT_LIMITS.MAX_PKR, Math.max(INPUT_LIMITS.MIN_PKR, normalizePkr(amount)));
}

export type AppAction =
  | {
      type: 'SET_ROLE';
      role: UserRole;
      workerTypePreference?: 'worker' | 'contractor';
    }
  | { type: 'SET_LANGUAGE'; language: LanguageCode }
  | { type: 'SET_TEXT_SIZE'; textSize: TextSize }
  | {
      type: 'UPDATE_ALERT_PREFERENCES';
      preferences: Partial<AlertPreferences>;
    }
  | { type: 'TOGGLE_ALL_ALERTS'; enabled: boolean }
  | {
      type: 'APPLY_AUTH_SESSION';
      userId: string;
      role: 'customer' | 'worker';
      fullName: string;
      isGuest: boolean;
      city?: PakistaniCity;
      area?: string;
      categoryId?: string;
    }
  | {
      type: 'UPDATE_CUSTOMER_PROFILE';
      updates: {
        name: string;
        city: PakistaniCity;
        area: string;
        profilePhotoUrl?: string;
        coverPhotoUrl?: string;
      };
    }
  | { type: 'LOG_OUT' }
  | { type: 'SELECT_WORKER'; workerId: string }
  | { type: 'SELECT_CUSTOMER'; customerId: string }
  | { type: 'SET_CUSTOMER_LOCATION'; location: Location }
  | { type: 'TOGGLE_WORKER_FREE_TO_WORK'; workerId?: string }
  | { type: 'UPDATE_WORKER_SERVICE_AREAS'; workerId?: string; serviceAreas: string[] }
  | {
      type: 'UPDATE_WORKER_PROFILE';
      workerId?: string;
      updates: {
        name: string;
        headline: string;
        bio: string;
        categoryId: string;
        skills: string[];
        yearsExperience: number;
        city: PakistaniCity;
        area: string;
        serviceAreas: string[];
        freeToWorkNow: boolean;
        priceHintPkr: number;
        priceUnit: 'visit' | 'day' | 'job';
        languages: string[];
        workerType: WorkerType;
        teamSize: number;
        profilePhotoUrl?: string;
        coverPhotoUrl?: string;
      };
    }
  | {
      type: 'ADD_WORK_UPDATE';
      workerId: string;
      jobId?: string;
      photos: PhotoMedia[];
      note: string;
      progress: WorkProgress;
    }
  | {
      type: 'DELETE_WORK_UPDATE';
      updateId: string;
      workerId: string;
    }
  | {
      type: 'ADD_PORTFOLIO_ITEM';
      workerId: string;
      categoryId: string;
      caption: string;
      photos: PhotoMedia[];
    }
  | {
      type: 'UPDATE_PORTFOLIO_CAPTION';
      itemId: string;
      workerId: string;
      caption: string;
    }
  | {
      type: 'DELETE_PORTFOLIO_ITEM';
      itemId: string;
      workerId: string;
    }
  | {
      type: 'ADD_CONTENT_REPORT';
      targetType?: ContentReport['targetType'];
      targetId: string;
      workerId: string;
      reason: string;
      note: string;
      jobLink?: string;
    }
  | {
      type: 'ADD_CONTACT_MESSAGE';
      name: string;
      message: string;
    }
  | {
      type: 'CREATE_JOB';
      customerId?: string;
      description: string;
      categoryId: string;
      city: PakistaniCity;
      area: string;
      budget?: number;
      materialsIncluded: boolean;
      workforceType: WorkforceType;
      workersNeeded: number;
      urgency: JobUrgency;
      preferredDate?: string;
      photos: PhotoMedia[];
      notes?: string;
    }
  | {
      type: 'CANCEL_JOB';
      jobId: string;
      customerId?: string;
    }
  | {
      type: 'SEND_OFFER';
      jobId: string;
      workerId?: string;
      pricePkr: number;
      daysNeeded: number;
      workersCount?: number;
      note: string;
    }
  | {
      type: 'COUNTER_OFFER';
      offerId: string;
      pricePkr: number;
      note?: string;
    }
  | {
      type: 'DECLINE_OFFER';
      offerId: string;
    }
  | {
      type: 'WITHDRAW_OFFER';
      offerId: string;
    }
  | {
      type: 'ACCEPT_OFFER';
      offerId: string;
    }
  | {
      type: 'UPDATE_BOOKING_STATUS';
      bookingId: string;
      status: BookingStatus;
    }
  | {
      type: 'SUBMIT_REVIEW';
      bookingId: string;
      stars: number;
      text: string;
      tags: string[];
    }
  | {
      type: 'REPLY_TO_REVIEW';
      reviewId: string;
      text: string;
    }
  | {
      type: 'OPEN_OR_CREATE_CONVERSATION';
      conversationId?: string;
      customerId: string;
      workerId: string;
      jobId?: string;
      jobTitle?: string;
    }
  | {
      type: 'MARK_CONVERSATION_READ';
      conversationId: string;
    }
  | {
      type: 'SEND_CHAT_MESSAGE';
      conversationId: string;
      text: string;
    }
  | {
      type: 'BLOCK_CONVERSATION';
      conversationId: string;
    }
  | {
      type: 'MARK_ALERT_READ';
      alertId: string;
    }
  | {
      type: 'MARK_ALL_ALERTS_READ';
    }
  | {
      type: 'ENTER_DEMO_ACCOUNT';
      account: DemoAccountKey;
    }
  | {
      type: 'RUN_DEMO_SCENARIO';
      scenario: 'A' | 'B';
    }
  | { type: 'RESET_DEMO_DATA' }
  | { type: 'HYDRATE_FROM_STORAGE'; state: AppState };

function getActiveActorId(state: AppState): string {
  if (state.activeRole === UserRole.Customer) return state.activeCustomerId;
  if (state.activeRole === UserRole.Worker) return state.activeWorkerId;
  return '';
}

function getActiveActorName(state: AppState): string {
  if (state.activeRole === UserRole.Customer) {
    return (
      state.customers.find((c) => c.id === state.activeCustomerId)?.name || 'Customer'
    );
  }
  if (state.activeRole === UserRole.Worker) {
    return (
      state.workers.find((w) => w.id === state.activeWorkerId)?.name || 'Worker'
    );
  }
  return 'Guest';
}

export function appReducer(state: AppState, action: AppAction): AppState {
  const nowIso = new Date().toISOString();

  switch (action.type) {
    case 'HYDRATE_FROM_STORAGE': {
      return action.state;
    }

    case 'RESET_DEMO_DATA': {
      const fresh = createSeedState();
      return {
        ...fresh,
        language: state.language,
      };
    }

    case 'SET_LANGUAGE': {
      return {
        ...state,
        language: action.language,
        lastUpdatedAt: nowIso,
      };
    }

    case 'SET_TEXT_SIZE': {
      return {
        ...state,
        textSize: action.textSize,
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_ALERT_PREFERENCES': {
      return {
        ...state,
        alertPreferences: {
          ...state.alertPreferences,
          ...action.preferences,
        },
        lastUpdatedAt: nowIso,
      };
    }

    case 'TOGGLE_ALL_ALERTS': {
      return {
        ...state,
        alertPreferences: {
          jobs: action.enabled,
          prices: action.enabled,
          chat: action.enabled,
          reviews: action.enabled,
        },
        lastUpdatedAt: nowIso,
      };
    }

    case 'LOG_OUT': {
      return {
        ...state,
        activeRole: UserRole.Guest,
        lastUpdatedAt: nowIso,
      };
    }

    case 'APPLY_AUTH_SESSION': {
      const cleanName = sanitizeText(action.fullName, INPUT_LIMITS.NAME_MAX) || 'User';
      const defaultCity: PakistaniCity = action.city || 'Wah Cantt';
      const defaultArea = sanitizeText(action.area || 'Lalarukh', INPUT_LIMITS.AREA_MAX) || 'Lalarukh';

      if (action.role === 'customer') {
        const existing = state.customers.find((c) => c.id === action.userId);
        const nextCustomers = existing
          ? state.customers.map((c) =>
              c.id === action.userId ? { ...c, name: cleanName } : c
            )
          : [
              {
                id: action.userId,
                userId: action.userId,
                name: cleanName,
                city: defaultCity,
                area: defaultArea,
                joinedAt: nowIso,
              },
              ...state.customers,
            ];

        return {
          ...state,
          activeRole: UserRole.Customer,
          activeCustomerId: action.userId,
          selectedLocation: existing
            ? { city: existing.city, area: existing.area }
            : { city: defaultCity, area: defaultArea },
          customers: nextCustomers,
          lastUpdatedAt: nowIso,
        };
      }

      const existingWorker = state.workers.find((w) => w.id === action.userId);
      const cat =
        state.categories.find((c) => c.id === (action.categoryId || existingWorker?.categoryId)) ||
        state.categories[0];

      const nextWorkers = existingWorker
        ? state.workers.map((w) =>
            w.id === action.userId
              ? {
                  ...w,
                  name: cleanName,
                  nameUr: cleanName,
                }
              : w
          )
        : [
            {
              id: action.userId,
              userId: action.userId,
              name: cleanName,
              nameUr: cleanName,
              headline: `${cat.nameEn} · Skilled worker`,
              headlineUr: `${cat.nameUr} · ماہر کاریگر`,
              categoryId: cat.id,
              skills: cat.subSkills.slice(0, 4),
              city: defaultCity,
              area: defaultArea,
              serviceAreas: Array.from(new Set([defaultArea, defaultCity])),
              yearsExperience: 2,
              rating: 5.0,
              reviewCount: 0,
              jobsCompleted: 0,
              priceHintPkr: 1500,
              priceUnit: 'visit' as const,
              workerType: 'One person' as const,
              teamSize: 1,
              checkedDemo: false,
              freeToWorkNow: true,
              bio: action.isGuest
                ? `Guest demo worker in ${defaultArea}, ${defaultCity}.`
                : `Skilled ${cat.nameEn.toLowerCase()} serving ${defaultArea}, ${defaultCity}.`,
              bioUr: action.isGuest
                ? `${defaultArea}، ${defaultCity} میں گیسٹ ڈیمو کاریگر۔`
                : `${defaultArea}، ${defaultCity} میں ${cat.nameUr} کی خدمات۔`,
              languages: ['Urdu', 'English'],
              workPhotos: [],
              joinedAt: nowIso,
            },
            ...state.workers,
          ];

      return {
        ...state,
        activeRole: UserRole.Worker,
        activeWorkerId: action.userId,
        activeWorkerTypePreference:
          existingWorker?.workerType === 'Contractor' || existingWorker?.workerType === 'Team'
            ? 'contractor'
            : 'worker',
        workers: nextWorkers,
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_CUSTOMER_PROFILE': {
      if (state.activeRole !== UserRole.Customer) return state;
      const cleanName = sanitizeText(action.updates.name, INPUT_LIMITS.NAME_MAX);
      const cleanArea = sanitizeText(action.updates.area, INPUT_LIMITS.AREA_MAX);
      if (!cleanName || !cleanArea) return state;
      return {
        ...state,
        selectedLocation: {
          city: action.updates.city,
          area: cleanArea,
        },
        customers: state.customers.map((c) =>
          c.id === state.activeCustomerId
            ? {
                ...c,
                name: cleanName,
                city: action.updates.city,
                area: cleanArea,
                profilePhotoUrl: action.updates.profilePhotoUrl,
                coverPhotoUrl: action.updates.coverPhotoUrl,
              }
            : c
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'SET_ROLE': {
      return {
        ...state,
        activeRole: action.role,
        activeWorkerTypePreference:
          action.workerTypePreference ?? state.activeWorkerTypePreference,
        lastUpdatedAt: nowIso,
      };
    }

    case 'ENTER_DEMO_ACCOUNT': {
      if (action.account === 'customer') {
        return {
          ...state,
          activeRole: UserRole.Customer,
          activeCustomerId: 'cust_demo',
          lastUpdatedAt: nowIso,
        };
      }
      if (action.account === 'contractor') {
        return {
          ...state,
          activeRole: UserRole.Worker,
          activeWorkerId: 'wrk_hassan_team',
          activeWorkerTypePreference: 'contractor',
          lastUpdatedAt: nowIso,
        };
      }
      return {
        ...state,
        activeRole: UserRole.Worker,
        activeWorkerId: 'wrk_ali_raza',
        activeWorkerTypePreference: 'worker',
        lastUpdatedAt: nowIso,
      };
    }

    case 'SELECT_WORKER': {
      const allowed = action.workerId === 'wrk_ali_raza' || action.workerId === 'wrk_hassan_team';
      if (!allowed) return state;
      return {
        ...state,
        activeWorkerId: action.workerId,
        activeWorkerTypePreference:
          action.workerId === 'wrk_hassan_team' ? 'contractor' : 'worker',
        lastUpdatedAt: nowIso,
      };
    }

    case 'SELECT_CUSTOMER': {
      return {
        ...state,
        activeCustomerId: 'cust_demo',
        lastUpdatedAt: nowIso,
      };
    }

    case 'SET_CUSTOMER_LOCATION': {
      if (state.activeRole === UserRole.Worker) return state;
      const cleanArea = sanitizeText(action.location.area, INPUT_LIMITS.AREA_MAX);
      if (!cleanArea) return state;
      const nextLocation: Location = {
        city: action.location.city,
        area: cleanArea,
      };
      return {
        ...state,
        selectedLocation: nextLocation,
        customers: state.customers.map((c) =>
          c.id === state.activeCustomerId
            ? { ...c, city: nextLocation.city, area: nextLocation.area }
            : c
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'TOGGLE_WORKER_FREE_TO_WORK': {
      if (state.activeRole !== UserRole.Worker) return state;
      if (action.workerId && action.workerId !== state.activeWorkerId) return state;
      const targetId = state.activeWorkerId;
      return {
        ...state,
        workers: state.workers.map((w) =>
          w.id === targetId ? { ...w, freeToWorkNow: !w.freeToWorkNow } : w
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_WORKER_SERVICE_AREAS': {
      if (state.activeRole !== UserRole.Worker) return state;
      if (action.workerId && action.workerId !== state.activeWorkerId) return state;
      const targetId = state.activeWorkerId;
      const sanitized = Array.from(
        new Set(
          action.serviceAreas
            .map((a) => sanitizeText(a, INPUT_LIMITS.AREA_MAX))
            .filter(Boolean)
        )
      );
      return {
        ...state,
        workers: state.workers.map((w) =>
          w.id === targetId ? { ...w, serviceAreas: sanitized } : w
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_WORKER_PROFILE': {
      if (state.activeRole !== UserRole.Worker) return state;
      if (action.workerId && action.workerId !== state.activeWorkerId) return state;
      const targetId = state.activeWorkerId;
      const u = action.updates;
      const cleanName = sanitizeText(u.name, INPUT_LIMITS.NAME_MAX);
      const cleanHeadline = sanitizeText(u.headline, INPUT_LIMITS.HEADLINE_MAX);
      const cleanBio = sanitizeText(u.bio, INPUT_LIMITS.BIO_MAX);
      const cleanArea = sanitizeText(u.area, INPUT_LIMITS.AREA_MAX);
      const cleanServiceAreas = Array.from(
        new Set(u.serviceAreas.map((a) => sanitizeText(a, INPUT_LIMITS.AREA_MAX)).filter(Boolean))
      );
      const cleanSkills = Array.from(
        new Set(u.skills.map((s) => sanitizeText(s, INPUT_LIMITS.SKILL_MAX)).filter(Boolean))
      );
      const cleanLanguages = Array.from(
        new Set(u.languages.map((l) => sanitizeText(l, 30)).filter(Boolean))
      );
      const years = Math.max(0, Math.min(60, Math.round(u.yearsExperience || 0)));
      const teamSize =
        u.workerType === 'One person'
          ? 1
          : Math.max(2, Math.min(50, Math.round(u.teamSize || 2)));

      return {
        ...state,
        workers: state.workers.map((w) => {
          if (w.id !== targetId) return w;
          return {
            ...w,
            name: cleanName || w.name,
            nameUr: cleanName || w.nameUr,
            headline: cleanHeadline || w.headline,
            headlineUr: cleanHeadline || w.headlineUr,
            bio: cleanBio,
            categoryId: u.categoryId || w.categoryId,
            skills: cleanSkills,
            yearsExperience: years,
            city: u.city,
            area: cleanArea || cleanServiceAreas[0] || w.area,
            serviceAreas: cleanServiceAreas,
            freeToWorkNow: u.freeToWorkNow,
            priceHintPkr: clampPkr(u.priceHintPkr),
            priceUnit: u.priceUnit,
            languages: cleanLanguages,
            workerType: u.workerType,
            teamSize,
            profilePhotoUrl: u.profilePhotoUrl,
            coverPhotoUrl: u.coverPhotoUrl,
          };
        }),
        lastUpdatedAt: nowIso,
      };
    }

    case 'ADD_WORK_UPDATE': {
      if (state.activeRole !== UserRole.Worker || action.workerId !== state.activeWorkerId) {
        return state;
      }
      const cleanNote = sanitizeText(action.note, INPUT_LIMITS.UPDATE_NOTE_MAX);
      if (action.photos.length === 0 || action.photos.length > 5 || !cleanNote) {
        return state;
      }
      const nextUpdate = {
        id: createId('wu'),
        workerId: state.activeWorkerId,
        jobId: action.jobId || undefined,
        photos: action.photos.slice(0, 5),
        note: cleanNote,
        progress: action.progress,
        createdAt: nowIso,
      };
      return {
        ...state,
        workUpdates: [nextUpdate, ...state.workUpdates],
        lastUpdatedAt: nowIso,
      };
    }

    case 'DELETE_WORK_UPDATE': {
      if (state.activeRole !== UserRole.Worker || action.workerId !== state.activeWorkerId) {
        return state;
      }
      return {
        ...state,
        workUpdates: state.workUpdates.filter(
          (u) => !(u.id === action.updateId && u.workerId === state.activeWorkerId)
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'ADD_PORTFOLIO_ITEM': {
      if (state.activeRole !== UserRole.Worker || action.workerId !== state.activeWorkerId) {
        return state;
      }
      const cleanCaption = sanitizeText(action.caption, INPUT_LIMITS.CAPTION_MAX);
      if (action.photos.length === 0 || action.photos.length > 5 || !cleanCaption) {
        return state;
      }
      const nextItem = {
        id: createId('pf'),
        workerId: state.activeWorkerId,
        categoryId: action.categoryId,
        caption: cleanCaption,
        photos: action.photos.slice(0, 5),
        createdAt: nowIso,
      };
      return {
        ...state,
        portfolioItems: [nextItem, ...state.portfolioItems],
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_PORTFOLIO_CAPTION': {
      if (state.activeRole !== UserRole.Worker || action.workerId !== state.activeWorkerId) {
        return state;
      }
      const cleanCaption = sanitizeText(action.caption, INPUT_LIMITS.CAPTION_MAX);
      if (!cleanCaption) return state;
      return {
        ...state,
        portfolioItems: state.portfolioItems.map((item) =>
          item.id === action.itemId && item.workerId === state.activeWorkerId
            ? { ...item, caption: cleanCaption }
            : item
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'DELETE_PORTFOLIO_ITEM': {
      if (state.activeRole !== UserRole.Worker || action.workerId !== state.activeWorkerId) {
        return state;
      }
      return {
        ...state,
        portfolioItems: state.portfolioItems.filter(
          (item) => !(item.id === action.itemId && item.workerId === state.activeWorkerId)
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'ADD_CONTENT_REPORT': {
      const cleanReason = sanitizeText(action.reason, 80);
      const cleanNote = sanitizeText(action.note, INPUT_LIMITS.REPORT_NOTE_MAX);
      const cleanJobLink = action.jobLink
        ? sanitizeText(action.jobLink, INPUT_LIMITS.JOB_LINK_MAX)
        : undefined;
      if (!cleanReason) return state;
      return {
        ...state,
        reports: [
          {
            id: createId('rep'),
            targetType: action.targetType || 'work_update',
            targetId: sanitizeText(action.targetId, 60) || 'app_help',
            workerId: sanitizeText(action.workerId, 60) || 'wrk_ali_raza',
            reason: cleanReason,
            note: cleanNote,
            jobLink: cleanJobLink || undefined,
            status: 'Sent (demo)',
            createdAt: nowIso,
          },
          ...state.reports,
        ],
        lastUpdatedAt: nowIso,
      };
    }

    case 'ADD_CONTACT_MESSAGE': {
      const cleanName = sanitizeText(action.name, INPUT_LIMITS.NAME_MAX);
      const cleanMessage = sanitizeText(action.message, INPUT_LIMITS.CONTACT_MESSAGE_MAX);
      if (!cleanName || !cleanMessage) return state;
      return {
        ...state,
        contactMessages: [
          {
            id: createId('cnt'),
            name: cleanName,
            message: cleanMessage,
            status: 'Sent (demo)',
            createdAt: nowIso,
          },
          ...state.contactMessages,
        ],
        lastUpdatedAt: nowIso,
      };
    }

    case 'CREATE_JOB': {
      if (state.activeRole !== UserRole.Customer) {
        return state;
      }
      if (action.customerId && action.customerId !== state.activeCustomerId) {
        return state;
      }

      const cleanDesc = sanitizeText(action.description, INPUT_LIMITS.JOB_DESCRIPTION_MAX);
      const cleanArea = sanitizeText(action.area, INPUT_LIMITS.AREA_MAX);
      const cleanNotes = action.notes
        ? sanitizeText(action.notes, INPUT_LIMITS.JOB_NOTES_MAX)
        : undefined;

      if (!cleanDesc || !action.categoryId || !cleanArea) {
        return state;
      }

      const cat = state.categories.find((c) => c.id === action.categoryId);
      const rawBudget =
        typeof action.budget === 'number' && action.budget > 0
          ? clampPkr(action.budget)
          : undefined;
      const workersNeeded =
        action.workforceType === 'one' || action.workforceType === 'either'
          ? 1
          : Math.max(2, Math.min(20, Math.round(action.workersNeeded || 2)));

      const newJob: Job = {
        id: createId('job'),
        customerId: state.activeCustomerId,
        categoryId: action.categoryId,
        requiredSkill: cat?.subSkills[0] || '',
        title: cleanDesc.slice(0, INPUT_LIMITS.JOB_TITLE_MAX),
        description: cleanDesc,
        city: action.city,
        area: cleanArea,
        budget: rawBudget,
        yourPriceMinPkr: rawBudget || 0,
        yourPriceMaxPkr: rawBudget || 0,
        materialsIncluded: Boolean(action.materialsIncluded),
        workforceType: action.workforceType,
        workersNeeded,
        urgency: action.urgency,
        howSoon: action.urgency === 'Flexible' ? 'Anytime' : action.urgency,
        preferredDate: action.preferredDate ? sanitizeText(action.preferredDate, 20) : undefined,
        photos: action.photos.slice(0, 4),
        notes: cleanNotes,
        status: 'Published',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const matchingWorkers = getMatchingWorkersForJob(newJob, state.workers, state.categories);
      const shortServiceEn = cat ? cat.nameEn : 'Work';
      const shortServiceUr = cat ? cat.nameUr : 'کام';

      const newDeliveries: RequestDelivery[] = matchingWorkers.map((w) => {
        const km = getApproxDistanceKm(newJob, w);
        return {
          id: createId('del'),
          jobId: newJob.id,
          workerId: w.id,
          customerId: newJob.customerId,
          categoryId: newJob.categoryId,
          city: newJob.city,
          area: newJob.area,
          matchedSkill: shortServiceEn,
          distanceKmLabel: `about ${km} km`,
          createdAt: nowIso,
        };
      });

      const newAlerts: Alert[] = matchingWorkers.map((w) =>
        createAlertItem({
          type: 'new_job_near_you',
          targetRole: 'worker',
          workerId: w.id,
          jobId: newJob.id,
          title: t('alert.newJobTitle', 'en', {
            service: shortServiceEn,
            area: newJob.area,
          }),
          titleUr: t('alert.newJobTitle', 'ur', {
            service: shortServiceUr,
            area: newJob.area,
          }),
          body: t('alert.newJobBody', 'en', {
            title: newJob.title,
            city: newJob.city,
            price: newJob.budget ? formatPkr(newJob.budget, 'en') : t('common.openPrice', 'en'),
          }),
          bodyUr: t('alert.newJobBody', 'ur', {
            title: newJob.titleUr || newJob.title,
            city: t(`city.${newJob.city}` as never, 'ur'),
            price: newJob.budget ? formatPkr(newJob.budget, 'ur') : t('common.openPrice', 'ur'),
          }),
          link: `/worker/jobs/${newJob.id}`,
          createdAt: nowIso,
        })
      );

      return {
        ...state,
        jobs: [newJob, ...state.jobs],
        requestDeliveries: [...newDeliveries, ...state.requestDeliveries],
        notifications: [...newAlerts, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'CANCEL_JOB': {
      if (state.activeRole !== UserRole.Customer) {
        return state;
      }
      if (action.customerId && action.customerId !== state.activeCustomerId) {
        return state;
      }
      const ownerId = state.activeCustomerId;
      const targetJob = state.jobs.find((j) => j.id === action.jobId && j.customerId === ownerId);
      if (!targetJob || targetJob.status === 'Completed' || targetJob.status === 'Cancelled') {
        return state;
      }

      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.jobId && job.customerId === ownerId
            ? { ...job, status: 'Cancelled', updatedAt: nowIso }
            : job
        ),
        bookings: state.bookings.map((b) =>
          b.jobId === action.jobId && b.status !== 'Completed'
            ? { ...b, status: 'Cancelled', updatedAt: nowIso }
            : b
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'SEND_OFFER': {
      if (state.activeRole !== UserRole.Worker) {
        return state;
      }
      if (action.workerId && action.workerId !== state.activeWorkerId) {
        return state;
      }
      const workerId = state.activeWorkerId;
      const worker = state.workers.find((w) => w.id === workerId);
      const job = state.jobs.find((j) => j.id === action.jobId);
      const hasBooking = state.bookings.some(
        (b) => b.jobId === action.jobId && b.status !== 'Cancelled'
      );
      if (
        !worker ||
        !job ||
        hasBooking ||
        job.status === 'Confirmed Job' ||
        job.status === 'Work Started' ||
        job.status === 'In Progress' ||
        job.status === 'Cancelled' ||
        job.status === 'Completed'
      ) {
        return state;
      }

      const alreadyHasOpenOffer = state.offers.some(
        (o) =>
          o.jobId === job.id &&
          o.workerId === worker.id &&
          (o.status === 'pending' || o.status === 'price_talk')
      );
      if (alreadyHasOpenOffer) {
        return state;
      }

      const price = clampPkr(action.pricePkr);
      const daysNeeded = Math.max(1, Math.min(90, Math.round(action.daysNeeded || 1)));
      const cleanNote = sanitizeText(action.note, INPUT_LIMITS.MESSAGE_MAX);
      const workersCount = Math.max(1, Math.min(20, Math.round(action.workersCount || worker.teamSize || 1)));

      const newOffer: Offer = {
        id: createId('off'),
        jobId: job.id,
        workerId: worker.id,
        workerType: worker.workerType,
        workersCount,
        pricePkr: price,
        daysNeeded,
        note: cleanNote || 'Ready to do this work cleanly.',
        status: 'pending',
        submittedAt: nowIso,
        expiresAt: computeExpiresAt(nowIso),
        updatedAt: nowIso,
      };

      const negEntry: Negotiation = {
        id: createId('neg'),
        offerId: newOffer.id,
        jobId: job.id,
        byRole: 'worker',
        byName: worker.name,
        action: 'sent_price',
        pricePkr: price,
        workersCount,
        note: newOffer.note,
        createdAt: nowIso,
      };

      const customerAlert = createAlertItem({
        type: 'new_price_received',
        targetRole: 'customer',
        customerId: job.customerId,
        jobId: job.id,
        offerId: newOffer.id,
        title: t('alert.newPriceReceivedTitle', 'en', { price: formatPkr(price, 'en') }),
        titleUr: t('alert.newPriceReceivedTitle', 'ur', { price: formatPkr(price, 'ur') }),
        body: t('alert.newPriceReceivedBody', 'en', {
          worker: worker.name,
          price: formatPkr(price, 'en'),
          title: job.title,
        }),
        bodyUr: t('alert.newPriceReceivedBody', 'ur', {
          worker: worker.nameUr || worker.name,
          price: formatPkr(price, 'ur'),
          title: job.titleUr || job.title,
        }),
        link: `/my-requests/${job.id}`,
        createdAt: nowIso,
      });

      return {
        ...state,
        offers: [newOffer, ...state.offers],
        negotiations: [negEntry, ...state.negotiations],
        jobs: state.jobs.map((j) =>
          j.id === job.id && j.status === 'Published'
            ? { ...j, status: 'Offers Received', updatedAt: nowIso }
            : j
        ),
        notifications: [customerAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'COUNTER_OFFER': {
      if (state.activeRole === UserRole.Guest) return state;
      const offer = state.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;
      const job = state.jobs.find((j) => j.id === offer.jobId);
      if (!job) return state;

      const hasConfirmedBooking = state.bookings.some(
        (b) => b.jobId === job.id && b.status !== 'Cancelled'
      );
      const actorId = getActiveActorId(state);
      const evalOffer = evaluateOfferActions(
        offer,
        job,
        state.negotiations,
        state.activeRole,
        actorId,
        hasConfirmedBooking
      );

      if (!evalOffer.canCounter) {
        return state;
      }

      const price = clampPkr(action.pricePkr);
      const actorRole = state.activeRole === UserRole.Customer ? 'customer' : 'worker';
      const actorName = getActiveActorName(state);
      const cleanNote = sanitizeText(action.note || '', INPUT_LIMITS.MESSAGE_MAX);

      const negEntry: Negotiation = {
        id: createId('neg'),
        offerId: offer.id,
        jobId: job.id,
        byRole: actorRole,
        byName: actorName,
        action: 'your_price',
        pricePkr: price,
        workersCount: offer.workersCount,
        note: cleanNote || `New price suggested: ${formatPkr(price)}`,
        createdAt: nowIso,
      };

      const recipientAlert =
        actorRole === 'customer'
          ? createAlertItem({
              type: 'new_price_sent_to_you',
              targetRole: 'worker',
              workerId: offer.workerId,
              jobId: job.id,
              offerId: offer.id,
              title: t('alert.newPriceCounterTitle', 'en', { price: formatPkr(price, 'en') }),
              titleUr: t('alert.newPriceCounterTitle', 'ur', { price: formatPkr(price, 'ur') }),
              body: t('alert.newPriceCounterBody', 'en', {
                name: actorName,
                price: formatPkr(price, 'en'),
                title: job.title,
              }),
              bodyUr: t('alert.newPriceCounterBody', 'ur', {
                name: actorName,
                price: formatPkr(price, 'ur'),
                title: job.titleUr || job.title,
              }),
              link: `/worker/prices`,
              createdAt: nowIso,
            })
          : createAlertItem({
              type: 'new_price_received',
              targetRole: 'customer',
              customerId: job.customerId,
              jobId: job.id,
              offerId: offer.id,
              title: t('alert.newPriceReceivedTitle', 'en', { price: formatPkr(price, 'en') }),
              titleUr: t('alert.newPriceReceivedTitle', 'ur', { price: formatPkr(price, 'ur') }),
              body: t('alert.newPriceReceivedBody', 'en', {
                worker: actorName,
                price: formatPkr(price, 'en'),
                title: job.title,
              }),
              bodyUr: t('alert.newPriceReceivedBody', 'ur', {
                worker: actorName,
                price: formatPkr(price, 'ur'),
                title: job.titleUr || job.title,
              }),
              link: `/my-requests/${job.id}`,
              createdAt: nowIso,
            });

      return {
        ...state,
        offers: state.offers.map((o) =>
          o.id === offer.id
            ? { ...o, pricePkr: price, status: 'price_talk', updatedAt: nowIso }
            : o
        ),
        negotiations: [negEntry, ...state.negotiations],
        jobs: state.jobs.map((j) =>
          j.id === job.id ? { ...j, status: 'Price Talk', updatedAt: nowIso } : j
        ),
        notifications: [recipientAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'DECLINE_OFFER': {
      if (state.activeRole !== UserRole.Customer) return state;
      const offer = state.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;
      const job = state.jobs.find((j) => j.id === offer.jobId);
      if (!job) return state;
      const hasConfirmedBooking = state.bookings.some(
        (b) => b.jobId === job.id && b.status !== 'Cancelled'
      );
      const evalOffer = evaluateOfferActions(
        offer,
        job,
        state.negotiations,
        state.activeRole,
        state.activeCustomerId,
        hasConfirmedBooking
      );
      if (!evalOffer.canDecline) return state;

      const negEntry: Negotiation = {
        id: createId('neg'),
        offerId: offer.id,
        jobId: job.id,
        byRole: 'customer',
        byName: getActiveActorName(state),
        action: 'declined',
        pricePkr: offer.pricePkr,
        workersCount: offer.workersCount,
        note: 'Price declined by customer.',
        createdAt: nowIso,
      };

      const alert = createAlertItem({
        type: 'price_said_no',
        targetRole: 'worker',
        workerId: offer.workerId,
        jobId: job.id,
        offerId: offer.id,
        title: t('alert.priceDeclinedTitle', 'en', { title: job.title }),
        titleUr: t('alert.priceDeclinedTitle', 'ur', { title: job.titleUr || job.title }),
        body: t('alert.priceDeclinedBody', 'en', {
          price: formatPkr(offer.pricePkr, 'en'),
          title: job.title,
        }),
        bodyUr: t('alert.priceDeclinedBody', 'ur', {
          price: formatPkr(offer.pricePkr, 'ur'),
          title: job.titleUr || job.title,
        }),
        link: `/worker/prices`,
        createdAt: nowIso,
      });

      return {
        ...state,
        offers: state.offers.map((o) =>
          o.id === offer.id ? { ...o, status: 'declined', updatedAt: nowIso } : o
        ),
        negotiations: [negEntry, ...state.negotiations],
        notifications: [alert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'WITHDRAW_OFFER': {
      if (state.activeRole !== UserRole.Worker) return state;
      const offer = state.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;
      const job = state.jobs.find((j) => j.id === offer.jobId);
      if (!job) return state;

      const hasConfirmedBooking = state.bookings.some(
        (b) => b.jobId === job.id && b.status !== 'Cancelled'
      );
      const evalOffer = evaluateOfferActions(
        offer,
        job,
        state.negotiations,
        state.activeRole,
        state.activeWorkerId,
        hasConfirmedBooking
      );
      if (!evalOffer.canWithdraw) return state;

      const negEntry: Negotiation = {
        id: createId('neg'),
        offerId: offer.id,
        jobId: job.id,
        byRole: 'worker',
        byName: getActiveActorName(state),
        action: 'withdrawn',
        pricePkr: offer.pricePkr,
        workersCount: offer.workersCount,
        note: 'Price withdrawn by worker.',
        createdAt: nowIso,
      };

      return {
        ...state,
        offers: state.offers.map((o) =>
          o.id === offer.id ? { ...o, status: 'withdrawn', updatedAt: nowIso } : o
        ),
        negotiations: [negEntry, ...state.negotiations],
        lastUpdatedAt: nowIso,
      };
    }

    case 'ACCEPT_OFFER': {
      if (state.activeRole !== UserRole.Customer) return state;
      const offer = state.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;
      const job = state.jobs.find((j) => j.id === offer.jobId);
      if (!job) return state;

      const hasConfirmedBooking = state.bookings.some(
        (b) => b.jobId === job.id && b.status !== 'Cancelled'
      );
      const evalOffer = evaluateOfferActions(
        offer,
        job,
        state.negotiations,
        state.activeRole,
        state.activeCustomerId,
        hasConfirmedBooking
      );
      if (!evalOffer.canAccept) return state;

      const feeCalc = calculateOurFee(offer.pricePkr);
      const newBooking: Booking = {
        id: createId('bk'),
        jobId: job.id,
        offerId: offer.id,
        customerId: job.customerId,
        workerId: offer.workerId,
        jobTitle: job.title,
        area: job.area,
        city: job.city,
        agreedPricePkr: feeCalc.jobValue,
        ourFeePkr: feeCalc.fee,
        workerGetsPkr: feeCalc.net,
        status: 'Confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const negEntry: Negotiation = {
        id: createId('neg'),
        offerId: offer.id,
        jobId: job.id,
        byRole: 'customer',
        byName: getActiveActorName(state),
        action: 'accepted',
        pricePkr: offer.pricePkr,
        workersCount: offer.workersCount,
        note: 'Price agreed. Confirmed job.',
        createdAt: nowIso,
      };

      const priceAcceptedAlert = createAlertItem({
        type: 'price_accepted',
        targetRole: 'worker',
        workerId: offer.workerId,
        jobId: job.id,
        offerId: offer.id,
        bookingId: newBooking.id,
        title: t('alert.priceAcceptedTitle', 'en', { price: formatPkr(feeCalc.jobValue, 'en') }),
        titleUr: t('alert.priceAcceptedTitle', 'ur', { price: formatPkr(feeCalc.jobValue, 'ur') }),
        body: t('alert.priceAcceptedBody', 'en', {
          price: formatPkr(feeCalc.jobValue, 'en'),
          title: job.title,
        }),
        bodyUr: t('alert.priceAcceptedBody', 'ur', {
          price: formatPkr(feeCalc.jobValue, 'ur'),
          title: job.titleUr || job.title,
        }),
        link: '/worker/bookings',
        createdAt: nowIso,
      });

      const jobConfirmedAlert = createAlertItem({
        type: 'job_confirmed',
        targetRole: 'worker',
        workerId: offer.workerId,
        jobId: job.id,
        bookingId: newBooking.id,
        title: t('alert.jobConfirmedTitle', 'en', { title: job.title }),
        titleUr: t('alert.jobConfirmedTitle', 'ur', { title: job.titleUr || job.title }),
        body: t('alert.jobConfirmedBody', 'en', {
          fee: formatPkr(feeCalc.fee, 'en'),
          net: formatPkr(feeCalc.net, 'en'),
        }),
        bodyUr: t('alert.jobConfirmedBody', 'ur', {
          fee: formatPkr(feeCalc.fee, 'ur'),
          net: formatPkr(feeCalc.net, 'ur'),
        }),
        link: '/worker/bookings',
        createdAt: nowIso,
      });

      return {
        ...state,
        offers: state.offers.map((o) => {
          if (o.id === offer.id) return { ...o, status: 'accepted', updatedAt: nowIso };
          if (o.jobId === job.id && (o.status === 'pending' || o.status === 'price_talk')) {
            return { ...o, status: 'declined', updatedAt: nowIso };
          }
          return o;
        }),
        negotiations: [negEntry, ...state.negotiations],
        bookings: [newBooking, ...state.bookings],
        jobs: state.jobs.map((j) =>
          j.id === job.id ? { ...j, status: 'Confirmed Job', updatedAt: nowIso } : j
        ),
        notifications: [jobConfirmedAlert, priceAcceptedAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'UPDATE_BOOKING_STATUS': {
      const booking = state.bookings.find((b) => b.id === action.bookingId);
      if (!booking) return state;

      if (!isAllowedBookingTransition(booking.status, action.status)) {
        return state;
      }

      // Cancelling allowed for owning customer or assigned worker when not yet completed
      if (action.status === 'Cancelled') {
        const isOwningCustomer =
          state.activeRole === UserRole.Customer && booking.customerId === state.activeCustomerId;
        const isAssignedWorker =
          state.activeRole === UserRole.Worker && booking.workerId === state.activeWorkerId;
        if (!isOwningCustomer && !isAssignedWorker) return state;

        return {
          ...state,
          bookings: state.bookings.map((b) =>
            b.id === booking.id ? { ...b, status: 'Cancelled', updatedAt: nowIso } : b
          ),
          jobs: state.jobs.map((j) =>
            j.id === booking.jobId ? { ...j, status: 'Cancelled', updatedAt: nowIso } : j
          ),
          lastUpdatedAt: nowIso,
        };
      }

      // Starting / In Progress / Completing a booking is restricted to that booking's worker
      if (state.activeRole !== UserRole.Worker || booking.workerId !== state.activeWorkerId) {
        return state;
      }

      const job = state.jobs.find((j) => j.id === booking.jobId);
      const jobTitle = booking.jobTitle || job?.title || 'Skilled service job';
      const worker = state.workers.find((w) => w.id === booking.workerId);

      const jobStatusMap: Record<Exclude<BookingStatus, 'Cancelled' | 'Confirmed'>, JobStatus> = {
        Started: 'Work Started',
        'In Progress': 'In Progress',
        Completed: 'Completed',
      };

      const nextJobStatus =
        action.status === 'Confirmed' ? 'Confirmed Job' : jobStatusMap[action.status];

      const alertsToAdd: Alert[] = [];
      let nextTransactions = state.transactions;

      const jobTitleUr = job?.titleUr || jobTitle;
      const workerNameEn = worker?.name || 'Worker';
      const workerNameUr = worker?.nameUr || workerNameEn;

      if (action.status === 'Started') {
        alertsToAdd.push(
          createAlertItem({
            type: 'work_started',
            targetRole: 'customer',
            customerId: booking.customerId,
            jobId: booking.jobId,
            bookingId: booking.id,
            title: t('alert.workStartedTitle', 'en', { title: jobTitle }),
            titleUr: t('alert.workStartedTitle', 'ur', { title: jobTitleUr }),
            body: t('alert.workStartedBody', 'en', { worker: workerNameEn }),
            bodyUr: t('alert.workStartedBody', 'ur', { worker: workerNameUr }),
            link: `/my-requests/${booking.jobId}`,
            createdAt: nowIso,
          })
        );
      } else if (action.status === 'In Progress') {
        alertsToAdd.push(
          createAlertItem({
            type: 'work_in_progress',
            targetRole: 'customer',
            customerId: booking.customerId,
            jobId: booking.jobId,
            bookingId: booking.id,
            title: t('alert.workInProgressTitle', 'en', { title: jobTitle }),
            titleUr: t('alert.workInProgressTitle', 'ur', { title: jobTitleUr }),
            body: t('alert.workInProgressBody', 'en', { worker: workerNameEn, title: jobTitle }),
            bodyUr: t('alert.workInProgressBody', 'ur', { worker: workerNameUr, title: jobTitleUr }),
            link: `/my-requests/${booking.jobId}`,
            createdAt: nowIso,
          })
        );
      } else if (action.status === 'Completed') {
        const alreadyHasTx = state.transactions.some((tx) => tx.bookingId === booking.id);
        if (!alreadyHasTx) {
          const calc = calculateOurFee(booking.agreedPricePkr);
          const newTx: Transaction = {
            id: createId('tx'),
            bookingId: booking.id,
            workerId: booking.workerId,
            jobId: booking.jobId,
            jobTitle,
            jobValue: calc.jobValue,
            grossPkr: calc.grossPkr,
            fee: calc.fee,
            ourFeePkr: calc.ourFeePkr,
            net: calc.net,
            netPkr: calc.net,
            status: 'Done (demo)',
            createdAt: nowIso,
          };
          nextTransactions = [newTx, ...state.transactions];
        }

        alertsToAdd.push(
          createAlertItem({
            type: 'work_done',
            targetRole: 'customer',
            customerId: booking.customerId,
            jobId: booking.jobId,
            bookingId: booking.id,
            title: t('alert.workDoneTitle', 'en', { worker: workerNameEn }),
            titleUr: t('alert.workDoneTitle', 'ur', { worker: workerNameUr }),
            body: t('alert.workDoneBody', 'en', { title: jobTitle }),
            bodyUr: t('alert.workDoneBody', 'ur', { title: jobTitleUr }),
            link: `/my-requests/${booking.jobId}`,
            createdAt: nowIso,
          })
        );
      }

      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: action.status,
                updatedAt: nowIso,
                completedAt: action.status === 'Completed' ? nowIso : b.completedAt,
              }
            : b
        ),
        jobs: state.jobs.map((j) =>
          j.id === booking.jobId
            ? { ...j, status: nextJobStatus, updatedAt: nowIso }
            : j
        ),
        transactions: nextTransactions,
        notifications: [...alertsToAdd, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'SUBMIT_REVIEW': {
      const booking = state.bookings.find((b) => b.id === action.bookingId);
      const eligibility = canCustomerReviewBooking(
        booking,
        state.activeCustomerId,
        state.activeRole,
        state.reviews
      );
      if (!eligibility.allowed || !booking) {
        return state;
      }

      const stars = Math.max(1, Math.min(5, Math.round(action.stars)));
      const cleanText = sanitizeText(action.text, INPUT_LIMITS.REVIEW_MAX);
      const validTagSet = new Set<string>(REVIEW_TAGS);
      const cleanTags = Array.from(
        new Set(action.tags.filter((t) => validTagSet.has(t)))
      ).slice(0, 5);

      const customer = state.customers.find((c) => c.id === booking.customerId);
      const customerDisplay = formatReviewerDisplayName(customer?.name);
      const areaLabel =
        booking.area && booking.city
          ? `${booking.area}, ${booking.city}`
          : customer
            ? `${customer.area}, ${customer.city}`
            : undefined;

      const newReview: Review = {
        id: createId('rev'),
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: customerDisplay,
        areaName: areaLabel,
        workerId: booking.workerId,
        stars,
        rating: stars,
        text: cleanText,
        comment: cleanText,
        tags: cleanTags,
        isDemo: false,
        createdAt: nowIso,
      };

      const nextReviews = [newReview, ...state.reviews];
      const nextAvgRating = recalculateWorkerRating(nextReviews, booking.workerId);

      const workerAlert = createAlertItem({
        type: 'new_review',
        targetRole: 'worker',
        workerId: booking.workerId,
        bookingId: booking.id,
        title: t('alert.newReviewTitle', 'en', { stars }),
        titleUr: t('alert.newReviewTitle', 'ur', { stars }),
        body: cleanText
          ? t('alert.newReviewBodyWithText', 'en', { customer: customerDisplay, text: cleanText })
          : t('alert.newReviewBodyNoText', 'en', { customer: customerDisplay, stars }),
        bodyUr: cleanText
          ? t('alert.newReviewBodyWithText', 'ur', { customer: customerDisplay, text: cleanText })
          : t('alert.newReviewBodyNoText', 'ur', { customer: customerDisplay, stars }),
        link: `/workers/${booking.workerId}`,
        createdAt: nowIso,
      });

      return {
        ...state,
        reviews: nextReviews,
        workers: state.workers.map((w) =>
          w.id === booking.workerId
            ? {
                ...w,
                rating: nextAvgRating,
                reviewCount: nextReviews.filter((r) => r.workerId === w.id).length,
                jobsCompleted: w.jobsCompleted + 1,
              }
            : w
        ),
        notifications: [workerAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'REPLY_TO_REVIEW': {
      const review = state.reviews.find((r) => r.id === action.reviewId);
      const check = canWorkerReplyToReview(review, state.activeWorkerId, state.activeRole);
      if (!check.allowed || !review) return state;

      const cleanReply = sanitizeText(action.text, INPUT_LIMITS.REVIEW_REPLY_MAX);
      if (!cleanReply) return state;

      const worker = state.workers.find((w) => w.id === review.workerId);

      const customerAlert = createAlertItem({
        type: 'review_reply',
        targetRole: 'customer',
        customerId: review.customerId,
        bookingId: review.bookingId,
        title: t('alert.reviewReplyTitle', 'en', { worker: worker?.name || 'Worker' }),
        titleUr: t('alert.reviewReplyTitle', 'ur', {
          worker: worker?.nameUr || worker?.name || 'کاریگر',
        }),
        body: cleanReply,
        bodyUr: cleanReply,
        link: `/workers/${review.workerId}`,
        createdAt: nowIso,
      });

      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === review.id
            ? {
                ...r,
                reply: {
                  text: cleanReply,
                  createdAt: nowIso,
                },
              }
            : r
        ),
        notifications: [customerAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'OPEN_OR_CREATE_CONVERSATION': {
      if (state.activeRole === UserRole.Guest) return state;
      if (state.activeRole === UserRole.Customer && action.customerId !== state.activeCustomerId) {
        return state;
      }
      if (state.activeRole === UserRole.Worker && action.workerId !== state.activeWorkerId) {
        return state;
      }
      const customerExists = state.customers.some((c) => c.id === action.customerId);
      const workerExists = state.workers.some((w) => w.id === action.workerId);
      if (!customerExists || !workerExists) return state;

      const existing = state.conversations.find(
        (c) =>
          c.customerId === action.customerId &&
          c.workerId === action.workerId &&
          (action.jobId ? c.jobId === action.jobId : true)
      );
      if (existing) {
        const actorId = getActiveActorId(state);
        return {
          ...state,
          messages: state.messages.map((m) =>
            m.conversationId === existing.id && !m.readBy.includes(actorId)
              ? { ...m, readBy: [...m.readBy, actorId] }
              : m
          ),
          lastUpdatedAt: nowIso,
        };
      }

      const newConv: Conversation = {
        id: action.conversationId || createId('conv'),
        jobId: action.jobId,
        jobTitle: action.jobTitle ? sanitizeText(action.jobTitle, INPUT_LIMITS.TITLE_MAX) : undefined,
        customerId: action.customerId,
        workerId: action.workerId,
        participantIds: [action.customerId, action.workerId],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      return {
        ...state,
        conversations: [newConv, ...state.conversations],
        lastUpdatedAt: nowIso,
      };
    }

    case 'MARK_CONVERSATION_READ': {
      const actorId = getActiveActorId(state);
      if (!actorId) return state;
      const conv = state.conversations.find((c) => c.id === action.conversationId);
      if (!isConversationParticipant(conv, actorId)) return state;

      const hasUnread = state.messages.some(
        (m) =>
          m.conversationId === action.conversationId &&
          m.senderId !== actorId &&
          !m.readBy.includes(actorId)
      );
      if (!hasUnread) return state;

      return {
        ...state,
        messages: state.messages.map((m) =>
          m.conversationId === action.conversationId && !m.readBy.includes(actorId)
            ? { ...m, readBy: [...m.readBy, actorId] }
            : m
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'SEND_CHAT_MESSAGE': {
      if (state.activeRole === UserRole.Guest) return state;
      const actorId = getActiveActorId(state);
      const conv = state.conversations.find((c) => c.id === action.conversationId);
      if (!conv || !isConversationParticipant(conv, actorId) || conv.blockedBy) {
        return state;
      }

      const cleanInput = sanitizeText(action.text, INPUT_LIMITS.MESSAGE_MAX);
      const safety = inspectChatMessageSafety(cleanInput);
      if (safety.blocked) {
        return state;
      }

      const senderRole = state.activeRole === UserRole.Customer ? 'customer' : 'worker';
      const senderName = getActiveActorName(state);
      const receiverId = senderRole === 'customer' ? conv.workerId : conv.customerId;

      const msg: Message = {
        id: createId('msg'),
        conversationId: conv.id,
        jobId: conv.jobId,
        senderId: actorId,
        senderRole,
        receiverId,
        senderName,
        text: safety.safeDisplayText,
        readBy: [actorId],
        createdAt: nowIso,
      };

      const recipientAlert = createAlertItem({
        type: 'new_chat_message',
        targetRole: senderRole === 'customer' ? 'worker' : 'customer',
        workerId: senderRole === 'customer' ? conv.workerId : undefined,
        customerId: senderRole === 'worker' ? conv.customerId : undefined,
        conversationId: conv.id,
        jobId: conv.jobId,
        title: t('alert.newChatTitle', 'en', { name: senderName }),
        titleUr: t('alert.newChatTitle', 'ur', { name: senderName }),
        body: safety.safeDisplayText,
        bodyUr: safety.safeDisplayText,
        link: `/chat/${conv.id}`,
        createdAt: nowIso,
      });

      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === conv.id ? { ...c, updatedAt: nowIso } : c
        ),
        messages: [...state.messages, msg],
        notifications: [recipientAlert, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    case 'BLOCK_CONVERSATION': {
      const actorId = getActiveActorId(state);
      const conv = state.conversations.find((c) => c.id === action.conversationId);
      if (!conv || !isConversationParticipant(conv, actorId)) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === conv.id ? { ...c, blockedBy: actorId, updatedAt: nowIso } : c
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'MARK_ALERT_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.alertId ? { ...n, read: true } : n
        ),
        lastUpdatedAt: nowIso,
      };
    }

    case 'MARK_ALL_ALERTS_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) => {
          if (state.activeRole === UserRole.Worker) {
            if (n.targetRole === 'worker' && (!n.workerId || n.workerId === state.activeWorkerId)) {
              return { ...n, read: true };
            }
            return n;
          }
          if (state.activeRole === UserRole.Customer) {
            if (
              n.targetRole === 'customer' &&
              (!n.customerId || n.customerId === state.activeCustomerId)
            ) {
              return { ...n, read: true };
            }
            return n;
          }
          return n;
        }),
        lastUpdatedAt: nowIso,
      };
    }

    case 'RUN_DEMO_SCENARIO': {
      const isA = action.scenario === 'A';
      const scenarioJob: Job = isA
        ? {
            id: createId('job_scnA'),
            customerId: 'cust_demo',
            categoryId: 'cat_plumbing',
            requiredSkill: 'Pipe leak fix',
            title: 'Bathroom sink pipe & water tap leak fix (Scenario A)',
            titleUr: 'باتھ روم سنک پائپ اور نلکی کی لیکج مرمت (منظرنامہ A)',
            description:
              'Need a plumber in Lalarukh Wah Cantt today to fix a dripping sink pipe and mixer tap.',
            descriptionUr:
              'لالہ رخ واہ کینٹ میں آج سنک پائپ اور مکسر نلکی کی لیکج ٹھیک کرنے کے لیے پلمبر چاہیے۔',
            city: 'Wah Cantt',
            area: 'Lalarukh',
            budget: 2200,
            yourPriceMinPkr: 2200,
            yourPriceMaxPkr: 2200,
            materialsIncluded: false,
            workforceType: 'one',
            workersNeeded: 1,
            urgency: 'Today',
            howSoon: 'Today',
            photos: [],
            status: 'Published',
            createdAt: nowIso,
            updatedAt: nowIso,
          }
        : {
            id: createId('job_scnB'),
            customerId: 'cust_demo',
            categoryId: 'cat_renovation',
            requiredSkill: 'Room extension',
            title: 'Room extension & wall plaster for 4 workers (Scenario B)',
            titleUr: '4 کاریگروں کے لیے کمرہ بڑھانے اور پلستر کا کام (منظرنامہ B)',
            description:
              'Need a contractor team of 4 workers in Satellite Town Rawalpindi for room extension and plaster.',
            descriptionUr:
              'سیٹلائٹ ٹاؤن راولپنڈی میں کمرہ بڑھانے اور پلستر کے لیے 4 کاریگروں کی ٹھیکیدار ٹیم چاہیے۔',
            city: 'Rawalpindi',
            area: 'Satellite Town',
            budget: 85000,
            yourPriceMinPkr: 85000,
            yourPriceMaxPkr: 85000,
            materialsIncluded: false,
            workforceType: 'contractor',
            workersNeeded: 4,
            urgency: 'This week',
            howSoon: 'This week',
            photos: [],
            status: 'Published',
            createdAt: nowIso,
            updatedAt: nowIso,
          };

      const matched = getMatchingWorkersForJob(scenarioJob, state.workers, state.categories);
      const cat = state.categories.find((c) => c.id === scenarioJob.categoryId);
      const deliveries: RequestDelivery[] = matched.map((w) => {
        const km = getApproxDistanceKm(scenarioJob, w);
        return {
          id: createId('del'),
          jobId: scenarioJob.id,
          workerId: w.id,
          customerId: scenarioJob.customerId,
          categoryId: scenarioJob.categoryId,
          city: scenarioJob.city,
          area: scenarioJob.area,
          matchedSkill: cat?.nameEn || scenarioJob.requiredSkill,
          distanceKmLabel: `about ${km} km`,
          createdAt: nowIso,
        };
      });

      const alerts: Alert[] = matched.map((w) =>
        createAlertItem({
          type: 'new_job_near_you',
          targetRole: 'worker',
          workerId: w.id,
          jobId: scenarioJob.id,
          title: t('alert.newJobTitle', 'en', {
            service: cat?.nameEn || 'Work',
            area: scenarioJob.area,
          }),
          titleUr: t('alert.newJobTitle', 'ur', {
            service: cat?.nameUr || 'کام',
            area: scenarioJob.area,
          }),
          body: t('alert.newJobBody', 'en', {
            title: scenarioJob.title,
            city: scenarioJob.city,
            price: scenarioJob.budget ? formatPkr(scenarioJob.budget, 'en') : t('common.openPrice', 'en'),
          }),
          bodyUr: t('alert.newJobBody', 'ur', {
            title: scenarioJob.titleUr || scenarioJob.title,
            city: t(`city.${scenarioJob.city}` as never, 'ur'),
            price: scenarioJob.budget ? formatPkr(scenarioJob.budget, 'ur') : t('common.openPrice', 'ur'),
          }),
          link: `/worker/jobs/${scenarioJob.id}`,
          createdAt: nowIso,
        })
      );

      return {
        ...state,
        activeRole: UserRole.Worker,
        activeWorkerId: isA ? 'wrk_ali_raza' : 'wrk_hassan_team',
        activeWorkerTypePreference: isA ? 'worker' : 'contractor',
        jobs: [scenarioJob, ...state.jobs],
        requestDeliveries: [...deliveries, ...state.requestDeliveries],
        notifications: [...alerts, ...state.notifications],
        lastUpdatedAt: nowIso,
      };
    }

    default:
      return state;
  }
}
