import prisma from "@/lib/prisma";
import type { Plan, SubscriptionStatus, Prisma } from "@prisma/client";

/**
 * Tipe kunci fitur yang dapat digating secara type-safe.
 * Dipetakan langsung ke kemampuan paket di schema.prisma.
 */
export type FeatureKey =
  | "qr_attendance"
  | "erapor"
  | "installment"
  | "audit_trail"
  | "automated_email"
  | "learning_materials";

export interface EffectiveSubscription {
  academyId: string;
  academyName: string;
  tenantSlug: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  isAccessible: boolean;
  isTrial: boolean;
  dueDate: Date | null;
  daysRemaining: number | null;
  plan: Plan;
}

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  planName: string;
  upgradeUrl?: string;
}

/**
 * Pesan human-readable untuk setiap fitur saat terkunci.
 */
export function getFeatureLockMessage(feature: FeatureKey, planName: string): string {
  switch (feature) {
    case "qr_attendance":
      return `Fitur Absensi QR Dinamis hanya tersedia pada paket Growth dan Pro. Paket Anda saat ini (${planName}) menggunakan absensi manual.`;
    case "erapor":
      return `Fitur E-Rapor & Evaluasi Siswa hanya tersedia pada paket Growth dan Pro. Paket Anda saat ini (${planName}) belum mendukung e-rapor.`;
    case "installment":
      return `Fitur Pemecahan Tagihan Cicilan hanya tersedia pada paket Pro. Paket Anda saat ini (${planName}) hanya mendukung pembayaran lunas penuh.`;
    case "audit_trail":
      return `Fitur Audit Trail Keamanan hanya tersedia pada paket Pro. Paket Anda saat ini (${planName}) belum mencakup riwayat log audit.`;
    case "automated_email":
      return `Fitur Pengingat Email Otomatis tersedia pada paket Growth dan Pro. Paket Anda saat ini (${planName}) belum mendukung pengiriman email otomatis.`;
    case "learning_materials":
      return `Fitur Pengelolaan Materi Pembelajaran tersedia mulai dari paket Growth. Paket Anda saat ini (${planName}) belum mendukung repositori materi.`;
    default:
      return `Fitur ini tidak tersedia pada paket ${planName}. Silakan upgrade paket Anda.`;
  }
}

/**
 * Evaluasi murni apakah objek Plan mengizinkan fitur tertentu.
 * Menggunakan field aktual yang tersedia pada model Plan di schema.prisma:
 * - allows_qr_attendance
 * - allows_erapor
 * - allows_installment
 * - allows_audit_trail
 * - allows_automated_email
 * - learning_materials: Starter tidak termasuk; Growth dan Pro termasuk.
 */
export function isFeatureAllowedByPlan(
  plan: {
    allows_qr_attendance?: boolean | null;
    allows_erapor?: boolean | null;
    allows_installment?: boolean | null;
    allows_audit_trail?: boolean | null;
    allows_automated_email?: boolean | null;
    name: string;
    additional_features?: string[];
  },
  feature: FeatureKey
): boolean {
  switch (feature) {
    case "qr_attendance":
      return !!plan.allows_qr_attendance;
    case "erapor":
      return !!plan.allows_erapor;
    case "installment":
      return !!plan.allows_installment;
    case "audit_trail":
      return !!plan.allows_audit_trail;
    case "automated_email":
      return !!plan.allows_automated_email;
    case "learning_materials":
      // Starter tidak mengizinkan materi belajar; Growth dan Pro mengizinkan.
      return plan.name.trim().toLowerCase() !== "starter";
    default:
      return false;
  }
}

/**
 * Sumber kebenaran tunggal untuk mengambil status langganan dan paket efektif sebuah Academy.
 * Memperhitungkan:
 * 1. Jadwal pending plan upgrade yang sudah jatuh tempo.
 * 2. Status TRIAL / ACTIVE / SUSPENDED / EXPIRED_TRIAL.
 * 3. Tanggal jatuh tempo (due date) terhadap hari ini.
 */
