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

    // 2. Persiapkan pengecekan batas izin bulanan (Maksimal 2x sebulan)
    const MAX_EXCUSED_PER_MONTH = 2;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const updatedAttendances = [];
    let hasLimitReached = false;

    for (const att of attendances) {
      let finalStatus = att.status;

      if (finalStatus === "EXCUSED") {
        // Hitung izin yang sudah diambil bulan ini
        const excusedCount = await prisma.attendance.count({
          where: {
            student_id: att.student_id,
            attendance_status: "EXCUSED",
            schedule: {
              start_time: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          }
        });

        // Cek apakah data ini sebenarnya sudah EXCUSED sebelumnya (agar tidak kehitung dobel jika tutor klik simpan ulang)
        const existingAtt = await prisma.attendance.findUnique({
          where: { student_id_schedule_id: { student_id: att.student_id, schedule_id: scheduleId } }
        });

        const isAlreadyExcused = existingAtt?.attendance_status === "EXCUSED";
        
        // Jika belum excused untuk jadwal ini, dan batas habis
        if (!isAlreadyExcused && excusedCount >= MAX_EXCUSED_PER_MONTH) {
          finalStatus = "ABSENT";
          hasLimitReached = true;
        }
      }

      updatedAttendances.push({
        ...att,
        finalStatus
      });
    }

    // 3. Lakukan proses upsert (Insert atau Update) secara bulk menggunakan Prisma Transaction
    await prisma.$transaction(
      updatedAttendances.map((attendance) => 
        prisma.attendance.upsert({
          where: {
            student_id_schedule_id: {
              student_id: attendance.student_id,
              schedule_id: scheduleId
            }
          },
          update: {
            attendance_status: attendance.finalStatus,
            // scanned_at dibiarkan (jika manual update, tidak mengubah waktu scan QR asli)
          },
          create: {
            student_id: attendance.student_id,
            schedule_id: scheduleId,
            attendance_status: attendance.finalStatus,
            scanned_at: new Date() // Tandai waktu rekam manual
          }
        })
      )
    );

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    revalidatePath(`/${session.tenant_slug}/dashboard/schedules/${scheduleId}`);
    
    if (hasLimitReached) {
      return { success: true, message: "Absensi tersimpan. Beberapa siswa yang izinnya melebihi kuota 2x/bulan otomatis diubah menjadi Alpa." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving attendances:", error);
    return { error: "Terjadi kesalahan internal saat merekam absensi." };
  }
}

