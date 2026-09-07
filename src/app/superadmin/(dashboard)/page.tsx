import prisma from "@/lib/prisma";
import { DollarSign, Building2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function SuperadminDashboard() {
  const [
    activeAcademies,
    invoices,
  ] = await Promise.all([
    prisma.academy.findMany({
      where: { subscription_status: "ACTIVE", deleted_at: null },
      include: { plan: true },
    }),
    prisma.platformInvoice.findMany({
      include: { academy: true, plan: true },
      orderBy: { due_date: 'desc' }
    }),
  ]);

  // Calculate MRR (Monthly Recurring Revenue)
  const currentMRR = activeAcademies.reduce((acc, academy) => acc + academy.plan.price, 0);
  
  // Calculate Revenues
  const totalRevenue = invoices
    .filter(i => i.payment_status === "PAID")
    .reduce((acc, i) => acc + i.amount, 0);
    
  const totalReceivables = invoices
    .filter(i => i.payment_status === "UNPAID" || i.payment_status === "OVERDUE")
    .reduce((acc, i) => acc + i.amount, 0);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan performa bisnis BimbelSync secara keseluruhan.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">MRR</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(currentMRR).replace(",00", "")}
          </h3>
          <p className="text-xs text-blue-600 mt-2">/bulan dari akademi aktif</p>
        </div>

        {/* Total Academies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">AKADEMI AKTIF</span>
            <Building2 size={16} className="text-indigo-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{activeAcademies.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Akademi berlangganan</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">TOTAL PENDAPATAN</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalRevenue).replace(",00", "")}
          </h3>
          <p className="text-xs text-emerald-600 mt-2">Total tagihan terbayar lunas</p>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">PIUTANG BELUM DIBAYAR</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalReceivables).replace(",00", "")}
          </h3>
          <p className="text-xs text-amber-600 mt-2">Menunggu pembayaran akademi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Platform Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Tagihan Terbaru</h3>
            <Link href="/superadmin/billing" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">Belum ada tagihan platform.</div>
            ) : recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${inv.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : inv.payment_status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {inv.payment_status === 'PAID' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{inv.academy.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(inv.billing_period))} • {inv.plan.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(inv.amount).replace(",00", "")}
                  </p>
                  <p className={`text-[10px] font-bold mt-1 uppercase ${inv.payment_status === 'PAID' ? 'text-emerald-500' : inv.payment_status === 'OVERDUE' ? 'text-red-500' : 'text-amber-500'}`}>
                    {inv.payment_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Active Academies List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Akademi Aktif</h3>
            <Link href="/superadmin/academies" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {activeAcademies.slice(0, 5).length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">Belum ada akademi aktif.</div>
            ) : activeAcademies.slice(0, 5).map((academy) => (
              <div key={academy.id} className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{academy.name}</p>
                  <p className="text-xs text-slate-500">/{academy.path_url}</p>
                </div>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">
                  {academy.plan.name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
