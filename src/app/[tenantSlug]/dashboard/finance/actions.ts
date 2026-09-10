"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

export async function createInvoiceAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id || !session.id) return { error: "Sesi tidak valid." };

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

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        payment_status: "PAID",
        payment_method: paymentMethod as any, // "CASH" atau "MANUAL_TRANSFER"
        verified_by_staff_id: isStaff ? session.id : null
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "VERIFY",
      entity_type: "Invoice",
      entity_id: invoiceId,
      details: { payment_method: paymentMethod }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { error: "Terjadi kesalahan internal saat memverifikasi pembayaran." };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

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

    if (!invoice.academy.plan?.allows_installment) {
      return { error: "Fitur cicilan tidak tersedia untuk paket Anda." };
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
