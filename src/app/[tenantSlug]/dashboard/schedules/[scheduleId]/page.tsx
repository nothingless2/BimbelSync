import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AttendanceClient } from "./attendance-client";
import { Calendar, Clock, MapPin, User, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AttendancePage({ 
  params 
}: { 
  params: Promise<{ tenantSlug: string, scheduleId: string }> 
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const scheduleId = resolvedParams.scheduleId;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Fetch the schedule details
  const schedule = await prisma.schedule.findUnique({
    where: { 
      id: scheduleId,
      program: {
        academy_id: session.academy_id
      }
    },
    include: {
      program: true,
      room: true,
      tutor: true,
      attendances: true // Fetch existing attendances
    }
  });

  if (!schedule) {
    return (
      <div className="p-8 text-center text-slate-500">
        Jadwal tidak ditemukan atau Anda tidak memiliki akses.
      </div>
    );
  }

  // Ambil semua siswa yang terdaftar SAAT jadwal ini berlangsung (Historical Check)
  const relevantEnrollments = await prisma.enrollment.findMany({
    where: {
      program_id: schedule.program_id,
      enrolled_date: {
        lte: schedule.start_time // Hanya siswa yang masuk sebelum atau saat kelas dimulai
      },
      OR: [
        { status: 'ACTIVE' },
        { 
          status: 'WITHDRAWN',
          withdrawn_at: {
            gte: schedule.start_time // Jika sudah keluar, pastikan keluarnya setelah kelas ini selesai/dimulai
          }
        }
      ],
      student: {
        deleted_at: null
      }
    },
    include: {
      student: true
    },
    orderBy: {
      student: {
        full_name: 'asc'
      }
    }
  });

  // Map students with their existing attendance status if any
  const studentsData = relevantEnrollments.map(enrollment => {
    const existingRecord = schedule.attendances.find(a => a.student_id === enrollment.student_id);
    return {
      student: enrollment.student,
      currentStatus: existingRecord ? existingRecord.attendance_status : null,
      isWithdrawn: enrollment.status === 'WITHDRAWN' // Tambahan marker visual jika diperlukan
    };
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href={`/${tenantSlug}/dashboard/schedules`} className="hover:text-blue-600 transition-colors">
            Jadwal Kelas
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 dark:text-slate-200">Presensi</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Detail Presensi Kelas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Merekam kehadiran siswa untuk sesi kelas yang bersangkutan.
          </p>
        </div>
      </div>

      {/* Schedule Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300 mb-4">{schedule.program.name}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Tanggal</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(schedule.start_time)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Waktu</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Ruangan</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{schedule.room.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <User size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Tutor</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{schedule.tutor.email.split('@')[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {schedule.status === 'CANCELLED' ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl text-center">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Kelas Dibatalkan</h3>
          <p className="text-slate-600 dark:text-slate-300">Anda tidak bisa mengisi presensi pada kelas yang telah dibatalkan.</p>
          <p className="text-sm mt-4 text-red-500 italic">Alasan: {schedule.cancelled_reason}</p>
        </div>
      ) : (
        <AttendanceClient 
          scheduleId={schedule.id}
          tenantSlug={tenantSlug}
          studentsData={studentsData}
        />
      )}
    </div>
  );
}
