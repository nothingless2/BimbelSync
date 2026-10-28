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
 * Batas maksimal termin cicilan berdasarkan paket:
 * - Starter: 0 (tidak mendukung cicilan)
 * - Growth: 3 (maksimal 3 termin)
 * - Pro: null (tanpa batas termin / unlimited)
 */
export function getMaxInstallmentTerms(planName: string): number | null {
  const name = planName.trim().toLowerCase();
  if (name === "starter") return 0;
  if (name === "growth") return 3;
  return null; // Pro unlimited
}

/**
 * Batas maksimal materi belajar berdasarkan paket:
 * - Starter: 15 modul (kuota dasar)
 * - Growth: 50 modul (kuota menengah)
 * - Pro: null (tanpa batas / unlimited)
 */
export function getMaxLearningMaterials(planName: string): number | null {
  const name = planName.trim().toLowerCase();
  if (name === "starter") return 15;
  if (name === "growth") return 50;
  return null; // Pro unlimited
}

/**
 * Pesan human-readable untuk setiap fitur saat terkunci.
 */
export function getFeatureLockMessage(feature: FeatureKey, planName: string): string {
  switch (feature) {
    case "qr_attendance":
      return `Fitur Absensi QR Dinamis hanya tersedia pada paket Growth dan Pro. Paket Anda saat ini (${planName}) menggunakan absensi manual.`;
    case "erapor":
      return `Fitur E-Rapor & Evaluasi Siswa hanya tersedia pada paket Pro. Paket Anda saat ini (${planName}) belum mendukung e-rapor.`;
    case "installment":
      return `Fitur Pemecahan Tagihan Cicilan hanya tersedia pada paket Growth (maks. 3 termin) dan Pro. Paket Anda saat ini (${planName}) hanya mendukung pembayaran lunas penuh.`;
    case "audit_trail":
      return `Fitur Audit Trail Keamanan hanya tersedia pada paket Pro. Paket Anda saat ini (${planName}) belum mencakup riwayat log audit.`;
    case "automated_email":
      return `Fitur Pengingat Email Otomatis tersedia pada paket Growth dan Pro. Paket Anda saat ini (${planName}) belum mendukung pengiriman email otomatis.`;
    case "learning_materials":
      return `Fitur Pengelolaan Materi Pembelajaran tersedia untuk semua paket (maksimal 15 modul di Starter, 50 modul di Growth, unlimited di Pro).`;
    default:
      return `Fitur ini tidak tersedia pada paket ${planName}. Silakan upgrade paket Anda.`;
  }
}

/**
 * Evaluasi murni apakah objek Plan mengizinkan fitur tertentu.
 * Menggunakan field aktual yang tersedia pada model Plan di schema.prisma:
 * - allows_qr_attendance
 * - allows_erapor
 * - allows_installment: Starter tidak boleh; Growth (maks. 3 termin) dan Pro (unlimited) boleh.
 * - allows_audit_trail
 * - allows_automated_email
 * - learning_materials: Starter didukung hingga 15 modul; Growth dan Pro unlimited.
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
  const planName = (plan.name || "").trim().toLowerCase();
  switch (feature) {
    case "qr_attendance":
      return !!plan.allows_qr_attendance;
    case "erapor":
      return !!plan.allows_erapor;
    case "installment":
      // Growth dan Pro mengizinkan fitur cicilan (Starter tetap terkunci)
      return !!plan.allows_installment || planName === "growth" || planName === "pro";
    case "audit_trail":
      return !!plan.allows_audit_trail;
    case "automated_email":
      return !!plan.allows_automated_email;
    case "learning_materials":
      // Seluruh paket diizinkan; Starter dibatasi kuota 15 modul di level action
      return true;
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

  // 1. Eksekusi upgrade/perubahan otomatis jika pending_plan sudah tiba waktunya
  if (academy.pending_plan_id && academy.pending_plan_date) {
    const activationDate = new Date(academy.pending_plan_date);
    activationDate.setHours(0, 0, 0, 0);

    if (today >= activationDate) {
      const actResult = await activatePendingPlan(academy.id, tx);
      if (actResult.activated) {
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
 * Definisi batas kuota kanonikal untuk paket standar BimbelSync:
 * - Starter: 50 siswa, 3 staf, 3 ruangan, 1 cabang
 * - Growth: 200 siswa, 10 staf, 6 ruangan, 1 cabang
 * - Pro: 500 siswa, 25 staf, 15 ruangan, 1 cabang
 */
