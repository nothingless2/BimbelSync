"use server";

import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { sendSupportTicketEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";

export async function submitSupportTicketAction(formData: FormData) {
  const result = await requireAdminSession();
  if ("error" in result) return { error: result.error };
  const session = result.session;

  const category = (formData.get("category") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!category) {
    return { error: "Kategori kendala wajib dipilih." };
  }

  if (!message || message.length < 10) {
    return { error: "Pesan kendala minimal 10 karakter agar tim kami dapat membantu dengan jelas." };
  }

  try {
    const [staff, academy] = await Promise.all([
      prisma.staff.findUnique({
        where: { id: session.id },
        select: { email: true, name: true },
      }),
      prisma.academy.findUnique({
        where: { id: session.academy_id },
        select: { name: true, path_url: true },
      }),
    ]);

    const senderEmail = staff?.email || "unknown@bimbelsync.web.id";
    const senderName = staff?.name || "Staf Bimbel";
    const academyName = academy?.name || "Bimbel";
    const tenantSlug = academy?.path_url || session.tenant_slug || "";

    const emailRes = await sendSupportTicketEmail({
      senderEmail,
      senderName,
      academyName,
      tenantSlug,
      category,
      message,
    });

    if (!emailRes.success) {
      return { error: emailRes.error || "Gagal mengirimkan pesan ke tim support." };
    }

    // Catat ke audit log
    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "SupportTicket",
      details: {
        category,
        messageLength: message.length,
      },
    });

    return {
      success: true,
      message: "Pesan berhasil dikirim ke tim support BimbelSync! Kami akan membalas melalui email Anda.",
    };
  } catch (error: any) {
    console.error("[SUBMIT SUPPORT TICKET ERROR]:", error);
    return { error: error?.message || "Terjadi kesalahan sistem saat mengirim pesan bantuan." };
  }
}
