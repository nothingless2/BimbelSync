"use client";

import { Award, BookOpen, Calendar, CheckCircle2, ChevronRight, Clock, GraduationCap, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export interface TutorMilestoneData {
  teaching: {
    thisMonthTotal: number;
    completedCount: number;
    percentage: number;
  };
  attendanceVerification: {
    pendingCount: number;
    percentage: number;
  };
  evaluations: {
    totalStudentsTaught: number;
    evaluatedStudentsCount: number;
    percentage: number;
  };
}

interface TutorMilestoneCardProps {
  milestone: TutorMilestoneData;
  tenantSlug: string;
}

export function TutorMilestoneCard({ milestone, tenantSlug }: TutorMilestoneCardProps) {
  const { teaching, attendanceVerification, evaluations } = milestone;

  const getTutorStatus = () => {
    if (teaching.thisMonthTotal === 0) {
      return {
        label: "Belum Ada Jadwal",
        color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
    }
    if (attendanceVerification.pendingCount === 0 && teaching.percentage >= 80) {
      return {
        label: "Tutor Teladan ✨",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    }
    if (attendanceVerification.pendingCount > 0) {
      return {
        label: "Ada Absensi Tertunda ⚠️",
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      };
    }
    return {
      label: "On Track 👍",
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    };
  };

  const status = getTutorStatus();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Capaian Kinerja & Progres Mengajar (Tutor Milestone)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pantau progres sesi kelas, ketertiban administrasi absensi, dan input rapor siswa.
            </p>
          </div>
        </div>

        <div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Grid 3 Milestone Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Milestone 1: Sesi Mengajar Bulan Ini */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Sesi Terlaksana
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {teaching.percentage}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, teaching.percentage))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              {teaching.thisMonthTotal > 0
                ? `${teaching.completedCount} dari ${teaching.thisMonthTotal} sesi selesai`
                : "Belum ada jadwal bulan ini"}
            </span>
            <Link
              href={`/${tenantSlug}/dashboard/schedules`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
            >
              Jadwal <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Milestone 2: Ketertiban Rekap Presensi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Ketertiban Presensi
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {attendanceVerification.percentage}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  attendanceVerification.pendingCount === 0
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                    : "bg-gradient-to-r from-amber-500 to-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceVerification.percentage))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              {attendanceVerification.pendingCount === 0
                ? "Semua presensi tertib diisi"
                : `${attendanceVerification.pendingCount} sesi belum direkap`}
            </span>
            <Link
              href={`/${tenantSlug}/dashboard/schedules`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
            >
              Cek Kelas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Milestone 3: Evaluasi Nilai Siswa */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                Input Nilai & Rapor
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {evaluations.percentage}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, evaluations.percentage))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              {evaluations.totalStudentsTaught > 0
                ? `${evaluations.evaluatedStudentsCount} dari ${evaluations.totalStudentsTaught} murid ternilai`
                : "Belum ada murid di kelas"}
            </span>
            <Link
              href={`/${tenantSlug}/dashboard/evaluations`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
            >
              Input Nilai <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

