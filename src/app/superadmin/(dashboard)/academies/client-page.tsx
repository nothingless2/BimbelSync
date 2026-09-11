"use client";

import { useState } from "react";
import { AddAcademyModal } from "@/components/modals/add-academy-modal";
import { EditAcademyModal } from "@/components/modals/edit-academy-modal";
import { DeleteAcademyModal } from "@/components/modals/delete-academy-modal";
import { Building2, ArrowUpRight, Activity, Clock, AlertTriangle, MoreVertical, Edit2, Trash2, ArrowRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

export default function AcademiesClientPage({ academies, plans }: { academies: any[], plans: any[] }) {
  const [selectedAcademy, setSelectedAcademy] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "TRIAL" | "SUSPENDED">("ALL");

  const filteredAcademies = academies.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.path_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "ALL" || a.subscription_status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredAcademies.length / itemsPerPage));
  const currentData = filteredAcademies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalActive = academies.filter(a => a.subscription_status === "ACTIVE").length;
  const totalTrial = academies.filter(a => a.subscription_status === "TRIAL").length;
  const totalSuspended = academies.filter(a => a.subscription_status === "SUSPENDED").length;

  const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
    ACTIVE:    { label: "Aktif",     class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    TRIAL:     { label: "Trial",     class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",             dot: "bg-blue-500" },
    SUSPENDED: { label: "Suspended", class: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",               dot: "bg-red-500" },
  };

  const openEditModal = (academy: any) => {
    setSelectedAcademy(academy);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (academy: any) => {
    setSelectedAcademy(academy);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daftar Akademi Berlangganan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tampilan semua pusat bimbingan belajar yang aktif dan status langganan.</p>
        </div>
        <AddAcademyModal plans={plans} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">BIMBEL AKTIF</span>
            <Building2 size={16} className="text-blue-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalActive}</h3>
          <p className="text-xs font-medium text-slate-500 mt-2">dari {academies.length} total</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">MRR (EST.)</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", { notation: "compact", style: "currency", currency: "IDR" }).format(
              academies.filter(a => a.subscription_status === "ACTIVE").reduce((sum, a) => sum + a.plan.price, 0)
            )}
          </h3>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1"><ArrowUpRight size={12} /> dari akademi aktif</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">JUMLAH TRIAL</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalTrial}</h3>
          <p className="text-xs font-medium text-slate-500 mt-2">bimbel dalam masa coba</p>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm relative overflow-hidden ${totalSuspended > 0 ? "border-2 border-red-200 dark:border-red-900/50 shadow-red-500/5" : "border border-slate-200 dark:border-slate-800"}`}>
          {totalSuspended > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">SUSPENDED</span>
            <AlertTriangle size={16} className={totalSuspended > 0 ? "text-red-500" : "text-slate-400"} />
          </div>
          <h3 className={`text-3xl font-bold ${totalSuspended > 0 ? "text-red-600 dark:text-red-500" : "text-slate-800 dark:text-white"}`}>{totalSuspended}</h3>
          <p className={`text-xs font-medium mt-2 ${totalSuspended > 0 ? "text-red-500" : "text-slate-500"}`}>
            {totalSuspended > 0 ? "Requires action" : "Semua normal"}
          </p>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau URL akademi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          
          <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shrink-0 overflow-hidden">
            <button 
              onClick={() => { setFilterStatus("ALL"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "ALL" ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => { setFilterStatus("ACTIVE"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "ACTIVE" ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Aktif
            </button>
            <button 
              onClick={() => { setFilterStatus("TRIAL"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "TRIAL" ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Trial
            </button>
            <button 
              onClick={() => { setFilterStatus("SUSPENDED"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "SUSPENDED" ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Suspended
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-16">No.</th>
                <th className="px-6 py-4">Nama Bimbel</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada akademi terdaftar.
                  </td>
                </tr>
              ) : currentData.map((academy, index) => {
                const status = statusConfig[academy.subscription_status];
                const isSuspended = academy.subscription_status === "SUSPENDED";
                return (
                  <tr key={academy.id} className={`transition-colors ${isSuspended ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/80" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/superadmin/academies/${academy.id}`} className="group inline-block">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          {academy.name}
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 dark:text-blue-400" />
                        </p>
                        <p className="text-xs text-slate-500 font-mono">/{academy.path_url}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded">
                        {academy.plan.name.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
                        {status.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{academy._count.students}</td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{academy._count.staff}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {academy.subscription_due_date
                        ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(academy.subscription_due_date))
                        : <span className="text-slate-400 italic text-xs">Belum diset</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(academy)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(academy)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredAcademies.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      <EditAcademyModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} academy={selectedAcademy} plans={plans} />
      <DeleteAcademyModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} academy={selectedAcademy} />
    </div>
  );
}
