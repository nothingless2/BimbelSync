"use client";

import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { createStudentAction } from "@/app/[tenantSlug]/dashboard/master-data/students/actions";
import { Program } from "@prisma/client";

export function AddStudentModal({ tenantSlug, programs }: { tenantSlug: string, programs: Program[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await createStudentAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setIsOpen(false);
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
        Tambah Siswa
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pendaftaran Siswa Baru</h2>
                <p className="text-sm text-slate-500">Buat akun siswa dan masukkan ke dalam program.</p>
              </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="parent_whatsapp" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No. WhatsApp Orang Tua (Opsional)
                  </label>
                  <input
                    type="text"
                    id="parent_whatsapp"
                    name="parent_whatsapp"
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    placeholder="Contoh: budi_s"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password Sementara
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <label htmlFor="program_id" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Pilih Program / Paket Belajar
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Siswa wajib dimasukkan ke dalam minimal 1 program saat mendaftar.</p>
                  <select
                    id="program_id"
                    name="program_id"
                    required
                    defaultValue=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-medium"
                  >
                    <option value="" disabled>Pilih Program...</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(program.monthly_fee)}/bln
                      </option>
                    ))}
                  </select>
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
                  {isLoading ? "Memproses..." : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
