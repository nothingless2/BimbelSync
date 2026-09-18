"use client";

import { useState } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { verifyPaymentAction } from "@/app/[tenantSlug]/dashboard/finance/actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { Invoice } from "@prisma/client";

export function VerifyPaymentModal({ 
  invoice, 
  onClose 
}: { 
  invoice: Invoice, 
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const paymentMethod = formData.get("payment_method") as string;
    
    if (!paymentMethod) {
        setErrorMsg("Metode pembayaran wajib dipilih.");
        setIsLoading(false);
        return;
    }

    const result = await verifyPaymentAction(invoice.id, paymentMethod);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      onClose();
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Verifikasi Pelunasan</h2>
              <p className="text-sm text-slate-500">Tagihan #{invoice.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
            <p className="text-sm text-slate-500 font-medium">Total Tagihan Dibayar</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(invoice.total_amount)}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="payment_method" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Metode Pembayaran</label>
            <p className="text-xs text-slate-500 mb-2">Pilih bagaimana siswa ini melunasi tagihannya kepada Anda.</p>
            <CustomSelect
              id="payment_method"
              name="payment_method"
              required
              placeholder="Pilih Metode..."
              options={[
                { value: "CASH", label: "Tunai (Cash di Resepsionis)" },
                { value: "MANUAL_TRANSFER", label: "Transfer Bank Manual (Telah dicek mutasi)" }
              ]}
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Memproses..." : "Konfirmasi Lunas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
