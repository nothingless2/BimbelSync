"use client";

import { TrendingUp, BookOpen, CheckCircle2, ChevronRight, Award } from "lucide-react";
import Link from "next/link";

export interface StudentMilestoneData {
  attendance: {
    totalPastSchedules: number;
    attendedCount: number;
    percentage: number | null;
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Capaian Belajar Siswa
          </h3>
        </div>
        <Link
          href={`/${tenantSlug}/student/evaluations`}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
        >
          Lihat Rapor <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Metric Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 pt-1">
        
        {/* Metric 1: Kehadiran Sesi */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Kehadiran Sesi Kelas
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {attendance.percentage !== null ? `${attendance.percentage}%` : "—"}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendance.percentage !== null && attendance.percentage > 0
                  ? "bg-emerald-500"
                  : "bg-transparent"
              }`}
              style={{ width: `${attendance.percentage ?? 0}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {attendance.totalPastSchedules > 0
              ? `${attendance.attendedCount} dari ${attendance.totalPastSchedules} sesi hadir`
              : "Belum ada sesi kelas yang berlalu"}
          </p>
        </div>

        {/* Metric 2: Rata-Rata Nilai */}
        <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-6">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rata-rata Nilai Asesmen
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {academic.averageScore !== null ? academic.averageScore.toFixed(0) : "—"}
            </span>
            {academic.averageScore !== null && (
              <span className="text-xs font-medium text-slate-400">/ 100</span>
            )}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                academic.averageScore !== null && academic.averageScore > 0
                  ? "bg-blue-600"
                  : "bg-transparent"
              }`}
              style={{ width: `${academic.averageScore ?? 0}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {academic.totalEvaluations > 0
              ? `${academic.totalEvaluations} evaluasi nilai terbit`
              : "Belum ada asesmen dinilai"}
          </p>
        </div>

        {/* Metric 3: Modul Belajar */}
        <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-6">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Modul Pembelajaran
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {materials.totalAvailable}
            </span>
            <span className="text-xs font-medium text-slate-400">Modul</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                materials.totalAvailable > 0 ? "bg-indigo-500" : "bg-transparent"
              }`}
              style={{ width: materials.totalAvailable > 0 ? "100%" : "0%" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {materials.totalAvailable > 0 ? "Materi siap dipelajari" : "Belum ada materi diunggah"}
            </p>
            {materials.totalAvailable > 0 && (
              <Link
                href={`/${tenantSlug}/student/materials`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Buka &rarr;
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
