export enum UserRole {
  Guest = 'guest',
  Customer = 'customer',
  Worker = 'worker',
}

export type LanguageCode = 'en' | 'ur';

export type DemoAccountKey = 'customer' | 'worker' | 'contractor';

export type WorkerType = 'One person' | 'Contractor' | 'Team';

export type PakistaniCity = 'Wah Cantt' | 'Rawalpindi' | 'Islamabad' | 'Taxila';

export type WorkProgress = 'Started' | 'Half done' | 'Almost done' | 'Finished';

export interface Location {
  city: PakistaniCity;
  area: string;
}

export interface SampleArea {
  id: string;
  city: PakistaniCity;
  name: string;
  nameUr: string;
  approxLat: number;
  approxLng: number;
}

export interface Category {
  id: string;
  slug: string;
  order: number;
  nameEn: string;
  nameUr: string;
  subSkills: string[];
  accentBg: string;
  accentText: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  city: PakistaniCity;
  area: string;
  joinedAt: string;
}

export interface WorkPhoto {
  id: string;
  title: string;
  caption: string;
  categoryId: string;
  palette: [string, string];
  dataUrl?: string;
}

export interface PhotoMedia {
  id: string;
  dataUrl?: string;
  title: string;
  palette?: [string, string];
  categoryId?: string;
}

export interface PortfolioItem {
  id: string;
  workerId: string;
  categoryId: string;
  caption: string;
  captionUr?: string;
  photos: PhotoMedia[];
  createdAt: string;
}

export interface WorkUpdate {
  id: string;
  workerId: string;
  jobId?: string;
  photos: PhotoMedia[];
  note: string;
  noteUr?: string;
  progress: WorkProgress;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  targetType:
    | 'work_update'
    | 'review'
    | 'worker'
    | 'chat'
    | 'customer'
    | 'job'
    | 'other';
  targetId: string;
  workerId: string;
  reason: string;
  note: string;
  jobLink?: string;
  status?: 'Sent (demo)';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  message: string;
  status: 'Sent (demo)';
  createdAt: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  nameUr: string;
  headline: string;
  headlineUr: string;
  categoryId: string;
  skills: string[];
  city: PakistaniCity;
  area: string;
  serviceAreas: string[];
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  priceHintPkr: number;
  priceUnit: 'visit' | 'day' | 'job';
  workerType: WorkerType;
  teamSize: number;
  checkedDemo: boolean;
  freeToWorkNow: boolean;
  bio: string;
  bioUr?: string;
  languages: string[];
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  workPhotos: WorkPhoto[];
  joinedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  name: string;
  city: PakistaniCity;
  area: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  joinedAt: string;
}

export type JobStatus =
  | 'Published'
  | 'Offers Received'
  | 'Price Talk'
  | 'Worker Chosen'
  | 'Confirmed Job'
  | 'Work Started'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type WorkforceType = 'one' | 'several' | 'team' | 'contractor' | 'either';

export type JobUrgency = 'Today' | 'This week' | 'Flexible';

export interface Job {
  id: string;
  customerId: string;
  categoryId: string;
  requiredSkill: string;
  title: string;
  titleUr?: string;
  description: string;
  descriptionUr?: string;
  city: PakistaniCity;
  area: string;
  budget?: number;
  yourPriceMinPkr: number;
  yourPriceMaxPkr: number;
  materialsIncluded: boolean;
  workforceType: WorkforceType;
  workersNeeded: number;
  urgency: JobUrgency;
  howSoon: 'Today' | 'This week' | 'Anytime';
  preferredDate?: string;
  photos: PhotoMedia[];
  notes?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RequestDelivery {
  id: string;
  jobId: string;
  workerId: string;
  customerId: string;
  categoryId: string;
  city: PakistaniCity;
  area: string;
  matchedSkill: string;
  distanceKmLabel: string;
  createdAt: string;
}

export type OfferStatus =
  | 'pending'
  | 'price_talk'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired';

export interface Offer {
  id: string;
  jobId: string;
  workerId: string;
  workerType: WorkerType;
  workersCount: number;
  pricePkr: number;
  daysNeeded: number;
  note: string;
  status: OfferStatus;
  submittedAt: string;
  expiresAt: string;
  updatedAt: string;
}

export interface Negotiation {
  id: string;
  offerId: string;
  jobId: string;
  byRole: 'customer' | 'worker' | 'system';
  byName: string;
  action: 'sent_price' | 'your_price' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  pricePkr: number;
  workersCount: number;
  note: string;
  createdAt: string;
}

export type BookingStatus = 'Confirmed' | 'Started' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  jobId: string;
  offerId: string;
  customerId: string;
  workerId: string;
  jobTitle?: string;
  area?: string;
  city?: PakistaniCity;
  agreedPricePkr: number;
  ourFeePkr: number;
  workerGetsPkr: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Conversation {
  id: string;
  jobId?: string;
  jobTitle?: string;
  customerId: string;
  workerId: string;
  participantIds: string[];
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  jobId?: string;
  senderId: string;
  senderRole?: 'customer' | 'worker';
  receiverId?: string;
  senderName: string;
  text: string;
  readBy: string[];
  createdAt: string;
}

export type AlertType =
  | 'new_job_near_you'
  | 'request_expiring_soon'
  | 'request_expired'
  | 'new_price_received'
  | 'new_price_sent_to_you'
  | 'price_accepted'
  | 'price_said_no'
  | 'price_expired'
  | 'job_confirmed'
  | 'work_started'
  | 'work_in_progress'
  | 'work_done'
  | 'new_chat_message'
  | 'new_review'
  | 'review_reply';

export type AlertCategory = 'jobs' | 'prices' | 'chat' | 'reviews';

export interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
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
  read: boolean;
  createdAt: string;
}

export type Notification = Alert;

export interface ReviewReply {
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName?: string;
  areaName?: string;
  workerId: string;
  stars: number;
  rating: number;
  text: string;
  textUr?: string;
  comment: string;
  tags: string[];
  reply?: ReviewReply;
  isDemo?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  workerId: string;
  jobId?: string;
  jobTitle: string;
  jobValue: number;
  grossPkr: number;
  fee: number;
  ourFeePkr: number;
  net: number;
  netPkr: number;
  status: 'Pending' | 'Done (demo)';
  createdAt: string;
}

export interface AlertPreferences {
  jobs: boolean;
  prices: boolean;
  chat: boolean;
  reviews: boolean;
}

export type TextSize = 'normal' | 'large';

export interface AppState {
  schemaVersion: number;
  language: LanguageCode;
  textSize: TextSize;
  alertPreferences: AlertPreferences;
  activeRole: UserRole;
  activeWorkerTypePreference: 'worker' | 'contractor';
  activeCustomerId: string;
  activeWorkerId: string;
  selectedLocation: Location;
  categories: Category[];
  users: User[];
  workers: WorkerProfile[];
  customers: CustomerProfile[];
  jobs: Job[];
  requestDeliveries: RequestDelivery[];
  offers: Offer[];
  negotiations: Negotiation[];
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Alert[];
  reviews: Review[];
  transactions: Transaction[];
  workUpdates: WorkUpdate[];
  portfolioItems: PortfolioItem[];
  reports: ContentReport[];
  contactMessages: ContactMessage[];
  lastUpdatedAt: string;
}
