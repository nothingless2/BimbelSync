"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { updateStudentAction } from "@/app/[tenantSlug]/dashboard/master-data/students/actions";
import { Student } from "@prisma/client";

export function EditStudentModal({ 
  student, 
  tenantSlug, 
  onClose 
}: { 
  student: Student, 
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
    const result = await updateStudentAction(student.id, formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      onClose();
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Profil Siswa</h2>
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
              Username (Tidak bisa diubah)
            </label>
            <input
              type="text"
              disabled
              defaultValue={student.username}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Lengkap</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              defaultValue={student.full_name}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="parent_whatsapp" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No. WhatsApp Orang Tua
            </label>
            <input
              type="text"
              id="parent_whatsapp"
              name="parent_whatsapp"
              defaultValue={student.parent_whatsapp || ""}
              placeholder="Contoh: 08123456789"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Reset Password (Opsional)
            </label>
            <p className="text-xs text-slate-500 mb-1">Jika diisi, siswa akan diminta mengganti password saat login berikutnya.</p>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Biarkan kosong jika tidak ingin me-reset password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sertakan huruf besar, kecil, angka, & simbol (minimal 8 karakter).</p>
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
