import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import StudentAttendancesClientPage from "./client-page";
import { Suspense } from "react";

export const metadata = {
  title: "Riwayat Absensi | BimbelSync",
};

export default async function StudentAttendancesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;
  const now = new Date();

  const [rawAttendances, student, pastSchedules] = await Promise.all([
    prisma.attendance.findMany({
      where: { student_id: session.id as string },
      include: {
        schedule: {
          include: {
            program: true,
            tutor: true,
            room: true
          }
        }
      },
      orderBy: { scanned_at: "desc" },
    }),
    prisma.student.findFirst({
      where: { id: session.id as string, deleted_at: null },
      select: {
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            program_id: true,
            enrolled_date: true,
            program: {
              select: { id: true, name: true }
            }
          }
        }
      }
    }),
    prisma.schedule.findMany({
      where: {
        status: 'SCHEDULED',
        end_time: { lte: now },
        program: {
          academy_id: session.academy_id,
          enrollments: {
            some: { student_id: session.id as string, status: 'ACTIVE' }
          }
        }
      },
      include: {
        program: true,
        tutor: true,
        room: true,
      },
      orderBy: { start_time: "desc" },
    })
  ]);

  const programs = student?.enrollments.map((e) => e.program) || [];
  const enrollmentDateMap = new Map(
    (student?.enrollments || []).map((e) => [e.program_id, new Date(e.enrolled_date)])
  );

  // Gabungkan record absensi nyata + sesi lewat yang belum direkap tutor agar sinkron dengan Beranda
  const attendanceByScheduleId = new Map(rawAttendances.map((a) => [a.schedule_id, a]));

  const unrecordedEntries = pastSchedules
    .filter((sch) => {
      if (attendanceByScheduleId.has(sch.id)) return false;
      const enrolledAt = enrollmentDateMap.get(sch.program_id);
      if (!enrolledAt) return true;
      return new Date(sch.start_time) >= enrolledAt;
    })
    .map((sch) => ({
      id: `unrecorded-${sch.id}`,
      schedule_id: sch.id,
      student_id: session.id as string,
      attendance_status: "UNRECORDED",
      scanned_at: sch.start_time,
      schedule: sch,
    }));

  const attendances = [...rawAttendances, ...unrecordedEntries].sort((a, b) => {
    const timeA = new Date(a.schedule?.start_time || a.scanned_at).getTime();
    const timeB = new Date(b.schedule?.start_time || b.scanned_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Profile Style */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Riwayat Absensi</h1>
          <p className="text-blue-100 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium">Lihat riwayat kehadiran kelas per program</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 max-w-4xl mx-auto">
        <Suspense fallback={<div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400">Memuat riwayat absensi...</div>}>
          <StudentAttendancesClientPage attendances={attendances} programs={programs} />
        </Suspense>
      </div>
    </div>
  );
}
