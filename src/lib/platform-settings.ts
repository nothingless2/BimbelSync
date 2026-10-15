import prisma from "@/lib/prisma";

export interface PlatformBankInfo {
  bankName: string;
  bankAccount: string;
}

export const DEFAULT_PLATFORM_BANK_INFO: PlatformBankInfo = {
  bankName: "BCA a.n PT BimbelSync Nusantara",
  bankAccount: "123-456-7890",
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
