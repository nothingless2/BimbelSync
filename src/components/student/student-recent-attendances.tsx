"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, Calendar, Clock, MapPin } from "lucide-react";

// Helper format waktu (WIB)
const formatTimeWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(date))
    .replace(".", ":");
};

const formatDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

interface AttendanceRecord {
  id: string;
  scanned_at: string | Date;
  attendance_status: string;
  schedule: {
    program_id?: string;
    program?: {
      id?: string;
      name: string;
    };
    room?: {
      name: string;
    };
    tutor?: {
      name?: string | null;
      email?: string | null;
    };
  };
}

export function StudentRecentAttendances({
  attendances,
  programs = [],
  tenantSlug,
}: {
  attendances: AttendanceRecord[];
  programs?: { id: string; name: string }[];
  tenantSlug: string;
}) {
  // Default ke program pertama jika ada, agar sinkron dengan komponen lainnya
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs.length > 0 ? programs[0].id : "ALL"
  );

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentProgramName = currentProgram
    ? currentProgram.name
    : selectedProgramId === "ALL"
    ? "Semua Program"
    : "";

  const programAttendances =
    selectedProgramId === "ALL"
      ? attendances
      : attendances.filter(
          (a) =>
            a.schedule?.program_id === selectedProgramId ||
            a.schedule?.program?.id === selectedProgramId
        );

  const displayedAttendances = programAttendances.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Riwayat Absensi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catatan presensi kehadiran kelas terbaru Anda
          </p>
        </div>

        <Link
          href={`/${tenantSlug}/student/attendances${
            selectedProgramId !== "ALL" ? `?programId=${selectedProgramId}` : ""
          }`}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 self-start sm:self-auto bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl transition"
        >
          Lihat Semua &rarr;
        </Link>
      </div>

      {/* Program Selector Tabs (Mobile-Friendly, No-Scrollbar) */}
      {programs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {programs.map((p) => {
            const isSelected = selectedProgramId === p.id;
            const count = attendances.filter(
              (a) =>
                a.schedule?.program_id === p.id ||
                a.schedule?.program?.id === p.id
            ).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProgramId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-blue-500"
                  }`}
                />
                <span>{p.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedProgramId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedProgramId === "ALL"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>Semua</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                selectedProgramId === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {attendances.length}
            </span>
          </button>
        </div>
      )}

      {/* Attendance List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {displayedAttendances.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedAttendances.map((record) => {
              const isPresent = record.attendance_status === "PRESENT";
              const isAbsent = record.attendance_status === "ABSENT";

              return (
                <div
                  key={record.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                        isPresent
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : isAbsent
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle2 size={18} />
                      ) : isAbsent ? (
                        <XCircle size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {record.schedule?.program?.name || "Program Kelas"}
                        </span>
                        {record.schedule?.room?.name && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Ruang {record.schedule.room.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateWIB(record.scanned_at)}, {formatTimeWIB(record.scanned_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                      isPresent
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                        : isAbsent
                        ? "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40"
                        : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
                    }`}
                  >
                    {isPresent ? "Hadir" : isAbsent ? "Alpa" : "Izin"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedProgramId !== "ALL" && currentProgramName
                ? `Belum ada riwayat absensi untuk ${currentProgramName}`
                : "Belum ada riwayat absensi"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Riwayat kehadiran kelas Anda akan tercatat otomatis saat sesi dimulai.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

