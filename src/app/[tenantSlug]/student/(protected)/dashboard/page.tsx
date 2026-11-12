import { requireStudentSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import StudentSchedulesClientPage from '../schedules/client-page';
import { StudentBillingBanner } from '@/components/student-billing-banner';
import { StudentMilestoneCard } from '@/components/student/student-milestone-card';
import { StudentRecentAttendances } from '@/components/student/student-recent-attendances';

// Helper format waktu (WIB) untuk Server Component di Vercel
const formatTimeWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)).replace('.', ':');
};
const formatDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const auth = await requireStudentSession();

  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;

  const [student, allSchedules, unpaidInvoices, academy, allAttendances, evaluations, learningMaterials] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: session.id,
        academy_id: session.academy_id,
        deleted_at: null,
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            program: true
          }
        },
        attendances: {
          orderBy: { scanned_at: 'desc' },
          take: 20,
          include: {
            schedule: {
              include: {
                room: true,
                tutor: true,
                program: true,
              }
            }
          }
        }
      }
    }),
    prisma.schedule.findMany({
      where: {
        program: {
          academy_id: session.academy_id,
          enrollments: {
            some: { student_id: session.id, status: 'ACTIVE' }
          }
        }
      },
      include: {
        room: true,
        tutor: true,
        program: true,
      },
      orderBy: {
        start_time: 'asc'
      }
    }),
    prisma.invoice.findMany({
      where: {
        student_id: session.id,
        payment_status: { in: ['UNPAID', 'OVERDUE'] }
      },
      select: { id: true, total_amount: true, due_date: true },
      orderBy: { due_date: 'asc' }
    }),
    prisma.academy.findUnique({
      where: { id: session.academy_id },
      select: { name: true, bank_name: true, bank_account: true }
    }),
    prisma.attendance.findMany({
      where: {
        student_id: session.id,
      },
      select: {
        schedule_id: true,
        attendance_status: true,
        schedule: {
          select: {
            program_id: true,
          }
        }
      }
    }),
    prisma.studentEvaluation.findMany({
      where: {
        student_id: session.id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        program_id: true,
        title: true,
        score: true,
        evaluation_type: true,
      }
    }),
    prisma.learningMaterial.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null,
        program: {
          enrollments: {
            some: { student_id: session.id, status: 'ACTIVE' }
          }
        }
      },
      select: {
        id: true,
        program_id: true,
      }
    })
  ]);

  if (!student) {
    redirect(`/${tenantSlug}/login`);
  }

  const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const hasUnpaid = unpaidInvoices.length > 0;

  // Daftar program aktif yang diikuti siswa
  const activePrograms = student.enrollments.map((e) => ({
    id: e.program.id,
    name: e.program.name,
  }));

  const now = new Date();

  // Helper kalkulasi data milestone untuk satu set jadwal & evaluasi (per program atau gabungan)
  function computeMilestone(
    schedules: typeof allSchedules,
    attendances: typeof allAttendances,
    evals: typeof evaluations,
    matCount: number,
    progName?: string
  ) {
    const attMap = new Map(attendances.map((a) => [a.schedule_id, a.attendance_status]));

    const pastSchedules = schedules.filter((s) => new Date(s.end_time) <= now && s.status === 'SCHEDULED');
    const totalPastSchedules = pastSchedules.length;

    const pastScheduleIds = new Set(pastSchedules.map((s) => s.id));
    const attendedCount = attendances.filter(
      (a) => pastScheduleIds.has(a.schedule_id) && a.attendance_status === 'PRESENT'
    ).length;

    const attendancePercentage = totalPastSchedules === 0
      ? null
      : Math.min(100, Math.round((attendedCount / totalPastSchedules) * 100));

    // Deduplikasi jika ada evaluasi dengan nama dan tipe yang sama pada program yang sama
    const dedupedEvalsMap = new Map<string, (typeof evals)[0]>();
    for (const ev of evals) {
      const key = `${ev.program_id}_${ev.title.trim().toLowerCase()}_${ev.evaluation_type}`;
      if (!dedupedEvalsMap.has(key)) {
        dedupedEvalsMap.set(key, ev);
      } else {
        const existing = dedupedEvalsMap.get(key)!;
        if (existing.score === null && ev.score !== null) {
          dedupedEvalsMap.set(key, ev);
        }
      }
    }
    const dedupedEvaluations = Array.from(dedupedEvalsMap.values());

    const validScores = dedupedEvaluations
      .filter((e) => e.score !== null)
      .map((e) => Number(e.score));
    const averageScore = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null;

    const examScores = dedupedEvaluations
      .filter((e) => e.evaluation_type === 'EXAM' && e.score !== null)
      .map((e) => Number(e.score));
    const examAverage = examScores.length > 0
      ? examScores.reduce((a, b) => a + b, 0) / examScores.length
      : null;

    const homeworkScores = dedupedEvaluations
      .filter((e) => e.evaluation_type === 'HOMEWORK' && e.score !== null)
      .map((e) => Number(e.score));
    const homeworkAverage = homeworkScores.length > 0
      ? homeworkScores.reduce((a, b) => a + b, 0) / homeworkScores.length
      : null;

    // Kalkulasi Sliding Window Milestone Pertemuan (5 Sesi Terdekat)
    const totalSchedules = schedules.length;
    const nextScheduleIdx = schedules.findIndex((s) => new Date(s.end_time) > now && s.status === 'SCHEDULED');
    const activeSessionNumber = nextScheduleIdx !== -1 ? nextScheduleIdx + 1 : (totalPastSchedules > 0 ? totalPastSchedules : 1);

    let windowStart = Math.max(0, (nextScheduleIdx !== -1 ? nextScheduleIdx : totalPastSchedules) - 2);
    let windowEnd = windowStart + 5;
    if (windowEnd > totalSchedules) {
      windowEnd = totalSchedules;
      windowStart = Math.max(0, windowEnd - 5);
    }

    const slidingWindow = schedules.slice(windowStart, windowEnd).map((sch, localIdx) => {
      const globalIdx = windowStart + localIdx;
      const sessionNum = globalIdx + 1;
      const isPast = new Date(sch.end_time) <= now;
      const isActiveNext = globalIdx === nextScheduleIdx;
      const attStatus = attMap.get(sch.id);

      let status: "PRESENT" | "ABSENT" | "EXCUSED" | "ACTIVE_NEXT" | "UPCOMING" = "UPCOMING";
      if (isActiveNext) {
        status = "ACTIVE_NEXT";
      } else if (isPast) {
        if (attStatus === "PRESENT") status = "PRESENT";
        else if (attStatus === "EXCUSED") status = "EXCUSED";
        else status = "ABSENT";
      }

      return {
        sessionNumber: sessionNum,
        dateFormatted: formatDateWIB(sch.start_time),
        status,
        roomName: sch.room?.name || "Kelas",
        programName: sch.program?.name || "",
      };
    });

    return {
      programName: progName,
      attendance: {
        totalPastSchedules,
        attendedCount,
        percentage: attendancePercentage,
      },
      academic: {
        averageScore,
        totalEvaluations: dedupedEvaluations.length,
        scoredCount: validScores.length,
        examAverage,
        homeworkAverage,
      },
      materials: {
        totalAvailable: matCount,
      },
      sessions: {
        totalSchedules,
        pastSchedulesCount: totalPastSchedules,
        activeSessionNumber,
        slidingWindow,
      },
    };
  }

  // Hitung milestone gabungan (semua program)
  const combinedMilestone = computeMilestone(
    allSchedules,
    allAttendances,
    evaluations,
    learningMaterials.length,
    "Semua Program"
  );

  // Hitung milestone individual untuk masing-masing program
  const programMilestones: Record<string, ReturnType<typeof computeMilestone>> = {};
  for (const prog of activePrograms) {
    const pSchedules = allSchedules.filter((s) => s.program_id === prog.id);
    const pAttendances = allAttendances.filter(
      (a) => a.schedule?.program_id === prog.id || pSchedules.some((s) => s.id === a.schedule_id)
    );
    const pEvaluations = evaluations.filter((e) => e.program_id === prog.id);
    const pMatCount = learningMaterials.filter((m) => m.program_id === prog.id).length;

    programMilestones[prog.id] = computeMilestone(
      pSchedules,
      pAttendances,
      pEvaluations,
      pMatCount,
      prog.name
    );
  }

  return (
    <div className="p-4 sm:p-8 md:pt-10 space-y-6">
      
      {/* Notifikasi Tagihan SPP Siswa */}
      <StudentBillingBanner
        hasUnpaid={hasUnpaid}
        totalDebt={totalDebt}
        dueDate={unpaidInvoices[0]?.due_date}
        bankName={academy?.bank_name}
        bankAccount={academy?.bank_account}
        academyName={academy?.name}
        tenantSlug={tenantSlug}
        targetInvoiceId={unpaidInvoices[0]?.id}
      />

      {/* Welcome Card */}
      <div className="bg-blue-700 rounded-3xl p-6 sm:p-8 text-white">
        
        <div className="relative z-10">
          <p className="text-blue-100 font-medium mb-1">Selamat datang kembali,</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{student.full_name}</h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {student.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="bg-blue-800/50 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-blue-300"></span>
                {enrollment.program.name}
              </div>
            ))}
            {student.enrollments.length === 0 && (
              <div className="bg-blue-800/50 px-3 py-1.5 rounded-md text-sm font-semibold">
                Belum terdaftar di program apapun
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capaian Belajar Siswa (Milestone Progress Card) */}
      <StudentMilestoneCard
        programs={activePrograms}
        programMilestones={programMilestones}
        combinedMilestone={combinedMilestone}
        tenantSlug={tenantSlug}
      />

      {/* Full Schedule Calendar */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Jadwal Kelas</h2>
        <StudentSchedulesClientPage schedules={allSchedules} programs={activePrograms} tenantSlug={tenantSlug} />
      </div>

      {/* Recent Attendance (Filtered by program) */}
      <StudentRecentAttendances
        attendances={student.attendances}
        programs={activePrograms}
        tenantSlug={tenantSlug}
      />

    </div>
  );
}
