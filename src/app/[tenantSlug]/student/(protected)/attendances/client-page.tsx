"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, AlertCircle, Calendar, Clock, MapPin } from "lucide-react";

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

  const filteredAttendances = attendances.filter((a: any) => {
    const matchQuery = a.schedule.program.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       a.schedule.tutor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || a.attendance_status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari program atau nama tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200 outline-none"
        >
          <option value="ALL">Semua Status</option>
          <option value="PRESENT">Hadir</option>
          <option value="ABSENT">Alpa</option>
          <option value="PERMIT">Izin</option>
        </select>
      </div>

      {filteredAttendances.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tidak ada riwayat absensi</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Belum ada data absensi yang sesuai dengan pencarianmu.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAttendances.map((record: any) => (
              <div key={record.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2.5 rounded-full shrink-0 ${
                    record.attendance_status === 'PRESENT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    record.attendance_status === 'ABSENT' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {record.attendance_status === 'PRESENT' ? <CheckCircle2 size={20} /> :
                     record.attendance_status === 'ABSENT' ? <XCircle size={20} /> :
                     <AlertCircle size={20} />}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {record.schedule.program.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">
                      Tutor: {record.schedule.tutor.name}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
                        <Calendar size={12} />
                        {formatFullDateWIB(record.scanned_at)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md">
                        <Clock size={12} />
                        {formatTimeWIB(record.scanned_at)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
                        <MapPin size={12} />
                        Ruang {record.schedule.room.name}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                    record.attendance_status === 'PRESENT' ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                    record.attendance_status === 'ABSENT' ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20' :
                    'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
                  }`}>
                    {record.attendance_status === 'PRESENT' ? 'Hadir' :
                     record.attendance_status === 'ABSENT' ? 'Alpa' : 'Izin'}
                  </span>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
