import { requireStaffSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import DashboardClientPage from "./client-page";

export default async function DashboardHome({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const auth = await requireStaffSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/login`);
  }
  const session = auth.session;

  if (session.tenant_slug !== tenantSlug) {
    redirect(`/${session.tenant_slug}/dashboard`);
  }

  // Gunakan session.role terverifikasi dari DB (ter-cache per request)
  const isTutor = session.role === 'TUTOR';
  const academyId = session.academy_id;
  const today = new Date();
  
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Menarik semua data yang dibutuhkan secara paralel dengan query yang teroptimasi
  const [totalStudents, todaySchedules, unpaidAgg, recentPayments, thisMonthClassesCount, pendingAttendanceCount] = await Promise.all([
    // 1. Total Siswa Aktif (Hanya ADMIN)
    !isTutor ? prisma.student.count({
      where: {
        academy_id: academyId,
        deleted_at: null
      }
    }) : Promise.resolve(0),
    
    // 2. Kelas Hari Ini
    prisma.schedule.findMany({
      where: {
        program: {
          academy_id: academyId
        },
        ...(isTutor ? { tutor_id: session.id } : {}),
        start_time: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'SCHEDULED'
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

    // 3. Agregasi Tunggakan Piutang (O(1) memory & kalkulasi langsung di PostgreSQL)
    !isTutor ? prisma.invoice.aggregate({
      where: {
        academy_id: academyId,
        payment_status: { in: ['UNPAID', 'OVERDUE'] }
      },
      _sum: {
        total_amount: true
      }
    }) : Promise.resolve({ _sum: { total_amount: 0 } }),

    // 4. Ambil 5 Pembayaran Terakhir (PAID) secara spesifik (LIMIT 5)
    !isTutor ? prisma.invoice.findMany({
      where: {
        academy_id: academyId,
        payment_status: 'PAID'
      },
      include: {
        student: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    }) : Promise.resolve([]),

    // 5. Total Kelas Bulan Ini (Hanya TUTOR)
    isTutor ? prisma.schedule.count({
      where: {
        tutor_id: session.id,
        start_time: {
          gte: startOfMonth(today),
          lte: endOfMonth(today)
        },
        status: 'SCHEDULED'
      }
    }) : Promise.resolve(0),

    // 6. Absensi Tertunda (Hanya TUTOR)
    isTutor ? prisma.schedule.count({
      where: {
        tutor_id: session.id,
        end_time: { lt: today },
        status: 'SCHEDULED',
        attendances: { none: {} }
      }
    }) : Promise.resolve(0)
  ]);

  const totalUnpaid = unpaidAgg._sum?.total_amount || 0;

  return (
    <DashboardClientPage 
      tenantSlug={tenantSlug}
      userRole={session.role || 'ADMIN'}
      totalStudents={totalStudents}
      todayClassesCount={todaySchedules.length}
      totalUnpaid={totalUnpaid}
      todaySchedules={todaySchedules}
      recentPayments={recentPayments}
      thisMonthClassesCount={thisMonthClassesCount}
      pendingAttendanceCount={pendingAttendanceCount}
    />
  );
}
