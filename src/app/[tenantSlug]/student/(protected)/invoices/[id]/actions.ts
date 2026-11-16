"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStudentSession } from "@/lib/session";

export async function uploadStudentInvoiceProofAction(
  tenantSlug: string,
  invoiceId: string,
  base64Url: string
) {
  const auth = await requireStudentSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  if (!base64Url || !base64Url.startsWith("data:image/")) {
    return { error: "Format file gambar bukti pembayaran tidak valid." };
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { error: "Tagihan tidak ditemukan." };
    }

    if (invoice.student_id !== session.id) {
      return { error: "Akses ditolak: Anda tidak memiliki hak akses atas tagihan ini." };
    }

    if (invoice.payment_status === "PAID") {
      return { error: "Tagihan ini sudah berstatus Lunas." };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        proof_of_payment_url: base64Url,
        payment_method: "MANUAL_TRANSFER",
      },
    });

    revalidatePath(`/${tenantSlug}/student/invoices`);
    revalidatePath(`/${tenantSlug}/student/invoices/${invoiceId}`);
    revalidatePath(`/${tenantSlug}/dashboard/finance`);
    revalidatePath(`/${tenantSlug}/dashboard/finance/${invoiceId}`);

    return {
      success: true,
      message: "Bukti pembayaran berhasil diunggah! Mohon menunggu verifikasi dari staf administrasi bimbel.",
    };
  } catch (error: any) {
    console.error("uploadStudentInvoiceProofAction error:", error);
    return { error: error?.message || "Terjadi kesalahan internal saat mengunggah bukti pembayaran." };
  }
}

