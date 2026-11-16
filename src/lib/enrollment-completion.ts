import prisma from "@/lib/prisma";
import { addMonths } from "date-fns";

export interface CompletionCheckResult {
  completed: boolean;
  reason?: "MEETINGS_REACHED" | "DURATION_EXPIRED";
  notes?: string;
  totalMeetings?: number;
  attendedMeetings?: number;
  durationMonths?: number;
}

/**
 * Memeriksa apakah kepesertaan siswa dalam program tertentu sudah memenuhi batas kuota pertemuan
 * atau batas durasi waktu program, lalu otomatis mengupdate status enrollment menjadi COMPLETED.
 */
export async function checkAndCompleteEnrollment(
  studentId: string,
  programId: string
): Promise<CompletionCheckResult> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_program_id: {
          student_id: studentId,
          program_id: programId,
        },
      },
      include: {
        program: true,
      },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") {
      return { completed: enrollment?.status === "COMPLETED" };
    }

    const { program } = enrollment;
    const now = new Date();

    // 1. Pengecekan Total Pertemuan yang sudah dihadiri / diselenggarakan
    if (program.total_meetings && program.total_meetings > 0) {
      // Hitung kehadiran siswa pada jadwal program ini (PRESENT / EXCUSED)
      const attendedMeetingsCount = await prisma.attendance.count({
        where: {
          student_id: studentId,
          attendance_status: { in: ["PRESENT", "EXCUSED"] },
          schedule: {
            program_id: programId,
          },
        },
      });

      if (attendedMeetingsCount >= program.total_meetings) {
        const notes = `Otomatis selesai: siswa telah menyelesaikan ${attendedMeetingsCount} dari kuota ${program.total_meetings} pertemuan.`;
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "COMPLETED",
            withdrawn_at: now,
            withdrawn_reason: "PROGRAM_SELESAI",
            withdrawn_notes: notes,
          },
        });

        return {
          completed: true,
          reason: "MEETINGS_REACHED",
          notes,
          totalMeetings: program.total_meetings,
          attendedMeetings: attendedMeetingsCount,
        };
      }
    }

    // 2. Pengecekan Durasi Program (Bulan)
    if (program.duration_months && program.duration_months > 0) {
      const expirationDate = addMonths(new Date(enrollment.enrolled_date), program.duration_months);
      if (now >= expirationDate) {
        const notes = `Otomatis selesai: masa aktif durasi program (${program.duration_months} bulan) telah berakhir.`;
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "COMPLETED",
            withdrawn_at: now,
            withdrawn_reason: "PROGRAM_SELESAI",
            withdrawn_notes: notes,
          },
        });

        return {
          completed: true,
          reason: "DURATION_EXPIRED",
          notes,
          durationMonths: program.duration_months,
        };
      }
    }

    return { completed: false };
  } catch (error) {
    console.error("Error in checkAndCompleteEnrollment:", error);
    return { completed: false };
  }
}

/**
 * Bulk check untuk seluruh siswa yang terdaftar di program tertentu.
 * Sangat berguna setelah sesi kelas selesai diabsen atau saat cron penagihan bulanan dijalankan.
 */
export async function batchCheckEnrollmentCompletions(
  academyId: string
): Promise<{ totalCompleted: number }> {
  try {
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        program: {
          academy_id: academyId,
          deleted_at: null,
          OR: [
            { total_meetings: { not: null } },
            { duration_months: { not: null } },
          ],
        },
      },
      include: {
        program: true,
      },
    });

    let totalCompleted = 0;
    for (const enrollment of activeEnrollments) {
      const res = await checkAndCompleteEnrollment(enrollment.student_id, enrollment.program_id);
      if (res.completed && res.reason) {
        totalCompleted++;
      }
    }

    return { totalCompleted };
  } catch (error) {
    console.error("Error in batchCheckEnrollmentCompletions:", error);
    return { totalCompleted: 0 };
  }
}

