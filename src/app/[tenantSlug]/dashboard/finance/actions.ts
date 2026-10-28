"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { requireAdminSession } from "@/lib/session";
import { getTenantSmtpConfig, sendTenantEmail, renderInvoiceEmailTemplate } from "@/lib/tenant-mailer";

const VALID_PAYMENT_METHODS = ["GATEWAY", "MANUAL_TRANSFER", "CASH"] as const;
type PaymentMethodType = typeof VALID_PAYMENT_METHODS[number];

export async function createInvoiceAction(formData: FormData) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  const studentId = formData.get("student_id") as string;
  const descriptions = formData.getAll("item_description[]") as string[];
  const amounts = formData.getAll("item_amount[]") as string[];

  if (!studentId) {
    return { error: "Siswa harus dipilih." };
  }

  if (descriptions.length === 0 || amounts.length === 0 || descriptions.length !== amounts.length) {
    return { error: "Item tagihan tidak valid." };
  }

  // Validasi student milik academy
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student || student.academy_id !== session.academy_id) {
    return { error: "Data siswa tidak ditemukan." };
  }

  const itemsData = descriptions.map((desc, idx) => ({
    description: desc,
    amount: parseInt(amounts[idx].replace(/[^0-9]/g, ""), 10) || 0
  })).filter(item => item.description.trim() !== "" && item.amount > 0);

  if (itemsData.length === 0) {
    return { error: "Setidaknya harus ada satu item tagihan dengan nominal lebih dari 0." };
  }

  const totalAmount = itemsData.reduce((acc, curr) => acc + curr.amount, 0);

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          academy_id: session.academy_id as string,
          student_id: studentId,
          total_amount: totalAmount,
          payment_option: "FULL",
          payment_status: "UNPAID",
        }
      });

      await tx.invoiceItem.createMany({
        data: itemsData.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          amount: item.amount
        }))
      });
    });

    await createAuditLog({
      academy_id: session.academy_id as string,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Invoice",
      details: { total_amount: totalAmount, items: itemsData.length }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { error: "Terjadi kesalahan internal saat membuat tagihan." };
  }
}

