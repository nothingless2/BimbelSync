"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";

export async function uploadPlatformInvoiceProofAction(tenantSlug: string, invoiceId: string, base64Url: string) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (session.tenant_slug && session.tenant_slug !== tenantSlug) {
    return { error: "Akses ditolak." };
  }

  try {
    const invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) return { error: "Tagihan tidak ditemukan." };
    if (invoice.academy_id !== session.academy_id) return { error: "Akses ditolak." };
    if (invoice.payment_status === "PAID") return { error: "Tagihan sudah lunas." };

    await prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: {
        proof_of_payment_url: base64Url,
      }
    });

    revalidatePath(`/${tenantSlug}/dashboard/subscription`);
    return { success: true };
  } catch (error) {
    console.error("uploadPlatformInvoiceProofAction error:", error);
    return { error: "Terjadi kesalahan saat mengunggah bukti pembayaran." };
  }
}
