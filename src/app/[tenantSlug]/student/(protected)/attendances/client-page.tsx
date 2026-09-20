"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, AlertCircle, Calendar, Clock, MapPin } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Pagination } from "@/components/ui/pagination";

// Helper format waktu (WIB)
const formatTimeWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)).replace('.', ':');
};
const formatDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};
const formatFullDateWIB = (date: Date | string) => {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export default function StudentAttendancesClientPage({ attendances }: { attendances: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PRESENT", label: "Hadir" },
    { value: "ABSENT", label: "Alpa" },
    { value: "PERMIT", label: "Izin" },
  ];

    const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAttendances = attendances.filter((a: any) => {
    const matchQuery = a.schedule.program.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       a.schedule.tutor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.schedule.tutor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || a.attendance_status === statusFilter;
    return matchQuery && matchStatus;
  });

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const currentData = filteredAttendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 relative z-20">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari program atau nama tutor..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200 outline-none"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <CustomSelect
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          />
        </div>
      </div>

      {filteredAttendances.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tidak ada riwayat absensi</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Belum ada data absensi yang sesuai dengan pencarianmu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm relative z-10">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
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
                        {record.schedule.program.name}
                      </div>
                      <div className="text-slate-500 mt-1">
                        Tutor: {record.schedule.tutor.name || record.schedule.tutor.email || 'Tutor'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          <Calendar size={14} />
                          <span>{formatFullDateWIB(record.scanned_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-bold px-2 py-1 rounded-md">
                          <Clock size={14} />
                          <span>{formatTimeWIB(record.scanned_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 px-1">
                        <MapPin size={14} />
                        <span>Ruang {record.schedule.room.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg text-sm ${
                        record.attendance_status === 'PRESENT' ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                        record.attendance_status === 'ABSENT' ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20' :
                        'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
                      }`}>
                        {record.attendance_status === 'PRESENT' ? <CheckCircle2 size={16} /> :
                         record.attendance_status === 'ABSENT' ? <XCircle size={16} /> :
                         <AlertCircle size={16} />}
                        {record.attendance_status === 'PRESENT' ? 'Hadir' :
                         record.attendance_status === 'ABSENT' ? 'Alpa' : 'Izin'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={filteredAttendances.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
    </div>
  );
}
