"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createScheduleAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const programId = formData.get("program_id") as string;
  const tutorId = formData.get("tutor_id") as string;
  const roomId = formData.get("room_id") as string;
  const dateStr = formData.get("date") as string;
  const startTimeStr = formData.get("start_time") as string;
  const endTimeStr = formData.get("end_time") as string;

  if (!programId || !tutorId || !roomId || !dateStr || !startTimeStr || !endTimeStr) {
    return { error: "Semua field wajib diisi." };
  }

  // Parse time
  const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
  const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

  if (endDateTime <= startDateTime) {
    return { error: "Waktu selesai harus lebih dari waktu mulai." };
  }

  try {
    // Validasi kepemilikan program, tutor, dan room untuk mencegah manipulasi
    const [program, tutor, room] = await Promise.all([
      prisma.program.findFirst({ where: { id: programId, academy_id: session.academy_id, deleted_at: null } }),
      prisma.staff.findFirst({ where: { id: tutorId, academy_id: session.academy_id, deleted_at: null } }),
      prisma.room.findFirst({ where: { id: roomId, academy_id: session.academy_id, deleted_at: null } }),
    ]);

    if (!program || !tutor || !room) {
      return { error: "Data program, tutor, atau ruangan tidak valid atau sudah dihapus." };
    }

    await prisma.schedule.create({
      data: {
        program_id: programId,
        tutor_id: tutorId,
        room_id: roomId,
        start_time: startDateTime,
        end_time: endDateTime,
        status: "SCHEDULED"
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    return { success: true };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { error: "Terjadi kesalahan saat menyimpan jadwal." };
  }
}

export async function cancelScheduleAction(scheduleId: string, reason: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  if (!reason || reason.trim() === "") {
    return { error: "Alasan pembatalan wajib diisi." };
  }

  try {
    const existing = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { program: true }
    });

    if (!existing || existing.program.academy_id !== session.academy_id) {
      return { error: "Jadwal tidak ditemukan." };
    }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: "CANCELLED",
        cancelled_reason: reason
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    return { success: true };
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return { error: "Terjadi kesalahan saat membatalkan jadwal." };
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const existing = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { program: true }
    });

    if (!existing || existing.program.academy_id !== session.academy_id) {
      return { error: "Jadwal tidak ditemukan." };
    }

    // Hanya bisa delete jika jadwal CANCELLED atau masa depan, 
    // namun demi kemudahan MVP, kita ijinkan hard delete
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { error: "Terjadi kesalahan saat menghapus jadwal." };
  }
}
