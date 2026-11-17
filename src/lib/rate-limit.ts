/**
 * Rate Limiter — In-Memory (cocok untuk single-instance / Vercel serverless per-region)
 *
 * Implementasi sederhana tanpa dependency eksternal.
 * Untuk multi-region production, pertimbangkan Upstash Redis.
 *
 * Strategi:
 * - Sliding window per IP address
 * - Max N attempts dalam window waktu tertentu
 * - Automatic cleanup agar tidak memory leak
 */

interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

// Store di module-level (persisten selama instance hidup)
const store = new Map<string, RateLimitEntry>();

// Bersihkan entri lama setiap 15 menit agar tidak memory leak
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 15 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    // Hapus entri yang window-nya sudah lewat dan tidak terkunci
    if (!entry.lockedUntil && now - entry.firstAttemptAt > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Jumlah maksimum percobaan sebelum diblokir */
  maxAttempts: number;
  /** Durasi sliding window dalam milidetik */
  windowMs: number;
  /** Durasi lockout setelah melewati batas (ms) */
  lockoutMs: number;
}

export interface RateLimitResult {
  /** Apakah request diizinkan */
  allowed: boolean;
  /** Sisa percobaan yang diizinkan */
  remaining: number;
  /** Milidetik sampai lockout berakhir (0 jika tidak terkunci) */
  retryAfterMs: number;
}

/**
 * Periksa apakah key tertentu masih dalam batas rate limit.
 *
 * @param key   Identifier unik (misalnya: "login:127.0.0.1" atau "login:user@email.com")
 * @param config Konfigurasi rate limit
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  maybeCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Belum pernah ada entri
  if (!entry) {
    store.set(key, { count: 1, firstAttemptAt: now });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  // Sedang dalam masa lockout
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.lockedUntil - now,
    };
  }

  // Window sudah lewat → reset counter
  if (now - entry.firstAttemptAt > config.windowMs) {
    store.set(key, { count: 1, firstAttemptAt: now });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  // Masih dalam window — tambah counter
  const newCount = entry.count + 1;

  if (newCount > config.maxAttempts) {
    // Kunci akses
    store.set(key, {
      ...entry,
      count: newCount,
      lockedUntil: now + config.lockoutMs,
    });
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: config.lockoutMs,
    };
  }

  store.set(key, { ...entry, count: newCount });
  return {
    allowed: true,
    remaining: config.maxAttempts - newCount,
    retryAfterMs: 0,
  };
}

/**
 * Reset counter untuk key tertentu (dipanggil setelah login sukses).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

// Preset konfigurasi siap pakai
export const RATE_LIMIT_PRESETS = {
  /** Login: 5 percobaan per 15 menit, lockout 15 menit */
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  } satisfies RateLimitConfig,

  /** OTP: 3 percobaan per 10 menit, lockout 10 menit */
  otp: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000,
    lockoutMs: 10 * 60 * 1000,
  } satisfies RateLimitConfig,

  /** Reset password: 3 permintaan per 30 menit */
  passwordReset: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000,
  } satisfies RateLimitConfig,
} as const;
