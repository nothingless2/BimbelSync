"use server";

import prisma from "@/lib/prisma";
import { decrypt, validatePassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { StaffRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export async function createStaffAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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

  // Feature Gating: Check max_staff from Plan
  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: {
      plan: true,
      _count: {
        select: { staff: { where: { deleted_at: null } } }
      }
    }
  });

  if (!academy) return { error: "Data akademi tidak ditemukan." };

  const currentStaff = academy._count.staff;
  const maxStaff = academy.plan.max_staff;

  // max_staff === null berarti Unlimited
  if (maxStaff !== null && currentStaff >= maxStaff) {
    return { error: `Batas paket tercapai! Paket "${academy.plan.name}" hanya mengizinkan maksimal ${maxStaff} staff. Harap upgrade paket Anda untuk menambah staf lagi.` };
  }

  try {
    const existingStaff = await prisma.staff.findUnique({
      where: {
        academy_id_email: {
          academy_id: session.academy_id,
          email: email
        }
      }
    });

    if (existingStaff) {
      if (existingStaff.deleted_at) {
        return { error: "Email ini terdaftar pada staf yang sudah dihapus. Harap gunakan email lain." };
      }
      return { error: "Email ini sudah digunakan oleh staf lain." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.staff.create({
      data: {
        academy_id: session.academy_id,
        email,
        password_hash: passwordHash,
        role,
      }
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
  } catch (error) {
    console.error("Error creating staff:", error);
    return { error: "Terjadi kesalahan internal pada server saat menyimpan staf." };
  }
}

export async function updateStaffAction(staffId: string, formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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
