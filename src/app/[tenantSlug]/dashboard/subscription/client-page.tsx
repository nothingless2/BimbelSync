"use client";

import { CreditCard, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Download } from "lucide-react";

interface Props {
  academy: {
    id: string;
    name: string;
    subscription_status: string;
    subscription_due_date: string | null;
    plan: {
      name: string;
      price: number;
    };
    invoices: {
      id: string;
      amount: number;
      billing_period: string;
      due_date: string;
      payment_status: string;
      paid_at: string | null;
    }[];
  }
}

export default function SubscriptionClientPage({ academy }: Props) {
  const IDR = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case "ACTIVE": return { label: "Aktif", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 size={16} /> };
      case "TRIAL": return { label: "Masa Coba", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock size={16} /> };
      default: return { label: "Ditangguhkan", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertTriangle size={16} /> };
    }
  };

  const getInvoiceStatus = (status: string) => {
    switch(status) {
      case "PAID": return { label: "Lunas", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
      case "UNPAID": return { label: "Belum Bayar", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
      case "OVERDUE": return { label: "Terlambat", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      case "VOID": return { label: "Dibatalkan", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" };
      default: return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  };

  const currentStatus = getStatusDisplay(academy.subscription_status);
  const unpaidInvoices = academy.invoices.filter(i => i.payment_status === "UNPAID" || i.payment_status === "OVERDUE");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Langganan Sistem</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola status dan riwayat tagihan langganan BimbelSync Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paket Saat Ini</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{academy.plan.name}</h3>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Akses</p>
                <div className={`inline-flex items-center gap-1.5 font-bold ${currentStatus.class.replace("bg-", "text-").replace("dark:bg-", "dark:text-").split(" ")[1]}`}>
                  {currentStatus.icon} {currentStatus.label}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Berlaku Hingga</p>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {academy.subscription_due_date 
                    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(academy.subscription_due_date)) 
                    : "Selamanya"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-lg font-bold">Butuh Bantuan?</h3>
            <p className="text-blue-100 text-sm">Untuk mengubah paket, perpanjangan massal, atau pertanyaan tagihan, hubungi tim dukungan BimbelSync.</p>
          </div>
          <a href="mailto:support@bimbelsync.com" className="relative z-10 mt-6 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-sm transition">
            Hubungi Support
          </a>
        </div>
      </div>

      {unpaidInvoices.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex gap-4 items-start">
          <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-400">Tagihan Menunggu Pembayaran</h3>
            <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
              Anda memiliki {unpaidInvoices.length} tagihan yang belum dilunasi sejumlah total <span className="font-bold">{IDR(unpaidInvoices.reduce((sum, i) => sum + i.amount, 0))}</span>. 
              Segera lakukan pembayaran dan konfirmasikan ke Admin Pusat untuk menghindari pemblokiran akses sistem.
            </p>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Tagihan</h2>
        </div>
        
        {academy.invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada riwayat tagihan sistem.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID Tagihan</th>
                  <th className="px-6 py-4 font-semibold">Periode</th>
                  <th className="px-6 py-4 font-semibold">Jatuh Tempo</th>
                  <th className="px-6 py-4 font-semibold">Nominal</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {academy.invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice.payment_status);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          INV-{invoice.id.split("-")[0].toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                        {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(invoice.billing_period))}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.due_date))}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {IDR(invoice.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.class}`}>
                          {status.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1">
                          <Download size={14} /> <span className="hidden sm:inline">Unduh PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
