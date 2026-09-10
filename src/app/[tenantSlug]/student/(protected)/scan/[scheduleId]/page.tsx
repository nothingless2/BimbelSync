import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function DirectQrScanPage({
  params,
  searchParams
}: {
  params: Promise<{ tenantSlug: string, scheduleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const { tenantSlug, scheduleId } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const timestampStr = resolvedSearchParams?.t as string;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('bimbelsync_session')?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/student/login?redirect=/student/scan/${scheduleId}?t=${timestampStr}`);
  }

  const session = await decrypt(sessionToken);
  
  if (!session || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/student/login`);
  }

  let isSuccess = false;
  let message = "";

  try {
    if (!scheduleId || !timestampStr) {
      throw new Error('URL QR Code tidak lengkap.');
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      throw new Error('Format waktu tidak valid.');
    }

    // Anti-Cheat: Validate Timestamp (Max 15 seconds gap for URL load time)
    const now = Date.now();
    const timeDiff = now - timestamp;
    
    // Memberikan toleransi waktu lebih lama sedikit (15 detik) karena loading browser butuh waktu
    if (timeDiff > 15000 || timeDiff < -5000) { 
      throw new Error('QR Code sudah kedaluwarsa. Silakan scan ulang dari layar tutor.');
    }

    // Validate Schedule & Enrollment
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        program: true
      }
    });

    if (!schedule) {
      throw new Error('Jadwal kelas tidak ditemukan.');
    }

    if (schedule.status !== 'SCHEDULED') {
      throw new Error('Sesi kelas ini belum dimulai atau sudah dibatalkan.');
    }

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      include: {
        enrollments: true
      }
    });

    const isEnrolled = student?.enrollments.some(e => e.program_id === schedule.program_id && e.status === 'ACTIVE');

    if (!student || !isEnrolled) {
      throw new Error('Anda tidak terdaftar di program kelas ini.');
    }

    // Check existing attendance
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
        isSuccess = true;
        message = 'Anda sudah absen hadir sebelumnya pada kelas ini.';
      } else {
        // Update if they were marked ABSENT or EXCUSED
        await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: { attendance_status: 'PRESENT' }
        });
        isSuccess = true;
        message = 'Status absen berhasil diubah menjadi Hadir.';
      }
    } else {
      // Record New Attendance
      await prisma.attendance.create({
        data: {
          schedule_id: schedule.id,
          student_id: student.id,
          attendance_status: 'PRESENT'
        }
      });
      isSuccess = true;
      message = 'Absensi berhasil! Kehadiran Anda telah dicatat.';
    }

  } catch (error: any) {
    isSuccess = false;
    message = error.message || 'Terjadi kesalahan sistem.';
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center">
        
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Berhasil!</h2>
            <p className="text-slate-500 mb-8">{message}</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle size={40} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gagal Absen</h2>
            <p className="text-slate-500 mb-8">{message}</p>
          </>
        )}

        <Link
          href={`/${tenantSlug}/student/dashboard`}
          className="px-6 py-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex justify-center items-center gap-2"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
