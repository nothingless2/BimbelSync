"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { updatePlanAction } from "@/app/superadmin/(dashboard)/actions";

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
}

export function EditPlanModal({ isOpen, onClose, plan }: EditPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !plan) return null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Add id to form data
    formData.append("id", plan.id);

    const res = await updatePlanAction(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Paket: {plan.name}</h2>
            <p className="text-xs text-slate-500">Sesuaikan harga dan batasan fitur paket.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Paket</label>
                <input 
                  type="text" 
                  name="name"
                  defaultValue={plan.name}
                  required
                  placeholder="Misal: Pro Plan"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Harga (Rp) / Bulan</label>
                <input 
                  type="number" 
                  name="price"
                  defaultValue={plan.price}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Batasan (Limits)</h3>
              <p className="text-xs text-slate-500 mb-4">Kosongkan jika ingin Unlimited.</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maks Siswa</label>
                  <input 
                    type="number" 
                    name="max_students"
                    defaultValue={plan.max_students || ""}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maks Tutor</label>
                  <input 
                    type="number" 
                    name="max_staff"
                    defaultValue={plan.max_staff || ""}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maks Ruangan</label>
                  <input 
                    type="number" 
                    name="max_rooms"
                    defaultValue={plan.max_rooms || ""}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Fitur Tambahan</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <input type="checkbox" name="allows_payment_gateway" defaultChecked={plan.allows_payment_gateway} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Payment Gateway Terintegrasi</p>
                    <p className="text-xs text-slate-500">Mendukung VA, E-Wallet, Kartu Kredit (Mutasi Otomatis)</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <input type="checkbox" name="allows_installment" defaultChecked={plan.allows_installment} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Sistem Cicilan (Installment)</p>
                    <p className="text-xs text-slate-500">Bimbel dapat menagih pembayaran secara bertahap / termin</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={18} className="mr-2 animate-spin"/> Menyimpan...</> : <><Save size={18} className="mr-2"/> Simpan Perubahan</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
