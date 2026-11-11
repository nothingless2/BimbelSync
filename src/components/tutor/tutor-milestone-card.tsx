"use client";

import { TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface TutorMilestoneData {
  teaching: {
    thisMonthTotal: number;
    completedCount: number;
    percentage: number;
  };
  attendanceVerification: {
    pendingCount: number;
    percentage: number | null;
  };
  evaluations: {
    totalStudentsTaught: number;
    evaluatedStudentsCount: number;
    percentage: number | null;
  };
}

interface TutorMilestoneCardProps {
  milestone: TutorMilestoneData;
  tenantSlug: string;
}

export function TutorMilestoneCard({ milestone, tenantSlug }: TutorMilestoneCardProps) {
  const { teaching, attendanceVerification, evaluations } = milestone;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Progres Mengajar Bulan Ini
          </h3>
        </div>
        <Link
          href={`/${tenantSlug}/dashboard/schedules`}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
        >
          Lihat Kalender <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Metric Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 pt-1">
        
        {/* Metric 1: Sesi Terlaksana */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sesi Kelas Terlaksana
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {teaching.thisMonthTotal > 0 ? `${teaching.percentage}%` : "—"}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                teaching.thisMonthTotal > 0 && teaching.percentage > 0
                  ? "bg-emerald-500"
                  : "bg-transparent"
              }`}
              style={{ width: `${teaching.percentage}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {teaching.thisMonthTotal > 0
              ? `${teaching.completedCount} dari ${teaching.thisMonthTotal} sesi selesai`
              : "Belum ada jadwal bulan ini"}
          </p>
        </div>

        {/* Metric 2: Ketertiban Presensi */}
        <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-6">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ketertiban Presensi
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {attendanceVerification.percentage !== null ? `${attendanceVerification.percentage}%` : "—"}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendanceVerification.percentage !== null && attendanceVerification.percentage > 0
                  ? attendanceVerification.pendingCount === 0
                    ? "bg-blue-600"
                    : "bg-amber-500"
                  : "bg-transparent"
              }`}
              style={{ width: `${attendanceVerification.percentage ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {attendanceVerification.percentage !== null
                ? attendanceVerification.pendingCount === 0
                  ? "Semua presensi tertib diisi"
                  : `${attendanceVerification.pendingCount} sesi belum direkap`
                : "Belum ada sesi kelas yang usai"}
            </p>
            {attendanceVerification.pendingCount > 0 ? (
              <Link
                href={`/${tenantSlug}/dashboard/schedules/attendance?filter=PENDING`}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Isi Presensi &rarr;
              </Link>
            ) : (
              <Link
                href={`/${tenantSlug}/dashboard/schedules/attendance`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Cek &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Metric 3: Input Nilai & Rapor */}
        <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-6">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Evaluasi Nilai Siswa
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {evaluations.percentage !== null ? `${evaluations.percentage}%` : "—"}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                evaluations.percentage !== null && evaluations.percentage > 0
                  ? "bg-indigo-500"
                  : "bg-transparent"
              }`}
              style={{ width: `${evaluations.percentage ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {evaluations.totalStudentsTaught > 0
                ? `${evaluations.evaluatedStudentsCount} dari ${evaluations.totalStudentsTaught} murid ternilai`
                : "Belum ada murid di kelas"}
            </p>
            {evaluations.totalStudentsTaught > 0 && (
              <Link
                href={`/${tenantSlug}/dashboard/evaluations`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Input Nilai &rarr;
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
