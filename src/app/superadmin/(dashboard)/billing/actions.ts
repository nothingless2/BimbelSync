"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperadminSession } from "@/lib/session";
import { changeAcademyPlan, activateAllDuePendingPlans } from "@/lib/subscription";
import { SubscriptionStatus } from "@prisma/client";

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
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const superadminId = auth.session.id;

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
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const superadminId = auth.session.id;

  try {
    const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };
    if (invoice.payment_status === "PAID") return { error: "Invoice ini sudah berstatus Lunas." };
    if (invoice.payment_status === "VOID") return { error: "Invoice ini sudah di-void." };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let warningMessage: string | undefined;

    await prisma.$transaction(async (tx) => {
      // 1. Kunci baris Academy secara eksklusif (Row-Level Lock)
      const lockedAcademies = await tx.$queryRaw<Array<{
        id: string;
        plan_id: string;
        subscription_status: SubscriptionStatus;
        subscription_due_date: Date | null;
      }>>`
        SELECT id, plan_id, subscription_status, subscription_due_date
        FROM "Academy"
        WHERE id = ${invoice.academy_id}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `;

      if (lockedAcademies.length === 0) {
        throw new Error("Akademi tidak ditemukan atau telah dinonaktifkan.");
      }

      const academy = lockedAcademies[0];

      // 2. Kalkulasi jatuh tempo baru
      let newDueDate = new Date();
      if (academy.subscription_due_date && new Date(academy.subscription_due_date) > today) {
        newDueDate = new Date(academy.subscription_due_date);
      }
      const duration = invoice.duration_months || 1;
      newDueDate.setMonth(newDueDate.getMonth() + duration);

      // 3. Update invoice menjadi PAID
      await tx.platformInvoice.update({
        where: { id: invoiceId },
        data: {
          payment_status: "PAID",
          paid_at: new Date(),
          verified_by_superadmin_id: superadminId,
        },
      });

      // 4. Evaluasi pergantian paket atau perpanjangan
      const isPlanChange = invoice.plan_id !== academy.plan_id;
      const isDueDateInFuture = academy.subscription_due_date && new Date(academy.subscription_due_date) > today;

      if (isPlanChange && !isDueDateInFuture) {
        // Langsung terapkan paket baru hari ini karena belum ada jatuh tempo aktif di masa depan
        const changeResult = await changeAcademyPlan({
          academyId: invoice.academy_id,
          targetPlanId: invoice.plan_id,
          subscriptionStatus: "ACTIVE",
          subscriptionDueDate: newDueDate,
          clearPendingPlan: true,
          tx,
        });
        warningMessage = changeResult.warningMessage;
      } else if (isPlanChange && isDueDateInFuture) {
        // Jadwalkan perubahan paket saat masa aktif paket lama habis
        await tx.academy.update({
          where: { id: invoice.academy_id },
          data: {
            subscription_status: "ACTIVE",
            subscription_due_date: newDueDate,
            pending_plan_id: invoice.plan_id,
            pending_plan_date: academy.subscription_due_date,
          },
        });
      } else {
        // Perpanjangan paket yang sama
        await tx.academy.update({
          where: { id: invoice.academy_id },
          data: {
            subscription_status: "ACTIVE",
            subscription_due_date: newDueDate,
          },
        });
      }
    });

    await logAction(superadminId, "VERIFY_PLATFORM_INVOICE", invoiceId, {
      invoice_id: invoiceId,
      academy_id: invoice.academy_id,
      action: "Marked as PAID",
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${invoice.academy_id}`);
    return { success: true, warning: warningMessage };
  } catch (error: any) {
    console.error("verifyInvoiceAction error:", error);
    return { error: error.message || "Terjadi kesalahan saat memverifikasi invoice." };
  }
}


export async function markOverdueAction(invoiceId: string) {
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const superadminId = auth.session.id;

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
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const superadminId = auth.session.id;

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

export async function createInvoiceAction(academyId: string, planId: string, amount: number, billingPeriod: string, dueDate: string, durationMonths: number = 1) {
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const superadminId = auth.session.id;

  try {
    const academy = await prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy) return { error: "Akademi tidak ditemukan." };
    if (academy.subscription_status === "TRIAL") return { error: "Tidak dapat membuat invoice untuk akademi berstatus TRIAL." };

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || plan.deleted_at !== null) return { error: "Paket langganan tidak valid atau telah dinonaktifkan." };

    const newInvoice = await prisma.platformInvoice.create({
      data: {
        academy_id: academyId,
        plan_id: planId,
        amount,
        billing_period: new Date(billingPeriod),
        due_date: new Date(dueDate),
        payment_status: "UNPAID",
        duration_months: durationMonths,
      },
    });

    await logAction(superadminId, "CREATE_PLATFORM_INVOICE", newInvoice.id, {
      academy_id: academyId,
      amount,
      billing_period: billingPeriod,
    });

    revalidatePath("/superadmin/billing");
    revalidatePath(`/superadmin/academies/${academyId}`);
    return { success: true, invoiceId: newInvoice.id };
  } catch (error) {
    console.error("createInvoiceAction error:", error);
    return { error: "Terjadi kesalahan saat membuat invoice." };
  }
}

export async function triggerPendingPlansActivationAction() {
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };

  try {
    const result = await activateAllDuePendingPlans();
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/academies");
    return { success: true, ...result };
  } catch (error: any) {
    console.error("triggerPendingPlansActivationAction error:", error);
    return { error: error.message || "Gagal memproses aktivasi paket tertunda." };
  }
}

export async function updatePlatformBankInfoAction(bankName: string, bankAccount: string) {
  const auth = await requireSuperadminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const trimmedName = bankName?.trim();
  const trimmedAccount = bankAccount?.trim();

  if (!trimmedName || !trimmedAccount) {
    return { error: "Nama bank dan nomor rekening wajib diisi." };
  }

  try {
    await prisma.$transaction([
      prisma.platformSetting.upsert({
        where: { key: "bank_name" },
        update: { value: trimmedName },
        create: { key: "bank_name", value: trimmedName },
      }),
      prisma.platformSetting.upsert({
        where: { key: "bank_account" },
        update: { value: trimmedAccount },
        create: { key: "bank_account", value: trimmedAccount },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        superadmin_id: session.id,
        action: "UPDATE_PLATFORM_SETTINGS",
        entity_type: "PlatformSetting",
        details: {
          setting: "bank_account_info",
          bank_name: trimmedName,
          bank_account: trimmedAccount,
        },
      },
    });

    revalidatePath("/superadmin/billing");
    revalidatePath("/[tenantSlug]/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("updatePlatformBankInfoAction error:", error);
    return { error: "Terjadi kesalahan saat menyimpan pengaturan rekening bank." };
  }
}

