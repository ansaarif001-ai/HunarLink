import { Location, PakistaniCity, SampleArea } from '../types';

export const SAMPLE_CITIES: PakistaniCity[] = [
  'Wah Cantt',
  'Rawalpindi',
  'Islamabad',
  'Taxila',
];

export const SAMPLE_AREAS: SampleArea[] = [
  // Wah Cantt (5 areas)
  {
    id: 'area_wah_lalarukh',
    city: 'Wah Cantt',
    name: 'Lalarukh',
    nameUr: 'لالہ رخ',
    approxLat: 33.7634,
    approxLng: 72.7512,
  },
  {
    id: 'area_wah_model_town',
    city: 'Wah Cantt',
    name: 'Model Town',
    nameUr: 'ماڈل ٹاؤن',
    approxLat: 33.758,
    approxLng: 72.742,
  },
  {
    id: 'area_wah_the_mall',
    city: 'Wah Cantt',
    name: 'The Mall',
    nameUr: 'دی مال',
    approxLat: 33.7675,
    approxLng: 72.7615,
  },
  {
    id: 'area_wah_officers_colony',
    city: 'Wah Cantt',
    name: 'Officers Colony',
    nameUr: 'آفیسرز کالونی',
    approxLat: 33.771,
    approxLng: 72.758,
  },
  {
    id: 'area_wah_basti',
    city: 'Wah Cantt',
    name: 'Basti',
    nameUr: 'بستی',
    approxLat: 33.755,
    approxLng: 72.771,
  },

  // Rawalpindi (5 areas)
  {
    id: 'area_rwp_chaklala3',
    city: 'Rawalpindi',
    name: 'Chaklala Scheme 3',
    nameUr: 'چکلالہ سکیم 3',
    approxLat: 33.5889,
    approxLng: 73.0815,
  },
  {
    id: 'area_rwp_satellite',
    city: 'Rawalpindi',
    name: 'Satellite Town',
    nameUr: 'سیٹلائٹ ٹاؤن',
    approxLat: 33.6366,
    approxLng: 73.0695,
  },
  {
    id: 'area_rwp_bahria4',
    city: 'Rawalpindi',
    name: 'Bahria Town Phase 4',
    nameUr: 'بحریہ ٹاؤن فیز 4',
    approxLat: 33.5416,
    approxLng: 73.1225,
  },
  {
    id: 'area_rwp_saddar',
    city: 'Rawalpindi',
    name: 'Saddar',
    nameUr: 'صدر',
    approxLat: 33.5951,
    approxLng: 73.0543,
  },
  {
    id: 'area_rwp_westridge',
    city: 'Rawalpindi',
    name: 'Westridge',
    nameUr: 'ویسٹ رج',
    approxLat: 33.6062,
    approxLng: 73.0218,
  },

  // Islamabad (5 areas)
  {
    id: 'area_isb_f10',
    city: 'Islamabad',
    name: 'F-10',
    nameUr: 'ایف 10',
    approxLat: 33.6946,
    approxLng: 73.0124,
  },
  {
    id: 'area_isb_g11',
    city: 'Islamabad',
    name: 'G-11',
    nameUr: 'جی 11',
    approxLat: 33.6713,
    approxLng: 72.9964,
  },
  {
    id: 'area_isb_i8',
    city: 'Islamabad',
    name: 'I-8',
    nameUr: 'آئی 8',
    approxLat: 33.6665,
    approxLng: 73.0748,
  },
  {
    id: 'area_isb_f11',
    city: 'Islamabad',
    name: 'F-11',
    nameUr: 'ایف 11',
    approxLat: 33.6844,
    approxLng: 72.9896,
  },
  {
    id: 'area_isb_g13',
    city: 'Islamabad',
    name: 'G-13',
    nameUr: 'جی 13',
    approxLat: 33.6496,
    approxLng: 72.9614,
  },

  // Taxila (5 areas)
  {
    id: 'area_txl_cantt',
    city: 'Taxila',
    name: 'Taxila Cantt',
    nameUr: 'ٹیکسلا کینٹ',
    approxLat: 33.7463,
    approxLng: 72.7995,
  },
  {
    id: 'area_txl_faisal_hills',
    city: 'Taxila',
    name: 'Faisal Hills',
    nameUr: 'فیصل ہلز',
    approxLat: 33.7294,
    approxLng: 72.8152,
  },
  {
    id: 'area_txl_hit',
    city: 'Taxila',
    name: 'HIT Colony',
    nameUr: 'ایچ آئی ٹی کالونی',
    approxLat: 33.7368,
    approxLng: 72.8012,
  },
  {
    id: 'area_txl_museum',
    city: 'Taxila',
    name: 'Museum Road',
    nameUr: 'میوزیم روڈ',
    approxLat: 33.7458,
    approxLng: 72.8205,
  },
  {
    id: 'area_txl_bhallar',
    city: 'Taxila',
    name: 'Bhallar Top',
    nameUr: 'بھلار ٹاپ',
    approxLat: 33.758,
    approxLng: 72.835,
  },
];

/**
 * Match a GPS position to the nearest sample area in memory.
 * Returns ONLY { city, area } — never stores or returns exact coordinates.
 */
export function findNearestSampleArea(lat: number, lng: number): Location {
  let closest = SAMPLE_AREAS[0];
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const area of SAMPLE_AREAS) {
    const dLat = area.approxLat - lat;
    const dLng = area.approxLng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      closest = area;
    }
  }

  return {
    city: closest.city,
    area: closest.name,
  };
}

export function searchSampleAreas(query: string, city: PakistaniCity | 'ALL' = 'ALL'): SampleArea[] {
  const q = query.trim().toLowerCase();
  return SAMPLE_AREAS.filter((item) => {
    if (city !== 'ALL' && item.city !== city) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.nameUr.includes(q)
    );
  });
}

export function getAreasForCity(city: PakistaniCity): SampleArea[] {
  return SAMPLE_AREAS.filter((a) => a.city === city);
}
