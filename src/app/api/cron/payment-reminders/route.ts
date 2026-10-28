export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { isFeatureAllowedByPlan } from "@/lib/subscription";
import { getTenantSmtpConfig, sendTenantEmail, renderInvoiceEmailTemplate } from "@/lib/tenant-mailer";
import { createAuditLog } from "@/lib/audit";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Automasi Pengingat Tagihan SPP (Cron Job):
 * Berjalan secara terjadwal untuk mengirimkan email pengingat otomatis:
 * - H-3: Pengingat 3 hari sebelum jatuh tempo.
 * - H-1: Peringatan 1 hari sebelum jatuh tempo (Besok).
 */
export async function POST(request: Request) {
  try {
    // 1. Otorisasi
    const authHeader = request.headers.get("authorization");
    const isCronAuth = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    let sessionAcademyId: string | null = null;

    if (!isCronAuth) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("bimbelsync_session")?.value;
      if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const session = await decrypt(sessionToken);
      if (!session || (!session.academy_id && session.role !== "SUPERADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      sessionAcademyId = session.academy_id || null;
    }

    const today = new Date();
    const dateH3 = addDays(today, 3);
    const dateH1 = addDays(today, 1);

    const startH3 = startOfDay(dateH3);
    const endH3 = endOfDay(dateH3);
    const startH1 = startOfDay(dateH1);
    const endH1 = endOfDay(dateH1);

    // 2. Cari seluruh akademi dengan SMTP aktif
    const academies = await prisma.academy.findMany({
      where: {
        is_smtp_active: true,
        deleted_at: null,
        ...(sessionAcademyId ? { id: sessionAcademyId } : {}),
      },
      include: {
        plan: true,
      },
    });

    let totalSentH3 = 0;
    let totalSentH1 = 0;

    for (const academy of academies) {
      if (!isFeatureAllowedByPlan(academy.plan, "automated_email")) continue;
      if (!academy.smtp_host || !academy.smtp_user || !academy.smtp_pass) continue;

      // Cari tagihan UNPAID yang jatuh tempo pada H-3 atau H-1
      const dueInvoices = await prisma.invoice.findMany({
        where: {
          academy_id: academy.id,
          payment_status: "UNPAID",
          due_date: {
            not: null,
            gte: startH1,
            lte: endH3,
          },
        },
        include: {
          student: true,
          items: true,
          installments: true,
        },
      });

      if (dueInvoices.length === 0) continue;

      const appBaseUrl = process.env.NEXTAUTH_URL || "https://bimbelsync.com";
      const portalUrl = `${appBaseUrl}/${academy.path_url}/login`;

      for (const inv of dueInvoices) {
        if (!inv.student?.email) continue;
        if (!inv.due_date) continue;

        const invDueDate = new Date(inv.due_date);
        let reminderType: "DUE_H3" | "DUE_H1" | null = null;

        if (invDueDate >= startH1 && invDueDate <= endH1) {
          reminderType = "DUE_H1";
        } else if (invDueDate >= startH3 && invDueDate <= endH3) {
          reminderType = "DUE_H3";
        }

        if (!reminderType) continue;

        const formattedDueDate = format(invDueDate, "d MMMM yyyy", { locale: idLocale });
        const invoiceNumber = "INV-" + inv.id.slice(0, 8).toUpperCase();

        const html = renderInvoiceEmailTemplate({
          academyName: academy.name,
          studentName: inv.student.full_name,
          invoiceNumber,
          amount: inv.total_amount,
          dueDate: formattedDueDate,
          paymentOption: inv.payment_option,
          installments: inv.installments.map((i) => ({
            term: i.installment_number,
            amount: i.amount,
            dueDate: format(new Date(i.due_date), "d MMM yyyy", { locale: idLocale }),
            isPaid: i.status === "PAID",
          })),
          bankName: academy.bank_name || undefined,
          bankAccount: academy.bank_account || undefined,
          portalUrl,
          reminderType,
        });

        const subject =
          reminderType === "DUE_H1"
            ? `[Pengingat Besok] Tagihan SPP ${invoiceNumber} - ${academy.name}`
            : `[Pengingat H-3] Tagihan SPP ${invoiceNumber} - ${academy.name}`;

        const sendRes = await sendTenantEmail({
          academyId: academy.id,
          to: inv.student.email,
          subject,
          html,
        });

        if (sendRes.success) {
          if (reminderType === "DUE_H1") totalSentH1++;
          else totalSentH3++;

          await createAuditLog({
            academy_id: academy.id,
            action: "UPDATE",
            entity_type: "Invoice (Automated Reminder)",
            entity_id: inv.id,
            details: {
              type: reminderType,
              recipient: inv.student.email,
              due_date: formattedDueDate,
            },
          });
        }

        // Jeda 200ms antar pengiriman
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Automasi pengingat selesai. Terkirim H-3: ${totalSentH3}, Terkirim H-1: ${totalSentH1}.`,
      sentH3: totalSentH3,
      sentH1: totalSentH1,
    });
  } catch (error) {
    console.error("Error running automated payment reminders cron:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pengingat tagihan otomatis." },
      { status: 500 }
    );
  }
}