export async function verifyPaymentAction(invoiceId: string, paymentMethod: string) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  // Validasi payment method terhadap enum yang diizinkan
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod as PaymentMethodType)) {
    return { error: "Metode pembayaran tidak valid." };
  }

  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!existing || existing.academy_id !== session.academy_id) {
      return { error: "Tagihan tidak ditemukan." };
    }

    if (existing.payment_status === "PAID") {
      return { error: "Tagihan ini sudah lunas." };
    }

    // PENTING: Untuk sementara role auth di MVP belum dipisah ketat di token (bisa superadmin/staff).
    // Karena session mengindikasikan user_id yang bisa berupa Staff ID atau Superadmin ID (tergantung JWT yang digenerate di login).
    // Asumsi di sini session.id adalah staff id.
    
    // Namun `verified_by_staff_id` mengharapkan referensi ke Staff.
    // Jika Superadmin yg verifikasi sbg tenant, ini bisa FK error.
    // Untuk amannya (MVP), kita kosongkan verified_by jika dia Superadmin, atau tembak id staff yang valid.
    const isStaff = await prisma.staff.findUnique({ where: { id: session.id } });

    await prisma.$transaction(async (tx) => {
      // 1. Update invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          payment_status: "PAID",
          payment_method: paymentMethod as PaymentMethodType,
          verified_by_staff_id: isStaff ? session.id : null
        }
      });

      // 2. Jika tagihan berupa cicilan, tandai semua cicilan yang belum lunas menjadi lunas
      if (existing.payment_option === "INSTALLMENT") {
        await tx.installment.updateMany({
          where: { invoice_id: invoiceId, status: { not: "PAID" } },
          data: {
            status: "PAID",
            paid_at: new Date(),
            payment_method: paymentMethod as PaymentMethodType,
            verified_by_staff_id: isStaff ? session.id : null,
          }
        });
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "VERIFY",
      entity_type: "Invoice",
      entity_id: invoiceId,
      details: { payment_method: paymentMethod, payment_option: existing.payment_option }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    revalidatePath(`/${session.tenant_slug}/dashboard/finance/${invoiceId}`);
    revalidatePath(`/${session.tenant_slug}/student/invoices`);
    revalidatePath(`/${session.tenant_slug}/student/invoices/${invoiceId}`);
    revalidatePath(`/${session.tenant_slug}/student/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { error: "Terjadi kesalahan internal saat memverifikasi pembayaran." };
  }
}

export async function verifyInstallmentAction(installmentId: string, paymentMethod: string) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod as PaymentMethodType)) {
    return { error: "Metode pembayaran tidak valid." };
  }

  try {
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        invoice: true
      }
    });

    if (!installment || installment.invoice.academy_id !== session.academy_id) {
      return { error: "Data cicilan tidak ditemukan atau akses ditolak." };
    }

    if (installment.status === "PAID") {
      return { error: "Termin cicilan ini sudah berstatus Lunas." };
    }

    const isStaff = await prisma.staff.findUnique({ where: { id: session.id } });
    let isEntireInvoicePaid = false;

    await prisma.$transaction(async (tx) => {
      // 1. Update installment status menjadi PAID
      await tx.installment.update({
        where: { id: installmentId },
        data: {
          status: "PAID",
          paid_at: new Date(),
          payment_method: paymentMethod as PaymentMethodType,
          verified_by_staff_id: isStaff ? session.id : null,
        }
      });

      // 2. Periksa apakah seluruh termin cicilan untuk invoice ini sudah lunas
      const allInstallments = await tx.installment.findMany({
        where: { invoice_id: installment.invoice_id },
        select: { id: true, status: true }
      });

      const allPaid = allInstallments.every(inst => 
        inst.id === installmentId ? true : inst.status === "PAID"
      );

      // 3. Jika semua termin lunas, otomatis ubah status tagihan induk menjadi PAID
      if (allPaid) {
        isEntireInvoicePaid = true;
        await tx.invoice.update({
          where: { id: installment.invoice_id },
          data: {
            payment_status: "PAID",
            payment_method: paymentMethod as PaymentMethodType,
            verified_by_staff_id: isStaff ? session.id : null,
          }
        });
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "VERIFY",
      entity_type: "Installment",
      entity_id: installmentId,
      details: {
        invoice_id: installment.invoice_id,
        installment_number: installment.installment_number,
        amount: installment.amount,
        payment_method: paymentMethod,
        invoice_completed: isEntireInvoicePaid,
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    revalidatePath(`/${session.tenant_slug}/dashboard/finance/${installment.invoice_id}`);
    revalidatePath(`/${session.tenant_slug}/student/invoices`);
    revalidatePath(`/${session.tenant_slug}/student/invoices/${installment.invoice_id}`);
    revalidatePath(`/${session.tenant_slug}/student/dashboard`);

    return { 
      success: true, 
      invoiceCompleted: isEntireInvoicePaid,
      message: isEntireInvoicePaid 
        ? "Seluruh cicilan telah lunas! Status tagihan otomatis menjadi LUNAS." 
        : `Termin ${installment.installment_number} berhasil ditandai Lunas.`
    };
  } catch (error) {
    console.error("Error verifying installment payment:", error);
    return { error: "Terjadi kesalahan internal saat memverifikasi pembayaran cicilan." };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!existing || existing.academy_id !== session.academy_id) {
      return { error: "Tagihan tidak ditemukan." };
    }

    if (existing.payment_status === "PAID") {
      return { error: "Tagihan yang sudah LUNAS tidak bisa dihapus." };
    }

    // Delete items first, then invoice
    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoice_id: invoiceId }
      });
      await tx.invoice.delete({
        where: { id: invoiceId }
      });
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Invoice",
      entity_id: invoiceId,
      details: { total_amount: existing.total_amount }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return { error: "Terjadi kesalahan internal saat menghapus tagihan." };
  }
}

export async function splitInstallmentsAction(
  invoiceId: string, 
  installmentsData: { amount: number; due_date: string }[]
) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { academy: { include: { plan: true } } }
    });

    if (!invoice || invoice.academy_id !== session.academy_id) {
      return { error: "Tagihan tidak ditemukan." };
    }

    if (invoice.payment_status === "PAID") {
      return { error: "Tagihan sudah lunas, tidak bisa dipecah." };
    }

    const hasPaidInstallments = await prisma.installment.findFirst({
      where: { invoice_id: invoiceId, status: "PAID" }
    });
    if (hasPaidInstallments) {
      return { error: "Tagihan ini sudah memiliki cicilan yang terbayar. Tidak dapat memecah ulang termin." };
    }

    if (!Array.isArray(installmentsData) || installmentsData.length < 2) {
      return { error: "Pecah cicilan membutuhkan minimal 2 termin." };
    }

    // Feature Gating: Tagihan Cicilan (Growth maks. 3 termin, Pro unlimited)
    const { assertFeatureAccess, getAcademySubscription, getMaxInstallmentTerms } = await import("@/lib/subscription");
    const featureCheck = await assertFeatureAccess(session.academy_id, "installment");
    if (!featureCheck.allowed) {
      return { error: featureCheck.error };
    }

    // Batasi kuota termin berdasarkan paket (misal Growth: maks. 3 termin)
    const sub = await getAcademySubscription(session.academy_id);
    if (sub) {
      const maxTerms = getMaxInstallmentTerms(sub.planName);
      if (maxTerms !== null && installmentsData.length > maxTerms) {
        return {
          error: `Paket ${sub.planName} dibatasi maksimal ${maxTerms} termin cicilan. Silakan upgrade ke paket Pro untuk membuat termin cicilan tanpa batas.`
        };
      }
    }

    const totalAssigned = installmentsData.reduce((acc, curr) => acc + curr.amount, 0);
    if (totalAssigned !== invoice.total_amount) {
      return { error: "Total cicilan tidak sesuai dengan total tagihan." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Ubah tipe pembayaran invoice
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { payment_option: "INSTALLMENT" }
      });

      // 2. Hapus installment lama (jika ada)
      await tx.installment.deleteMany({
        where: { invoice_id: invoiceId }
      });

      // 3. Buat installment baru
      await tx.installment.createMany({
        data: installmentsData.map((inst, idx) => ({
          invoice_id: invoiceId,
          installment_number: idx + 1,
          due_date: new Date(inst.due_date),
          amount: inst.amount,
          status: "UNPAID"
        }))
      });
    });

    await createAuditLog({
      academy_id: session.academy_id as string,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Invoice",
      entity_id: invoiceId,
      details: { action: "SPLIT_INSTALLMENT", terms: installmentsData.length }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance/${invoiceId}`);
    return { success: true };
  } catch (error) {
    console.error("Error splitting installments:", error);
    return { error: "Terjadi kesalahan internal saat memecah cicilan." };
  }
}

