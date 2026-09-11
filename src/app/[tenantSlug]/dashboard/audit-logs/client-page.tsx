"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pagination } from "@/components/ui/pagination";
import { Filter } from "lucide-react";

interface Log {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: Date;
  details: any;
  staff: {
    name: string | null;
    email: string;
  } | null;
}

interface Props {
  logs: Log[];
}

export default function AuditLogsClientPage({ logs }: Props) {
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const filteredLogs = logs.filter(log => filterAction === "ALL" || log.action === filterAction);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const currentData = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Belum Ada Aktivitas</h3>
        <p className="text-slate-500 dark:text-slate-400">Log aktivitas akan muncul setelah admin atau staf melakukan perubahan data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      
      {/* Toolbar Filter */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={14} className="text-slate-400" />
          </div>
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200 appearance-none bg-white"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE (Membuat)</option>
            <option value="UPDATE">UPDATE (Memperbarui)</option>
            <option value="DELETE">DELETE (Menghapus)</option>
            <option value="VERIFY">VERIFY (Verifikasi)</option>
            <option value="LOGIN">LOGIN (Masuk Sistem)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold w-16">No.</th>
              <th className="px-6 py-4 font-semibold">TANGGAL & WAKTU</th>
              <th className="px-6 py-4 font-semibold">AKTOR (STAF)</th>
              <th className="px-6 py-4 font-semibold">AKSI</th>
              <th className="px-6 py-4 font-semibold">ENTITAS</th>
              <th className="px-6 py-4 font-semibold">DETAIL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {currentData.map((log, index) => {
              // Helper untuk mengubah JSON detail menjadi kalimat yang mudah dibaca
              const formatDetails = (action: string, entity: string, details: any) => {
                if (!details || Object.keys(details).length === 0) return "Tidak ada detail.";
                
                const entries = Object.entries(details).map(([key, value]) => {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return `${label}: ${typeof value === 'boolean' ? (value ? 'Ya' : 'Tidak') : value}`;
                });
                
                const detailString = entries.join(', ');

                if (action === "CREATE") return `Menambahkan ${entity} baru (${detailString})`;
                if (action === "UPDATE") return `Memperbarui ${entity} (${detailString})`;
                if (action === "DELETE") return `Menghapus ${entity} (${detailString})`;
                if (action === "VERIFY") return `Memverifikasi ${entity} (${detailString})`;
                
                return `Melakukan ${action} pada ${entity} (${detailString})`;
              };

              return (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-500">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-slate-900 dark:text-slate-200 font-medium">
                    {format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {format(new Date(log.created_at), 'HH:mm:ss')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-900 dark:text-slate-200 font-medium">
                    {log.staff ? (log.staff.name || 'Admin') : 'Sistem'}
                  </div>
                  {log.staff && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {log.staff.email}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    log.action.includes('DELETE') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-slate-300">
                  <div className="font-medium">{log.entity_type}</div>
                  <div className="text-xs text-slate-500 mt-0.5 max-w-[120px] truncate" title={log.entity_id || ''}>
                    {log.entity_id || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed">
                    {formatDetails(log.action, log.entity_type, log.details)}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        totalItems={filteredLogs.length} 
        itemsPerPage={itemsPerPage} 
      />
    </div>
  );
}
