import { SAMPLE_AREAS } from '../data/locations';
import {
  getLocalizedAreaName,
  getLocalizedCategoryName,
  getLocalizedCityName,
  t,
} from '../i18n';
import { Category, Job, LanguageCode, WorkerProfile, WorkerType } from '../types';

export interface WorkerFilterOptions {
  query?: string;
  categoryId?: string;
  city?: string;
  area?: string;
  minRating?: number;
  freeNowOnly?: boolean;
  workerType?: WorkerType | 'ALL';
}

export type JobSortOption = 'newest' | 'highest_price' | 'closest_area';
export type JobBudgetFilter = 'ALL' | 'OPEN' | 'UNDER_5K' | '5K_TO_25K' | 'OVER_25K';
export type JobWorkersFilter = 'ALL' | 'ONE' | 'TWO_PLUS';

export interface JobFilterOptions {
  query?: string;
  categoryId?: string;
  area?: string;
  budgetRange?: JobBudgetFilter;
  workersFilter?: JobWorkersFilter;
  sortBy?: JobSortOption;
}

export interface MatchedJobResult {
  job: Job;
  workforceLabel: string;
  whySeeingReason: string;
  matchedSkillLabel: string;
  distanceLabel: string;
  isPrioritized: boolean;
  availabilityNote?: string;
}

const KEYWORD_CATEGORY_MAP: Array<{ categoryId: string; keywords: string[] }> = [
  {
    categoryId: 'cat_electrical',
    keywords: [
      'electrician',
      'electric',
      'fan',
      'fans',
      'wiring',
      'wire',
      'breaker',
      'db box',
      'switch',
      'socket',
      'ups',
      'inverter',
      'short circuit',
      'bulb',
      'light',
      'bijli',
    ],
  },
  {
    categoryId: 'cat_plumbing',
    keywords: [
      'plumber',
      'plumbing',
      'pipe',
      'pipes',
      'tap',
      'taps',
      'sink',
      'bathroom',
      'toilet',
      'leak',
      'leaking',
      'geyser',
      'water motor',
      'motor',
      'tank',
      'drain',
      'pprc',
      'shower',
      'mixer',
      'flush',
    ],
  },
  {
    categoryId: 'cat_ceiling',
    keywords: ['ceiling', 'false ceiling', 'pop', 'gypsum', 'pvc', 'cove'],
  },
  {
    categoryId: 'cat_painting',
    keywords: [
      'paint',
      'painter',
      'painting',
      'putty',
      'distemper',
      'weather shield',
      'polish',
      'emulsion',
      'color',
      'colour',
      'rang',
    ],
  },
  {
    categoryId: 'cat_carpentry',
    keywords: [
      'carpenter',
      'wood',
      'woodwork',
      'cabinet',
      'cabinets',
      'wardrobe',
      'door lock',
      'door',
      'hinge',
      'furniture',
      'cupboard',
      'drawer',
      'kitchen cabinet',
    ],
  },
  {
    categoryId: 'cat_tiles',
    keywords: ['tile', 'tiles', 'marble', 'granite', 'flooring', 'grout', 'counter'],
  },
  {
    categoryId: 'cat_welding',
    keywords: ['weld', 'welder', 'welding', 'gate', 'grill', 'railing', 'steel', 'iron', 'shed'],
  },
  {
    categoryId: 'cat_ac',
    keywords: [
      'ac',
      'air conditioner',
      'cooling',
      'gas refill',
      'split ac',
      'fridge',
      'refrigerator',
      'washing machine',
      'dispenser',
      'appliance',
    ],
  },
  {
    categoryId: 'cat_construction',
    keywords: [
      'mason',
      'mistri',
      'brick',
      'brickwork',
      'plaster',
      'grey structure',
      'lintel',
      'concrete',
      'slab',
      'construct',
      'building',
      'boundary wall',
    ],
  },
  {
    categoryId: 'cat_renovation',
    keywords: ['renovate', 'renovation', 'remodel', 'upgrade', 'extension', 'break wall'],
  },
  {
    categoryId: 'cat_labour',
    keywords: [
      'labour',
      'labor',
      'helper',
      'helpers',
      'mazdoor',
      'debris',
      'malba',
      'loading',
      'shifting',
      'digging',
      'mixing',
    ],
  },
  {
    categoryId: 'cat_cleaning',
    keywords: [
      'clean',
      'cleaning',
      'deep clean',
      'tank wash',
      'sofa',
      'carpet',
      'safai',
      'wash',
    ],
  },
  {
    categoryId: 'cat_glass',
    keywords: ['glass', 'window', 'windows', 'aluminium', 'aluminum', 'mirror', 'mesh', 'sliding'],
  },
  {
    categoryId: 'cat_gardening',
    keywords: ['garden', 'gardening', 'lawn', 'grass', 'tree', 'trimming', 'plant', 'mali'],
  },
  {
    categoryId: 'cat_solar',
    keywords: ['solar', 'panel', 'panels', 'cctv', 'camera', 'cameras', 'security', 'smart lock'],
  },
];

