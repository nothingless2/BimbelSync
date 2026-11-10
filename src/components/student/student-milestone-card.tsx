"use client";

import { Award, BookOpen, CheckCircle2, ChevronRight, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export interface StudentMilestoneData {
  attendance: {
    totalPastSchedules: number;
    attendedCount: number;
    percentage: number;
  };
  academic: {
    averageScore: number | null;
    totalEvaluations: number;
  };
  materials: {
    totalAvailable: number;
  };
}

interface StudentMilestoneCardProps {
  milestone: StudentMilestoneData;
  tenantSlug: string;
}

export function StudentMilestoneCard({ milestone, tenantSlug }: StudentMilestoneCardProps) {
  const { attendance, academic, materials } = milestone;

  // Hitung overall score (kombinasi kehadiran & nilai)
  let overallScore = 100;
  if (attendance.totalPastSchedules > 0 && academic.averageScore !== null) {
    overallScore = Math.round(attendance.percentage * 0.4 + academic.averageScore * 0.6);
  } else if (attendance.totalPastSchedules > 0) {
    overallScore = attendance.percentage;
  } else if (academic.averageScore !== null) {
    overallScore = Math.round(academic.averageScore);
  }

  const getPerformanceBadge = () => {
    if (attendance.totalPastSchedules === 0 && academic.totalEvaluations === 0) {
      return {
        label: "Awal Semester",
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      };
    }
    if (overallScore >= 85) {
      return {
        label: "Sangat Memuaskan 🌟",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    }
    if (overallScore >= 70) {
      return {
        label: "Konsisten & Baik 👍",
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      };
    }
    return {
      label: "Perlu Ditingkatkan ⚠️",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    };
  };

  const badge = getPerformanceBadge();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Capaian Belajar (Milestone Progress)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progres kehadiran sesi belajar dan evaluasi pemahaman materi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Progress Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Milestone 1: Presensi / Kehadiran Sesi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Kehadiran Sesi Kelas
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {attendance.percentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, attendance.percentage))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              {attendance.totalPastSchedules > 0
                ? `${attendance.attendedCount} dari ${attendance.totalPastSchedules} sesi hadir`
                : "Belum ada sesi kelas yang berlalu"}
            </span>
            <Link
              href={`/${tenantSlug}/student/attendances`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
            >
              Riwayat <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Milestone 2: Asesmen & Nilai Rapor */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Rata-rata Nilai Asesmen
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {academic.averageScore !== null ? `${academic.averageScore.toFixed(1)} / 100` : "Belum Ada"}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, academic.averageScore || 0))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>
              {academic.totalEvaluations > 0
                ? `${academic.totalEvaluations} evaluasi nilai terbit`
                : "Belum ada asesmen yang dinilai"}
            </span>
            <Link
              href={`/${tenantSlug}/student/evaluations`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
            >
              Lihat Rapor <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Mini Bar: Modul Materi Pembelajaran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Modul Pembelajaran Program ({materials.totalAvailable} Materi Tersedia)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Akses slide presentasi, dokumen PDF, dan tautan materi kelas.
            </p>
          </div>
        </div>

        <Link
          href={`/${tenantSlug}/student/materials`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
        >
          <span>Buka Materi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