export async function getAcademySubscription(
  academyId: string,
  tx?: Prisma.TransactionClient
): Promise<EffectiveSubscription | null> {
  if (!academyId) return null;

  const db = tx ?? prisma;

  let academy = await db.academy.findUnique({
    where: { id: academyId },
    include: {
      plan: true,
      pending_plan: true,
    },
  });

  if (!academy || academy.deleted_at !== null) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Eksekusi upgrade otomatis jika pending_plan sudah tiba waktunya
  if (academy.pending_plan_id && academy.pending_plan_date) {
    const activationDate = new Date(academy.pending_plan_date);
    activationDate.setHours(0, 0, 0, 0);

    if (today >= activationDate) {
      // Gunakan client db yang sama (tx jika dalam lock) dan filter guard untuk atomisitas
      const updateResult = await db.academy.updateMany({
        where: {
          id: academy.id,
          pending_plan_id: academy.pending_plan_id,
        },
        data: {
          plan_id: academy.pending_plan_id,
          pending_plan_id: null,
          pending_plan_date: null,
        },
      });

      if (updateResult.count > 0 || tx) {
        const refreshed = await db.academy.findUnique({
          where: { id: academy.id },
          include: {
            plan: true,
            pending_plan: true,
          },
        });
        if (refreshed) {
          academy = refreshed;
        }
      }
    }
  }

  // 2. Evaluasi tanggal jatuh tempo
  const dueDate = academy.subscription_due_date ? new Date(academy.subscription_due_date) : null;
  if (dueDate) dueDate.setHours(0, 0, 0, 0);

  const isPastDue = dueDate ? dueDate < today : false;
  const isSuspended = academy.subscription_status === "SUSPENDED";
  const isExpiredTrial = academy.subscription_status === "EXPIRED_TRIAL";

  // Hitung status efektif
  let effectiveStatus: SubscriptionStatus = academy.subscription_status;
  if (isExpiredTrial || (isPastDue && academy.subscription_status === "TRIAL")) {
    effectiveStatus = "EXPIRED_TRIAL";
  } else if (isSuspended || (isPastDue && academy.subscription_status === "ACTIVE")) {
    effectiveStatus = "SUSPENDED";
  }

  const isAccessible = effectiveStatus !== "SUSPENDED" && effectiveStatus !== "EXPIRED_TRIAL";
  const isTrial = effectiveStatus === "TRIAL";

  // Hitung sisa hari
  let daysRemaining: number | null = null;
  if (dueDate) {
    const diffTime = dueDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    academyId: academy.id,
    academyName: academy.name,
    tenantSlug: academy.path_url,
    planId: academy.plan.id,
    planName: academy.plan.name,
    status: academy.subscription_status,
    effectiveStatus,
    isAccessible,
    isTrial,
    dueDate,
    daysRemaining,
    plan: academy.plan,
  };
}

/**
 * Pengecekan izin akses fitur pada level server.
 * Mengembalikan objek hasil pemeriksaan (allowed: boolean, reason, upgradeUrl).
 */
export async function checkFeatureAccess(
  academyId: string,
  feature: FeatureKey
): Promise<FeatureAccessResult> {
  const sub = await getAcademySubscription(academyId);

  if (!sub) {
    return {
      allowed: false,
      reason: "Akademi tidak ditemukan atau telah dinonaktifkan.",
      planName: "Unknown",
    };
  }

  if (!sub.isAccessible) {
    return {
      allowed: false,
      reason:
        sub.effectiveStatus === "EXPIRED_TRIAL"
          ? "Masa percobaan gratis (TRIAL) telah berakhir. Silakan pilih paket langganan."
          : "Masa langganan telah berakhir atau ditangguhkan. Silakan lunasi tagihan langganan.",
      planName: sub.planName,
      upgradeUrl: `/${sub.tenantSlug}/dashboard/subscription`,
    };
  }

  const isAllowed = isFeatureAllowedByPlan(sub.plan, feature);

  if (!isAllowed) {
    return {
      allowed: false,
      reason: getFeatureLockMessage(feature, sub.planName),
      planName: sub.planName,
      upgradeUrl: `/${sub.tenantSlug}/dashboard/subscription`,
    };
  }

  return {
    allowed: true,
    planName: sub.planName,
  };
}

/**
 * Assert akses fitur untuk Server Actions.
 * Mengembalikan { allowed: true } jika berhasil, atau { allowed: false, error: string } jika ditolak.
 */
export async function assertFeatureAccess(
  academyId: string,
  feature: FeatureKey
): Promise<{ allowed: true; planName: string } | { allowed: false; error: string }> {
  const check = await checkFeatureAccess(academyId, feature);
  if (!check.allowed) {
    return { allowed: false, error: check.reason || "Akses ke fitur ini ditolak." };
  }
  return { allowed: true, planName: check.planName };
}

