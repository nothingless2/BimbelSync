"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSuperadminId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!session || session.role !== "SUPERADMIN") return null;
  return session.id as string;
}

async function logAction(superadminId: string, action: string, entityId: string, details: object) {
  await prisma.auditLog.create({
    data: {
      superadmin_id: superadminId,
      action,
      entity_type: "PlatformInvoice",
      entity_id: entityId,
      details,
    },
  });
}

export async function deleteInvoiceAction(invoiceId: string) {
  const superadminId = await getSuperadminId();
  if (!superadminId) return { error: "Tidak terautentikasi." };

  try {
    const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };
    if (invoice.payment_status === "PAID") return { error: "Invoice yang sudah lunas tidak bisa dihapus. Void terlebih dahulu jika diperlukan." };

    await prisma.platformInvoice.delete({ where: { id: invoiceId } });

    await logAction(superadminId, "DELETE_PLATFORM_INVOICE", invoiceId, {
      invoice_id: invoiceId,
      academy_id: invoice.academy_id,
      amount: invoice.amount,
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${invoice.academy_id}`);
    return { success: true };
  } catch (error) {
    console.error("deleteInvoiceAction error:", error);
    return { error: "Terjadi kesalahan saat menghapus invoice." };
  }
}

export async function verifyInvoiceAction(invoiceId: string) {
  const superadminId = await getSuperadminId();
  if (!superadminId) return { error: "Tidak terautentikasi." };

  try {
    const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };
    if (invoice.payment_status === "PAID") return { error: "Invoice ini sudah berstatus Lunas." };
    if (invoice.payment_status === "VOID") return { error: "Invoice ini sudah di-void." };

    const academy = await prisma.academy.findUnique({ where: { id: invoice.academy_id } });
    if (!academy) return { error: "Akademi tidak ditemukan." };

    // Kalkulasi jatuh tempo baru: jika sudah punya jatuh tempo, tambah 1 bulan. Jika belum, tambah 1 bulan dari hari ini.
    let newDueDate = new Date();
    if (academy.subscription_due_date) {
      newDueDate = new Date(academy.subscription_due_date);
    }
    newDueDate.setMonth(newDueDate.getMonth() + 1);

    await prisma.$transaction([
      prisma.platformInvoice.update({
        where: { id: invoiceId },
        data: {
          payment_status: "PAID",
          paid_at: new Date(),
          verified_by_superadmin_id: superadminId,
        },
      }),
      prisma.academy.update({
        where: { id: invoice.academy_id },
        data: {
          subscription_status: "ACTIVE",
          subscription_due_date: newDueDate
        }
      })
    ]);

    await logAction(superadminId, "VERIFY_PLATFORM_INVOICE", invoiceId, {
      invoice_id: invoiceId,
      academy_id: invoice.academy_id,
      action: "Marked as PAID",
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${invoice.academy_id}`);
    return { success: true };
  } catch (error) {
    console.error("verifyInvoiceAction error:", error);
    return { error: "Terjadi kesalahan saat memverifikasi invoice." };
  }
}


export async function markOverdueAction(invoiceId: string) {
  const superadminId = await getSuperadminId();
  if (!superadminId) return { error: "Tidak terautentikasi." };

  try {
    const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };
    if (invoice.payment_status !== "UNPAID") return { error: "Hanya invoice UNPAID yang bisa ditandai Overdue." };

    await prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: { payment_status: "OVERDUE" },
    });

    await logAction(superadminId, "MARK_INVOICE_OVERDUE", invoiceId, {
      invoice_id: invoiceId,
      academy_id: invoice.academy_id,
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${invoice.academy_id}`);
    return { success: true };
  } catch (error) {
    console.error("markOverdueAction error:", error);
    return { error: "Terjadi kesalahan." };
  }
}

export async function voidInvoiceAction(invoiceId: string) {
  const superadminId = await getSuperadminId();
  if (!superadminId) return { error: "Tidak terautentikasi." };

  try {
    const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };
    if (invoice.payment_status === "PAID") return { error: "Invoice yang sudah lunas tidak bisa di-void." };

    await prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: { payment_status: "VOID" },
    });

    await logAction(superadminId, "VOID_PLATFORM_INVOICE", invoiceId, {
      invoice_id: invoiceId,
      academy_id: invoice.academy_id,
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${invoice.academy_id}`);
    return { success: true };
  } catch (error) {
    console.error("voidInvoiceAction error:", error);
    return { error: "Terjadi kesalahan." };
  }
}

export async function createInvoiceAction(academyId: string, planId: string, amount: number, billingPeriod: string, dueDate: string, accessValidUntil: string) {
  const superadminId = await getSuperadminId();
  if (!superadminId) return { error: "Tidak terautentikasi." };

  try {
    const newInvoice = await prisma.platformInvoice.create({
      data: {
        academy_id: academyId,
        plan_id: planId,
        amount,
        billing_period: new Date(billingPeriod),
        due_date: new Date(dueDate),
        payment_status: "UNPAID",
      },
    });

    await logAction(superadminId, "CREATE_PLATFORM_INVOICE", newInvoice.id, {
      academy_id: academyId,
      amount,
      billing_period: billingPeriod,
    });

    // Otomatisasi Sinkronisasi Akses
    await prisma.academy.update({
      where: { id: academyId },
      data: {
        subscription_due_date: new Date(accessValidUntil),
        subscription_status: "ACTIVE",
      }
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true, invoiceId: newInvoice.id };
  } catch (error) {
    console.error("createInvoiceAction error:", error);
    return { error: "Terjadi kesalahan saat membuat invoice." };
  }
}