/**
 * Suggests the best matching category based on keywords in the customer's work text.
 */
export function suggestCategoryFromText(
  text: string,
  categories: Category[]
): { category: Category; matchedKeyword: string } | null {
  const lower = text.trim().toLowerCase();
  if (!lower) return null;

  for (const entry of KEYWORD_CATEGORY_MAP) {
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lower)) {
        const cat = categories.find((c) => c.id === entry.categoryId);
        if (cat) {
          return { category: cat, matchedKeyword: kw };
        }
      }
    }
  }
  return null;
}

/**
 * Returns the effective single PKR figure for sorting or filtering a job's budget.
 */
export function getJobEffectivePrice(job: Job): number {
  if (typeof job.budget === 'number' && job.budget > 0) {
    return job.budget;
  }
  if (job.yourPriceMaxPkr > 0) return job.yourPriceMaxPkr;
  if (job.yourPriceMinPkr > 0) return job.yourPriceMinPkr;
  return 0;
}

/**
 * Core Job <-> Worker matching rule (single source of truth):
 * A worker sees a job only if ALL are true:
 *   a) job category is the worker's main category OR one of their skills matches
 *   b) job area (or city-wide coverage) is in the worker's service areas
 *   c) job status is 'Published' (never Cancelled / Completed)
 *   d) worker has Free to work now ON (unless includeNotFree option is passed)
 */
export function doesJobMatchWorker(
  job: Job,
  worker: WorkerProfile,
  categories: Category[] = [],
  options?: { includeNotFree?: boolean }
): boolean {
  // c) Must be Published
  if (job.status !== 'Published') {
    return false;
  }

  // d) Must be free to work now unless explicitly browsing offline
  if (!options?.includeNotFree && !worker.freeToWorkNow) {
    return false;
  }

  // b) Job area (or city-wide coverage) must be in worker's service areas
  const normalizedServiceAreas = new Set(
    worker.serviceAreas.map((a) => a.trim().toLowerCase()).filter(Boolean)
  );
  const jobArea = job.area.trim().toLowerCase();
  const jobCity = job.city.trim().toLowerCase();
  const areaMatches =
    (Boolean(jobArea) && normalizedServiceAreas.has(jobArea)) ||
    (Boolean(jobCity) && normalizedServiceAreas.has(jobCity)) ||
    (jobArea === worker.area.trim().toLowerCase() && jobCity === worker.city.trim().toLowerCase());

  if (!areaMatches) {
    return false;
  }

  // a) Job category matches worker's main category OR one of worker's skills
  if (job.categoryId === worker.categoryId) {
    return true;
  }

  const normalizedSkills = worker.skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (normalizedSkills.length === 0) return false;

  if (
    job.requiredSkill &&
    normalizedSkills.some((sk) => sk === job.requiredSkill.trim().toLowerCase())
  ) {
    return true;
  }

  const jobCat = categories.find((c) => c.id === job.categoryId);
  if (jobCat) {
    const catSkills = jobCat.subSkills.map((s) => s.trim().toLowerCase());
    if (normalizedSkills.some((sk) => catSkills.includes(sk))) {
      return true;
    }
    const catNameLower = jobCat.nameEn.toLowerCase();
    if (normalizedSkills.some((sk) => catNameLower.includes(sk))) {
      return true;
    }
  }

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  return normalizedSkills.some((sk) => sk.length >= 3 && jobText.includes(sk));
}

/**
 * Returns every matching worker for a newly posted job (used for RequestDeliveries & Alerts).
 */
export function getMatchingWorkersForJob(
  job: Job,
  workers: WorkerProfile[],
  categories: Category[] = []
): WorkerProfile[] {
  return workers.filter((worker) => doesJobMatchWorker(job, worker, categories));
}

