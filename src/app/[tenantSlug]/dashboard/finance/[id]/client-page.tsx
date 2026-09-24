"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Student, Installment, Staff } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Banknote, RefreshCcw, Loader2, Calendar
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { verifyPaymentAction } from "../actions";
import { SplitInstallmentModal } from "@/components/modals/split-installment-modal";

type InvoiceWithDetails = Invoice & {
  student: Student;
  items: InvoiceItem[];
  installments: Installment[];
  verified_by: Staff | null;
};

export default function FinanceDetailClient({
  invoice,
  tenantSlug,
  canSplitInstallments
}: {
  invoice: InvoiceWithDetails;
  tenantSlug: string;
  canSplitInstallments: boolean;
}) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleVerify = async (method: "CASH" | "MANUAL_TRANSFER") => {
    if (!confirm(`Konfirmasi pembayaran lunas via ${method === 'CASH' ? 'Tunai' : 'Transfer Manual'}?`)) return;
    
    setIsVerifying(true);
    const result = await verifyPaymentAction(invoice.id, method);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tagihan berhasil diverifikasi (Lunas).");
      router.refresh();
    }
    setIsVerifying(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push(`/${tenantSlug}/dashboard/finance`)}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Detail Tagihan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">INV-{invoice.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Rincian & Siswa */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Informasi Siswa</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Nama Lengkap</p>
                <p className="font-medium text-slate-900 dark:text-white">{invoice.student.full_name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Username / ID</p>
                <p className="font-medium text-slate-900 dark:text-white">@{invoice.student.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Rincian Tagihan</h3>
            
            <div className="space-y-3 mb-6">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Total Keseluruhan</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatRupiah(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Tabel Cicilan jika payment_option === INSTALLMENT */}
          {invoice.payment_option === 'INSTALLMENT' && invoice.installments.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Jadwal Cicilan</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.installments.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Termin {inst.installment_number}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Calendar size={12} />
                        {format(new Date(inst.due_date), 'd MMMM yyyy', { locale: localeId })}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(inst.amount)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                        inst.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        inst.status === 'OVERDUE' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
            
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              invoice.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
              invoice.payment_status === 'OVERDUE' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
              'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
            }`}>
              {invoice.payment_status === 'PAID' ? <CheckCircle2 size={24} /> :
               invoice.payment_status === 'OVERDUE' ? <AlertCircle size={24} /> :
               <Clock size={24} />}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{invoice.payment_status}</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Status Pembayaran</p>

            {invoice.payment_status === 'PAID' && invoice.verified_by && (
              <div className="mt-5 w-full pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-left grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 mb-1">Diverifikasi Oleh</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{invoice.verified_by.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Metode</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{invoice.payment_method}</p>
                </div>
              </div>
            )}
          </div>

          {invoice.payment_status !== 'PAID' && invoice.payment_option === 'FULL' && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Aksi Manual</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleVerify("CASH")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                  Tandai Lunas (Tunai)
                </button>
                <button
                  onClick={() => handleVerify("MANUAL_TRANSFER")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  Tandai Lunas (Transfer)
                </button>
                
                {canSplitInstallments && (
                  <>
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                      <div className="relative flex justify-center text-[11px]"><span className="bg-white dark:bg-[#111827] px-2 text-slate-400">Atau</span></div>
                    </div>
                    <button
                      onClick={() => setIsSplitModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm rounded-lg transition-colors"
                    >
                      <RefreshCcw size={16} />
                      Ubah ke Cicilan (Termin)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {canSplitInstallments === false && invoice.payment_status !== 'PAID' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-800/30">
              Paket langganan Anda saat ini tidak mendukung fitur <strong>Cicilan Bertahap</strong>. Silakan upgrade paket Anda untuk menikmati fitur ini.
            </div>
          )}

        </div>
      </div>

      {isSplitModalOpen && (
        <SplitInstallmentModal 
          invoice={invoice} 
          isOpen={isSplitModalOpen} 
          onClose={() => setIsSplitModalOpen(false)} 
        />
      )}

    </div>
  );
}
