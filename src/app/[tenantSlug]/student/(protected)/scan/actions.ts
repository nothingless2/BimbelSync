'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { decryptQrData } from '@/lib/qr-crypto';

export async function processQrScanAction(tenantSlug: string, qrDataRaw: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('bimbelsync_session')?.value;
    
    if (!sessionToken) {
      return { error: 'Sesi tidak valid.' };
    }

    const session = await decrypt(sessionToken);
    
    if (!session || session.role !== 'STUDENT') {
      return { error: 'Akses ditolak.' };
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

    if (schedule.status !== 'SCHEDULED') {
      return { error: 'Sesi kelas ini belum dimulai atau sudah dibatalkan.' };
    }

    const student = await prisma.student.findUnique({
      where: { id: session.id },
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
