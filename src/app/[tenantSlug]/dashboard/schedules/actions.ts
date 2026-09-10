"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

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

    // ----------------------------------------------------
    // ANTI-COLLISION / BENTROK LOGIC
    // ----------------------------------------------------
    // Cek apakah ada jadwal aktif yang beririsan waktu pada ruang atau tutor yang sama
    const overlappingSchedule = await prisma.schedule.findFirst({
      where: {
        status: "SCHEDULED", // Hanya pedulikan jadwal yang belum dibatalkan
        program: {
          academy_id: session.academy_id
        },
        OR: [
          { room_id: roomId },
          { tutor_id: tutorId }
        ],
        AND: [
          { start_time: { lt: endDateTime } },
          { end_time: { gt: startDateTime } }
        ]
      },
      include: {
        room: true,
        tutor: true,
        program: true
      }
    });

    if (overlappingSchedule) {
      const isRoomClash = overlappingSchedule.room_id === roomId;
      const isTutorClash = overlappingSchedule.tutor_id === tutorId;
      
      const timeStr = `${overlappingSchedule.start_time.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} - ${overlappingSchedule.end_time.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;
      
      if (isRoomClash && isTutorClash) {
        return { error: `BENTROK! Ruangan ${overlappingSchedule.room.name} dan Tutor ${overlappingSchedule.tutor.name} sedang dipakai untuk ${overlappingSchedule.program.name} pada jam ${timeStr}.` };
      }
      if (isRoomClash) {
        return { error: `BENTROK RUANGAN! Ruang ${overlappingSchedule.room.name} sedang dipakai untuk program ${overlappingSchedule.program.name} pada jam ${timeStr}.` };
      }
      if (isTutorClash) {
        return { error: `BENTROK TUTOR! Tutor ${overlappingSchedule.tutor.name || overlappingSchedule.tutor.email} sedang mengajar program ${overlappingSchedule.program.name} di ruang ${overlappingSchedule.room.name} pada jam ${timeStr}.` };
      }
    }
    // ----------------------------------------------------

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

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Schedule",
      details: { program_id: programId, tutor_id: tutorId, start_time: startDateTime }
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

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Schedule",
      entity_id: scheduleId,
      details: { status: "CANCELLED", cancelled_reason: reason }
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

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Schedule",
      entity_id: scheduleId,
      details: { status: existing.status }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { error: "Terjadi kesalahan saat menghapus jadwal." };
  }
}
