export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, startOfMonth, addMonths, addDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { createAuditLog } from "@/lib/audit";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkAndCompleteEnrollment } from "@/lib/enrollment-completion";

// [FIX C1] Startup guard: lempar error jika CRON_SECRET tidak dikonfigurasi di .env
const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  throw new Error("CRITICAL: CRON_SECRET belum diatur di file .env! Endpoint cron tidak dapat beroperasi tanpa secret.");
}

export async function POST(request: Request) {
  try {
    // 1. Otorisasi: harus punya Bearer token CRON_SECRET atau session JWT yang valid
    const authHeader = request.headers.get('authorization');
    const isCronAuth = authHeader === `Bearer ${CRON_SECRET}`;
    
    let sessionAcademyId: string | null = null;
    
    if (!isCronAuth) {
      // Fallback: cek session JWT (untuk panggilan dari dashboard admin)
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("bimbelsync_session")?.value;
      if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const session = await decrypt(sessionToken);
      if (!session || (!session.academy_id && session.role !== 'SUPERADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      sessionAcademyId = session.academy_id || null;
    }

    // 2. Get request body
    const body = await request.json();
    const { academy_id } = body;
    
    // Jika bukan cron/superadmin, pastikan hanya bisa generate untuk akademi sendiri
    if (sessionAcademyId && academy_id !== sessionAcademyId) {
      return NextResponse.json({ error: "Forbidden: Anda hanya bisa generate untuk akademi Anda sendiri." }, { status: 403 });
    }

    const today = new Date();
    const currentMonthPeriod = format(today, "yyyy-MM"); // e.g. "2026-09"
    const dueDate = addDays(today, 10); // Due date is 10 days from today

    // 2. Fetch Academies
    const academies = await prisma.academy.findMany({
      where: {
        ...(academy_id ? { id: academy_id } : {}),
        deleted_at: null,
      },
      include: {
        students: {
          where: { deleted_at: null },
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { program: true }
            }
          }
        }
      }
    });

    let totalInvoicesCreated = 0;
    let totalCompletedEnrollments = 0;

    // 3. Ambil SELURUH Invoice yang sudah ada untuk periode ini sekaligus (O(1) query)
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        billing_period: currentMonthPeriod,
        ...(academy_id ? { academy_id: academy_id } : {})
      },
      select: { student_id: true }
    });

    // Buat Set berisi ID siswa yang sudah ditagih bulan ini agar pencarian lebih cepat (O(1) lookup)
    const billedStudentIds = new Set(existingInvoices.map(inv => inv.student_id));

    // Ambil riwayat item invoice yang pernah ditagihkan ke siswa untuk verifikasi program ONE_TIME (agar tidak ditagih ulang)
    const existingProgramInvoices = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...(academy_id ? { academy_id: academy_id } : {}),
          payment_status: { not: "VOID" },
        },
      },
      select: {
        program_id: true,
        description: true,
        invoice: {
          select: { student_id: true }
        }
      }
    });

    const billedStudentProgramKeys = new Set<string>();
    for (const item of existingProgramInvoices) {
      if (item.program_id) {
        billedStudentProgramKeys.add(`${item.invoice.student_id}_${item.program_id}`);
      }
    }

    const createPromises = [];
    const generatedCountPerAcademy = new Map<string, number>();

    // 4. Siapkan Data Tagihan di Memory (RAM)
    for (const academy of academies) {
      for (const student of academy.students) {
        if (student.enrollments.length === 0) continue; 
        
        // Cek secara instan di memory apakah sudah pernah ada invoice untuk periode ini
        if (billedStudentIds.has(student.id)) continue; 

        // Evaluasi setiap enrollment untuk auto-complete (kuota pertemuan / durasi habis) dan skema pembayaran (ONE_TIME vs MONTHLY)
        const eligibleInvoiceItems = [];
        let totalAmount = 0;

        for (const enrollment of student.enrollments) {
          // 1. Cek auto-stop / auto-complete jika kuota pertemuan atau durasi bulan terpenuhi
          const checkRes = await checkAndCompleteEnrollment(student.id, enrollment.program_id);
          if (checkRes.completed) {
            totalCompletedEnrollments++;
            continue; // Langsung lewati program yang telah selesai, TIDAK DITAGIH LAGI
          }

          // 2. Cek program Sekali Bayar (ONE_TIME / Uang Dibayar Dimuka)
          if (enrollment.program.billing_type === "ONE_TIME") {
            const key = `${student.id}_${enrollment.program_id}`;
            // Jika siswa sudah pernah ditagih untuk program ini (atau ada item dengan nama program), JANGAN TAGIH LAGI
            const hasBeenBilled = billedStudentProgramKeys.has(key) ||
              existingProgramInvoices.some(
                item => item.invoice.student_id === student.id && item.description.includes(enrollment.program.name)
              );

            if (hasBeenBilled) {
              continue; // Program sekali bayar / bayar dimuka yang sudah pernah dibuat tagihannya tidak akan ditagih lagi
            }

            // Jika belum pernah ditagih sama sekali (initial enrollment), buat tagihan paket 1x
            if (enrollment.program.monthly_fee > 0) {
              totalAmount += enrollment.program.monthly_fee;
              eligibleInvoiceItems.push({
                program_id: enrollment.program.id,
                description: `Biaya Paket Program ${enrollment.program.name} (Sekali Bayar)`,
                amount: enrollment.program.monthly_fee,
              });
              billedStudentProgramKeys.add(key);
            }
            continue;
          }

          // 3. Program Berulang Bulanan (MONTHLY)
          if (enrollment.program.monthly_fee > 0) {
            totalAmount += enrollment.program.monthly_fee;
            eligibleInvoiceItems.push({
              program_id: enrollment.program.id,
              description: `Tagihan SPP - ${enrollment.program.name} (${format(today, "MMMM yyyy", { locale: idLocale })})`,
              amount: enrollment.program.monthly_fee,
            });
          }
        }

        // Jika tidak ada item yang harus ditagih (misal semua program sudah selesai atau sudah lunas dimuka), lewati
        if (eligibleInvoiceItems.length === 0 || totalAmount === 0) continue;

        // 6. Kumpulkan tugas pembuatan (Promises)
        const createInvoiceTask = prisma.invoice.create({
          data: {
            academy_id: academy.id,
            student_id: student.id,
            total_amount: totalAmount,
            payment_option: "FULL",
            payment_status: "UNPAID",
            billing_period: currentMonthPeriod,
            due_date: dueDate,
            items: {
              create: eligibleInvoiceItems
            }
          }
        });

        createPromises.push(createInvoiceTask);
        generatedCountPerAcademy.set(academy.id, (generatedCountPerAcademy.get(academy.id) || 0) + 1);
      }
    }

    // 7. Eksekusi semua tugas database SECARA PARALEL (Batching)
    if (createPromises.length > 0) {
      // Chunking if too many promises (e.g. 500 max per batch)
      const chunkSize = 100;
      for (let i = 0; i < createPromises.length; i += chunkSize) {
        const chunk = createPromises.slice(i, i + chunkSize);
        await Promise.all(chunk);
      }
      totalInvoicesCreated = createPromises.length;
      
      // Catat ke Audit Log untuk academy yang terkena dampak
      if (academy_id) {
        await createAuditLog({
          academy_id: academy_id,
          action: "CREATE",
          entity_type: "Invoice (System Cron)",
          details: { total_invoices_generated: totalInvoicesCreated, billing_period: currentMonthPeriod }
        });
      } else {
        // Jika global, catat untuk setiap academy
        for (const [acadId, count] of generatedCountPerAcademy.entries()) {
          await createAuditLog({
            academy_id: acadId,
            action: "CREATE",
            entity_type: "Invoice (System Cron)",
            details: { total_invoices_generated: count, billing_period: currentMonthPeriod }
          });
        }
      }
    }

    // 8. Kirimkan email otomatis jika diminta dan SMTP aktif
    let emailSentCount = 0;
    if (totalInvoicesCreated > 0 && (body.send_email || body.sendEmail) && academy_id) {
      try {
        const { getTenantSmtpConfig, sendTenantEmail, renderInvoiceEmailTemplate } = await import("@/lib/tenant-mailer");
        const smtpCheck = await getTenantSmtpConfig(academy_id);
        
        if (smtpCheck.isAllowed && smtpCheck.isConfigured && smtpCheck.isActive) {
          const freshInvoices = await prisma.invoice.findMany({
            where: {
              academy_id: academy_id,
              billing_period: currentMonthPeriod,
              payment_status: "UNPAID",
            },
            include: {
              student: true,
              items: true,
              academy: true,
              installments: true,
            }
          });

          const appBaseUrl = process.env.NEXTAUTH_URL || "https://bimbelsync.web.id";
          const tenantSlug = freshInvoices[0]?.academy.path_url || "";
          const portalUrl = `${appBaseUrl}/${tenantSlug}/login`;

          for (const inv of freshInvoices) {
            if (!inv.student?.email) continue;

            const formattedDueDate = inv.due_date 
              ? format(new Date(inv.due_date), "d MMMM yyyy", { locale: idLocale })
              : format(new Date(inv.created_at), "d MMMM yyyy", { locale: idLocale });

            const html = renderInvoiceEmailTemplate({
              academyName: inv.academy.name,
              studentName: inv.student.full_name,
              invoiceNumber: "INV-" + inv.id.slice(0, 8).toUpperCase(),
              amount: inv.total_amount,
              dueDate: formattedDueDate,
              paymentOption: inv.payment_option,
              installments: inv.installments.map(i => ({
                term: i.installment_number,
                amount: i.amount,
                dueDate: format(new Date(i.due_date), "d MMM yyyy", { locale: idLocale }),
                isPaid: i.status === "PAID",
              })),
              bankName: inv.academy.bank_name || undefined,
              bankAccount: inv.academy.bank_account || undefined,
              portalUrl,
              reminderType: "ISSUED",
            });

            const sendRes = await sendTenantEmail({
              academyId: academy_id,
              to: inv.student.email,
              subject: `[Tagihan SPP] INV-${inv.id.slice(0, 8).toUpperCase()} - ${inv.academy.name}`,
              html,
            });

            if (sendRes.success) {
              emailSentCount++;
            }

            await new Promise(r => setTimeout(r, 200));
          }
        }
      } catch (mailErr) {
        console.error("Error sending emails during invoice generation:", mailErr);
      }
    }

    const completedMsg = totalCompletedEnrollments > 0 ? ` (${totalCompletedEnrollments} kepesertaan program ditandai selesai otomatis)` : "";
    const extraMsg = emailSentCount > 0 ? ` serta mengirimkan ${emailSentCount} email notifikasi tagihan ke siswa.` : ".";
    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menerbitkan ${totalInvoicesCreated} tagihan otomatis untuk periode ${currentMonthPeriod}${completedMsg}${extraMsg}`,
      invoicesCreated: totalInvoicesCreated,
      completedEnrollments: totalCompletedEnrollments,
      emailsSent: emailSentCount,
    });

  } catch (error) {
    console.error("Error generating invoices:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses automasi tagihan." }, { status: 500 });
  }
}
