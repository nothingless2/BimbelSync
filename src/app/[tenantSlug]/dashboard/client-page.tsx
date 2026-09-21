"use client";

import { Users, BookOpen, Receipt, ArrowRight, UserPlus, CalendarPlus, FileText, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardClientProps {
  tenantSlug: string;
  userRole: string;
  totalStudents: number;
  todayClassesCount: number;
  totalUnpaid: number;
  recentPayments: any[];
  todaySchedules: any[];
  thisMonthClassesCount?: number;
  pendingAttendanceCount?: number;
}

export default function DashboardClientPage({
  tenantSlug,
  userRole,
  totalStudents,
  todayClassesCount,
  totalUnpaid,
  recentPayments,
  todaySchedules,
  thisMonthClassesCount = 0,
  pendingAttendanceCount = 0,
}: DashboardClientProps) {

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Selamat datang di panel {userRole === 'TUTOR' ? 'tutor' : 'admin'} {tenantSlug}. Berikut ringkasan operasional Anda.
        </p>
      </div>

      {userRole !== 'TUTOR' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
                <Users size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">Total Siswa Aktif</h3>
                <p className="text-4xl font-black text-white">{totalStudents}</p>
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-600 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
                <BookOpen size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">Kelas Hari Ini</h3>
                <p className="text-4xl font-black text-white">{todayClassesCount}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 border border-rose-600 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
                <Receipt size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-rose-100 uppercase tracking-wider mb-2">Total Tunggakan Siswa</h3>
                <p className="text-4xl font-black text-white">{formatRupiah(totalUnpaid)}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Link href={`/${tenantSlug}/dashboard/master-data/students`} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
              <UserPlus size={18} />
              Tambah Siswa Baru
            </Link>
            <Link href={`/${tenantSlug}/dashboard/schedules`} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
              <CalendarPlus size={18} />
              Kelola Jadwal
            </Link>
            <Link href={`/${tenantSlug}/dashboard/finance`} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-500 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
              <FileText size={18} />
              Lihat Tagihan
            </Link>
          </div>
        </>
      )}

      {userRole === 'TUTOR' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-600 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
              <BookOpen size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">Kelas Hari Ini</h3>
              <p className="text-4xl font-black text-white">{todayClassesCount}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
              <CalendarPlus size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">Total Kelas Bulan Ini</h3>
              <p className="text-4xl font-black text-white">{thisMonthClassesCount}</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl bg-gradient-to-br shadow-lg relative overflow-hidden group ${
            pendingAttendanceCount > 0 
              ? "from-rose-500 to-rose-700 border-rose-600 animate-pulse-soft" 
              : "from-slate-500 to-slate-700 border-slate-600"
          }`}>
            <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110">
              <CheckCircle2 size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">Absensi Tertunda</h3>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-white">{pendingAttendanceCount}</p>
                {pendingAttendanceCount > 0 && (
                  <span className="text-xs font-semibold text-rose-100 bg-rose-900/40 px-2 py-1 rounded-md mb-1.5">
                    Perlu diisi!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri (Lebar: 2): Jadwal Kelas Hari Ini */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Jadwal Kelas Hari Ini
            </h3>
            <Link href={`/${tenantSlug}/dashboard/schedules`} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {todaySchedules.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <CalendarPlus size={32} />
                </div>
                <h4 className="text-slate-900 dark:text-white font-bold mb-1">Tidak ada kelas hari ini</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal untuk hari ini masih kosong.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaySchedules.map((schedule) => (
                  <div key={schedule.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex flex-col items-center justify-center w-20 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shrink-0">
                      <span className="text-sm font-bold">{format(new Date(schedule.start_time), 'HH:mm')}</span>
                      <span className="text-xs font-medium opacity-70">{format(new Date(schedule.end_time), 'HH:mm')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{schedule.program?.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <span className="truncate">{schedule.tutor?.name || schedule.tutor?.email}</span>
                        <span>•</span>
                        <span className="truncate">{schedule.room?.name}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (Lebar: 1): Pembayaran Terakhir (Hanya Admin) */}
        {userRole !== 'TUTOR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                Pembayaran Terakhir
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {recentPayments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">Belum ada data pembayaran lunas.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="p-5 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{payment.student?.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lunas</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500">+{formatRupiah(payment.total_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
