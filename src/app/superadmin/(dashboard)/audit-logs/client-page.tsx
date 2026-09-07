"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User, Building2 } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";

const COMMON_ACTIONS = [
  "SEARCH_TENANT",
  "INVITE_TENANT_ADMIN",
  "DEACTIVATE_TENANT_ADMIN",
  "REACTIVATE_TENANT_ADMIN",
  "SEND_RESET_PASSWORD",
];

export default function AuditLogsClientPage({ 
  logs, 
  total, 
  totalPages, 
  currentPage, 
  superadmins, 
  academies,
  currentFilters
}: { 
  logs: any[], 
  total: number, 
  totalPages: number, 
  currentPage: number, 
  superadmins: any[], 
  academies: any[],
  currentFilters: any
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    tenant: currentFilters.tenant || "",
    superadmin: currentFilters.superadmin || "",
    action: currentFilters.action || "",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    
    router.push(`/superadmin/audit-logs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/superadmin/audit-logs?${params.toString()}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global Audit Logs</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lacak seluruh aktivitas Superadmin lintas tenant untuk kepatuhan dan keamanan.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Filter size={16} /> Filter Pencarian
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Tenant</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={filters.tenant}
                onChange={(e) => handleFilterChange("tenant", e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm appearance-none"
              >
                <option value="">Semua Tenant</option>
                {academies.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Superadmin</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={filters.superadmin}
                onChange={(e) => handleFilterChange("superadmin", e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm appearance-none"
              >
                <option value="">Semua Superadmin</option>
                {superadmins.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Aksi</label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm appearance-none"
              >
                <option value="">Semua Aksi</option>
                {COMMON_ACTIONS.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Superadmin</th>
                <th className="px-6 py-4">Jenis Aksi</th>
                <th className="px-6 py-4">Tenant Terkait</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada log aktivitas yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar id={log.superadmin_id} email={log.superadmin?.email} avatarUrl={log.superadmin?.avatar_url} size={28} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{log.superadmin?.name || log.superadmin?.email || "Unknown"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.tenantName ? (
                        <Link href={`/superadmin/academies/${log.tenantId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                          {log.tenantName}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Global / Tidak terikat</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                        {expandedLogId === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Payload Row */}
                  {expandedLogId === log.id && (
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <td colSpan={5} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-900 dark:bg-black text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                          <div className="text-slate-500 mb-2">// Payload Details</div>
                          <pre>{log.details ? JSON.stringify(log.details, null, 2) : "{}"}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan halaman {currentPage} dari {totalPages} (Total {total} log)
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
