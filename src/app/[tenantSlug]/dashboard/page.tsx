import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClientPage from "./client-page";

export default async function DashboardHome({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  const academyId = session.academy_id as string;
  const today = new Date();
  
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  // Menarik semua data yang dibutuhkan secara paralel
  const [totalStudents, todaySchedules, invoices] = await Promise.all([
    // 1. Total Siswa Aktif
    prisma.student.count({
      where: {
        academy_id: academyId,
        deleted_at: null
      }
    }),
    
    // 2. Kelas Hari Ini
    prisma.schedule.findMany({
      where: {
        program: {
          academy_id: academyId
        },
        start_time: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'SCHEDULED' // Only get scheduled ones
      },
      include: {
        program: true,
        room: true,
        tutor: true
      },
      orderBy: {
        start_time: 'asc'
      }
    }),

    // 3. Invoice untuk menghitung piutang & mencari pembayaran terakhir
    prisma.invoice.findMany({
      where: {
        academy_id: academyId,
      },
      include: {
        student: true
      },
      orderBy: {
        id: 'desc'
      }
    })
  ]);

  // Kalkulasi Tunggakan (UNPAID / OVERDUE)
  const totalUnpaid = invoices
    .filter(inv => inv.payment_status === 'UNPAID' || inv.payment_status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  // 5 Pembayaran Terakhir (PAID)
  const recentPayments = invoices
    .filter(inv => inv.payment_status === 'PAID')
    .slice(0, 5);

  return (
    <DashboardClientPage 
      tenantSlug={tenantSlug}
      totalStudents={totalStudents}
      todayClassesCount={todaySchedules.length}
      totalUnpaid={totalUnpaid}
      todaySchedules={todaySchedules}
      recentPayments={recentPayments}
    />
  );
}