export const CANONICAL_PLAN_LIMITS: Record<
  "starter" | "growth" | "pro",
  Record<UsageResource, number>
> = {
  starter: {
    students: 50,
    staff: 3,
    rooms: 3,
    branches: 1,
  },
  growth: {
    students: 200,
    staff: 10,
    rooms: 6,
    branches: 1,
  },
  pro: {
    students: 500,
    staff: 25,
    rooms: 15,
    branches: 1,
  },
};

/**
 * Mengambil batas maksimal resource berdasarkan konfigurasi paket aktual dan aturan kuota standar BimbelSync:
 * - Starter: 50 siswa, 3 staf, 3 ruangan, 1 cabang
 * - Growth: 200 siswa, 10 staf, 6 ruangan, 1 cabang
 * - Pro: 500 siswa, 25 staf, 15 ruangan, 1 cabang
 *
 * Perilaku Penanganan Nilai Kuota (Hardened via Gate 4B & 4B.1):
 * 1. Angka non-negatif valid (>= 0): digunakan sebagai batas kuota aktual (termasuk angka 0).
 * 2. Paket Standar (Starter, Growth, Pro):
 *    - Nilai null atau undefined: TIDAK PERNAH dianggap unlimited; selalu fallback ke batas kanonikal tier standar.
 *    - Nilai tidak valid (< 0 atau NaN): selalu fallback ke batas kanonikal tier standar.
 * 3. Paket Custom / Non-Standar (misal Enterprise):
 *    - null: kuota UNLIMITED (tidak terbatas) secara eksplisit dari database.
 *    - undefined: field tidak disediakan/di-load, fail-closed ke 0 (mencegah fail-open / unlimited tak terduga).
 *    - Nilai tidak valid (< 0 atau NaN): failsafe ke 0 (terkunci aman, tidak menjadi unlimited).
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

  const planName = (plan?.name || "").trim().toLowerCase();
  const isStandardPlan = planName === "starter" || planName === "growth" || planName === "pro";

  let rawValue: number | null | undefined;
  if (resource === "students") rawValue = plan.max_students;
  else if (resource === "staff") rawValue = plan.max_staff;
  else if (resource === "rooms") rawValue = plan.max_rooms;

  // 1. Jika nilai adalah bilangan bulat / angka non-negatif yang valid (termasuk angka 0)
  if (typeof rawValue === "number" && !Number.isNaN(rawValue) && rawValue >= 0) {
    return rawValue;
  }

  // 2. Untuk paket standar (Starter, Growth, Pro):
  // Nilai null, undefined, negatif, atau NaN TIDAK BOLEH menjadi unlimited!
  // Harus selalu menggunakan batas kuota kanonikal paket standar tersebut.
  if (isStandardPlan) {
    return CANONICAL_PLAN_LIMITS[planName as "starter" | "growth" | "pro"][resource];
  }

  // 3. Untuk paket custom / non-standar:
  // Hanya nilai NULL eksplisit dari database yang diakui sebagai kuota UNLIMITED.
  if (rawValue === null) {
    return null;
  }

  // 4. Fail-closed untuk paket custom (undefined, angka negatif, NaN, atau nilai tidak valid lainnya):
  // Field yang tidak disediakan (undefined) atau tidak valid TIDAK BOLEH dianggap unlimited.
  // Gunakan batas 0 (Fail-Closed) agar sumber daya terkunci aman dan mencegah over-allocation tak disengaja.
  return 0;
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

// ============================================================================
// PERUBAHAN PAKET & INTEGRITAS KUOTA (GATE 5C - OPSI B)
// ============================================================================

export interface ChangePlanOptions {
  academyId: string;
  targetPlanId: string;
  name?: string;
  pathUrl?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionDueDate?: Date | null;
  clearPendingPlan?: boolean;
  tx?: Prisma.TransactionClient;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface ResourceQuotaStatus {
  current: number;
  maxLimit: number | null;
  isExceeded: boolean;
}

export interface ChangePlanResult {
  success: boolean;
  academyId: string;
  previousPlanId: string;
  previousPlanName: string;
  newPlanId: string;
  newPlanName: string;
  isDowngrade: boolean;
  resourceStatus: {
    students: ResourceQuotaStatus;
    staff: ResourceQuotaStatus;
    rooms: ResourceQuotaStatus;
  };
  hasExceededQuota: boolean;
  warningMessage?: string;
}

/**
 * Mengubah paket akademi secara atomik dan aman terhadap race condition.
 * 
 * Implementasi Kebijakan Downgrade: OPSI B (Allow downgrade with restrictions)
 * - Baris Academy dikunci dengan SELECT ... FOR UPDATE (konsisten dengan executeWithQuotaLock).
 * - Paket target diverifikasi dari database.
 * - Resource aktif (students, staff, rooms) dihitung secara real-time di dalam transaksi.
 * - Jika jumlah resource aktif saat ini melampaui kuota paket target:
 *   1. Perubahan paket tetap DIIZINKAN (downgrade berhasil).
 *   2. Data historis/existing TIDAK DIHAPUS.
 *   3. Menghasilkan pesan peringatan yang menjelaskan resource mana yang melampaui batas.
 *   4. Penambahan resource baru berikutnya secara otomatis diblokir oleh executeWithQuotaLock
 *      karena currentCount >= maxLimit.
 */