/**
 * ============================================================================
 * KONTRAK TAHAP 2 (DOKUMENTASI KONTRAK PERLINDUNGAN KUOTA ATOMIK)
 * ============================================================================
 * Sesuai aturan kerja Tahap 1 Poin 8, fungsi ini TIDAK diterapkan sebagai
 * solusi konkurensi di Tahap 1 agar tidak prematur sebelum mekanisme
 * transaksi atomik dirancang dan diuji secara menyeluruh di Tahap 2.
 */
export type UsageResource = "students" | "staff" | "rooms" | "branches";

export interface UsageLimitContract {
  resource: UsageResource;
  currentCount: number;
  maxLimit: number | null; // null = Unlimited
  isExceeded: boolean;
  remainingQuota: number | null;
}

/**
 * Mengambil batas maksimal resource berdasarkan konfigurasi paket aktual dan aturan kuota standar BimbelSync:
 * - Starter: 50 siswa, 3 staf, 2 ruangan, 1 cabang
 * - Growth: 200 siswa, 10 staf, 6 ruangan, 1 cabang
 * - Pro: 500 siswa, 25 staf, 15 ruangan, 1 cabang
 *
 * Perilaku Nilai Kuota:
 * - number (terbatas): batas kuota numerik aktual.
 * - null (eksplisit di database): kuota UNLIMITED (tidak terbatas).
 * - undefined (field tidak di-load / parsial): gunakan batas kanonikal tier standar BimbelSync.
 */
export function getPlanResourceLimit(
  plan: {
    name: string;
    max_students?: number | null;
    max_staff?: number | null;
    max_rooms?: number | null;
  },
  resource: UsageResource
): number | null {
  if (resource === "branches") {
    return 1;
  }

  let rawValue: number | null | undefined;
  if (resource === "students") rawValue = plan.max_students;
  else if (resource === "staff") rawValue = plan.max_staff;
  else if (resource === "rooms") rawValue = plan.max_rooms;

  // 1. Jika field eksplisit tersedia dari database:
  // - number: batas numerik aktual.
  // - null: UNLIMITED (tanpa batas).
  if (rawValue !== undefined) {
    return rawValue;
  }

  // 2. Jika field undefined (misal query tidak menyertakan kolom kuota),
  // gunakan nilai batas kanonikal berdasarkan nama paket:
  const planName = plan.name.trim().toLowerCase();
  switch (resource) {
    case "students":
      if (planName === "starter") return 50;
      if (planName === "growth") return 200;
      if (planName === "pro") return 500;
      return null;
    case "staff":
      if (planName === "starter") return 3;
      if (planName === "growth") return 10;
      if (planName === "pro") return 25;
      return null;
    case "rooms":
      if (planName === "starter") return 2;
      if (planName === "growth") return 6;
      if (planName === "pro") return 15;
      return null;
    default:
      return null;
  }
}

/**
 * Mengambil status penggunaan kuota akademi saat ini secara non-blocking.
 * Hanya menghitung record aktif (deleted_at: null).
 */
export async function getAcademyUsageLimit(
  academyId: string,
  resource: UsageResource
): Promise<UsageLimitContract> {
  const sub = await getAcademySubscription(academyId);
  if (!sub) {
    throw new Error("Akademi tidak ditemukan.");
  }

  const maxLimit = getPlanResourceLimit(sub.plan, resource);
  let currentCount = 0;

  if (resource === "students") {
    currentCount = await prisma.student.count({
      where: { academy_id: academyId, deleted_at: null }
    });
  } else if (resource === "staff") {
    currentCount = await prisma.staff.count({
      where: { academy_id: academyId, deleted_at: null }
    });
  } else if (resource === "rooms") {
    currentCount = await prisma.room.count({
      where: { academy_id: academyId, deleted_at: null }
    });
  }

  const isExceeded = maxLimit !== null ? currentCount >= maxLimit : false;
  const remainingQuota = maxLimit !== null ? Math.max(0, maxLimit - currentCount) : null;

  return {
    resource,
    currentCount,
    maxLimit,
    isExceeded,
    remainingQuota
  };
}

/**
 * Error khusus yang dilempar saat kuota terlampaui.
 * Berisi informasi kuota terkini dan tidak boleh di-retry.
 */
export class QuotaExceededError extends Error {
  public readonly resource: UsageResource;
  public readonly currentCount: number;
  public readonly maxLimit: number;
  public readonly requestedCount: number;
  public readonly planName: string;