export function getApproxDistanceKm(
  job: Pick<Job, 'area' | 'city'>,
  worker: Pick<WorkerProfile, 'area' | 'city'>
): number {
  const jArea = job.area.trim().toLowerCase();
  const wArea = worker.area.trim().toLowerCase();
  if (jArea && jArea === wArea) return 2;
  if (job.city === worker.city) return 4;
  return 12;
}

export function getJobMatchReason(
  job: Job,
  worker: WorkerProfile,
  categories: Category[] = [],
  lang: LanguageCode = 'en'
): {
  skillLabel: string;
  areaLabel: string;
  distanceLabel: string;
  summary: string;
} {
  const jobCat = categories.find((c) => c.id === job.categoryId);
  const skillLabel = jobCat
    ? getLocalizedCategoryName(jobCat, lang)
    : job.requiredSkill || (lang === 'ur' ? 'متعلقہ کام' : 'Skilled work');

  const localArea = getLocalizedAreaName(job.area, SAMPLE_AREAS, lang);
  const localCity = getLocalizedCityName(job.city, lang);
  const areaLabel = lang === 'ur' ? `${localArea}، ${localCity}` : `${localArea}, ${localCity}`;
  const km = getApproxDistanceKm(job, worker);
  const distanceLabel = t('common.aboutKm', lang, { n: km });

  return {
    skillLabel,
    areaLabel,
    distanceLabel,
    summary: t('workerJobs.whySeeingText', lang, {
      skill: skillLabel,
      area: areaLabel,
      distance: distanceLabel,
    }),
  };
}

/**
 * Workforce label & priority rule:
 * - Individuals see all jobs ("You can do this job" or multi-worker note).
 * - Teams & Contractors see jobs needing 2+ workers first, with team count label.
 */
export function getWorkforceMatchInfo(
  job: Job,
  worker: WorkerProfile,
  lang: LanguageCode = 'en'
): { label: string; isPrioritized: boolean } {
  if (worker.workerType === 'Team' || worker.workerType === 'Contractor') {
    if (job.workersNeeded >= 2) {
      return {
        label: t('workerJobs.workforceTeamMatch', lang, {
          needed: job.workersNeeded,
          team: worker.teamSize,
        }),
        isPrioritized: true,
      };
    }
    return {
      label: t('workerJobs.workforceTeamAny', lang, { team: worker.teamSize }),
      isPrioritized: false,
    };
  }

  if (job.workersNeeded >= 2) {
    return {
      label: t('workerJobs.workforceOneMulti', lang, { needed: job.workersNeeded }),
      isPrioritized: false,
    };
  }

  return {
    label: t('workerJobs.workforceOne', lang),
    isPrioritized: true,
  };
}

/**
 * Returns matching jobs for a worker, including availability note when Free to work now is OFF,
 * workforce match labels, why-am-i-seeing-this reason, and optional search/filters/sorting.
 */
