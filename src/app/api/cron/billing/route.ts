export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Secret key for cron job authorization
// In a real app, this should match the VERCEL_CRON_SECRET environment variable
const CRON_SECRET = process.env.CRON_SECRET || 'bimbelsync-cron-secret-123';

export async function GET(request: Request) {
  try {
    // 1. Otorisasi Request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("=== [CRON] Memulai Automasi Tagihan Bulanan ===");

    // 2. Ambil semua enrollments yang aktif
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: { academy: true }
        },
        program: true
      }
    });

    console.log(`[CRON] Menemukan ${activeEnrollments.length} siswa aktif.`);

    let successCount = 0;
    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    // 3. Proses pembuatan invoice untuk masing-masing siswa
    for (const enrollment of activeEnrollments) {
      // Jika program ini gratis atau tidak ada biaya bulanan, lewati
      if (!enrollment.program.monthly_fee || enrollment.program.monthly_fee <= 0) {
        continue;
      }

      // Jika akademi berstatus TRIAL, lewati penagihan SPP
      if (enrollment.student.academy.subscription_status === 'TRIAL') {
        console.log(`[CRON] Lewati: Akademi ${enrollment.student.academy.name} masih berstatus TRIAL.`);
        continue;
      }

      // Pastikan belum ada tagihan SPP untuk bulan dan program ini agar tidak dobel
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          student_id: enrollment.student_id,
          items: {
            some: {
              description: {
                contains: `SPP Bulan ${currentMonth}`,
                mode: 'insensitive'
              }
            }
          }
        }
      });

      if (existingInvoice) {
        console.log(`[CRON] Lewati: Siswa ${enrollment.student.full_name} sudah memiliki tagihan SPP bulan ini.`);
        continue;
      }

      // Generate Invoice
      await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            academy_id: enrollment.student.academy_id,
            student_id: enrollment.student_id,
            total_amount: enrollment.program.monthly_fee,
            payment_option: 'FULL',
            payment_status: 'UNPAID',
          }
        });

        await tx.invoiceItem.create({
          data: {
            invoice_id: invoice.id,
            description: `SPP Bulan ${currentMonth} - ${enrollment.program.name}`,
            amount: enrollment.program.monthly_fee
          }
        });
      });

      successCount++;
      
      // 4. [DUMMY] Simulasi Pengiriman Pesan WhatsApp
      const waNumber = enrollment.student.parent_whatsapp || "Tidak ada nomor WA";
      console.log(`==========================================`);
      console.log(`[WA GATEWAY - DUMMY] Mengirim pesan ke: ${waNumber}`);
      console.log(`Halo Orang Tua dari ${enrollment.student.full_name},`);
      console.log(`Tagihan SPP Bulan ${currentMonth} untuk kelas ${enrollment.program.name} sebesar Rp${enrollment.program.monthly_fee.toLocaleString('id-ID')} telah diterbitkan.`);
      console.log(`Harap segera melakukan pembayaran via Portal Siswa BimbelSync.`);
      console.log(`==========================================`);
    }

    console.log(`=== [CRON] Selesai. Total Tagihan Baru: ${successCount} ===`);

    return NextResponse.json({
      success: true,
      message: `Automasi Tagihan Bulanan selesai. ${successCount} tagihan baru dibuat.`
    });

  } catch (error) {
    console.error("[CRON] Terjadi Kesalahan:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
