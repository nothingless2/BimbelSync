"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Users,
  Percent,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ProgramStudent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ProgramData {
  id: string;
  name: string;
  students: ProgramStudent[];
}

interface ScheduleItem {
  id: string;
  programId: string;
  programName: string;
  roomName: string;
  tutorName: string;
  startTime: string;
  endTime: string;
  status: string;
  isPast: boolean;
  isOngoing: boolean;
  isUpcoming: boolean;
  isLupaAbsen: boolean;
  attendancesCount: number;
  presentCount: number;
  excusedCount: number;
  absentCount: number;
  attendances: {
    id: string;
    student_id: string;
    attendance_status: "PRESENT" | "EXCUSED" | "ABSENT";
  }[];
}

interface AttendanceMonitoringClientProps {
  tenantSlug: string;
  isTutor: boolean;
  userName: string;
  programs: ProgramData[];
  schedules: ScheduleItem[];
  pendingCount: number;
  initialFilter?: string;
  initialProgramId?: string;
}

export default function AttendanceMonitoringClient({
  tenantSlug,
  isTutor,
  userName,
  programs,
  schedules,
  pendingCount,
  initialFilter = "ALL",
  initialProgramId = "ALL",
}: AttendanceMonitoringClientProps) {
  const router = useRouter();

  // Filters & State
  const [selectedProgramId, setSelectedProgramId] = useState<string>(initialProgramId);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"sessions" | "students">("sessions");

  // Format Helper
  const formatDateTime = (isoDate: string) => {
    const d = parseISO(isoDate);
    return format(d, "EEEE, d MMM yyyy", { locale: localeId });
  };

  const formatTimeRange = (startIso: string, endIso: string) => {
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    return `${format(start, "HH:mm")} - ${format(end, "HH:mm")} WIB`;
  };

  // Pending Schedules (Lupa Absen)
  const pendingSchedules = useMemo(() => {
    return schedules.filter((s) => s.isLupaAbsen);
  }, [schedules]);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // Program Filter
      if (selectedProgramId !== "ALL" && s.programId !== selectedProgramId) {
        return false;
      }

      // Status Filter
      if (statusFilter === "PENDING" && !s.isLupaAbsen) {
        return false;
      }
      if (statusFilter === "RECORDED" && s.attendancesCount === 0) {
        return false;
      }
      if (statusFilter === "UPCOMING" && !s.isUpcoming && !s.isOngoing) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProgram = s.programName.toLowerCase().includes(q);
        const matchRoom = s.roomName.toLowerCase().includes(q);
        const matchTutor = s.tutorName.toLowerCase().includes(q);
        return matchProgram || matchRoom || matchTutor;
      }

      return true;
    });
  }, [schedules, selectedProgramId, statusFilter, searchQuery]);

  // Selected Program for Student Matrix
  const activeProgram = useMemo(() => {
    if (selectedProgramId === "ALL") {
      return programs[0] || null;
    }
    return programs.find((p) => p.id === selectedProgramId) || null;
  }, [programs, selectedProgramId]);

  // Student Attendance Matrix for activeProgram
  const studentStats = useMemo(() => {
    if (!activeProgram) return [];

    // Filter all completed schedules for this program
    const programPastSchedules = schedules.filter(
      (s) => s.programId === activeProgram.id && s.isPast && s.status !== "CANCELLED"
    );
    const totalPastSessions = programPastSchedules.length;

    return activeProgram.students.map((student) => {
      let present = 0;
      let excused = 0;
      let absent = 0;

      programPastSchedules.forEach((sch) => {
        const record = sch.attendances.find((a) => a.student_id === student.id);
        if (record) {
          if (record.attendance_status === "PRESENT") present++;
          else if (record.attendance_status === "EXCUSED") excused++;
          else if (record.attendance_status === "ABSENT") absent++;
        }
      });

      const recordedCount = present + excused + absent;
      const rate =
        totalPastSessions > 0
          ? Math.round((present / totalPastSessions) * 100)
          : null;

      return {
        student,
        totalPastSessions,
        present,
        excused,
        absent,
        recordedCount,
        rate,
      };
    });
  }, [activeProgram, schedules]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link
            href={`/${tenantSlug}/dashboard/schedules`}
            className="hover:text-blue-600 transition-colors"
          >
            Jadwal Kelas
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            Monitoring Presensi
          </span>
        </div>

        {/* Top Header Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/${tenantSlug}/dashboard/schedules`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Calendar size={16} />
              Kalender Jadwal
            </Link>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 shadow-sm"
            >
              <ClipboardCheck size={16} />
              Monitoring Presensi Siswa
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {pendingCount} Lupa Absen
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isTutor ? "Portal Presensi Tutor" : "Monitoring Presensi Akademi"}
          </div>
        </div>
      </div>

      {/* Main Title & Description */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Monitoring & Rekap Presensi Siswa
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isTutor
            ? "Pantau status kehadiran siswa pada kelas yang Anda ajar. Jika ada sesi yang lupa diabsen, Anda dapat langsung mengisinya di sini."
            : "Pantau rekap kehadiran seluruh sesi kelas bimbel dan pastikan tidak ada jadwal yang tertinggal."}
        </p>
      </div>

      {/* ALERT BANNER: LUPA ABSEN (Jika pendingCount > 0) */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-rose-50/50 to-amber-50 dark:from-rose-950/30 dark:via-rose-950/20 dark:to-amber-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  {pendingCount} Sesi Kelas Telah Selesai Namun Belum Diabsen
                </h3>
                <p className="text-xs sm:text-sm text-rose-800/90 dark:text-rose-300/80 mt-0.5">
                  Waktu kelas telah berlalu tetapi presensi siswa belum direkap.
                  Klik salah satu sesi di bawah untuk segera mengisi absensi.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter("PENDING")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Filter Jadwal Lupa Absen &rarr;
            </button>
          </div>

          {/* Quick Cards of Overdue Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-rose-200/60 dark:border-rose-900/40">
            {pendingSchedules.slice(0, 3).map((sch) => (
              <div
                key={sch.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/30 flex flex-col justify-between shadow-xs hover:border-rose-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      Belum Diabsen
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatTimeRange(sch.startTime, sch.endTime)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {sch.programName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDateTime(sch.startTime)} • {sch.roomName}
                  </p>
                </div>

                <Link
                  href={`/${tenantSlug}/dashboard/schedules/${sch.id}`}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-xl text-xs font-bold transition"
                >
                  <CheckCircle2 size={14} />
                  Isi Presensi Sekarang
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Sesi Terjadwal
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {schedules.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sudah Diabsen
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {schedules.filter((s) => s.attendancesCount > 0).length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Lupa Absen (Tertunda)
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              pendingCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {pendingCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Program Yang Diajar
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {programs.length}
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls Bar & View Switcher */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0 self-start">
              <button
                onClick={() => setViewMode("sessions")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  viewMode === "sessions"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <ClipboardCheck size={16} />
                Daftar Sesi Kelas ({filteredSchedules.length})
              </button>
              <button
                onClick={() => setViewMode("students")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  viewMode === "students"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Users size={16} />
                Rekap Kehadiran Siswa
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari program / ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
            {/* Program Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Program:
              </span>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Semua Program ({programs.length})</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.students.length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pills (Only relevant in sessions view) */}
            {viewMode === "sessions" && (
              <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "ALL"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  Semua ({schedules.length})
                </button>

                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "PENDING"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <AlertTriangle size={12} />
                  Belum Diabsen ({pendingCount})
                </button>

                <button
                  onClick={() => setStatusFilter("RECORDED")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "RECORDED"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 size={12} />
                  Sudah Diabsen (
                  {schedules.filter((s) => s.attendancesCount > 0).length})
                </button>

                <button
                  onClick={() => setStatusFilter("UPCOMING")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "UPCOMING"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100"
                  }`}
                >
                  <Clock size={12} />
                  Mendatang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            VIEW MODE 1: DAFTAR SESI KELAS (SESSION LIST)
        ======================================================== */}
        {viewMode === "sessions" && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSchedules.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {statusFilter === "PENDING"
                    ? "Hebat! Tidak ada sesi yang lupa diabsen"
                    : "Tidak ada jadwal kelas yang sesuai kriteria"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {statusFilter === "PENDING"
                    ? "Seluruh sesi kelas yang telah selesai telah tertib direkam presensinya."
                    : "Silakan ubah filter program atau kata kunci pencarian Anda."}
                </p>
                {statusFilter === "PENDING" && (
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className="mt-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:opacity-90 transition"
                  >
                    Tampilkan Semua Sesi
                  </button>
                )}
              </div>
            ) : (
              filteredSchedules.map((sch) => {
                return (
                  <div
                    key={sch.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      sch.isLupaAbsen
                        ? "bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/70"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Left: Schedule Information */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        {sch.isLupaAbsen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                            <AlertTriangle size={12} />
                            Lupa Diabsen (Selesai)
                          </span>
                        ) : sch.attendancesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 size={12} />
                            Presensi Terisi
                          </span>
                        ) : sch.isOngoing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            <Clock size={12} />
                            Sedang Berlangsung
                          </span>
                        ) : sch.status === "CANCELLED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 line-through">
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Clock size={12} />
                            Mendatang
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {formatDateTime(sch.startTime)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {formatTimeRange(sch.startTime, sch.endTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {sch.programName}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {sch.roomName}
                        </span>
                      </div>

                      {/* Attendance Breakdown (If Recorded) */}
                      {sch.attendancesCount > 0 ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Kehadiran:
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {sch.presentCount} Hadir
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            {sch.excusedCount} Izin
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                            {sch.absentCount} Alpa
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sch.isLupaAbsen
                            ? "Sesi telah berakhir, absensi siswa belum tercatat."
                            : "Presensi dibuka otomatis saat kelas berlangsung."}
                        </p>
                      )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/${tenantSlug}/present/${sch.id}`}
                        target="_blank"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                        title="Tampilkan Layar QR Presensi di TV"
                      >
                        Layar QR
                      </Link>

                      {sch.isLupaAbsen ? (
                        <Link
                          href={`/${tenantSlug}/dashboard/schedules/${sch.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-rose-600/20"
                        >
                          <CheckCircle2 size={14} />
                          Isi Presensi Sekarang &rarr;
                        </Link>
                      ) : (
                        <Link
                          href={`/${tenantSlug}/dashboard/schedules/${sch.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-xl text-xs font-semibold transition"
                        >
                          {sch.attendancesCount > 0 ? "Edit Presensi" : "Buka Presensi"}
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: REKAP SISWA PER PROGRAM (STUDENT MATRIX)
        ======================================================== */}
        {viewMode === "students" && (
          <div className="p-4 sm:p-6 space-y-4">
            {!activeProgram ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada program yang dipilih.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Rekap Kehadiran Siswa: {activeProgram.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Total {activeProgram.students.length} siswa aktif terdaftar pada program ini.
                    </p>
                  </div>

                  <Link
                    href={`/${tenantSlug}/dashboard/evaluations`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Buka e-Rapor & Evaluasi Nilai &rarr;
                  </Link>
                </div>

                {studentStats.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Belum ada siswa aktif yang terdaftar di kelas program ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4 text-center">Sesi Selesai</th>
                          <th className="py-3 px-4 text-center">Hadir</th>
                          <th className="py-3 px-4 text-center">Izin</th>
                          <th className="py-3 px-4 text-center">Alpa</th>
                          <th className="py-3 px-4">Tingkat Kehadiran</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {studentStats.map((item) => {
                          const rate = item.rate;
                          const isHigh = rate !== null && rate >= 80;
                          const isMedium = rate !== null && rate >= 60 && rate < 80;
                          const isLow = rate !== null && rate < 60;

                          return (
                            <tr
                              key={item.student.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                            >
                              <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                                    {item.student.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p>{item.student.name}</p>
                                    <p className="text-[11px] font-normal text-slate-400">
                                      {item.student.phone || item.student.email || "No contact"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-semibold">
                                {item.totalPastSessions}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {item.present}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {item.excused}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                  {item.absent}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 min-w-[140px]">
                                {rate !== null ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <span
                                        className={
                                          isHigh
                                            ? "text-emerald-600"
                                            : isMedium
                                            ? "text-amber-600"
                                            : "text-rose-600"
                                        }
                                      >
                                        {rate}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          isHigh
                                            ? "bg-emerald-500"
                                            : isMedium
                                            ? "bg-amber-500"
                                            : "bg-rose-500"
                                        }`}
                                        style={{ width: `${rate}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Belum ada sesi
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                {rate === null ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    Baru
                                  </span>
                                ) : isHigh ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Sangat Rajin
                                  </span>
                                ) : isMedium ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    Cukup
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                    Perlu Perhatian
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