export function getMatchingJobsWithDetails(
  jobs: Job[],
  worker: WorkerProfile | undefined,
  categories: Category[] = [],
  filters: JobFilterOptions = {},
  lang: LanguageCode = 'en'
): MatchedJobResult[] {
  if (!worker) return [];

  const q = (filters.query || '').trim().toLowerCase();
  const areaFilter = (filters.area || '').trim().toLowerCase();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const matched = jobs
    .filter((job) => doesJobMatchWorker(job, worker, categories, { includeNotFree: true }))
    .filter((job) => {
      if (filters.categoryId && filters.categoryId !== 'ALL' && job.categoryId !== filters.categoryId) {
        return false;
      }
      if (areaFilter && areaFilter !== 'all' && job.area.trim().toLowerCase() !== areaFilter) {
        return false;
      }

      const price = getJobEffectivePrice(job);
      if (filters.budgetRange === 'OPEN' && price > 0) return false;
      if (filters.budgetRange === 'UNDER_5K' && (price <= 0 || price >= 5000)) return false;
      if (filters.budgetRange === '5K_TO_25K' && (price < 5000 || price > 25000)) return false;
      if (filters.budgetRange === 'OVER_25K' && price <= 25000) return false;

      if (filters.workersFilter === 'ONE' && job.workersNeeded !== 1) return false;
      if (filters.workersFilter === 'TWO_PLUS' && job.workersNeeded < 2) return false;

      if (q) {
        const cat = catMap.get(job.categoryId);
        const haystack = [
          job.title,
          job.titleUr || '',
          job.description,
          job.descriptionUr || '',
          job.requiredSkill,
          job.area,
          job.city,
          cat?.nameEn || '',
          cat?.nameUr || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .map((job) => {
      const wf = getWorkforceMatchInfo(job, worker, lang);
      const reason = getJobMatchReason(job, worker, categories, lang);
      return {
        job,
        workforceLabel: wf.label,
        whySeeingReason: reason.summary,
        matchedSkillLabel: reason.skillLabel,
        distanceLabel: reason.distanceLabel,
        isPrioritized: wf.isPrioritized,
        availabilityNote: worker.freeToWorkNow ? undefined : t('workerHome.freeNo', lang),
      };
    });

  const sortBy = filters.sortBy || 'newest';
  const isTeamOrContractor =
    worker.workerType === 'Team' || worker.workerType === 'Contractor';
  const areaOrder = worker.serviceAreas.map((a) => a.trim().toLowerCase());
  const homeAreaLower = worker.area.trim().toLowerCase();

  matched.sort((a, b) => {
    if (sortBy === 'highest_price') {
      const diff = getJobEffectivePrice(b.job) - getJobEffectivePrice(a.job);
      if (diff !== 0) return diff;
    } else if (sortBy === 'closest_area') {
      const aArea = a.job.area.trim().toLowerCase();
      const bArea = b.job.area.trim().toLowerCase();
      const aRank = aArea === homeAreaLower ? -1 : areaOrder.indexOf(aArea);
      const bRank = bArea === homeAreaLower ? -1 : areaOrder.indexOf(bArea);
      if (aRank !== bRank) return aRank - bRank;
    } else if (isTeamOrContractor && a.isPrioritized !== b.isPrioritized) {
      return a.isPrioritized ? -1 : 1;
    }
    return Date.parse(b.job.createdAt) - Date.parse(a.job.createdAt);
  });

  return matched;
}

export function getMatchingJobsForWorker(
  jobs: Job[],
  worker: WorkerProfile | undefined,
  categories: Category[] = []
): Job[] {
  return getMatchingJobsWithDetails(jobs, worker, categories).map((r) => r.job);
}

/**
 * Customer Find Nearby Workers rule: uses the same skill/category + area matching logic.
 */
export function getMatchingWorkersForCustomer(
  workers: WorkerProfile[],
  categories: Category[],
  filters: WorkerFilterOptions
): WorkerProfile[] {
  const q = (filters.query || '').trim().toLowerCase();
  const areaFilter = (filters.area || '').trim().toLowerCase();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const selectedCat = filters.categoryId ? categoryMap.get(filters.categoryId) : undefined;
  const selectedCatSkills = selectedCat
    ? selectedCat.subSkills.map((s) => s.trim().toLowerCase())
    : [];

  return workers.filter((worker) => {
    if (filters.categoryId) {
      const mainMatches = worker.categoryId === filters.categoryId;
      const skillMatches = worker.skills.some((sk) =>
        selectedCatSkills.includes(sk.trim().toLowerCase())
      );
      if (!mainMatches && !skillMatches) {
        return false;
      }
    }
    if (filters.city && filters.city !== 'ALL' && worker.city !== filters.city) {
      return false;
    }
    if (areaFilter && areaFilter !== 'all') {
      const matchesArea =
        worker.area.toLowerCase() === areaFilter ||
        worker.serviceAreas.some((sa) => sa.toLowerCase() === areaFilter);
      if (!matchesArea) return false;
    }
    if (
      filters.workerType &&
      filters.workerType !== 'ALL' &&
      worker.workerType !== filters.workerType
    ) {
      return false;
    }
    if (filters.minRating && worker.rating < filters.minRating) {
      return false;
    }
    if (filters.freeNowOnly && !worker.freeToWorkNow) {
      return false;
    }
    if (q) {
      const cat = categoryMap.get(worker.categoryId);
      const haystack = [
        worker.name,
        worker.nameUr,
        worker.headline,
        worker.city,
        worker.area,
        ...worker.serviceAreas,
        worker.workerType,
        ...worker.skills,
        cat?.nameEn || '',
        cat?.nameUr || '',
        ...(cat?.subSkills || []),
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function filterWorkers(
  workers: WorkerProfile[],
  categories: Category[],
  filters: WorkerFilterOptions
): WorkerProfile[] {
  return getMatchingWorkersForCustomer(workers, categories, filters);
}
