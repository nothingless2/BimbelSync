"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { updateStaffAction } from "@/app/[tenantSlug]/dashboard/master-data/staff/actions";
import { Staff } from "@prisma/client";

export function EditStaffModal({ 
  staff, 
  tenantSlug, 
  onClose 
}: { 
  staff: Staff, 
  tenantSlug: string, 
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateStaffAction(staff.id, formData);

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
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Staf</h2>
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

          <div className="space-y-2 opacity-60">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Staf (Tidak bisa diubah)
            </label>
            <input
              type="email"
              disabled
              defaultValue={staff.email}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Peran (Role)
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue={staff.role}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
            >
              <option value="TUTOR">Tutor (Pengajar)</option>
              <option value="ADMIN">Admin (Pengelola)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ganti Password (Opsional)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Biarkan kosong jika tidak ingin mengubah password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jika diisi, pastikan minimal 8 karakter dengan huruf besar, kecil, angka & simbol.</p>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
