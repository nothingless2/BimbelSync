import prisma from "@/lib/prisma";

export interface PlatformBankInfo {
  bankName: string;
  bankAccount: string;
}

export const DEFAULT_PLATFORM_BANK_INFO: PlatformBankInfo = {
  bankName: "BCA a.n PT BimbelSync Nusantara",
  bankAccount: "123-456-7890",
};

export interface DataRetentionConfig {
  retentionDays: number;
  autoPurgeEnabled: boolean;
  targetStaff: boolean;
  targetStudent: boolean;
  targetAcademy: boolean;
}

export const DEFAULT_RETENTION_CONFIG: DataRetentionConfig = {
  retentionDays: 90, // Default: 3 bulan (90 hari)
  autoPurgeEnabled: true,
  targetStaff: true,
  targetStudent: true,
  targetAcademy: true,
};

/**
 * Mengambil informasi rekening bank pembayaran platform.
 * Membaca dari tabel PlatformSetting dengan fallback ke default.
 */
export async function getPlatformBankInfo(): Promise<PlatformBankInfo> {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: { in: ["bank_name", "bank_account"] },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      bankName: map.get("bank_name") || DEFAULT_PLATFORM_BANK_INFO.bankName,
      bankAccount: map.get("bank_account") || DEFAULT_PLATFORM_BANK_INFO.bankAccount,
    };
  } catch (error) {
    console.error("Gagal mengambil platform bank info:", error);
    return DEFAULT_PLATFORM_BANK_INFO;
  }
}

/**
 * Mengambil konfigurasi retensi data & pembersihan permanen platform.
 */
export async function getDataRetentionConfig(): Promise<DataRetentionConfig> {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            "data_retention_days",
            "auto_purge_enabled",
            "retention_target_staff",
            "retention_target_student",
            "retention_target_academy",
          ],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    const rawDays = parseInt(map.get("data_retention_days") || "", 10);
    const retentionDays = [30, 90, 180, 365].includes(rawDays)
      ? rawDays
      : DEFAULT_RETENTION_CONFIG.retentionDays;

    return {
      retentionDays,
      autoPurgeEnabled: map.has("auto_purge_enabled")
        ? map.get("auto_purge_enabled") === "true"
        : DEFAULT_RETENTION_CONFIG.autoPurgeEnabled,
      targetStaff: map.has("retention_target_staff")
        ? map.get("retention_target_staff") === "true"
        : DEFAULT_RETENTION_CONFIG.targetStaff,
      targetStudent: map.has("retention_target_student")
        ? map.get("retention_target_student") === "true"
        : DEFAULT_RETENTION_CONFIG.targetStudent,
      targetAcademy: map.has("retention_target_academy")
        ? map.get("retention_target_academy") === "true"
        : DEFAULT_RETENTION_CONFIG.targetAcademy,
    };
  } catch (error) {
    console.error("Gagal mengambil data retention config:", error);
    return DEFAULT_RETENTION_CONFIG;
  }
}

/**
 * Menyimpan konfigurasi retensi data ke tabel PlatformSetting.
 */
export async function saveDataRetentionConfig(config: Partial<DataRetentionConfig>): Promise<void> {
  const operations: { key: string; value: string }[] = [];

  if (config.retentionDays !== undefined) {
    operations.push({ key: "data_retention_days", value: String(config.retentionDays) });
  }
  if (config.autoPurgeEnabled !== undefined) {
    operations.push({ key: "auto_purge_enabled", value: String(config.autoPurgeEnabled) });
  }
  if (config.targetStaff !== undefined) {
    operations.push({ key: "retention_target_staff", value: String(config.targetStaff) });
  }
  if (config.targetStudent !== undefined) {
    operations.push({ key: "retention_target_student", value: String(config.targetStudent) });
  }
  if (config.targetAcademy !== undefined) {
    operations.push({ key: "retention_target_academy", value: String(config.targetAcademy) });
  }

  await prisma.$transaction(
    operations.map((op) =>
      prisma.platformSetting.upsert({
        where: { key: op.key },
        create: { key: op.key, value: op.value },
        update: { value: op.value },
      })
    )
  );
}
