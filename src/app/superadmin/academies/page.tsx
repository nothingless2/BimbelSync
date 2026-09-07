import { Building2, Search, Download, ChevronDown, MoreVertical, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, Check, Activity, Clock } from "lucide-react";

export default function AcademiesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Daftar Akademi Berlangganan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of all active tutoring centers and their subscription status.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-600/20 text-sm whitespace-nowrap">
          + Tambah Akademi Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">BIMBEL AKTIF</span>
            <Building2 size={16} className="text-blue-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">52</h3>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowUpRight size={14} /> +12% vs last month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">MRR</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">Rp 26.5M</h3>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowUpRight size={14} /> +5% vs last month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">JUMLAH TRIAL</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">12</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
            4 converting soon
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 shadow-sm shadow-red-500/5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">TUNGGAKAN</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <h3 className="text-3xl font-bold text-red-600 dark:text-red-500">3</h3>
          <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-2">
            Requires action
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative">
              <select className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option>All Status</option>
                <option>Active</option>
                <option>Suspended</option>
                <option>Trial</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari bimbel..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={18} />
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Nama Bimbel</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tagihan (Bulan Ini)</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Bimbel Sukses Mandiri</p>
                  <p className="text-xs text-slate-500">ID: BSM-0921</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded">PRO</span>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Aktif
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                  Rp 1.500.000
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  15 Oct 2023
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Akademi Bintang Pelajar</p>
                  <p className="text-xs text-slate-500">ID: ABP-1102</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded">STARTER</span>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Trial
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                  Rp 0
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  22 Oct 2023
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>

              {/* Row 3 - Suspended / Overdue */}
              <tr className="bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Gama Cerdas</p>
                  <p className="text-xs text-slate-500">ID: GMC-0441</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded">GROWTH</span>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    Suspended
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                  Rp 750.000
                </td>
                <td className="px-6 py-4 font-medium text-red-600 dark:text-red-400">
                  01 Oct 2023 <span className="text-xs font-normal opacity-80">(Overdue)</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      <Check size={14} /> Verifikasi Bayar
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Inten Jaya</p>
                  <p className="text-xs text-slate-500">ID: INJ-0199</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded">PRO</span>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Aktif
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                  Rp 1.500.000
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  28 Oct 2023
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Showing 1 to 4 of 52 entries</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="sr-only">Previous</span>
              &lsaquo;
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium text-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="sr-only">Next</span>
              &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
