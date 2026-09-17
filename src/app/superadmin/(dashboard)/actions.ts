"use server";

import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/auth";
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
  const durationMonths = parseInt(formData.get("duration_months") as string || "1", 10);
  const isPaid = formData.get("is_paid") === "true";

  if (!name || !pathUrl || !planId || !adminEmail || !adminPassword) return { error: "Semua field wajib diisi." };
  if (!/^[a-z0-9-]+$/.test(pathUrl)) return { error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda (-) tanpa spasi." };

  let calculatedDueDate = dueDate ? new Date(dueDate) : null;

  if (!calculatedDueDate && status === "ACTIVE" && isPaid) {
    calculatedDueDate = new Date();
    calculatedDueDate.setMonth(calculatedDueDate.getMonth() + durationMonths);
  }

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const academy = await prisma.academy.create({
      data: {
        plan_id: planId,
        name,
        path_url: pathUrl,
        subscription_status: status,
        subscription_due_date: calculatedDueDate,
        staff: { create: { email: adminEmail, password_hash: hashedPassword, role: "ADMIN" } },
      },
    });

    // Otomatisasi: Jika status langsung diset ACTIVE, buatkan Invoice bulan pertama
    if (status === "ACTIVE") {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (plan) {
        const today = new Date();
        // Jadikan tanggal awal bulan ini sebagai billing period
        const billingPeriod = new Date(today.getFullYear(), today.getMonth(), 1); 
        
        await prisma.platformInvoice.create({
          data: {
            academy_id: academy.id,
            plan_id: plan.id,
            amount: plan.price * durationMonths,
            billing_period: billingPeriod,
            due_date: calculatedDueDate || today,
            duration_months: durationMonths,
            payment_status: isPaid ? "PAID" : "UNPAID",
            paid_at: isPaid ? new Date() : null,
          }
        });
      }
    }

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
  const pathUrl = formData.get("path_url") as string;
  const planId = formData.get("plan_id") as string;
  let status = formData.get("status") as "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED_TRIAL";
  const dueDate = formData.get("subscription_due_date") as string | null;

  if (!id || !name || !planId || !status || !pathUrl) return { error: "Semua field wajib diisi." };

  // Validasi URL (Hanya huruf, angka, dan strip)
  if (!/^[a-z0-9-]+$/.test(pathUrl)) {
    return { error: "Path URL hanya boleh berisi huruf kecil, angka, dan strip (-)." };
  }

  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  if (parsedDueDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    parsedDueDate.setHours(0,0,0,0);
    // Auto suspend jika tanggal lewat
    if (parsedDueDate < today) {
      if (status === "TRIAL") {
        status = "EXPIRED_TRIAL";
      } else if (status === "ACTIVE") {
        status = "SUSPENDED";
      }
    }
  }

  try {
    await prisma.academy.update({
      where: { id },
      data: { 
        name,
        path_url: pathUrl, 
        plan_id: planId, 
        subscription_status: status,
        subscription_due_date: parsedDueDate
      },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2002") return { error: `Path URL "${pathUrl}" sudah digunakan oleh orang lain.` };
    return { error: "Gagal memperbarui akademi." };
  }
}

export async function deleteAcademyAction(id: string) {
  try {
    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) return { error: "Akademi tidak ditemukan." };

    await prisma.academy.update({
      where: { id },
      data: { 
        deleted_at: new Date(),
        path_url: `${academy.path_url}-deleted-${Date.now()}`
      },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus akademi." };
  }
}

export async function restoreAcademyAction(id: string) {
  try {
    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) return { error: "Akademi tidak ditemukan." };
    if (!academy.deleted_at) return { error: "Akademi ini tidak berada di tempat sampah." };

    // Ekstrak original slug
    const originalSlug = academy.path_url.replace(/-deleted-\d+$/, "");
    
    // Cek apakah originalSlug sudah dipakai orang lain
    const existing = await prisma.academy.findUnique({
      where: { path_url: originalSlug }
    });

    let newSlug = originalSlug;
    if (existing && existing.id !== id) {
      newSlug = `${originalSlug}-recovered-${Math.floor(Math.random() * 10000)}`;
    }

    await prisma.academy.update({
      where: { id },
      data: { 
        deleted_at: null,
        path_url: newSlug
      },
    });
    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true, restoredSlug: newSlug, collision: newSlug !== originalSlug };
  } catch (error) {
    console.error(error);
    return { error: "Gagal memulihkan akademi." };
  }
}

export async function hardDeleteAcademyAction(id: string) {
  try {
    // Karena kita tidak memakai onDelete: Cascade di schema, 
    // kita harus menghapus data secara manual dari child terdalam ke parent 
    // melalui transaksi agar tidak terjadi error P2003 (Foreign Key Constraint).
    
    await prisma.$transaction(async (tx) => {
      // 1. Ambil ID dari entitas tingkat pertama
      const students = await tx.student.findMany({ where: { academy_id: id }, select: { id: true } });
      const studentIds = students.map((s: any) => s.id);

      const invoices = await tx.invoice.findMany({ where: { academy_id: id }, select: { id: true } });
      const invoiceIds = invoices.map((i: any) => i.id);

      const rooms = await tx.room.findMany({ where: { academy_id: id }, select: { id: true } });
      const roomIds = rooms.map((r: any) => r.id);

      // 2. Hapus entitas tingkat ketiga (bergantung pada entitas tingkat kedua)
      if (studentIds.length > 0) {
        await tx.attendance.deleteMany({ where: { student_id: { in: studentIds } } });
        await tx.enrollment.deleteMany({ where: { student_id: { in: studentIds } } });
      }
      if (invoiceIds.length > 0) {
        await tx.installment.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
        await tx.invoiceItem.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
      }
      if (roomIds.length > 0) {
        await tx.schedule.deleteMany({ where: { room_id: { in: roomIds } } });
      }

      // 3. Hapus entitas tingkat kedua yang bergantung langsung pada akademi
      await tx.studentEvaluation.deleteMany({ where: { academy_id: id } });
      await tx.learningMaterial.deleteMany({ where: { academy_id: id } });
      await tx.invoice.deleteMany({ where: { academy_id: id } });
      await tx.platformInvoice.deleteMany({ where: { academy_id: id } });
      await tx.auditLog.deleteMany({ where: { academy_id: id } });

      // 4. Hapus entitas tingkat pertama
      await tx.student.deleteMany({ where: { academy_id: id } });
      await tx.staff.deleteMany({ where: { academy_id: id } });
      await tx.program.deleteMany({ where: { academy_id: id } });
      await tx.room.deleteMany({ where: { academy_id: id } });

      // 5. Akhirnya, hapus akademi itu sendiri
      await tx.academy.delete({ where: { id } });
    }, {
      timeout: 15000 // Beri waktu lebih karena delete bisa lama
    });

    revalidatePath("/superadmin/academies");
    revalidatePath("/superadmin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Hard delete error:", error);
    return { error: "Gagal menghapus permanen akademi karena konfik relasi data." };
  }
}

// ==================== SYSTEM USERS (SUPERADMIN) ====================

export async function createSuperadminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const pwValidation = validatePassword(password);
  if (!pwValidation.isValid) return { error: pwValidation.errorMsg };

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

  const pwValidation = validatePassword(password);
  if (!pwValidation.isValid) return { error: pwValidation.errorMsg };

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
