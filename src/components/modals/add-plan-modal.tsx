"use client";

import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { createPlanAction } from "@/app/superadmin/(dashboard)/actions";

export function AddPlanModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await createPlanAction(formData);
    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
    }
    setIsLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm">
        <Plus size={16} /> Tambah Paket
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Paket Berlangganan</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex gap-2 items-start text-sm border border-red-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /><p>{errorMsg}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Paket</label>
                  <input name="name" required placeholder="Contoh: Starter" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Harga / Bulan (Rp)</label>
                  <input type="number" name="price" required min="0" placeholder="99000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Maks. Siswa <span className="text-slate-400 font-normal">(kosong = ∞)</span></label>
                  <input type="number" name="max_students" min="1" placeholder="50" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Maks. Staff <span className="text-slate-400 font-normal">(kosong = ∞)</span></label>
                  <input type="number" name="max_staff" min="1" placeholder="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Maks. Ruangan <span className="text-slate-400 font-normal">(kosong = ∞)</span></label>
                  <input type="number" name="max_rooms" min="1" placeholder="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Fitur Tambahan</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="allows_payment_gateway" className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Gateway (Midtrans/Xendit)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="allows_installment" className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Opsi Cicilan</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                  {isLoading ? "Menyimpan..." : "Simpan Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
