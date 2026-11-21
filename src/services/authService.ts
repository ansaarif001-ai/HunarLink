
import { PakistaniCity, UserRole } from '../types';
import { createId } from '../utils/id';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';
import { supabase } from '../lib/supabase';

export const ACCOUNTS_STORAGE_KEY = 'hunarlink_accounts_v1';
export const SESSION_STORAGE_KEY = 'hunarlink_session_v1';
export const GUESTS_STORAGE_KEY = 'hunarlink_guests_v1';

export type AuthRole = 'customer' | 'worker';
export type SessionType = 'registered' | 'guest';

export interface LocalAccount {
  id: string;
  role: AuthRole;
  fullName: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  categoryId?: string;
  city?: PakistaniCity;
  area?: string;
}

export interface GuestProfile {
  id: string;
  role: AuthRole;
  fullName: string;
  isGuest: true;
  createdAt: string;
  categoryId?: string;
  city?: PakistaniCity;
  area?: string;
}

export interface AuthSession {
  userId: string;
  role: AuthRole;
  type: SessionType;
  loggedInAt: string;
}

export interface SignUpInput {
  role: AuthRole;
  fullName: string;
  email: string;
  password: string;
  categoryId?: string;
  city?: PakistaniCity;
  area?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface StartGuestInput {
  role: AuthRole;
  fullName?: string;
  categoryId?: string;
  city?: PakistaniCity;
  area?: string;
}

export interface AuthResult<T = AuthSession> {
  ok: boolean;
  data?: T;
  errorCode?:
    | 'INVALID_NAME'
    | 'INVALID_EMAIL'
    | 'EMAIL_EXISTS'
    | 'WEAK_PASSWORD'
    | 'INVALID_CREDENTIALS'
    | 'RATE_LIMITED'
    | 'STORAGE_ERROR'
    | 'NOT_AVAILABLE';
  retryAfterSeconds?: number;
}

export interface PasswordChecks {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
  strength: 'weak' | 'good' | 'strong';
}

export function evaluatePassword(password: string): PasswordChecks {
  const minLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialOrMixed =
    (/[^A-Za-z0-9]/.test(password) ||
      (/[a-z]/.test(password) && /[A-Z]/.test(password))) &&
    password.length >= 10;

  const isValid = minLength && hasLetter && hasNumber;

  let strength: 'weak' | 'good' | 'strong' = 'weak';

  if (isValid && hasSpecialOrMixed) {
    strength = 'strong';
  } else if (isValid) {
    strength = 'good';
  }

  return { minLength, hasLetter, hasNumber, isValid, strength };
}

export function isValidEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export interface AuthService {
  signUp(input: SignUpInput): Promise<AuthResult<{ session: AuthSession; account: LocalAccount }>>;
  signIn(input: SignInInput): Promise<AuthResult<{ session: AuthSession; account: LocalAccount }>>;
  signOut(): void;
  getSession(): AuthSession | null;
  startGuest(input: StartGuestInput): AuthResult<{ session: AuthSession; guest: GuestProfile }>;
  startSampleAccount(userId: string, role: AuthRole): AuthResult<{ session: AuthSession }>;
  resetPassword(email: string): Promise<AuthResult<null>>;
  getAccountById(userId: string): LocalAccount | undefined;
  getGuestById(userId: string): GuestProfile | undefined;
  isEmailTaken(email: string): boolean;
  clearGuests(): void;
  subscribeToSessionSync(onSessionChange: (session: AuthSession | null) => void): () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function readArray<T>(key: string): T[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, items: T[]): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function readAccounts(): LocalAccount[] {
  return readArray<LocalAccount>(ACCOUNTS_STORAGE_KEY);
}

function writeAccounts(accounts: LocalAccount[]): boolean {
  return writeArray(ACCOUNTS_STORAGE_KEY, accounts);
}

function readGuests(): GuestProfile[] {
  return readArray<GuestProfile>(GUESTS_STORAGE_KEY);
}

function writeGuests(guests: GuestProfile[]): boolean {
  return writeArray(GUESTS_STORAGE_KEY, guests);
}

function writeSession(session: AuthSession): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

function isValidSession(item: unknown): item is AuthSession {
  if (!item || typeof item !== 'object') return false;

  const s = item as Record<string, unknown>;

  return (
    typeof s.userId === 'string' &&
    s.userId.length > 0 &&
    (s.role === 'customer' || s.role === 'worker') &&
    (s.type === 'registered' || s.type === 'guest') &&
    typeof s.loggedInAt === 'string'
  );
}

function createLocalAccount(
  id: string,
  role: AuthRole,
  fullName: string,
  email: string,
  createdAt: string,
  extra?: Pick<SignUpInput, 'categoryId' | 'city' | 'area'>
): LocalAccount {
  return {
    id,
    role,
    fullName,
    email,
    passwordHash: '',
    salt: '',
    createdAt,
    categoryId: role === 'worker' ? extra?.categoryId : undefined,
    city: extra?.city,
    area: extra?.area,
  };
}

class LocalAuthService implements AuthService {
  private failedAttempts = 0;
  private lockedUntilMs = 0;

  isEmailTaken(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return readAccounts().some((account) => account.email === normalized);
  }

  getAccountById(userId: string): LocalAccount | undefined {
    return readAccounts().find((account) => account.id === userId);
  }

  getGuestById(userId: string): GuestProfile | undefined {
    return readGuests().find((guest) => guest.id === userId);
  }

  getSession(): AuthSession | null {
    const storage = getStorage();
    if (!storage) return null;

    try {
      const raw = storage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      return isValidSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async signUp(
    input: SignUpInput
  ): Promise<AuthResult<{ session: AuthSession; account: LocalAccount }>> {
    const cleanName = sanitizeText(input.fullName, INPUT_LIMITS.NAME_MAX);

    if (cleanName.length < 2 || cleanName.length > 60) {
      return { ok: false, errorCode: 'INVALID_NAME' };
    }

    const cleanEmail = input.email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return { ok: false, errorCode: 'INVALID_EMAIL' };
    }

    if (!evaluatePassword(input.password).isValid) {
      return { ok: false, errorCode: 'WEAK_PASSWORD' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: input.password,
      options: {
        data: {
          full_name: cleanName,
          role: input.role,
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error.message);

      if (
        error.message.toLowerCase().includes('already') ||
        error.message.toLowerCase().includes('registered')
      ) {
        return { ok: false, errorCode: 'EMAIL_EXISTS' };
      }

      return { ok: false, errorCode: 'NOT_AVAILABLE' };
    }

    if (!data.user || !data.session) {
      return { ok: false, errorCode: 'NOT_AVAILABLE' };
    }

    const now = new Date().toISOString();

    const account = createLocalAccount(
      data.user.id,
      input.role,
      cleanName,
      cleanEmail,
      data.user.created_at || now,
      input
    );

    const accounts = readAccounts().filter((a) => a.id !== account.id);

    if (!writeAccounts([account, ...accounts])) {
      await supabase.auth.signOut();
      return { ok: false, errorCode: 'STORAGE_ERROR' };
    }

    const session: AuthSession = {
      userId: data.user.id,
      role: input.role,
      type: 'registered',
      loggedInAt: now,
    };

    writeSession(session);

    return { ok: true, data: { session, account } };
  }

  async signIn(
    input: SignInInput
  ): Promise<AuthResult<{ session: AuthSession; account: LocalAccount }>> {
    const now = Date.now();

    if (this.lockedUntilMs > now) {
      return {
        ok: false,
        errorCode: 'RATE_LIMITED',
        retryAfterSeconds: Math.ceil((this.lockedUntilMs - now) / 1000),
      };
    }

    const cleanEmail = input.email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return { ok: false, errorCode: 'INVALID_EMAIL' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: input.password,
    });

    if (error || !data.user || !data.session) {
      return this.recordFailure();
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError.message);
    }

    const metadata = data.user.user_metadata || {};

    const role: AuthRole =
      profile?.role === 'worker' || metadata.role === 'worker'
        ? 'worker'
        : 'customer';

    const fullName =
      profile?.full_name ||
      metadata.full_name ||
      cleanEmail.split('@')[0];

    const nowIso = new Date().toISOString();

    const account = createLocalAccount(
      data.user.id,
      role,
      fullName,
      cleanEmail,
      data.user.created_at || nowIso
    );

    const accounts = readAccounts().filter((a) => a.id !== account.id);

    if (!writeAccounts([account, ...accounts])) {
      await supabase.auth.signOut();
      return { ok: false, errorCode: 'STORAGE_ERROR' };
    }

    const session: AuthSession = {
      userId: data.user.id,
      role,
      type: 'registered',
      loggedInAt: nowIso,
    };

    writeSession(session);

    this.failedAttempts = 0;
    this.lockedUntilMs = 0;

    return { ok: true, data: { session, account } };
  }

  private recordFailure(): AuthResult<never> {
    this.failedAttempts += 1;

    if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      this.lockedUntilMs = Date.now() + LOCKOUT_MS;
      this.failedAttempts = 0;

      return {
        ok: false,
        errorCode: 'RATE_LIMITED',
        retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
      };
    }

    return { ok: false, errorCode: 'INVALID_CREDENTIALS' };
  }

  startGuest(
    input: StartGuestInput
  ): AuthResult<{ session: AuthSession; guest: GuestProfile }> {
    const rawName = sanitizeText(input.fullName || '', INPUT_LIMITS.NAME_MAX);
    const displayName = rawName || 'Guest';
    const nowIso = new Date().toISOString();

    const guests = readGuests();

    const existing = guests.find(
      (g) =>
        g.role === input.role &&
        g.fullName.toLowerCase() === displayName.toLowerCase()
    );

    let guest: GuestProfile;

    if (existing) {
      guest = {
        ...existing,
        fullName: displayName,
        categoryId:
          input.role === 'worker'
            ? input.categoryId || existing.categoryId
            : undefined,
        city: input.city || existing.city,
        area: input.area || existing.area,
      };

      writeGuests(guests.map((g) => (g.id === existing.id ? guest : g)));
    } else {
      guest = {
        id: createId(input.role === 'worker' ? 'wrk_guest' : 'cust_guest'),
        role: input.role,
        fullName: displayName,
        isGuest: true,
        createdAt: nowIso,
        categoryId: input.role === 'worker' ? input.categoryId : undefined,
        city: input.city,
        area: input.area,
      };

      writeGuests([guest, ...guests]);
    }

    const session: AuthSession = {
      userId: guest.id,
      role: guest.role,
      type: 'guest',
      loggedInAt: nowIso,
    };

    writeSession(session);

    return { ok: true, data: { session, guest } };
  }

  startSampleAccount(
    userId: string,
    role: AuthRole
  ): AuthResult<{ session: AuthSession }> {
    const session: AuthSession = {
      userId,
      role,
      type: 'guest',
      loggedInAt: new Date().toISOString(),
    };

    writeSession(session);

    return { ok: true, data: { session } };
  }

  signOut(): void {
    const storage = getStorage();

    if (storage) {
      try {
        storage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore local storage errors.
      }
    }

    void supabase.auth.signOut().catch((error) => {
      console.error('Supabase signout error:', error);
    });
  }

  async resetPassword(email: string): Promise<AuthResult<null>> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return { ok: false, errorCode: 'INVALID_EMAIL' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    if (error) {
      console.error('Password reset error:', error.message);
      return { ok: false, errorCode: 'NOT_AVAILABLE' };
    }

    return { ok: true, data: null };
  }

  clearGuests(): void {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.removeItem(GUESTS_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }

  subscribeToSessionSync(
    onSessionChange: (session: AuthSession | null) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const handler = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return;
      onSessionChange(this.getSession());
    };

    window.addEventListener('storage', handler);

    return () => window.removeEventListener('storage', handler);
  }
}

export const authService: AuthService = new LocalAuthService();

export function authRoleToUserRole(role: AuthRole): UserRole {
  return role === 'worker' ? UserRole.Worker : UserRole.Customer;
}
