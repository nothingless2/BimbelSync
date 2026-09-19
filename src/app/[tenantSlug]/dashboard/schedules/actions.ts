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

  const staff = await prisma.staff.findUnique({ where: { id: session.id }, select: { role: true } });
  if (staff?.role === 'TUTOR') return { error: "Akses ditolak untuk peran Tutor." };

  const programId = formData.get("program_id") as string;
  const tutorId = formData.get("tutor_id") as string;
  const roomId = formData.get("room_id") as string;
  const dateStr = formData.get("date") as string;
  const startTimeStr = formData.get("start_time") as string;
  const endTimeStr = formData.get("end_time") as string;

  if (!programId || !tutorId || !roomId || !dateStr || !startTimeStr || !endTimeStr) {
    return { error: "Semua field wajib diisi." };
  }

  // Parse time (Asumsikan input adalah WIB / Asia/Jakarta)
  const startDateTime = new Date(`${dateStr}T${startTimeStr}:00+07:00`);
  const endDateTime = new Date(`${dateStr}T${endTimeStr}:00+07:00`);

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

  const staff = await prisma.staff.findUnique({ where: { id: session.id }, select: { role: true } });
  if (staff?.role === 'TUTOR') return { error: "Akses ditolak untuk peran Tutor." };

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

  const staff = await prisma.staff.findUnique({ where: { id: session.id }, select: { role: true } });
  if (staff?.role === 'TUTOR') return { error: "Akses ditolak untuk peran Tutor." };

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

export async function rescheduleScheduleAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const staff = await prisma.staff.findUnique({ where: { id: session.id }, select: { role: true } });
  if (staff?.role === 'TUTOR') return { error: "Akses ditolak untuk peran Tutor." };

  const scheduleId = formData.get("schedule_id") as string;
  const roomId = formData.get("room_id") as string;
  const dateStr = formData.get("date") as string;
  const startTimeStr = formData.get("start_time") as string;
  const endTimeStr = formData.get("end_time") as string;

  if (!scheduleId || !roomId || !dateStr || !startTimeStr || !endTimeStr) {
    return { error: "Semua field wajib diisi." };
  }

  // Parse time
  const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
  const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

  if (endDateTime <= startDateTime) {
    return { error: "Waktu selesai harus lebih dari waktu mulai." };
  }

  try {
    const existing = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { program: true, tutor: true }
    });

    if (!existing || existing.program.academy_id !== session.academy_id) {
      return { error: "Jadwal tidak ditemukan." };
    }

    const room = await prisma.room.findFirst({ where: { id: roomId, academy_id: session.academy_id, deleted_at: null } });
    if (!room) {
      return { error: "Data ruangan tidak valid atau sudah dihapus." };
    }

    // ----------------------------------------------------
    // ANTI-COLLISION / BENTROK LOGIC (Excluding current schedule)
    // ----------------------------------------------------
    const overlappingSchedule = await prisma.schedule.findFirst({
      where: {
        id: { not: scheduleId }, // Kecuali jadwal ini sendiri
        status: "SCHEDULED",
        program: {
          academy_id: session.academy_id
        },
        OR: [
          { room_id: roomId },
          { tutor_id: existing.tutor_id } // Tutor tetap sama dengan existing
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
      const isTutorClash = overlappingSchedule.tutor_id === existing.tutor_id;
      
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

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        room_id: roomId,
        start_time: startDateTime,
        end_time: endDateTime
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Schedule",
      entity_id: scheduleId,
      details: { 
        action: "RESCHEDULE",
        old_start: existing.start_time,
        new_start: startDateTime,
        old_room: existing.room_id,
        new_room: roomId
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    return { success: true };
  } catch (error) {
    console.error("Error rescheduling schedule:", error);
    return { error: "Terjadi kesalahan saat melakukan reschedule jadwal." };
  }
}


// Daftar Libur Nasional 2026 & 2027 (Statis untuk contoh)
const NATIONAL_HOLIDAYS = [
  "2026-01-01", // Tahun Baru
  "2026-02-17", // Isra Mikraj
  "2026-03-20", // Nyepi
  "2026-04-03", // Jumat Agung
  "2026-04-10", // Idul Fitri
  "2026-04-11", // Idul Fitri
  "2026-05-01", // Hari Buruh
  "2026-05-14", // Kenaikan Isa Almasih
  "2026-06-01", // Lahir Pancasila
  "2026-06-17", // Idul Adha
  "2026-07-07", // Tahun Baru Islam
  "2026-08-17", // Kemerdekaan RI
  "2026-09-16", // Maulid Nabi
  "2026-12-25", // Natal
];

export async function generateSchedulesAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const staff = await prisma.staff.findUnique({ where: { id: session.id }, select: { role: true } });
  if (staff?.role === 'TUTOR') return { error: "Akses ditolak untuk peran Tutor." };

  const programId = formData.get("program_id") as string;
  const tutorId = formData.get("tutor_id") as string;
  const roomId = formData.get("room_id") as string;
  const totalMeetingsStr = formData.get("total_meetings") as string;
  const startDateStr = formData.get("start_date") as string;
  const startTimeStr = formData.get("start_time") as string;
  const endTimeStr = formData.get("end_time") as string;
  const daysStr = formData.get("days") as string;

  if (!programId || !tutorId || !roomId || !startDateStr || !startTimeStr || !endTimeStr || !daysStr || !totalMeetingsStr) {
    return { error: "Semua field wajib diisi." };
  }

  const totalMeetings = parseInt(totalMeetingsStr, 10);
  const days = JSON.parse(daysStr) as number[];

  if (isNaN(totalMeetings) || totalMeetings <= 0) {
    return { error: "Total pertemuan tidak valid." };
  }
  
  if (days.length === 0) {
    return { error: "Minimal pilih satu hari rutinan." };
  }

  try {
    let schedulesToCreate = [];
    let currentDate = new Date(startDateStr);
    let meetingsGenerated = 0;
    
    // Safety break (max 365 days iteration to avoid infinite loop)
    let iterations = 0; 
    
    while (meetingsGenerated < totalMeetings && iterations < 365) {
      const dayOfWeek = currentDate.getDay();
      
      if (days.includes(dayOfWeek)) {
        // Cek apakah ini hari libur nasional
        const dateString = currentDate.toISOString().split('T')[0];
        const isHoliday = NATIONAL_HOLIDAYS.includes(dateString);
        
        if (!isHoliday) {
          // Asumsikan input adalah WIB / Asia/Jakarta
          const startDateTime = new Date(`${dateString}T${startTimeStr}:00+07:00`);
          const endDateTime = new Date(`${dateString}T${endTimeStr}:00+07:00`);
          
          schedulesToCreate.push({
            program_id: programId,
            tutor_id: tutorId,
            room_id: roomId,
            start_time: startDateTime,
            end_time: endDateTime,
            status: "SCHEDULED" as const
          });
          
          meetingsGenerated++;
        }
      }
      
      // Tambah 1 hari
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }

    if (schedulesToCreate.length === 0) {
      return { error: "Gagal men-generate jadwal. Cek kembali tanggal dan hari." };
    }

    await prisma.schedule.createMany({
      data: schedulesToCreate
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Schedule_Batch",
      details: { program_id: programId, count: schedulesToCreate.length }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/schedules`);
    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/programs`);
    return { success: true, count: schedulesToCreate.length };

  } catch (error) {
    console.error("Error generating schedules:", error);
    return { error: "Terjadi kesalahan saat generate jadwal." };
  }
}

