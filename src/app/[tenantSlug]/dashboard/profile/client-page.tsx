"use client";

import { useState } from "react";
import { updateProfileAction } from "./actions";
import { AlertCircle, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";
import { Staff } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";

export default function ProfileClientPage({ staff }: { staff: Staff }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);

    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.success) {
      setSuccessMsg("Password berhasil diperbarui.");
      const pwdInput = document.getElementById('password') as HTMLInputElement;
      const confirmInput = document.getElementById('password_confirm') as HTMLInputElement;
      if (pwdInput) pwdInput.value = '';
      if (confirmInput) confirmInput.value = '';
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6">
      
      {/* Kolom Kiri: Informasi Dasar */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-8">Informasi Dasar</h3>
        
        <div className="flex items-center gap-5 mb-8">
          <UserAvatar id={staff.id} email={staff.email} avatarUrl={null} size={80} />
          <div>
            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
              {staff.role === 'ADMIN' ? 'Admin' : 'Tutor'}
            </h4>
            <p className="text-sm text-slate-500 mb-1">{staff.email}</p>
            <p className="text-xs text-slate-400 font-medium">Role: <span className="capitalize">{staff.role.toLowerCase()}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Masukkan nama Anda"
                  defaultValue={(staff as any).name || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  type="email"
                  id="email"
                  disabled
                  defaultValue={staff.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Alamat email {staff.role.toLowerCase()} tidak dapat diubah.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      {/* Kolom Kanan: Keamanan Akun */}
      <div className="w-full lg:w-[380px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Keamanan Akun</h3>
            <p className="text-sm text-slate-500">Ubah kata sandi Anda</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="current_password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password Saat Ini
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                id="current_password"
                name="current_password"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password Baru
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Minimal 8 karakter"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password_confirm" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ulangi Password Baru
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Perbarui Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
