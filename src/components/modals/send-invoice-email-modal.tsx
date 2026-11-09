"use client";

import { useState } from "react";
import { Mail, Send, X, Loader2, User, Calendar, AlertCircle } from "lucide-react";

interface SendInvoiceEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  studentName: string;
  studentEmail: string;
  invoiceNumber: string;
  totalAmount: number;
  billingPeriod?: string | null;
}

export function SendInvoiceEmailModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  studentEmail,
  invoiceNumber,
  totalAmount,
  billingPeriod,
}: SendInvoiceEmailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleSend = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error is handled in the caller with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kirim Rincian Tagihan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Faktur #{invoiceNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-5 space-y-4 text-xs">
          {/* Card Info Penerima & Tagihan */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-400 font-medium">Penerima Email:</span>
              <div className="text-right">
                <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1">
                  <User size={13} className="text-slate-400" />
                  <span>{studentName}</span>
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5 break-all">
                  {studentEmail}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Total Tagihan:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {billingPeriod && (
              <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 flex items-center justify-between text-slate-500">
                <span className="font-medium">Periode Tagihan:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {billingPeriod}
                </span>
              </div>
            )}
          </div>

          {/* Catatan Informasi */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 flex items-start gap-2.5 leading-relaxed">
            <Send size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p className="text-[11px]">
              Email resmi berisi rincian faktur dan petunjuk pembayaran akan langsung dikirimkan ke alamat email siswa/wali di atas melalui server email bimbel Anda.
            </p>
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Mengirim Email...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Kirim Email Sekarang</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

