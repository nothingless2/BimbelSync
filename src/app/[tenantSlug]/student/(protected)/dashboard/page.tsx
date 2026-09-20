import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import StudentSchedulesClientPage from '../schedules/client-page';

// Helper format waktu (WIB) untuk Server Component di Vercel
const formatTimeWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)).replace('.', ':');
};
const formatDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};
const formatFullDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('bimbelsync_session')?.value;
  const session = sessionToken ? await decrypt(sessionToken) : null;
  const { tenantSlug } = await params;

  if (!session || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/login`);
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: {
      enrollments: {
        include: {
          program: true
        }
      },
      attendances: {
        orderBy: { scanned_at: 'desc' },
        take: 5,
        include: {
          schedule: {
            include: {
              room: true,
              tutor: true,
              program: true,
            }
          }
        }
      }
    }
  });

  if (!student) {
    redirect(`/${tenantSlug}/login`);
  }

  // Cari jadwal mendatang (mulai dari hari ini)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allSchedules = await prisma.schedule.findMany({
    where: {
      program: {
        academy_id: session.academy_id,
        enrollments: {
          some: { student_id: session.id, status: 'ACTIVE' }
        }
      }
    },
    include: {
      room: true,
      tutor: true,
      program: true,
    },
    orderBy: {
      start_time: 'asc'
    }
  });

  return (
    <div className="p-4 sm:p-8 md:pt-10 space-y-8">
      
      {/* Welcome Card */}
      <div className="bg-blue-700 rounded-3xl p-6 sm:p-8 text-white">
        
        <div className="relative z-10">
          <p className="text-blue-100 font-medium mb-1">Selamat datang kembali,</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{student.full_name}</h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {student.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="bg-blue-800/50 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-blue-300"></span>
                {enrollment.program.name}
              </div>
            ))}
            {student.enrollments.length === 0 && (
              <div className="bg-blue-800/50 px-3 py-1.5 rounded-md text-sm font-semibold">
                Belum terdaftar di program apapun
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Schedule Calendar */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Jadwal Kelas</h2>
        <StudentSchedulesClientPage schedules={allSchedules} tenantSlug={tenantSlug} />
      </div>

      {/* Recent Attendance */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Absensi</h2>
        <a href={`/${tenantSlug}/student/attendances`} className="text-sm font-semibold text-blue-600 dark:text-blue-400">Lihat Semua</a>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {student.attendances.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {student.attendances.map(record => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-full ${
                    record.attendance_status === 'PRESENT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    record.attendance_status === 'ABSENT' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {record.attendance_status === 'PRESENT' ? <CheckCircle2 size={20} /> :
                     record.attendance_status === 'ABSENT' ? <XCircle size={20} /> :
                     <AlertCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {record.schedule.program.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateWIB(record.scanned_at)}, {formatTimeWIB(record.scanned_at)}
                    </p>
                  </div>
                </div>
                
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                  record.attendance_status === 'PRESENT' ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                  record.attendance_status === 'ABSENT' ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20' :
                  'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
                }`}>
                  {record.attendance_status === 'PRESENT' ? 'Hadir' :
                   record.attendance_status === 'ABSENT' ? 'Alpa' : 'Izin'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">Belum ada riwayat absensi.</p>
          </div>
        )}
      </div>

    </div>
  );
}
