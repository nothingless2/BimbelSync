import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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

  const upcomingSchedules = await prisma.schedule.findMany({
    where: {
      program: {
        academy_id: session.academy_id,
        enrollments: {
          some: { student_id: session.id, status: 'ACTIVE' }
        }
      },
      start_time: {
        gte: today
      },
      status: 'SCHEDULED'
    },
    include: {
      room: true,
      tutor: true,
      program: true,
    },
    orderBy: {
      start_time: 'asc'
    },
    take: 10 // Ambil 10 jadwal terdekat
  });

  return (
    <div className="p-4 sm:p-8 md:pt-10">
      
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10">
          <p className="text-blue-100 font-medium mb-1">Selamat datang kembali,</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{student.full_name}</h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {student.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                {enrollment.program.name}
              </div>
            ))}
            {student.enrollments.length === 0 && (
              <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm font-semibold">
                Belum terdaftar di program apapun
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Jadwal Mendatang</h2>
      
      {upcomingSchedules.length > 0 ? (
        <div className="space-y-4 mb-10">
          {upcomingSchedules.map(schedule => (
            <div key={schedule.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{schedule.program.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tutor: {schedule.tutor.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Calendar size={12} />
                    {format(new Date(schedule.start_time), 'EEEE, d MMM yyyy', { locale: id })}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                    <Clock size={14} />
                    {format(new Date(schedule.start_time), 'HH:mm')} - {format(new Date(schedule.end_time), 'HH:mm')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <MapPin size={16} className="text-slate-400" />
                Ruang {schedule.room.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-8 text-center mb-10">
          <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Calendar size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Tidak ada jadwal mendatang</h3>
          <p className="text-sm text-slate-500 mt-1">Belum ada kelas yang dijadwalkan untuk Anda.</p>
        </div>
      )}

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
                      {format(new Date(record.scanned_at), 'd MMM yyyy, HH:mm', { locale: id })}
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