export async function updateAcademyBankInfoAction(bankName: string, bankAccount: string) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  const trimmedName = bankName?.trim();
  const trimmedAccount = bankAccount?.trim();

  if (!trimmedName || !trimmedAccount) {
    return { error: "Nama bank dan nomor rekening wajib diisi." };
  }

  try {
    await prisma.academy.update({
      where: { id: session.academy_id },
      data: {
        bank_name: trimmedName,
        bank_account: trimmedAccount,
      },
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Academy",
      entity_id: session.academy_id,
      details: {
        action: "UPDATE_ACADEMY_BANK_INFO",
        bank_name: trimmedName,
        bank_account: trimmedAccount,
      },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    revalidatePath(`/${session.tenant_slug}/student/dashboard`);
    revalidatePath(`/${session.tenant_slug}/student/invoices`);
    return { success: true };
  } catch (error) {
    console.error("Error updating academy bank info:", error);
    return { error: "Terjadi kesalahan internal saat menyimpan rekening bimbel." };
  }
}

export async function sendInvoiceEmailAction(invoiceId: string) {
  const result = await requireAdminSession();
  if ('error' in result) return { error: result.error };
  const session = result.session;

  const invoice = await prisma.invoice.findUnique({
    where: { 
      id: invoiceId,
      academy_id: session.academy_id 
    },
    include: {
      student: true,
      items: true,
      installments: {
        orderBy: { installment_number: 'asc' }
      },
      academy: true,
    }
  });

  if (!invoice) {
    return { error: "Tagihan tidak ditemukan." };
  }

  if (!invoice.student.email) {
    return { error: "Siswa ini tidak memiliki alamat email terdaftar di sistem." };
  }

  const smtpCheck = await getTenantSmtpConfig(session.academy_id);
  if ('error' in smtpCheck) return { error: smtpCheck.error };

  if (!smtpCheck.isAllowed) {
    return { error: "Fitur pengiriman email otomatis hanya tersedia pada paket Growth dan Pro." };
  }

  if (!smtpCheck.isConfigured || !smtpCheck.isActive) {
    return { error: "Layanan SMTP bimbel belum aktif atau belum dikonfigurasi di menu Pengaturan Email." };
  }

  const appBaseUrl = process.env.NEXTAUTH_URL || "https://bimbelsync.com";
  const portalUrl = `${appBaseUrl}/${session.tenant_slug}/login`;

  const formattedDueDate = new Date(invoice.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const html = renderInvoiceEmailTemplate({
    academyName: invoice.academy.name,
    studentName: invoice.student.full_name,
    invoiceNumber: "INV-" + invoice.id.slice(0, 8).toUpperCase(),
    amount: invoice.total_amount,
    dueDate: formattedDueDate,
    paymentOption: invoice.payment_option,
    installments: invoice.installments.map(i => ({
      term: i.installment_number,
      amount: i.amount,
      dueDate: new Date(i.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      isPaid: i.status === "PAID",
    })),
    bankName: invoice.academy.bank_name || undefined,
    bankAccount: invoice.academy.bank_account || undefined,
    portalUrl,
  });

  const sendResult = await sendTenantEmail({
    academyId: session.academy_id,
    to: invoice.student.email,
    subject: `[Tagihan SPP] INV-${invoice.id.slice(0, 8).toUpperCase()} - ${invoice.academy.name}`,
    html,
  });

  if (!sendResult.success) {
    return { error: sendResult.error || "Gagal mengirimkan email tagihan." };
  }

  await createAuditLog({
    academy_id: session.academy_id,
    staff_id: session.id,
    action: "UPDATE",
    entity_type: "Invoice",
    entity_id: invoice.id,
    details: {
      action: "SEND_INVOICE_EMAIL",
      recipient: invoice.student.email,
      total_amount: invoice.total_amount,
    },
  });

  revalidatePath(`/${session.tenant_slug}/dashboard/finance/${invoiceId}`);
  return { 
    success: true, 
    message: `Notifikasi tagihan berhasil dikirim ke ${invoice.student.email}.` 
  };
}

