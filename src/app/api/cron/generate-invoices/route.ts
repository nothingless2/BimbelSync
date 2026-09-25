export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, startOfMonth, addMonths, addDays } from "date-fns";
import { createAuditLog } from "@/lib/audit";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  try {
    // 1. Otorisasi: harus punya Bearer token CRON_SECRET atau session JWT yang valid
    const authHeader = request.headers.get('authorization');
    const isCronAuth = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
    
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

    const createPromises = [];
    const generatedCountPerAcademy = new Map<string, number>();

    // 4. Siapkan Data Tagihan di Memory (RAM)
    for (const academy of academies) {
      for (const student of academy.students) {
        if (student.enrollments.length === 0) continue; 
        
        // Cek secara instan di memory, BUKAN query ke database!
        if (billedStudentIds.has(student.id)) continue; 

        // 5. Calculate totals and create Invoice items
        let totalAmount = 0;
        const invoiceItemsData = student.enrollments.map((enrollment) => {
          const amount = enrollment.program.monthly_fee;
          totalAmount += amount;
          return {
            description: `Tagihan SPP - ${enrollment.program.name} (${format(today, "MMMM yyyy", { locale: require('date-fns/locale').id })})`,
            amount: amount
          };
        });

        if (totalAmount === 0) continue;

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
              create: invoiceItemsData
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

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menerbitkan ${totalInvoicesCreated} tagihan otomatis untuk periode ${currentMonthPeriod}.` 
    });

  } catch (error) {
    console.error("Error generating invoices:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses automasi tagihan." }, { status: 500 });
  }
}
