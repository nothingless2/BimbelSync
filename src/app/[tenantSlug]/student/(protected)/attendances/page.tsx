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
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 pt-8 pb-16 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Portal Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Riwayat Absensi
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Lihat riwayat kehadiran kelas per program belajar
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-8 relative z-20 max-w-4xl mx-auto">
        <Suspense fallback={<div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400">Memuat riwayat absensi...</div>}>
          <StudentAttendancesClientPage attendances={attendances} programs={programs} />
        </Suspense>
      </div>
    </div>
  );
}
