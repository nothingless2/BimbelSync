"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">TANGGAL & WAKTU</th>
              <th className="px-6 py-4 font-semibold">AKTOR (STAF)</th>
              <th className="px-6 py-4 font-semibold">AKSI</th>
              <th className="px-6 py-4 font-semibold">ENTITAS</th>
              <th className="px-6 py-4 font-semibold">DETAIL (JSON)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                  <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 max-w-xs overflow-x-auto text-slate-600 dark:text-slate-400">
                    {log.details ? JSON.stringify(log.details, null, 2) : 'No details'}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
