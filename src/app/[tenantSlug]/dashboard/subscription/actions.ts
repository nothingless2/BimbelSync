"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getAdminSession(tenantSlug: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) return null;
  const session = await decrypt(sessionCookie);
  if (!session || session.role !== "ADMIN" || session.tenant_slug !== tenantSlug) return null;
  return session;
}

export async function uploadPlatformInvoiceProofAction(tenantSlug: string, invoiceId: string, base64Url: string) {
  const session = await getAdminSession(tenantSlug);
  if (!session) return { error: "Tidak terautentikasi." };

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
