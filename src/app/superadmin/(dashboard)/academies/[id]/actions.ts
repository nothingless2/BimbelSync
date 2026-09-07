"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "../../search/actions";

async function getSuperadminId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!session || session.role !== "SUPERADMIN") return null;
  return session.id as string;
}

export async function deactivateAdminAction(staffId: string, academyId: string) {
  try {
    const superadminId = await getSuperadminId();
    if (!superadminId) return { error: "Unauthorized" };

    // Tenant Isolation check: Make sure this staff belongs to the specified academy
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: academyId, role: "ADMIN" }
    });

    if (!staff) return { error: "Admin tidak ditemukan pada akademi ini" };

    await prisma.staff.update({
      where: { id: staffId },
      data: { deleted_at: new Date() }
    });

    await logAuditAction("DEACTIVATE_TENANT_ADMIN", "Staff", staffId, JSON.stringify({ email: staff.email, academy_id: academyId }));
    
    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menonaktifkan admin" };
  }
}

export async function sendResetPasswordLinkAction(staffId: string, academyId: string) {
  try {
    const superadminId = await getSuperadminId();
    if (!superadminId) return { error: "Unauthorized" };

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: academyId, role: "ADMIN" }
    });

    if (!staff) return { error: "Admin tidak ditemukan pada akademi ini" };

    // MOCK: Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    await logAuditAction("SEND_RESET_PASSWORD", "Staff", staffId, JSON.stringify({ email: staff.email, academy_id: academyId }));

    return { success: true, message: `Link reset password telah dikirim ke ${staff.email}` };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengirim link reset password" };
  }
}

export async function inviteAdminAction(email: string, academyId: string) {
  try {
    const superadminId = await getSuperadminId();
    if (!superadminId) return { error: "Unauthorized" };

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
    
    await logAuditAction("INVITE_TENANT_ADMIN", "Academy", academyId, JSON.stringify({ invited_email: email }));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengirim undangan" };
  }
}

// Optional: Reactivate admin for convenience
export async function reactivateAdminAction(staffId: string, academyId: string) {
  try {
    const superadminId = await getSuperadminId();
    if (!superadminId) return { error: "Unauthorized" };

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: academyId, role: "ADMIN" }
    });

    if (!staff) return { error: "Admin tidak ditemukan pada akademi ini" };

    await prisma.staff.update({
      where: { id: staffId },
      data: { deleted_at: null }
    });

    await logAuditAction("REACTIVATE_TENANT_ADMIN", "Staff", staffId, JSON.stringify({ email: staff.email, academy_id: academyId }));
    
    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengaktifkan kembali admin" };
  }
}
