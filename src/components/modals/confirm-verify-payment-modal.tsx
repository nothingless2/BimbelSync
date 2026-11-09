"use client";

import { useState } from "react";
import { CheckCircle2, X, Loader2, Banknote, CreditCard, User } from "lucide-react";

interface ConfirmVerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  studentName: string;
  invoiceNumber: string;
  amount: number;
  method: "CASH" | "MANUAL_TRANSFER";
  termNumber?: number;
}

export function ConfirmVerifyPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  invoiceNumber,
  amount,
  method,
  termNumber,
}: ConfirmVerifyPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const isCash = method === "CASH";
  const methodLabel = isCash ? "Pembayaran Tunai" : "Transfer Bank Manual";
  const methodDesc = isCash
    ? "Uang diterima langsung di resepsionis / kasir bimbel"
    : "Mutasi rekening bank bimbel telah diperiksa dan sesuai";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Handled in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Pelunasan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {termNumber ? `Termin ${termNumber} • Faktur #${invoiceNumber}` : `Faktur #${invoiceNumber}`}
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
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Siswa:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                <span>{studentName}</span>
              </span>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-medium">
                {termNumber ? `Nominal Termin ${termNumber}:` : "Total Pelunasan:"}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatRupiah(amount)}
              </span>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 flex items-start justify-between gap-3">
              <span className="text-slate-400 font-medium">Metode:</span>
              <div className="text-right">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1.5">
                  {isCash ? (
                    <Banknote size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CreditCard size={14} className="text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{methodLabel}</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{methodDesc}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            Status tagihan akan otomatis diperbarui menjadi <strong>LUNAS</strong> dan tercatat pada laporan kas masuk bimbel.
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Konfirmasi Lunas</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

