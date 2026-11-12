"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, CheckCircle2, XCircle, AlertCircle, Calendar, Clock, MapPin, User } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Pagination } from "@/components/ui/pagination";

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

const formatFullDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export default function StudentAttendancesClientPage({
  attendances,
  programs = [],
}: {
  attendances: any[];
  programs?: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const queryProgramId = searchParams.get("programId");

  // Default ke query param, atau program pertama siswa jika ada, agar fokus per program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    queryProgramId || (programs.length > 0 ? programs[0].id : "ALL")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentProgramName = currentProgram
    ? currentProgram.name
    : selectedProgramId === "ALL"
    ? "Semua Program"
    : "";

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PRESENT", label: "Hadir" },
    { value: "ABSENT", label: "Alpa" },
    { value: "PERMIT", label: "Izin" },
  ];

  // Filter absensi berdasarkan program yang dipilih
  const programAttendances = selectedProgramId === "ALL"
    ? attendances
    : attendances.filter((a: any) => a.schedule?.program_id === selectedProgramId);

  // Hitung ringkasan absensi untuk program terpilih
  const presentCount = programAttendances.filter((a: any) => a.attendance_status === "PRESENT").length;
  const permitCount = programAttendances.filter((a: any) => a.attendance_status === "PERMIT" || a.attendance_status === "EXCUSED").length;
  const absentCount = programAttendances.filter((a: any) => a.attendance_status === "ABSENT").length;
  const totalRecords = programAttendances.length;
  const presentRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : null;

  // Filter lanjutan berdasarkan pencarian teks dan status
  const filteredAttendances = programAttendances.filter((a: any) => {
    const matchQuery =
      a.schedule?.program?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schedule?.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schedule?.tutor?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schedule?.room?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      a.attendance_status === statusFilter ||
      (statusFilter === "PERMIT" && a.attendance_status === "EXCUSED");
    return matchQuery && matchStatus;
  });

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const currentData = filteredAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Program Selector Tabs (Mobile-Friendly Horizontal Pills, No Scrollbar) */}
      {programs.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pilih Program Belajar:
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {currentProgramName}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {programs.map((p) => {
              const isSelected = selectedProgramId === p.id;
              const count = attendances.filter((a: any) => a.schedule?.program_id === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgramId(p.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                  <span>{p.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setSelectedProgramId("ALL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedProgramId === "ALL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Absensi</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  selectedProgramId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {attendances.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Ringkasan Presensi Program (Mini Snapshot Card) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Hadir
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {presentCount}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {presentRate !== null ? `${presentRate}% ketertiban` : "Belum ada sesi"}
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              Izin / Sakit
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {permitCount}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Pemberitahuan resmi
            </span>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
              Alpa / Tidak Hadir
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {absentCount}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Tanpa keterangan
            </span>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              Total Sesi
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {totalRecords}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
              {currentProgramName || "Semua"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar (Search + Status Select) */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-20">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={
              selectedProgramId !== "ALL" && currentProgramName
                ? `Cari sesi atau tutor ${currentProgramName}...`
                : "Cari program, tutor, atau ruangan..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200"
          />
        </div>

        <div className="w-full sm:w-48">
          <CustomSelect
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Konten Daftar Absensi */}
      {filteredAttendances.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
          <CheckCircle2 size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Belum ada riwayat absensi untuk ${currentProgramName}`
              : "Tidak ada riwayat absensi"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Belum ada catatan presensi sesi kelas untuk program ${currentProgramName}.`
              : "Belum ada data absensi yang sesuai dengan pencarianmu."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tampilan Mobile: Kartu Responsif (Bebas Scrollbar Horizontal) */}
          <div className="block sm:hidden space-y-3">
            {currentData.map((record: any) => {
              const isPresent = record.attendance_status === "PRESENT";
              const isAbsent = record.attendance_status === "ABSENT";

              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                        {record.schedule?.program?.name}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                        Ruang {record.schedule?.room?.name || "Kelas"}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs shrink-0 ${
                        isPresent
                          ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                          : isAbsent
                          ? "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40"
                          : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle2 size={13} />
                      ) : isAbsent ? (
                        <XCircle size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {isPresent ? "Hadir" : isAbsent ? "Alpa" : "Izin"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{formatDateWIB(record.scanned_at)}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatTimeWIB(record.scanned_at)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {record.schedule?.tutor?.name || "Tutor"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative z-10">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Program & Tutor</th>
                  <th className="px-6 py-4 font-semibold">Waktu & Ruangan</th>
                  <th className="px-6 py-4 font-semibold text-right">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentData.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {record.schedule?.program?.name}
                      </div>
                      <div className="text-slate-500 mt-1 text-xs">
                        Tutor: {record.schedule?.tutor?.name || record.schedule?.tutor?.email || "Tutor"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs">
                          <Calendar size={13} />
                          <span>{formatFullDateWIB(record.scanned_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-bold px-2 py-1 rounded-md text-xs">
                          <Clock size={13} />
                          <span>{formatTimeWIB(record.scanned_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs px-1">
                        <MapPin size={13} />
                        <span>Ruang {record.schedule?.room?.name || "Kelas"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg text-sm ${
                          record.attendance_status === "PRESENT"
                            ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                            : record.attendance_status === "ABSENT"
                            ? "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20"
                            : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
                        }`}
                      >
                        {record.attendance_status === "PRESENT" ? (
                          <CheckCircle2 size={16} />
                        ) : record.attendance_status === "ABSENT" ? (
                          <XCircle size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        {record.attendance_status === "PRESENT"
                          ? "Hadir"
                          : record.attendance_status === "ABSENT"
                          ? "Alpa"
                          : "Izin"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredAttendances.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