export async function changeAcademyPlan(
  options: ChangePlanOptions
): Promise<ChangePlanResult> {
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 0;

  const executeInsideTx = async (tx: Prisma.TransactionClient): Promise<ChangePlanResult> => {
    // 1. Kunci baris Academy secara eksklusif (Row-Level Lock)
    const lockedAcademies = await tx.$queryRaw<Array<{ id: string; plan_id: string }>>`
      SELECT id, plan_id FROM "Academy" 
      WHERE id = ${options.academyId}::uuid AND deleted_at IS NULL 
      FOR UPDATE
    `;

    if (lockedAcademies.length === 0) {
      throw new Error("Akademi tidak ditemukan atau telah dinonaktifkan.");
    }

    const currentPlanId = lockedAcademies[0].plan_id;

    // 2. Ambil paket saat ini & paket target dari database
    const [previousPlan, targetPlan] = await Promise.all([
      tx.plan.findUnique({ where: { id: currentPlanId } }),
      tx.plan.findUnique({ where: { id: options.targetPlanId } })
    ]);

    if (!targetPlan || targetPlan.deleted_at !== null) {
      throw new Error("Paket langganan target tidak ditemukan atau tidak aktif.");
    }

    // 3. Hitung jumlah record aktif saat ini dalam isolasi transaksi terkunci
    const [studentCount, staffCount, roomCount] = await Promise.all([
      tx.student.count({ where: { academy_id: options.academyId, deleted_at: null } }),
      tx.staff.count({ where: { academy_id: options.academyId, deleted_at: null } }),
      tx.room.count({ where: { academy_id: options.academyId, deleted_at: null } }),
    ]);

    // 4. Hitung limit kanonikal paket target & paket sebelumnya
    const targetStudentLimit = getPlanResourceLimit(targetPlan, "students");
    const targetStaffLimit = getPlanResourceLimit(targetPlan, "staff");
    const targetRoomLimit = getPlanResourceLimit(targetPlan, "rooms");

    const prevStudentLimit = previousPlan ? getPlanResourceLimit(previousPlan, "students") : null;
    const prevStaffLimit = previousPlan ? getPlanResourceLimit(previousPlan, "staff") : null;
    const prevRoomLimit = previousPlan ? getPlanResourceLimit(previousPlan, "rooms") : null;

    // Evaluasi apakah perubahan ini merupakan downgrade kapasitas
    const isDowngrade = Boolean(
      (targetStudentLimit !== null && prevStudentLimit !== null && targetStudentLimit < prevStudentLimit) ||
      (targetStaffLimit !== null && prevStaffLimit !== null && targetStaffLimit < prevStaffLimit) ||
      (targetRoomLimit !== null && prevRoomLimit !== null && targetRoomLimit < prevRoomLimit)
    );

    // Evaluasi status kelebihan kuota (Opsi B: izinkan perubahan, batasi penambahan baru)
    const studentExceeded = targetStudentLimit !== null && studentCount > targetStudentLimit;
    const staffExceeded = targetStaffLimit !== null && staffCount > targetStaffLimit;
    const roomExceeded = targetRoomLimit !== null && roomCount > targetRoomLimit;
    const hasExceededQuota = studentExceeded || staffExceeded || roomExceeded;

    const exceededDetails: string[] = [];
    if (studentExceeded) exceededDetails.push(`siswa (${studentCount}/${targetStudentLimit})`);
    if (staffExceeded) exceededDetails.push(`staf (${staffCount}/${targetStaffLimit})`);
    if (roomExceeded) exceededDetails.push(`ruangan (${roomCount}/${targetRoomLimit})`);

    let warningMessage: string | undefined;
    if (hasExceededQuota) {
      warningMessage = `Paket berhasil diubah ke ${targetPlan.name}. Perhatian: jumlah ${exceededDetails.join(", ")} saat ini melampaui kuota paket baru. Penambahan data baru akan diblokir hingga jumlah resource kembali berada di bawah batas kuota. Seluruh data historis yang sudah ada tetap aman dan dipertahankan.`;
    }

    // 5. Update data Academy secara atomik
    await tx.academy.update({
      where: { id: options.academyId },
      data: {
        plan_id: options.targetPlanId,
        ...(options.name ? { name: options.name.trim() } : {}),
        ...(options.pathUrl ? { path_url: options.pathUrl.trim() } : {}),
        ...(options.subscriptionStatus ? { subscription_status: options.subscriptionStatus } : {}),
        ...(options.subscriptionDueDate !== undefined ? { subscription_due_date: options.subscriptionDueDate } : {}),
        ...(options.clearPendingPlan !== false ? { pending_plan_id: null, pending_plan_date: null } : {}),
      }
    });

    return {
      success: true,
      academyId: options.academyId,
      previousPlanId: currentPlanId,
      previousPlanName: previousPlan?.name || "Unknown",
      newPlanId: targetPlan.id,
      newPlanName: targetPlan.name,
      isDowngrade,
      resourceStatus: {
        students: { current: studentCount, maxLimit: targetStudentLimit, isExceeded: studentExceeded },
        staff: { current: staffCount, maxLimit: targetStaffLimit, isExceeded: staffExceeded },
        rooms: { current: roomCount, maxLimit: targetRoomLimit, isExceeded: roomExceeded },
      },
      hasExceededQuota,
      warningMessage,
    };
  };

  // Jika tx sudah diberikan oleh pemanggil, gunakan langsung tanpa membuka transaksi baru
  if (options.tx) {
    return await executeInsideTx(options.tx);
  }

  // Jika belum dalam transaksi, jalankan dalam prisma.$transaction dengan retry backoff
  while (true) {
    try {
      return await prisma.$transaction(
        async (tx) => executeInsideTx(tx),
        { timeout: options.timeoutMs ?? 15000 }
      );
    } catch (error: any) {
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

/**
 * Mengaktifkan paket terjadwal (pending_plan) untuk satu akademi secara atomik.
 */
export async function activatePendingPlan(
  academyId: string,
  tx?: Prisma.TransactionClient
): Promise<{ activated: boolean; planName?: string; warningMessage?: string }> {
  const executeInsideTx = async (client: Prisma.TransactionClient) => {
    const locked = await client.$queryRaw<Array<{
      id: string;
      plan_id: string;
      pending_plan_id: string | null;
      pending_plan_date: Date | null;
    }>>`
      SELECT id, plan_id, pending_plan_id, pending_plan_date 
      FROM "Academy" 
      WHERE id = ${academyId}::uuid AND deleted_at IS NULL 
      FOR UPDATE
    `;

    if (locked.length === 0) return { activated: false };
    const acad = locked[0];

    if (!acad.pending_plan_id || !acad.pending_plan_date) {
      return { activated: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activationDate = new Date(acad.pending_plan_date);
    activationDate.setHours(0, 0, 0, 0);

    if (today < activationDate) {
      return { activated: false };
    }

    const result = await changeAcademyPlan({
      academyId,
      targetPlanId: acad.pending_plan_id,
      clearPendingPlan: true,
      tx: client,
    });

    return {
      activated: true,
      planName: result.newPlanName,
      warningMessage: result.warningMessage,
    };
  };

  if (tx) {
    return await executeInsideTx(tx);
  }

  return await prisma.$transaction(
    async (client) => executeInsideTx(client),
    { timeout: 15000 }
  );
}

/**
 * Mengaktifkan seluruh pending plan yang sudah tiba tanggal aktivasinya.
 * Digunakan oleh halaman billing superadmin dan cron aktivasi.
 */
export async function activateAllDuePendingPlans(): Promise<{ processed: number; activated: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingAcademies = await prisma.academy.findMany({
    where: {
      deleted_at: null,
      pending_plan_id: { not: null },
      pending_plan_date: { lte: today },
    },
    select: { id: true },
  });

  let activatedCount = 0;
  for (const acad of pendingAcademies) {
    try {
      const res = await activatePendingPlan(acad.id);
      if (res.activated) activatedCount++;
    } catch (err) {
      console.error(`Gagal mengaktifkan pending plan untuk akademi ${acad.id}:`, err);
    }
  }

  return { processed: pendingAcademies.length, activated: activatedCount };
}
