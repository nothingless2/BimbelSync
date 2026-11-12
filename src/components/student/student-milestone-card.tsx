"use client";

import React from "react";
import { TrendingUp, Award, BookOpen, Check, X, Minus, Star, ChevronRight, Calendar } from "lucide-react";
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
    scoredCount?: number;
    examAverage?: number | null;
    homeworkAverage?: number | null;
  };
  materials: {
    totalAvailable: number;
  };
  sessions?: {
    totalSchedules: number;
    pastSchedulesCount: number;
    activeSessionNumber: number;
    slidingWindow: {
      sessionNumber: number;
      dateFormatted: string;
      status: "PRESENT" | "ABSENT" | "EXCUSED" | "ACTIVE_NEXT" | "UPCOMING";
      roomName?: string;
      programName?: string;
    }[];
  };
}

interface StudentMilestoneCardProps {
  milestone: StudentMilestoneData;
  tenantSlug: string;
}

/**
 * Komponen Progress Bar dengan Efek Gradasi Berkilau (Glossy Striped) 
 * dan Pin Balon Persentase Mengambang (Floating Pin Bubble).
 */
function GlossyPinBar({
  label,
  value,
  sublabel,
  gradientClass,
  pinBgClass,
  pinArrowClass,
  badgeText,
}: {
  label: string;
  value: number | null;
  sublabel?: string;
  gradientClass: string;
  pinBgClass: string;
  pinArrowClass: string;
  badgeText?: string;
}) {
  // Clamp pin position between 7% and 93% agar balon tidak terpotong di tepi kiri/kanan
  const clampedPct = value !== null ? Math.min(Math.max(value, 7), 93) : 0;
  const fillWidth = value !== null ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className="space-y-1">
      {/* Label & Nilai Numerik */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {badgeText}
            </span>
          )}
          <span className="font-extrabold text-slate-900 dark:text-white">
            {value !== null ? `${value.toFixed(0)}/100` : "—"}
          </span>
        </div>
      </div>

      {/* Bar Container dengan Ruang Pin Mengambang di Atasnya */}
      <div className="relative pt-6 pb-0.5">
        {/* Floating Pin Bubble dengan Panah ke Bawah */}
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

        {/* Track Bar Bergaris Diagonal (Glossy Texture) */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 sm:h-4 rounded-full overflow-hidden relative shadow-inner p-0.5 border border-slate-200/40 dark:border-slate-700/40">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${gradientClass} relative overflow-hidden`}
            style={{ width: `${fillWidth}%` }}
          >
            {/* Pola Garis Miring Halus (Glossy Stripes) */}
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

      {/* Sublabel / Keterangan di Bawah Bar */}
      {sublabel && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {sublabel}
        </p>
      )}
    </div>
  );
}

