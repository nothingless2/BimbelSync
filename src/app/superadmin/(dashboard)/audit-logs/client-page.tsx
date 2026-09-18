"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User, Building2, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { Pagination } from "@/components/ui/pagination";
import { CustomSelect } from "@/components/ui/custom-select";

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
  
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(q);
    const emailMatch = (log.superadmin?.email || "").toLowerCase().includes(q);
    const nameMatch = (log.superadmin?.name || "").toLowerCase().includes(q);
    return actionMatch || emailMatch || nameMatch;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Pencarian Teks</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari aksi atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Tenant</label>
            <div className="relative">
              <CustomSelect
                value={filters.tenant}
                onChange={(value) => handleFilterChange("tenant", value)}
                options={[
                  { value: "", label: "Semua Tenant" },
                  ...academies.map(a => ({ value: a.id, label: a.name }))
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Superadmin</label>
            <div className="relative">
              <CustomSelect
                value={filters.superadmin}
                onChange={(value) => handleFilterChange("superadmin", value)}
                options={[
                  { value: "", label: "Semua Superadmin" },
                  ...superadmins.map(s => ({ value: s.id, label: s.name || s.email }))
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Aksi</label>
            <div className="relative">
              <CustomSelect
                value={filters.action}
                onChange={(value) => handleFilterChange("action", value)}
                options={[
                  { value: "", label: "Semua Aksi" },
                  ...COMMON_ACTIONS.map(action => ({ value: action, label: action }))
                ]}
              />
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
                <th className="px-6 py-4 w-16">No.</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Superadmin</th>
                <th className="px-6 py-4">Jenis Aksi</th>
                <th className="px-6 py-4">Tenant Terkait</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada log aktivitas yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : filteredLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                      {(currentPage - 1) * 15 + index + 1}
                    </td>
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
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td colSpan={6} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-blue-500" /> 
                            Detail Informasi Aksi
                          </h4>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                                    {typeof value === 'object' && value !== null 
                                      ? JSON.stringify(value) 
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic flex items-center gap-2">
                              <AlertCircle size={14} /> Tidak ada data payload atau parameter tambahan pada aksi ini.
                            </p>
                          )}
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
        {totalPages > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
            totalItems={total} 
            itemsPerPage={15} 
          />
        )}
      </div>
    </div>
  );
}
