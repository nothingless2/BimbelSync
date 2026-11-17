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

  // [FIX C3] Validasi MIME type dengan whitelist ketat — hanya jpeg, png, webp
  const ALLOWED_MIME_PREFIXES = ["data:image/jpeg;", "data:image/png;", "data:image/webp;"];
  if (!base64Url || !ALLOWED_MIME_PREFIXES.some((prefix) => base64Url.startsWith(prefix))) {
    return { error: "Format file tidak valid. Hanya gambar JPEG, PNG, atau WebP yang diizinkan." };
  }

  // [FIX C3] Batasi ukuran payload: base64 ~5MB = ±6.8 juta karakter
  const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // 7MB limit (lebih konservatif dari bodySizeLimit 10MB)
  if (base64Url.length > MAX_BASE64_LENGTH) {
    return { error: "Ukuran file terlalu besar. Maksimal 5MB." };
  }

  try {
    // [FIX C3] Filter berdasarkan academy_id untuk mencegah IDOR lintas tenant
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        academy_id: session.academy_id, // pastikan invoice milik tenant yang sama
      },
    });

    if (!invoice) {
      return { error: "Tagihan tidak ditemukan." };
    }

    // Verifikasi bahwa tagihan ini memang milik siswa yang sedang login
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

