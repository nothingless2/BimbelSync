"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, CalendarDays, Coins, Info } from "lucide-react";
import { createProgramAction } from "@/app/[tenantSlug]/dashboard/master-data/programs/actions";

export function AddProgramModal({ tenantSlug }: { tenantSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [billingType, setBillingType] = useState<"MONTHLY" | "ONE_TIME">("MONTHLY");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await createProgramAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setIsOpen(false);
      setBillingType("MONTHLY");
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm"
      >
        <Plus size={16} />
        Tambah Program
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Program Baru</h2>
              <button 
                onClick={() => setIsOpen(false)}
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

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nama Program</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Contoh: Paket Intensif UTBK"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Skema Penagihan & Pembayaran *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingType("MONTHLY")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      billingType === "MONTHLY"
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <CalendarDays className={`w-5 h-5 shrink-0 mt-0.5 ${billingType === "MONTHLY" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">SPP Bulanan</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ditagih berulang setiap bulan via sistem otomatis</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingType("ONE_TIME")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      billingType === "ONE_TIME"
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <Coins className={`w-5 h-5 shrink-0 mt-0.5 ${billingType === "ONE_TIME" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Sekali Bayar / Paket</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Uang dibayar di muka (lunas di awal), tanpa tagihan bulanan</p>
                    </div>
                  </button>
                </div>
                <input type="hidden" name="billing_type" value={billingType} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="max_capacity" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Kapasitas (Siswa)</label>
                  <input
                    type="number"
                    id="max_capacity"
                    name="max_capacity"
                    required
                    min="1"
                    placeholder="Misal: 15"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="duration_months" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Durasi (Bulan)
                  </label>
                  <input
                    type="number"
                    id="duration_months"
                    name="duration_months"
                    min="1"
                    placeholder="Reguler"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="total_meetings" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Total Pertemuan
                  </label>
                  <input
                    type="number"
                    id="total_meetings"
                    name="total_meetings"
                    min="1"
                    placeholder="Opsional"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="monthly_fee" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {billingType === "ONE_TIME" ? "Biaya Paket / Bayar Dimuka (Rp)" : "Biaya SPP Bulanan (Rp)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input
                    type="number"
                    id="monthly_fee"
                    name="monthly_fee"
                    required
                    min="0"
                    placeholder={billingType === "ONE_TIME" ? "Contoh: 1500000" : "Contoh: 250000"}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Info size={13} className="shrink-0" />
                  <span>
                    {billingType === "ONE_TIME"
                      ? "Siswa hanya ditagih sekali saat awal pendaftaran dan tidak akan ditagih di bulan berikutnya."
                      : "Jika total pertemuan atau durasi diisi, sistem otomatis menghentikan penagihan saat kuota selesai."}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
