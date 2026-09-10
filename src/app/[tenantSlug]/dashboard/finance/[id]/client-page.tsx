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
          
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Informasi Siswa</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Nama Lengkap</p>
                <p className="font-semibold text-slate-900 dark:text-white">{invoice.student.full_name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Username / ID</p>
                <p className="font-semibold text-slate-900 dark:text-white">@{invoice.student.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Rincian Tagihan</h3>
            
            <div className="space-y-3 mb-6">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700 border-dashed">
              <span className="font-bold text-slate-800 dark:text-slate-200">Total Keseluruhan</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Tabel Cicilan jika payment_option === INSTALLMENT */}
          {invoice.payment_option === 'INSTALLMENT' && invoice.installments.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Jadwal Cicilan</h3>
              <div className="space-y-4">
                {invoice.installments.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Termin {inst.installment_number}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Calendar size={12} />
                        Jatuh Tempo: {format(new Date(inst.due_date), 'd MMMM yyyy', { locale: localeId })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white mb-1">{formatRupiah(inst.amount)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
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

        </div>

        {/* Kolom Kanan: Status & Aksi */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              invoice.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
              invoice.payment_status === 'OVERDUE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {invoice.payment_status === 'PAID' ? <CheckCircle2 size={32} /> :
               invoice.payment_status === 'OVERDUE' ? <AlertCircle size={32} /> :
               <Clock size={32} />}
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{invoice.payment_status}</h3>
            <p className="text-sm text-slate-500 mt-1">Status Pembayaran</p>

            {invoice.payment_status === 'PAID' && invoice.verified_by && (
              <div className="mt-6 w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-left">
                <p className="text-slate-500 mb-1">Diverifikasi Oleh:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{invoice.verified_by.name}</p>
                <p className="text-slate-500 mt-2 mb-1">Metode:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{invoice.payment_method}</p>
              </div>
            )}
          </div>

          {invoice.payment_status !== 'PAID' && invoice.payment_option === 'FULL' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Aksi Manual</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleVerify("CASH")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
                  Tandai Lunas (Tunai)
                </button>
                <button
                  onClick={() => handleVerify("MANUAL_TRANSFER")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  Tandai Lunas (Transfer)
                </button>
                
                {canSplitInstallments && (
                  <>
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-[#111827] px-2 text-slate-400">Atau</span></div>
                    </div>
                    <button
                      onClick={() => setIsSplitModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-colors"
                    >
                      <RefreshCcw size={18} />
                      Ubah ke Cicilan (Termin)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {canSplitInstallments === false && invoice.payment_status !== 'PAID' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-800/30">
              Tingkatkan paket langganan Anda ke <strong>Growth</strong> atau <strong>Pro</strong> untuk membuka fitur cicilan bertahap.
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
