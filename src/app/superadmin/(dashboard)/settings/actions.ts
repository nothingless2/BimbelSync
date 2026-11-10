"use server";

import prisma from "@/lib/prisma";
import { requireSuperadminSession } from "@/lib/session";
import { saveDataRetentionConfig, DataRetentionConfig } from "@/lib/platform-settings";
import { purgeExpiredTenantUsers, PurgeResult } from "@/lib/user-cleanup";
import { revalidatePath } from "next/cache";

export async function saveRetentionConfigAction(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
  message?: string;
}> {
  const auth = await requireSuperadminSession();
  if ("error" in auth) return { error: auth.error };

  const rawDays = parseInt(formData.get("retention_days") as string, 10);
  const allowedDays = [30, 90, 180, 365];
  if (!allowedDays.includes(rawDays)) {
    return { error: "Pilihan rentang waktu retensi tidak valid." };
  }

  const autoPurgeEnabled = formData.get("auto_purge_enabled") === "true";
  const targetStaff = formData.get("target_staff") === "true";
  const targetStudent = formData.get("target_student") === "true";
  const targetAcademy = formData.get("target_academy") === "true";

  if (!targetStaff && !targetStudent && !targetAcademy) {
    return { error: "Pilih setidaknya satu jenis entitas target pembersihan." };
  }

  const config: DataRetentionConfig = {
    retentionDays: rawDays,
    autoPurgeEnabled,
    targetStaff,
    targetStudent,
    targetAcademy,
  };

  try {
    await saveDataRetentionConfig(config);

    // Catat log audit superadmin
    await prisma.auditLog.create({
      data: {
        superadmin_id: auth.session.id,
        action: "UPDATE_DATA_RETENTION_SETTINGS",
        entity_type: "PlatformSetting",
        details: {
          retention_days: rawDays,
          auto_purge_enabled: autoPurgeEnabled,
          target_staff: targetStaff,
          target_student: targetStudent,
          target_academy: targetAcademy,
          updated_at: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/superadmin/settings");
    revalidatePath("/superadmin/academies");
    return {
      success: true,
      message: `Kebijakan retensi berhasil disimpan (${rawDays} hari).`,
    };
  } catch (error: any) {
    console.error("Gagal menyimpan konfigurasi retensi data:", error);
    return { error: error?.message || "Gagal menyimpan konfigurasi." };
  }
}

export async function executeManualPurgeAction(): Promise<{
  success?: boolean;
  error?: string;
  result?: PurgeResult;
}> {
  const auth = await requireSuperadminSession();
  if ("error" in auth) return { error: auth.error };

  try {
    const result = await purgeExpiredTenantUsers({ force: true });

    // Catat audit log pembersihan manual
    await prisma.auditLog.create({
      data: {
        superadmin_id: auth.session.id,
        action: "MANUAL_PURGE_EXPIRED_USERS",
        entity_type: "PlatformSetting",
        details: {
          retention_days: result.retentionDays,
          cutoff_date: result.cutoffDate,
          purged_staff_count: result.purgedStaffCount,
          purged_student_count: result.purgedStudentCount,
          purged_academy_count: result.purgedAcademyCount,
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/superadmin/settings");
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");

    return {
      success: true,
      result,
    };
  } catch (error: any) {
    console.error("Manual purge error:", error);
    return { error: error?.message || "Gagal menjalankan pembersihan data." };
  }
}
