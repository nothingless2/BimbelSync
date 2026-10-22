"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "../../search/actions";
import { executeWithQuotaLock, QuotaExceededError, changeAcademyPlan } from "@/lib/subscription";
import { requireSuperadminSession } from "@/lib/session";

export async function deactivateAdminAction(staffId: string, academyId: string) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };
    const superadminId = auth.session.id;

    // Tenant Isolation check: Make sure this staff belongs to the specified academy
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: academyId, role: "ADMIN" }
    });

    if (!staff) return { error: "Admin tidak ditemukan pada akademi ini" };

    await prisma.staff.update({
      where: { id: staffId },
      data: { deleted_at: new Date() }
    });

    await logAuditAction("DEACTIVATE_TENANT_ADMIN", "Staff", academyId, { staff_id: staffId, email: staff.email, academy_id: academyId });
    
    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menonaktifkan admin" };
  }
}

export async function sendResetPasswordLinkAction(staffId: string, academyId: string) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };
    const superadminId = auth.session.id;

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: academyId, role: "ADMIN" }
    });

    if (!staff) return { error: "Admin tidak ditemukan pada akademi ini" };

    // MOCK: Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    await logAuditAction("SEND_RESET_PASSWORD", "Staff", academyId, { staff_id: staffId, email: staff.email, academy_id: academyId });

    return { success: true, message: `Link reset password telah dikirim ke ${staff.email}` };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengirim link reset password" };
  }
}

export async function inviteAdminAction(email: string, academyId: string) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };
    const superadminId = auth.session.id;

    // Validate if email already exists in this academy
    const existing = await prisma.staff.findFirst({
      where: { email, academy_id: academyId }
    });

    if (existing) {
      if (existing.deleted_at) return { error: "Email ini terdaftar sebagai admin yang dinonaktifkan." };
      return { error: "Email ini sudah terdaftar sebagai staff/admin di akademi ini." };
    }

    // MOCK: Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    await logAuditAction("INVITE_TENANT_ADMIN", "Academy", academyId, { invited_email: email });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengirim undangan" };
  }
}

// Optional: Reactivate admin for convenience with atomic quota protection
export async function reactivateAdminAction(staffId: string, academyId: string) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };
    const superadminId = auth.session.id;

    if (!staffId || !academyId) {
      return { error: "Parameter staffId dan academyId wajib diisi." };
    }

    let staffEmail = "";

    await executeWithQuotaLock(academyId, "staff", 1, async (tx) => {
      // 1. Validasi keberadaan staff target pada akademi terkait dalam transaksi terkunci
      const staff = await tx.staff.findFirst({
        where: { id: staffId, academy_id: academyId, role: "ADMIN" }
      });

      if (!staff) {
        throw new Error("Admin tidak ditemukan pada akademi ini");
      }

      // 2. Pastikan staf memang sedang soft-deleted sebelum dipulihkan
      if (staff.deleted_at === null) {
        throw new Error("Akun admin ini sudah dalam keadaan aktif.");
      }

      staffEmail = staff.email;

      // 3. Pulihkan status staf di dalam transaksi atomik
      await tx.staff.update({
        where: { id: staffId },
        data: { deleted_at: null }
      });
    });

    // 4. Catat audit log hanya jika transaksi dan mutasi database berhasil
    await logAuditAction("REACTIVATE_TENANT_ADMIN", "Staff", academyId, {
      staff_id: staffId,
      email: staffEmail,
      academy_id: academyId
    });

    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true };
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return {
        error: `Kuota staf bimbel sudah penuh. Paket "${error.planName}" hanya mengizinkan maksimal ${error.maxLimit} staf aktif (saat ini ${error.currentCount}). Hapus staf aktif yang tidak digunakan atau tingkatkan paket langganan sebelum mengaktifkan kembali akun ini.`
      };
    }
    console.error("reactivateAdminAction error:", error);
    return { error: error.message || "Gagal mengaktifkan kembali admin" };
  }
}

export async function updateAcademyAction(
  academyId: string,
  data: {
    name: string;
    planId: string;
    subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED";
    subscriptionDueDate: string | null;
  }
) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };
    const superadminId = auth.session.id;

    if (!data.name || !data.name.trim()) {
      return { error: "Nama akademi tidak boleh kosong." };
    }
    if (!data.planId) {
      return { error: "Paket langganan wajib dipilih." };
    }

    const result = await changeAcademyPlan({
      academyId,
      targetPlanId: data.planId,
      name: data.name.trim(),
      subscriptionStatus: data.subscriptionStatus,
      subscriptionDueDate: data.subscriptionDueDate ? new Date(data.subscriptionDueDate) : null,
      clearPendingPlan: true,
    });

    await logAuditAction("UPDATE_ACADEMY", "Academy", academyId, {
      academy_id: academyId,
      name: data.name,
      plan_id: data.planId,
      previous_plan_id: result.previousPlanId,
      new_plan_id: result.newPlanId,
      is_downgrade: result.isDowngrade,
      has_exceeded_quota: result.hasExceededQuota,
      subscription_status: data.subscriptionStatus,
    });

    revalidatePath(`/superadmin/academies/${academyId}`);
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true, warning: result.warningMessage };
  } catch (error: any) {
    console.error("updateAcademyAction error:", error);
    return { error: error.message || "Gagal memperbarui data akademi." };
  }
}