export function StudentMilestoneCard({ milestone, tenantSlug }: StudentMilestoneCardProps) {
  const { attendance, academic, materials, sessions } = milestone;

  // Donut progress SVG calculations
  const attendancePct = attendance.percentage ?? 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendancePct / 100) * circumference;

  const totalSchedules = sessions?.totalSchedules ?? 0;
  const activeSessionNum = sessions?.activeSessionNumber ?? 1;
  const slidingWindow = sessions?.slidingWindow ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
      
      {/* Header Utama Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Milestone & Capaian Belajar Siswa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pantau progres kehadiran kelas dan rata-rata evaluasi nilai Anda.
            </p>
          </div>
        </div>

        <Link
          href={`/${tenantSlug}/student/evaluations`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 self-start sm:self-auto bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
        >
          Lihat E-Rapor <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid 2 Kolom: Kolom Kiri (Milestone Sesi) & Kolom Kanan (Nilai Siswa) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* =========================================================
            KOLOM KIRI (7/12): MILESTONE PERTEMUAN KELAS & GAUGE
        ========================================================= */}
        <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-5">
          
          {/* Top Row: Donut Gauge + Info Sesi */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                Progres Pertemuan Kelas
              </span>
              <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalSchedules > 0
                  ? `Pertemuan ${activeSessionNum} dari ${totalSchedules} Sesi`
                  : "Kalender Sesi Kelas"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalSchedules > 0
                  ? `${attendance.attendedCount} sesi dihadiri (${attendancePct}% ketertiban)`
                  : "Belum ada sesi kelas yang dijadwalkan."}
              </p>
            </div>

            {/* Circular Donut Gauge Kehadiran */}
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-200 dark:text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                  {attendance.percentage !== null ? `${attendance.percentage}%` : "—"}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  Hadir
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Sesi Pertemuan (Sliding Window 5 Sesi Terdekat) */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-3">
              <span>Alur Milestone Pertemuan</span>
              {totalSchedules > 5 && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                  Fokus 5 Sesi Terdekat
                </span>
              )}
            </div>

            {slidingWindow.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-400">
                Jadwal pertemuan akan otomatis tampil saat sesi kelas dirilis.
              </div>
            ) : (
              <div className="relative flex items-center justify-between px-1 sm:px-2">
                
                {/* Connecting Track Line */}
                <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />

                {slidingWindow.map((step, idx) => {
                  const isPresent = step.status === "PRESENT";
                  const isAbsent = step.status === "ABSENT";
                  const isExcused = step.status === "EXCUSED";
                  const isActiveNext = step.status === "ACTIVE_NEXT";
                  const isUpcoming = step.status === "UPCOMING";

                  return (
                    <div
                      key={idx}
                      className="relative z-10 flex flex-col items-center text-center group"
                    >
                      {/* Circle Icon Indicator */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-xs ${
                          isPresent
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-100 dark:ring-emerald-950"
                            : isAbsent
                            ? "bg-rose-500 text-white ring-2 ring-rose-100 dark:ring-rose-950"
                            : isExcused
                            ? "bg-amber-500 text-white ring-2 ring-amber-100 dark:ring-amber-950"
                            : isActiveNext
                            ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/60 shadow-md animate-pulse"
                            : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                        title={`Sesi ${step.sessionNumber} - ${step.dateFormatted}`}
                      >
                        {isPresent ? (
                          <Check size={14} strokeWidth={3} />
                        ) : isAbsent ? (
                          <X size={14} strokeWidth={3} />
                        ) : isExcused ? (
                          <Minus size={14} strokeWidth={3} />
                        ) : isActiveNext ? (
                          <Star size={13} className="fill-white" />
                        ) : (
                          step.sessionNumber
                        )}
                      </div>

                      {/* Label Text di Bawah Lingkaran */}
                      <div className="mt-1.5 flex flex-col items-center">
                        <span
                          className={`text-[11px] font-bold leading-tight ${
                            isActiveNext
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          Sesi {step.sessionNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 whitespace-nowrap">
                          {step.dateFormatted}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            KOLOM KANAN (5/12): PROGRESS BAR NILAI (GLOSSY & PIN)
        ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Capaian Nilai & Asesmen
            </span>
            <span className="text-xs text-slate-400">
              {academic.totalEvaluations} Tugas Terbit
            </span>
          </div>

          {/* Bar 1: Rata-Rata Nilai Asesmen (Cyan to Blue Gradient) */}
          <GlossyPinBar
            label="Rata-rata Asesmen"
            value={academic.averageScore}
            sublabel={
              academic.averageScore !== null
                ? `${academic.scoredCount ?? 0} dari ${academic.totalEvaluations} evaluasi telah dinilai`
                : "Belum ada nilai terbit"
            }
            gradientClass="from-cyan-400 via-blue-500 to-indigo-600"
            pinBgClass="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-blue-500/20"
            pinArrowClass="border-t-blue-600"
            badgeText={
              academic.averageScore !== null
                ? academic.averageScore >= 80
                  ? "Sangat Baik"
                  : academic.averageScore >= 65
                  ? "Cukup Baik"
                  : "Perlu Ditingkatkan"
                : undefined
            }
          />

          {/* Bar 2: Ujian & Kuis (Purple to Violet Gradient) */}
          <GlossyPinBar
            label="Ujian & Kuis (Exam)"
            value={academic.examAverage ?? academic.averageScore}
            sublabel="Rata-rata evaluasi kuis dan ujian"
            gradientClass="from-fuchsia-400 via-purple-500 to-violet-600"
            pinBgClass="bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-purple-500/20"
            pinArrowClass="border-t-purple-600"
          />

          {/* Bar 3: Tugas & PR (Amber to Orange Gradient) */}
          <GlossyPinBar
            label="Tugas & PR Harian"
            value={academic.homeworkAverage ?? academic.averageScore}
            sublabel="Penyelesaian latihan dan pekerjaan rumah"
            gradientClass="from-amber-400 via-orange-500 to-rose-500"
            pinBgClass="bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-500/20"
            pinArrowClass="border-t-orange-500"
          />

          {/* Modul Belajar Footer Link */}
          <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {materials.totalAvailable} Modul Pembelajaran Siap Dipelajari
              </span>
            </div>
            <Link
              href={`/${tenantSlug}/student/materials`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
            >
              Buka &rarr;
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
