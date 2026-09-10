"use client";

import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Installment } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, CreditCard, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";

type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  installments: Installment[];
};

export default function StudentInvoiceDetailClient({
  invoice,
  tenantSlug
}: {
  invoice: InvoiceWithDetails;
  tenantSlug: string;
}) {
  const router = useRouter();

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handlePay = () => {
    alert("Ini adalah simulasi integrasi Payment Gateway (Midtrans). Di tahap produksi, ini akan membuka pop-up atau mengalihkan Anda ke halaman pembayaran midtrans.");
  };

  const hasOverdue = invoice.payment_status === 'OVERDUE' || invoice.installments.some(i => i.status === 'OVERDUE');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] pt-12 pb-4 px-4 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 flex items-center gap-3">
        <button 
          onClick={() => router.push(`/${tenantSlug}/student/invoices`)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors -ml-2"
        >
          <ArrowLeft size={24} className="text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Detail Tagihan</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto mt-4">
        
        {/* Status Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            invoice.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
            hasOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {invoice.payment_status === 'PAID' ? <CheckCircle2 size={40} /> :
             hasOverdue ? <AlertCircle size={40} /> :
             <Clock size={40} />}
          </div>
          
          <p className="text-sm text-slate-500 mb-1">Status Pembayaran</p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{invoice.payment_status}</h2>
          
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
          
          <p className="text-sm text-slate-500 mb-1">Total Tagihan</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(invoice.total_amount)}</p>
          <p className="text-xs text-slate-400 mt-2">INV-{invoice.id.split('-')[0].toUpperCase()}</p>
        </div>

        {/* Rincian Item */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Rincian Pembayaran</h3>
          <div className="space-y-4">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <span className="text-slate-600 dark:text-slate-300 pr-4">{item.description}</span>
                <span className="font-medium text-slate-900 dark:text-white shrink-0">{formatRupiah(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cicilan (Jika Ada) */}
        {invoice.payment_option === 'INSTALLMENT' && invoice.installments.length > 0 && (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Jadwal Termin (Cicilan)</h3>
            <div className="space-y-3">
              {invoice.installments.map((inst) => (
                <div key={inst.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Termin {inst.installment_number}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={12} />
                      {format(new Date(inst.due_date), 'd MMM yyyy', { locale: localeId })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">{formatRupiah(inst.amount)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      inst.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bottom */}
        {invoice.payment_status !== 'PAID' && (
          <div className="mt-8 pt-4">
            <button 
              onClick={handlePay}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-500/20"
            >
              <CreditCard size={20} />
              Bayar Sekarang
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              Pembayaran aman diproses oleh Midtrans.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