  constructor(
    resource: UsageResource,
    currentCount: number,
    maxLimit: number,
    requestedCount: number,
    planName: string
  ) {
    const resourceLabel =
      resource === "students"
        ? "siswa"
        : resource === "staff"
        ? "staf"
        : resource === "rooms"
        ? "ruangan"
        : resource;
    super(
      `Batas kuota tercapai! Paket "${planName}" hanya mengizinkan maksimal ${maxLimit} ${resourceLabel} aktif (saat ini ${currentCount}, mencoba menambah ${requestedCount}). Harap upgrade paket Anda.`
    );
    this.name = "QuotaExceededError";
    this.resource = resource;
    this.currentCount = currentCount;
    this.maxLimit = maxLimit;
    this.requestedCount = requestedCount;
    this.planName = planName;
  }
}

export interface QuotaLockOptions {
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Eksekutor transaksi atomik dengan PostgreSQL Row-Level Lock pada baris Academy (`SELECT ... FOR UPDATE`).
 *
 * Jaminan Keamanan Konkurensi:
 * 1. Setiap mutasi yang membutuhkan kuota mengunci baris Academy milik tenant bersangkutan.
 * 2. Transaksi paralel untuk Academy yang sama otomatis antre (serialized), sehingga query count
 *    pasti melihat committed data dari request sebelumnya (menghilangkan phantom read).
 * 3. Tenant lain (Academy berbeda) memiliki baris berbeda sehingga berjalan 100% independen tanpa saling menunggu.
 * 4. Lock dilepas otomatis saat commit atau rollback.
 * 5. Retry dilakukan maksimal `maxRetries` (default 3x) HANYA untuk error transient seperti serialization conflict (40001) / deadlock (40P01).
 *    QuotaExceededError dan unique constraint violations TIDAK di-retry.
 */
export async function executeWithQuotaLock<T>(
  academyId: string,
  resource: UsageResource,
  requestedCount: number,
  operation: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>,
  options: QuotaLockOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 0;

  while (true) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Kunci baris Academy secara eksklusif dalam transaksi ini (Row-Level Lock)
          const lockedAcademies = await tx.$queryRaw<Array<{ id: string; plan_id: string }>>`
            SELECT id, plan_id FROM "Academy" 
            WHERE id = ${academyId}::uuid AND deleted_at IS NULL 
            FOR UPDATE
          `;

          if (lockedAcademies.length === 0) {
            throw new Error("Akademi tidak ditemukan atau telah dinonaktifkan.");
          }

          // 2. Ambil informasi paket efektif akademi menggunakan transaksi yang sama
          const sub = await getAcademySubscription(academyId, tx);
          if (!sub) {
            throw new Error("Langganan akademi tidak valid.");
          }

          if (!sub.isAccessible) {
            throw new Error(
              "Akses langganan bimbel Anda sedang ditangguhkan atau masa percobaan telah berakhir. Silakan selesaikan pembayaran untuk melanjutkan."
            );
          }

          const maxLimit = getPlanResourceLimit(sub.plan, resource);

          // 3. Hitung jumlah record aktif saat ini dalam isolasi transaksi yang terkunci
          let currentCount = 0;
          if (resource === "students") {
            currentCount = await tx.student.count({
              where: { academy_id: academyId, deleted_at: null }
            });
          } else if (resource === "staff") {
            currentCount = await tx.staff.count({
              where: { academy_id: academyId, deleted_at: null }
            });
          } else if (resource === "rooms") {
            currentCount = await tx.room.count({
              where: { academy_id: academyId, deleted_at: null }
            });
          }

          // 4. Verifikasi kuota: jika melebihi batas, batalkan transaksi dan lempar QuotaExceededError
          if (maxLimit !== null && (currentCount + requestedCount) > maxLimit) {
            throw new QuotaExceededError(
              resource,
              currentCount,
              maxLimit,
              requestedCount,
              sub.planName
            );
          }

          // 5. Jalankan operasi pembuatan data yang diinginkan
          return await operation(tx);
        },
        {
          timeout: options.timeoutMs ?? 15000
        }
      );
    } catch (error: any) {
      // Jangan retry jika kuota memang telah habis atau error validasi bisnis
      if (error instanceof QuotaExceededError) {
        throw error;
      }

      // Deteksi error transient PostgreSQL yang aman untuk dicoba ulang:
      const isTransient =
        error.code === "40001" ||
        error.code === "40P01" ||
        error.code === "P2034";

      attempt++;
      if (isTransient && attempt <= maxRetries) {
        const backoff = Math.min(250, 50 * Math.pow(2, attempt)) + Math.floor(Math.random() * 25);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      throw error;
    }
  }
}
