"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "@prisma/client";

export type AttendancePayload = {
  student_id: string;
  status: AttendanceStatus;
};

export async function saveAttendancesAction(scheduleId: string, attendances: AttendancePayload[]) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    // 1. Verifikasi kepemilikan jadwal
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { program: true }
    });

    if (!schedule || schedule.program.academy_id !== session.academy_id) {
      return { error: "Jadwal kelas tidak ditemukan atau Anda tidak memiliki akses." };
    }

    // 2. Lakukan proses upsert (Insert atau Update) secara bulk menggunakan Prisma Transaction
    await prisma.$transaction(
      attendances.map((attendance) => 
        prisma.attendance.upsert({
          where: {
            student_id_schedule_id: {
              student_id: attendance.student_id,
              schedule_id: scheduleId
            }
          },
          update: {
            attendance_status: attendance.status,
            // scanned_at dibiarkan (jika manual update, tidak mengubah waktu scan QR asli)
          },
          create: {
            student_id: attendance.student_id,
            schedule_id: scheduleId,
            attendance_status: attendance.status,
            scanned_at: new Date() // Tandai waktu rekam manual
          }
        })
      )
    );

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    revalidatePath(`/${session.tenant_slug}/dashboard/schedules/${scheduleId}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving attendances:", error);
    return { error: "Terjadi kesalahan internal saat merekam absensi." };
  }
}
