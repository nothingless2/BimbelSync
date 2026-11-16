"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Download, Eye, Upload, Calendar, Sparkles, ArrowRight, Zap } from "lucide-react";
import { UploadProofModal } from "@/components/modals/upload-proof-modal";
import { ViewProofModal } from "@/components/modals/view-proof-modal";

interface InvoiceItem {
  id: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: string;
  paid_at: string | null;
  proof_of_payment_url: string | null;
}

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
    invoices: InvoiceItem[];
  };
  tenantSlug: string;
}

export default function SubscriptionClientPage({ academy, tenantSlug }: Props) {
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<InvoiceItem | null>(null);
  const [reuploadInvoiceId, setReuploadInvoiceId] = useState<string | null>(null);

  const IDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Aktif", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 size={16} /> };
      case "TRIAL":
        return { label: "Masa Coba", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock size={16} /> };
      default:
        return { label: "Ditangguhkan", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertTriangle size={16} /> };
    }
  };

  const getInvoiceStatus = (status: string, proofUrl: string | null) => {
    if (proofUrl && status !== "PAID") {
      return { label: "Menunggu Verifikasi", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    }
    switch (status) {
      case "PAID":
        return { label: "Lunas", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
      case "UNPAID":
        return { label: "Belum Bayar", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
      case "OVERDUE":
        return { label: "Terlambat", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      case "VOID":
        return { label: "Dibatalkan", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  };

  const currentStatus = getStatusDisplay(academy.subscription_status);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Langganan Sistem</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola status dan riwayat tagihan langganan BimbelSync Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute -right-6 -bottom-6 text-slate-100 dark:text-slate-800/40 pointer-events-none">
            <ShieldCheck size={180} />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Top Row: Plan Identity & Upgrade CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Paket Aktif Saat Ini
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      TIER {academy.plan.name.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {academy.plan.name}
                  </h3>
                </div>
              </div>

              {academy.plan.name.toLowerCase() !== "pro" && (
                <a
                  href={`https://wa.me/6285173392350?text=${encodeURIComponent(`Halo tim BimbelSync, saya ingin upgrade ke paket ${academy.plan.name.toLowerCase() === "starter" ? "growth" : "pro"}` + (tenantSlug ? ` (Akademi: ${tenantSlug})` : ""))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer w-fit"
                >
                  <Sparkles size={15} className="animate-pulse" />
                  <span>Upgrade ke Paket {academy.plan.name.toLowerCase() === "starter" ? "Growth" : "Pro"}</span>
                  <ArrowRight size={15} />
                </a>
              )}
            </div>

            {/* Bottom Row: 2 Clean High-Density Status Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tile 1: Status Akses */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  academy.subscription_status === 'ACTIVE' 
                    ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-amber-100/80 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {currentStatus.icon}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status Akses</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {academy.subscription_status === 'ACTIVE' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span className={`text-sm font-bold ${currentStatus.class.replace("bg-", "text-").replace("dark:bg-", "dark:text-").split(" ")[1]}`}>
                      {currentStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tile 2: Masa Berlaku */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Berlaku Hingga</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {academy.subscription_due_date
                      ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(academy.subscription_due_date))
                      : "Akses Penuh Selamanya"}
                  </p>
                </div>
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
          <a 
            href={`https://wa.me/6285173392350?text=${encodeURIComponent(`Halo tim BimbelSync, saya butuh bantuan seputar langganan atau ingin upgrade paket untuk bimbel kami (${academy.name || tenantSlug}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 mt-6 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
          >
            Hubungi Support
          </a>
        </div>
      </div>

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
                  const status = getInvoiceStatus(invoice.payment_status, invoice.proof_of_payment_url);
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
                        <div className="flex items-center justify-end gap-2">
                          {invoice.proof_of_payment_url ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedProofInvoice(invoice)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                                title="Lihat Bukti Pembayaran"
                              >
                                <Eye size={14} />
                                <span>Lihat Bukti</span>
                              </button>

                              {invoice.payment_status !== "PAID" && (
                                <button
                                  onClick={() => setReuploadInvoiceId(invoice.id)}
                                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Unggah Ulang Bukti"
                                >
                                  <Upload size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            (invoice.payment_status === "UNPAID" || invoice.payment_status === "OVERDUE") && (
                              <UploadProofModal tenantSlug={tenantSlug} invoiceId={invoice.id} />
                            )
                          )}

                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5" title="Unduh PDF">
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lihat Bukti Pembayaran */}
      {selectedProofInvoice && (
        <ViewProofModal
          isOpen={!!selectedProofInvoice}
          onClose={() => setSelectedProofInvoice(null)}
          imageUrl={selectedProofInvoice.proof_of_payment_url}
          invoiceTitle={`INV-${selectedProofInvoice.id.split("-")[0].toUpperCase()}`}
          invoicePeriod={new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(selectedProofInvoice.billing_period))}
          invoiceAmount={IDR(selectedProofInvoice.amount)}
          isPaid={selectedProofInvoice.payment_status === "PAID"}
          onReupload={() => setReuploadInvoiceId(selectedProofInvoice.id)}
        />
      )}

      {/* Modal Unggah Ulang Bukti Pembayaran */}
      {reuploadInvoiceId && (
        <UploadProofModal
          tenantSlug={tenantSlug}
          invoiceId={reuploadInvoiceId}
          isOpenControlled={!!reuploadInvoiceId}
          onOpenChange={(open) => !open && setReuploadInvoiceId(null)}
          onSuccess={() => {
            setReuploadInvoiceId(null);
            setSelectedProofInvoice(null);
          }}
        />
      )}
    </div>
  );
}
