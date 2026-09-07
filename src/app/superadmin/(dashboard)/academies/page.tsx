import prisma from "@/lib/prisma";
import { AddAcademyModal } from "@/components/modals/add-academy-modal";
import { Building2, ArrowUpRight, Activity, Clock, AlertTriangle, MoreVertical, Check } from "lucide-react";

export default async function AcademiesPage() {
  const [academies, plans] = await Promise.all([
    prisma.academy.findMany({
      where: { deleted_at: null },
      include: {
        plan: true,
        _count: { select: { students: true, staff: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.plan.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { price: "asc" },
    }),
  ]);

  const totalActive = academies.filter(a => a.subscription_status === "ACTIVE").length;
  const totalTrial = academies.filter(a => a.subscription_status === "TRIAL").length;
  const totalSuspended = academies.filter(a => a.subscription_status === "SUSPENDED").length;

  const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
    ACTIVE:    { label: "Aktif",     class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    TRIAL:     { label: "Trial",     class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",             dot: "bg-blue-500" },
    SUSPENDED: { label: "Suspended", class: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",               dot: "bg-red-500" },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daftar Akademi Berlangganan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of all active tutoring centers and their subscription status.</p>
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
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
              {academies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada akademi terdaftar.
                  </td>
                </tr>
              ) : academies.map((academy) => {
                const status = statusConfig[academy.subscription_status];
                const isSuspended = academy.subscription_status === "SUSPENDED";
                return (
                  <tr key={academy.id} className={`transition-colors ${isSuspended ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/80" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{academy.name}</p>
                      <p className="text-xs text-slate-500 font-mono">/{academy.path_url}</p>
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
                      <button className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {academies.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500">Menampilkan {academies.length} akademi terdaftar</p>
          </div>
        )}
      </div>
    </div>
  );
}
