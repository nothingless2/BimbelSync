"use client";

import { useState } from "react";
import { Invoice } from "@prisma/client";
import { X, Plus, Trash2, Loader2, Save, Calendar, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { splitInstallmentsAction } from "@/app/[tenantSlug]/dashboard/finance/actions";
import { useRouter } from "next/navigation";

export function SplitInstallmentModal({
  invoice,
  isOpen,
  onClose,
  maxTerms,
}: {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  maxTerms?: number | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default: dibagi 2 dengan tanggal jatuh tempo bulanan default
  const [installments, setInstallments] = useState(() => {
    const half1 = Math.floor(invoice.total_amount / 2);
    const half2 = invoice.total_amount - half1;
    const now = new Date();
    const d1 = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split("T")[0];
    const d2 = new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString().split("T")[0];
    return [
      { amount: half1, due_date: d1 },
      { amount: half2, due_date: d2 }
    ];
  });

  if (!isOpen) return null;

  const totalAssigned = installments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = invoice.total_amount - totalAssigned;
  const isMaxTermsReached = typeof maxTerms === "number" && installments.length >= maxTerms;
  const isGrowthLimit = maxTerms === 3;

  // Preset fungsi bagi rata otomatis
  const handleSplitEqually = (termsCount: number) => {
    if (typeof maxTerms === "number" && termsCount > maxTerms) return;
    const base = Math.floor(invoice.total_amount / termsCount);
    const rem = invoice.total_amount - (base * termsCount);
    const now = new Date();
    
    const newItems = Array.from({ length: termsCount }, (_, idx) => {
      const existingDueDate = installments[idx]?.due_date;
      const defaultDate = new Date(now.getFullYear(), now.getMonth() + idx, 10).toISOString().split("T")[0];
      return {
        amount: idx === 0 ? base + rem : base,
        due_date: existingDueDate || defaultDate,
      };
    });
    setInstallments(newItems);
  };

  const handleAdd = () => {
    if (isMaxTermsReached) return;
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth() + installments.length, 10).toISOString().split("T")[0];
    setInstallments([
      ...installments,
      { amount: remaining > 0 ? remaining : 0, due_date: nextDate }
    ]);
  };

  const handleRemove = (idx: number) => {
    if (installments.length <= 2) {
      toast.error("Cicilan membutuhkan minimal 2 termin.");
      return;
    }
    const newInst = [...installments];
    newInst.splice(idx, 1);
    setInstallments(newInst);
  };

  const handleUpdate = (idx: number, field: "amount" | "due_date", val: string) => {
    const newInst = [...installments];
    if (field === "amount") {
      const num = parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
      newInst[idx].amount = num;
    } else {
      newInst[idx].due_date = val;
    }
    setInstallments(newInst);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remaining !== 0) {
      toast.error(
        remaining > 0 
          ? `Alokasi cicilan kurang ${formatRupiah(remaining)} dari total tagihan.` 
          : `Alokasi cicilan melebihi ${formatRupiah(Math.abs(remaining))} dari total tagihan.`
      );
      return;
    }
    if (installments.some(i => !i.due_date)) {
      toast.error("Semua tanggal jatuh tempo termin harus ditentukan.");
      return;
    }
    if (installments.some(i => i.amount <= 0)) {
      toast.error("Nominal setiap termin harus lebih dari Rp 0.");
      return;
    }

    setIsSubmitting(true);
    const result = await splitInstallmentsAction(invoice.id, installments);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Berhasil memecah tagihan menjadi cicilan!");
      onClose();
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* 1. Header Tetap (Sticky Header) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Pecah Tagihan Jadi Cicilan
              </h2>
              {typeof maxTerms === "number" ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                  Maks. {maxTerms} Termin
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                  Pro: Bebas Termin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total Tagihan Siswa: <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(invoice.total_amount)}</strong>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Quick Action Toolbar: Preset Bagi Rata */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Preset Bagi Rata Cepat:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSplitEqually(2)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                installments.length === 2
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              2x Termin
            </button>
            <button
              type="button"
              onClick={() => handleSplitEqually(3)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                installments.length === 3
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              3x Termin
            </button>
            {(!maxTerms || maxTerms > 3) && (
              <>
                <button
                  type="button"
                  onClick={() => handleSplitEqually(4)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    installments.length === 4
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  4x Termin
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitEqually(6)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    installments.length === 6
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  6x Termin
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Form Body dengan Baris Horizontal Padat & Scroll Terkontrol */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          
          <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Table Header Row */}
            <div className="grid grid-cols-12 gap-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-3 sm:col-span-3">Termin</div>
              <div className="col-span-5 sm:col-span-5">Nominal (Rp)</div>
              <div className="col-span-3 sm:col-span-3">Jatuh Tempo</div>
              <div className="col-span-1 text-center">Hapus</div>
            </div>

            {/* List of Compact Horizontal Rows */}
            <div className="space-y-2">
              {installments.map((inst, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  {/* Kolom 1: Badge Termin */}
                  <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      Termin {idx + 1}
                    </span>
                  </div>

                  {/* Kolom 2: Input Nominal Ringkas */}
                  <div className="col-span-5 sm:col-span-5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        required
                        value={inst.amount === 0 ? "" : inst.amount.toLocaleString("id-ID")}
                        onChange={(e) => handleUpdate(idx, "amount", e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Kolom 3: Input Tanggal Jatuh Tempo */}
                  <div className="col-span-3 sm:col-span-3">
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={inst.due_date}
                        onChange={(e) => handleUpdate(idx, "due_date", e.target.value)}
                        className="w-full px-2.5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Kolom 4: Tombol Hapus */}
                  <div className="col-span-1 flex justify-center">
                    {installments.length > 2 ? (
                      <button 
                        type="button" 
                        onClick={() => handleRemove(idx)} 
                        title="Hapus termin ini"
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="w-4 h-4 block" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tombol Tambah Termin Compact */}
            <div className="mt-3">
              <button 
                type="button" 
                onClick={handleAdd}
                disabled={isMaxTermsReached}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-300 disabled:hover:bg-transparent"
              >
                <Plus size={15} /> 
                <span>Tambah Termin ({installments.length}{typeof maxTerms === "number" ? `/${maxTerms}` : ""})</span>
              </button>

              {isMaxTermsReached && isGrowthLimit && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Batas maksimal 3 termin paket Growth tercapai. Upgrade ke <strong>Pro</strong> untuk termin bebas tanpa batas.</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Footer Tetap (Sticky Footer & Action Bar) */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0 space-y-3">
            
            {/* Ringkasan Status Alokasi */}
            <div className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
              remaining === 0 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' 
                : remaining > 0
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50'
            }`}>
              <div className="flex items-center gap-2">
                {remaining === 0 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span>
                  {remaining === 0 
                    ? "Alokasi nominal pas (100% teralokasi)" 
                    : remaining > 0 
                    ? "Sisa nominal belum dialokasikan:" 
                    : "Nominal melebihi total tagihan:"}
                </span>
              </div>
              <span className="font-bold text-sm tracking-tight">
                {formatRupiah(Math.abs(remaining))}
              </span>
            </div>

            {/* Tombol Aksi Batal / Simpan */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || remaining !== 0}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Simpan Pembagian Cicilan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

