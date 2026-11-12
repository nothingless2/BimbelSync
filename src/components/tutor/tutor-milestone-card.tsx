"use client";

import { TrendingUp, ChevronRight, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
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

/**
 * Komponen Bar Gradasi dengan Pin Mengambang untuk Tutor
 */
function TutorGlossyPinBar({
  value,
  gradientClass,
  pinBgClass,
  pinArrowClass,
}: {
  value: number | null;
  gradientClass: string;
  pinBgClass: string;
  pinArrowClass: string;
}) {
  const clampedPct = value !== null ? Math.min(Math.max(value, 8), 92) : 0;
  const fillWidth = value !== null ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className="relative pt-6 pb-0.5">
      {/* Floating Pin Bubble */}
      {value !== null && (
        <div
          className="absolute top-0 transition-all duration-700 ease-out z-10 flex flex-col items-center pointer-events-none"
          style={{ left: `${clampedPct}%`, transform: "translateX(-50%)" }}
        >
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm flex items-center justify-center leading-none ${pinBgClass}`}
          >
            {Math.round(value)}%
          </div>
          <div
            className={`w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[4px] -mt-px ${pinArrowClass}`}
          />
        </div>
      )}

      {/* Track Bar Bergaris Diagonal */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 sm:h-4 rounded-full overflow-hidden relative shadow-inner p-0.5 border border-slate-200/40 dark:border-slate-700/40">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${gradientClass} relative overflow-hidden`}
          style={{ width: `${fillWidth}%` }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 6px, transparent 6px, transparent 12px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function TutorMilestoneCard({ milestone, tenantSlug }: TutorMilestoneCardProps) {
  const { teaching, attendanceVerification, evaluations } = milestone;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
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
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
        >
          Lihat Kalender <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Metric Columns dengan Glossy Pin Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-1">
        
        {/* Metric 1: Sesi Terlaksana */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Sesi Kelas Terlaksana
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {teaching.thisMonthTotal > 0 ? `${teaching.percentage}%` : "—"}
            </span>
          </div>

          <TutorGlossyPinBar
            value={teaching.thisMonthTotal > 0 ? teaching.percentage : null}
            gradientClass="from-emerald-400 via-teal-500 to-cyan-600"
            pinBgClass="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-teal-500/20"
            pinArrowClass="border-t-teal-600"
          />

          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            {teaching.thisMonthTotal > 0
              ? `${teaching.completedCount} dari ${teaching.thisMonthTotal} sesi kelas selesai`
              : "Belum ada jadwal bulan ini"}
          </p>
        </div>

        {/* Metric 2: Ketertiban Presensi */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Ketertiban Presensi
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {attendanceVerification.percentage !== null ? `${attendanceVerification.percentage}%` : "—"}
            </span>
          </div>

          <TutorGlossyPinBar
            value={attendanceVerification.percentage}
            gradientClass="from-cyan-400 via-blue-500 to-indigo-600"
            pinBgClass="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-blue-500/20"
            pinArrowClass="border-t-blue-600"
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {attendanceVerification.percentage !== null
                ? attendanceVerification.pendingCount === 0
                  ? "Semua presensi tertib"
                  : `${attendanceVerification.pendingCount} sesi belum diabsen`
                : "Belum ada sesi usai"}
            </p>
            {attendanceVerification.pendingCount > 0 ? (
              <Link
                href={`/${tenantSlug}/dashboard/schedules/attendance?filter=PENDING`}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Isi Presensi &rarr;
              </Link>
            ) : (
              <Link
                href={`/${tenantSlug}/dashboard/schedules/attendance`}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Cek &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Metric 3: Input Nilai & Rapor */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Evaluasi Nilai Siswa
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {evaluations.percentage !== null ? `${evaluations.percentage}%` : "—"}
            </span>
          </div>

          <TutorGlossyPinBar
            value={evaluations.percentage}
            gradientClass="from-fuchsia-400 via-purple-500 to-violet-600"
            pinBgClass="bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-purple-500/20"
            pinArrowClass="border-t-purple-600"
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {evaluations.totalStudentsTaught > 0
                ? `${evaluations.evaluatedStudentsCount} dari ${evaluations.totalStudentsTaught} murid ternilai`
                : "Belum ada murid di kelas"}
            </p>
            {evaluations.totalStudentsTaught > 0 && (
              <Link
                href={`/${tenantSlug}/dashboard/evaluations`}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
