"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

// ==================== PLAN (PAKET BERLANGGANAN) ====================

export async function createPlanAction(formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const maxStudents = formData.get("max_students") ? parseInt(formData.get("max_students") as string, 10) : null;
  const maxStaff = formData.get("max_staff") ? parseInt(formData.get("max_staff") as string, 10) : null;
  const maxRooms = formData.get("max_rooms") ? parseInt(formData.get("max_rooms") as string, 10) : null;
  const allowsPaymentGateway = formData.get("allows_payment_gateway") === "on";
  const allowsInstallment = formData.get("allows_installment") === "on";

  if (!name || isNaN(price)) return { error: "Nama dan harga paket wajib diisi." };

  try {
    await prisma.plan.create({
      data: { name, price, max_students: maxStudents, max_staff: maxStaff, max_rooms: maxRooms, allows_payment_gateway: allowsPaymentGateway, allows_installment: allowsInstallment },
    });
    revalidatePath("/superadmin/plans");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal membuat paket." };
  }
}

export async function updatePlanAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const maxStudents = formData.get("max_students") ? parseInt(formData.get("max_students") as string, 10) : null;
  const maxStaff = formData.get("max_staff") ? parseInt(formData.get("max_staff") as string, 10) : null;
  const maxRooms = formData.get("max_rooms") ? parseInt(formData.get("max_rooms") as string, 10) : null;
  const allowsPaymentGateway = formData.get("allows_payment_gateway") === "on";
  const allowsInstallment = formData.get("allows_installment") === "on";

  if (!id || !name || isNaN(price)) return { error: "ID, Nama dan harga paket wajib diisi." };

  try {
    await prisma.plan.update({
      where: { id },
      data: { name, price, max_students: maxStudents, max_staff: maxStaff, max_rooms: maxRooms, allows_payment_gateway: allowsPaymentGateway, allows_installment: allowsInstallment },
    });
    revalidatePath("/superadmin/plans");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal memperbarui paket." };
  }
}

export async function deletePlanAction(id: string) {
  try {
    await prisma.plan.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
    revalidatePath("/superadmin/plans");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus paket." };
  }
}

// ==================== ACADEMY (BIMBEL) ====================

export async function createAcademyAction(formData: FormData) {
  const name = formData.get("name") as string;
  const pathUrl = formData.get("path_url") as string;
  const planId = formData.get("plan_id") as string;
  const adminEmail = formData.get("admin_email") as string;
  const adminPassword = formData.get("admin_password") as string;
  const status = (formData.get("status") as string || "TRIAL") as "TRIAL" | "ACTIVE" | "SUSPENDED";
  const dueDate = formData.get("subscription_due_date") as string | null;

  if (!name || !pathUrl || !planId || !adminEmail || !adminPassword) return { error: "Semua field wajib diisi." };
  if (!/^[a-z0-9-]+$/.test(pathUrl)) return { error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda (-) tanpa spasi." };

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const academy = await prisma.academy.create({
      data: {
        plan_id: planId,
        name,
        path_url: pathUrl,
        subscription_status: status,
        subscription_due_date: dueDate ? new Date(dueDate) : null,
        staff: { create: { email: adminEmail, password_hash: hashedPassword, role: "ADMIN" } },
      },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true, academyId: academy.id };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: `Slug "${pathUrl}" sudah digunakan.` };
    return { error: "Terjadi kesalahan saat membuat akademi." };
  }
}

export async function updateAcademyAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const planId = formData.get("plan_id") as string;
  let status = formData.get("status") as "TRIAL" | "ACTIVE" | "SUSPENDED";
  const dueDate = formData.get("subscription_due_date") as string | null;

  if (!id || !name || !planId || !status) return { error: "Semua field wajib diisi." };

  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  if (parsedDueDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    parsedDueDate.setHours(0,0,0,0);
    // Auto suspend jika tanggal lewat
    if (parsedDueDate < today) {
      status = "SUSPENDED";
    }
  }

  try {
    await prisma.academy.update({
      where: { id },
      data: { 
        name, 
        plan_id: planId, 
        subscription_status: status,
        subscription_due_date: parsedDueDate
      },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal memperbarui akademi." };
  }
}

export async function deleteAcademyAction(id: string) {
  try {
    await prisma.academy.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus akademi." };
  }
}

// ==================== SYSTEM USERS (SUPERADMIN) ====================

export async function createSuperadminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan password wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.superadmin.create({
      data: { email, password_hash: hashedPassword },
    });
    revalidatePath("/superadmin/users");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") return { error: "Email ini sudah digunakan oleh akun Superadmin lain." };
    return { error: "Gagal membuat akun Superadmin." };
  }
}

export async function updateSuperadminAction(formData: FormData) {
  const id = formData.get("id") as string;
  const password = formData.get("password") as string;

  if (!id || !password) return { error: "Password wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.superadmin.update({
      where: { id },
      data: { password_hash: hashedPassword },
    });
    revalidatePath("/superadmin/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate password Superadmin." };
  }
}

export async function deleteSuperadminAction(id: string) {
  try {
    await prisma.superadmin.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    revalidatePath("/superadmin/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus akun Superadmin." };
  }
}

// ==================== BILLING ====================

export async function verifyPlatformInvoiceAction(invoiceId: string, superadminId: string) {
  try {
    await prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: {
        payment_status: "PAID",
        paid_at: new Date(),
        verified_by_superadmin_id: superadminId,
      },
    });
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal memverifikasi tagihan." };
  }
}
