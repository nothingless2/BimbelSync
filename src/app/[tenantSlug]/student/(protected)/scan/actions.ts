'use server';

import prisma from '@/lib/prisma';
import { requireStudentSession } from '@/lib/session';
import { decryptQrData } from '@/lib/qr-crypto';

export async function processQrScanAction(tenantSlug: string, qrDataRaw: string) {
  try {
    const auth = await requireStudentSession();
    if ('error' in auth) {
      return { error: auth.error };
    }
    const session = auth.session;

    if (session.tenant_slug !== tenantSlug) {
      return { error: 'Akses ditolak. Sesi tidak sesuai dengan bimbel ini.' };
    }

    // 1. Parse & Decrypt QR Data
    const qrData = decryptQrData(qrDataRaw);
    
    if (!qrData) {
      return { error: 'QR Code tidak valid atau bukan berasal dari sistem ini.' };
    }

    if (!qrData.scheduleId || !qrData.timestamp || !qrData.tenantSlug) {
      return { error: 'Format QR Code tidak dikenali.' };
    }

    // 2. Validate Tenant
    if (qrData.tenantSlug !== tenantSlug) {
      return { error: 'QR Code ini milik bimbel lain.' };
    }

    // 3. Anti-Cheat: Validate Timestamp (Max 5 seconds gap)
    const now = Date.now();
    const timeDiff = now - qrData.timestamp;
    
    if (timeDiff > 5000 || timeDiff < -1000) { // 5s tolerance, -1s for slight clock desync
      return { error: 'QR Code sudah kedaluwarsa. Silakan scan ulang dari layar tutor.' };
    }

    // 4. Validate Schedule & Enrollment
    const schedule = await prisma.schedule.findUnique({
      where: { id: qrData.scheduleId },
      include: {
        program: true
      }
    });

    if (!schedule) {
      return { error: 'Jadwal tidak ditemukan.' };
    }

    // Feature Gating: Absensi QR dinamis hanya untuk paket Growth dan Pro
    const { assertFeatureAccess } = await import("@/lib/subscription");
    const featureCheck = await assertFeatureAccess(schedule.program.academy_id, "qr_attendance");
    if (!featureCheck.allowed) {
      return { error: "Fitur absensi QR dinamis tidak aktif pada paket bimbel ini. Silakan hubungi tutor untuk absensi manual." };
    }

    if (schedule.status === 'CANCELLED') {
      return { error: 'Sesi kelas ini telah dibatalkan.' };
    }

    if (schedule.status !== 'SCHEDULED') {
      return { error: 'Sesi kelas ini tidak aktif.' };
    }

    // 4.b. Validasi Waktu Jadwal Kelas (Tolak jika jadwal sudah lewat)
    const currentTime = Date.now();
    const startTime = new Date(schedule.start_time).getTime();
    const endTime = new Date(schedule.end_time).getTime();

    if (currentTime > endTime) {
      return { error: 'Waktu sesi kelas ini telah berakhir. Scan absensi sudah tidak dapat diterima.' };
    }

    // Siswa hanya boleh scan maksimal 30 menit sebelum kelas dimulai
    const earlyToleranceMs = 30 * 60 * 1000;
    if (currentTime < startTime - earlyToleranceMs) {
      return { error: 'Sesi kelas belum dimulai. Scan absensi baru dapat dilakukan 30 menit sebelum jam kelas dimulai.' };
    }

    const student = await prisma.student.findFirst({
      where: {
        id: session.id,
        academy_id: session.academy_id,
        deleted_at: null,
      },
      include: {
        enrollments: true
      }
    });

    const isEnrolled = student?.enrollments.some(e => e.program_id === schedule.program_id && e.status === 'ACTIVE');

    if (!student || !isEnrolled) {
      return { error: 'Anda tidak terdaftar di kelas ini.' };
    }

    // 5. Check existing attendance
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        student_id_schedule_id: {
          schedule_id: schedule.id,
          student_id: student.id
        }
      }
    });

    if (existingAttendance) {
      if (existingAttendance.attendance_status === 'PRESENT') {
        return { success: true, message: 'Anda sudah absen hadir sebelumnya.' };
      }
      
      // Update if they were marked ABSENT or EXCUSED
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { attendance_status: 'PRESENT' }
      });
      return { success: true, message: 'Status absen berhasil diubah menjadi Hadir.' };
    }

    // 6. Record New Attendance
    await prisma.attendance.create({
      data: {
        schedule_id: schedule.id,
        student_id: student.id,
        attendance_status: 'PRESENT'
      }
    });

    return { success: true, message: 'Absensi berhasil!' };

  } catch (error) {
    console.error("QR Scan Error:", error);
    return { error: 'Terjadi kesalahan sistem.' };
  }
}
