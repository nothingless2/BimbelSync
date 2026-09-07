"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createPlanAction(formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const maxStudents = formData.get("max_students") ? parseInt(formData.get("max_students") as string, 10) : null;
  const maxStaff = formData.get("max_staff") ? parseInt(formData.get("max_staff") as string, 10) : null;
  const maxRooms = formData.get("max_rooms") ? parseInt(formData.get("max_rooms") as string, 10) : null;
  const allowsPaymentGateway = formData.get("allows_payment_gateway") === "on";
  const allowsInstallment = formData.get("allows_installment") === "on";

  if (!name || isNaN(price)) {
    return { error: "Nama dan harga paket wajib diisi." };
  }

  try {
    await prisma.plan.create({
      data: {
        name,
        price,
        max_students: maxStudents,
        max_staff: maxStaff,
        max_rooms: maxRooms,
        allows_payment_gateway: allowsPaymentGateway,
        allows_installment: allowsInstallment,
      },
    });

    revalidatePath("/superadmin/plans");
    revalidatePath("/"); // Update landing page pricing
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal membuat paket. Pastikan nama paket unik." };
  }
}

export async function createAcademyAction(formData: FormData) {
  const name = formData.get("name") as string;
  const pathUrl = formData.get("path_url") as string;
  const planId = formData.get("plan_id") as string;
  const adminEmail = formData.get("admin_email") as string;
  const adminPassword = formData.get("admin_password") as string;

  if (!name || !pathUrl || !planId || !adminEmail || !adminPassword) {
    return { error: "Semua field wajib diisi." };
  }

  // Validasi slug (hanya huruf kecil, angka, dan strip)
  if (!/^[a-z0-9-]+$/.test(pathUrl)) {
    return { error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda (-) tanpa spasi." };
  }

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Buat academy dan admin dalam satu transaksi
    const academy = await prisma.academy.create({
      data: {
        plan_id: planId,
        name,
        path_url: pathUrl,
        subscription_status: "TRIAL",
        staff: {
          create: {
            email: adminEmail,
            password_hash: hashedPassword,
            role: "ADMIN",
          },
        },
      },
    });

    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin");
    return { success: true, academyId: academy.id };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: `Slug "${pathUrl}" sudah digunakan. Coba slug lain.` };
    }
    console.error(error);
    return { error: "Terjadi kesalahan saat membuat akademi." };
  }
}

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
    revalidatePath("/superadmin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal memverifikasi tagihan." };
  }
}

export async function createSuperadminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.superadmin.create({
      data: {
        email,
        password_hash: hashedPassword,
      },
    });

    revalidatePath("/superadmin/users");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "Email ini sudah digunakan oleh akun Superadmin lain." };
    }
    console.error(error);
    return { error: "Gagal membuat akun Superadmin." };
  }
}
