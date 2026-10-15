"use server";

import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { StaffRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { requireAdminSession } from "@/lib/session";
import { executeWithQuotaLock, QuotaExceededError } from "@/lib/subscription";

export async function createStaffAction(formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as StaffRole;

  if (!email || !password || !role) {
    return { error: "Semua field (Email, Password, Role) wajib diisi." };
  }

  const pwValidation = validatePassword(password);
  if (!pwValidation.isValid) {
    return { error: pwValidation.errorMsg };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await executeWithQuotaLock(session.academy_id, "staff", 1, async (tx) => {
      const existingStaff = await tx.staff.findUnique({
        where: {
          academy_id_email: {
            academy_id: session.academy_id as string,
            email: email
          }
        }
      });

      if (existingStaff) {
        if (existingStaff.deleted_at) {
          throw new Error("Email ini terdaftar pada staf yang sudah dihapus. Harap gunakan email lain.");
        }
        throw new Error("Email ini sudah digunakan oleh staf lain.");
      }

      await tx.staff.create({
        data: {
          academy_id: session.academy_id as string,
          email,
          password_hash: passwordHash,
          role,
        }
      });
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Staff",
      details: { email, role }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/staff`);
    return { success: true };
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }
    console.error("Error creating staff:", error);
    return { error: error.message || "Terjadi kesalahan internal pada server saat menyimpan staf." };
  }
}

export async function updateStaffAction(staffId: string, formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const role = formData.get("role") as StaffRole;
  const password = formData.get("password") as string; // Optional reset password

  try {
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Staf tidak ditemukan." };

    const updateData: any = { role };
    if (password) {
      const pwValidation = validatePassword(password);
      if (!pwValidation.isValid) {
        return { error: pwValidation.errorMsg };
      }
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: updateData
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Staff",
      entity_id: staffId,
      details: { role, updated_password: !!password }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/staff`);
    return { success: true };
  } catch (error) {
    console.error("Error updating staff:", error);
    return { error: "Terjadi kesalahan internal pada server saat mengupdate staf." };
  }
}

export async function deleteStaffAction(staffId: string) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Staf tidak ditemukan." };

    await prisma.staff.update({
      where: { id: staffId },
      data: { deleted_at: new Date() }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Staff",
      entity_id: staffId,
      details: { email: existing.email }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/staff`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting staff:", error);
    return { error: "Terjadi kesalahan internal pada server saat menghapus staf." };
  }
}
