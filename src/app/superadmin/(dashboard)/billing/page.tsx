import prisma from "@/lib/prisma";
import { FileText, CheckCircle2, Clock, AlertTriangle, MoreVertical } from "lucide-react";

export default async function BillingPage() {
  const invoices = await prisma.platformInvoice.findMany({
    include: { academy: { include: { plan: true } } },
    orderBy: { billing_period: "desc" },
  });

  const totalUnpaid = invoices.filter(i => i.payment_status === "UNPAID").length;
  const totalPaid = invoices.filter(i => i.payment_status === "PAID").length;
  const totalOverdue = invoices.filter(i => i.payment_status === "OVERDUE").length;
  const totalRevenue = invoices.filter(i => i.payment_status === "PAID").reduce((sum, i) => sum + i.amount, 0);

  const statusConfig: Record<string, { label: string; class: string }> = {
    PAID:    { label: "Lunas",   class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    UNPAID:  { label: "Belum Bayar", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    OVERDUE: { label: "Terlambat",   class: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
    VOID:    { label: "Void",    class: "bg-slate-100 dark:bg-slate-700 text-slate-500" },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Billing</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tagihan langganan bulanan dari seluruh akademi ke BimbelSync.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">TOTAL REVENUE</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalRevenue)}
          </h3>
          <p className="text-xs text-emerald-600 mt-2">dari tagihan lunas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">LUNAS</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalPaid}</h3>
          <p className="text-xs text-slate-500 mt-2">tagihan terbayar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">BELUM BAYAR</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalUnpaid}</h3>
          <p className="text-xs text-amber-600 mt-2">menunggu pembayaran</p>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm ${totalOverdue > 0 ? "border-2 border-red-200 dark:border-red-900/50" : "border border-slate-200 dark:border-slate-800"}`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 tracking-wider">TERLAMBAT</span>
            <AlertTriangle size={16} className={totalOverdue > 0 ? "text-red-500" : "text-slate-400"} />
          </div>
          <h3 className={`text-3xl font-bold ${totalOverdue > 0 ? "text-red-600 dark:text-red-500" : "text-slate-800 dark:text-white"}`}>{totalOverdue}</h3>
          <p className={`text-xs mt-2 ${totalOverdue > 0 ? "text-red-500" : "text-slate-500"}`}>{totalOverdue > 0 ? "Requires action" : "Semua normal"}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Akademi</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada tagihan platform.
                  </td>
                </tr>
              ) : invoices.map((invoice) => {
                const status = statusConfig[invoice.payment_status];
                const isOverdue = invoice.payment_status === "OVERDUE";
                return (
                  <tr key={invoice.id} className={`transition-colors ${isOverdue ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/80" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{invoice.academy.name}</p>
                      <p className="text-xs text-slate-500 font-mono">/{invoice.academy.path_url}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded">
                        {invoice.academy.plan.name.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(invoice.billing_period))}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.due_date))}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
                        {status.label}
                      </div>
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
        {invoices.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500">Menampilkan {invoices.length} tagihan</p>
          </div>
        )}
      </div>
    </div>
  );
}
