import { PakistaniCity, UserRole } from '../types';
import { createId } from '../utils/id';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

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
    (/[^A-Za-z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) &&
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
  startSampleAccount(
    userId: string,
    role: AuthRole
  ): AuthResult<{ session: AuthSession }>;
  resetPassword(email: string): Promise<AuthResult<null>>;
  getAccountById(userId: string): LocalAccount | undefined;
  getGuestById(userId: string): GuestProfile | undefined;
  isEmailTaken(email: string): boolean;
  clearGuests(): void;
  subscribeToSessionSync(onSessionChange: (session: AuthSession | null) => void): () => void;
}

const PBKDF2_ITERATIONS = 100_000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function generateSaltHex(): string {
  const saltBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(saltBytes);
  return bytesToHex(saltBytes);
}

async function hashPasswordPbkdf2(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const saltBytes = hexToBytes(saltHex);
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

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

function isValidAccount(item: unknown): item is LocalAccount {
  if (!item || typeof item !== 'object') return false;
  const a = item as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    (a.role === 'customer' || a.role === 'worker') &&
    typeof a.fullName === 'string' &&
    typeof a.email === 'string' &&
    typeof a.passwordHash === 'string' &&
    typeof a.salt === 'string' &&
    typeof a.createdAt === 'string'
  );
}

function isValidGuest(item: unknown): item is GuestProfile {
  if (!item || typeof item !== 'object') return false;
  const g = item as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    (g.role === 'customer' || g.role === 'worker') &&
    typeof g.fullName === 'string' &&
    g.isGuest === true &&
    typeof g.createdAt === 'string'
  );
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

function readAccounts(): LocalAccount[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAccount);
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    return true;
  } catch {
    return false;
  }
}

function readGuests(): GuestProfile[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(GUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidGuest);
  } catch {
    return [];
  }
}

function writeGuests(guests: GuestProfile[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
    return true;
  } catch {
    return false;
  }
}

function writeSession(session: AuthSession): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    // Session stores ONLY userId, role, type, loggedInAt
    const cleanSession: AuthSession = {
      userId: session.userId,
      role: session.role,
      type: session.type,
      loggedInAt: session.loggedInAt,
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cleanSession));
    return true;
  } catch {
    return false;
  }
}

class LocalAuthService implements AuthService {
  private failedAttempts = 0;
  private lockedUntilMs = 0;

  isEmailTaken(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return readAccounts().some((a) => a.email === normalized);
  }

  getAccountById(userId: string): LocalAccount | undefined {
    return readAccounts().find((a) => a.id === userId);
  }

  getGuestById(userId: string): GuestProfile | undefined {
    return readGuests().find((g) => g.id === userId);
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

    const pwCheck = evaluatePassword(input.password);
    if (!pwCheck.isValid) {
      return { ok: false, errorCode: 'WEAK_PASSWORD' };
    }

    const accounts = readAccounts();
    if (accounts.some((a) => a.email === cleanEmail)) {
      return { ok: false, errorCode: 'EMAIL_EXISTS' };
    }

    const salt = generateSaltHex();
    const passwordHash = await hashPasswordPbkdf2(input.password, salt);
    const nowIso = new Date().toISOString();
    const accountId = createId(input.role === 'worker' ? 'wrk_acc' : 'cust_acc');

    const account: LocalAccount = {
      id: accountId,
      role: input.role,
      fullName: cleanName,
      email: cleanEmail,
      passwordHash,
      salt,
      createdAt: nowIso,
      categoryId: input.role === 'worker' ? input.categoryId : undefined,
      city: input.city,
      area: input.area,
    };

    const saved = writeAccounts([account, ...accounts]);
    if (!saved) {
      return { ok: false, errorCode: 'STORAGE_ERROR' };
    }

    const session: AuthSession = {
      userId: account.id,
      role: account.role,
      type: 'registered',
      loggedInAt: nowIso,
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
    const accounts = readAccounts();
    const account = accounts.find((a) => a.email === cleanEmail);

    if (!account) {
      return this.recordFailure();
    }

    const candidateHash = await hashPasswordPbkdf2(input.password, account.salt);
    if (!constantTimeEqual(candidateHash, account.passwordHash)) {
      return this.recordFailure();
    }

    this.failedAttempts = 0;
    this.lockedUntilMs = 0;

    const session: AuthSession = {
      userId: account.id,
      role: account.role,
      type: 'registered',
      loggedInAt: new Date().toISOString(),
    };
    writeSession(session);

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

  startGuest(input: StartGuestInput): AuthResult<{ session: AuthSession; guest: GuestProfile }> {
    const rawName = sanitizeText(input.fullName || '', INPUT_LIMITS.NAME_MAX);
    const displayName = rawName || 'Guest';
    const nowIso = new Date().toISOString();

    const guests = readGuests();
    // Reuse existing guest profile if same name + role on this device
    const existing = guests.find(
      (g) => g.role === input.role && g.fullName.toLowerCase() === displayName.toLowerCase()
    );

    let guest: GuestProfile;
    if (existing) {
      guest = {
        ...existing,
        fullName: displayName,
        categoryId: input.role === 'worker' ? input.categoryId || existing.categoryId : undefined,
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

  startSampleAccount(userId: string, role: AuthRole): AuthResult<{ session: AuthSession }> {
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
    if (!storage) return;
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async resetPassword(_email: string): Promise<AuthResult<null>> {
    return { ok: false, errorCode: 'NOT_AVAILABLE' };
  }

  clearGuests(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(GUESTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  subscribeToSessionSync(onSessionChange: (session: AuthSession | null) => void): () => void {
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
