"use client";

import { useState, useRef } from "react";
import { updateProfileAction, updateAvatarAction, changePasswordAction } from "./actions";
import { AlertCircle, KeyRound, CheckCircle2, ShieldAlert, Camera, Loader2, AlertTriangle } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export default function ProfileClientPage({ staff }: { staff: any }) {
  const [alert, setAlert] = useState<{show: boolean, message: string, title?: string, type?: 'error' | 'success' | 'warning'}>({show: false, message: ''});
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [msgProfile, setMsgProfile] = useState({ type: "", text: "" });
  const [msgPassword, setMsgPassword] = useState({ type: "", text: "" });
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingProfile(true);
    setMsgProfile({ type: "", text: "" });

    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);

    if (result.error) {
      setMsgProfile({ type: "error", text: result.error });
    } else if (result.success) {
      setMsgProfile({ type: "success", text: "Profil berhasil diperbarui!" });
    }
    
    setLoadingProfile(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingPassword(true);
    setMsgPassword({ type: "", text: "" });

    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);

    if (result.error) {
      setMsgPassword({ type: "error", text: result.error });
    } else if (result.success) {
      setMsgPassword({ type: "success", text: "Password berhasil diperbarui." });
      (e.target as HTMLFormElement).reset();
    }
    
    setLoadingPassword(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAlert({ show: true, title: "File Terlalu Besar", message: "Ukuran file maksimal 2MB.", type: "error" });
      return;
    }

    // Validate type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setAlert({ show: true, title: "Format Tidak Valid", message: "Hanya format JPG atau PNG yang diperbolehkan.", type: "error" });
      return;
    }

    setUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await updateAvatarAction(base64);
      if (res.error) {
        setAlert({ show: true, title: "Gagal", message: res.error, type: "error" });
      }
      setUploadingAvatar(false);
    };
    reader.onerror = () => {
      setAlert({ show: true, title: "Error", message: "Gagal membaca file gambar", type: "error" });
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      
      {/* Kolom Kiri: Informasi Dasar */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-8">Informasi Dasar</h3>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <UserAvatar id={staff.id} email={staff.email} avatarUrl={staff.avatar_url} size={80} className="border-4 border-white dark:border-slate-800 shadow-lg" />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white dark:border-slate-900 hover:bg-blue-700 transition"
              title="Ganti Foto Profil"
            >
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg, image/png" 
              className="hidden" 
            />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
              {staff.name || 'Admin'}
            </h4>
            <p className="text-sm text-slate-500 mb-1">{staff.email}</p>
            <p className="text-xs text-slate-400 font-medium">Role: <span className="capitalize">{staff.role.toLowerCase()}</span></p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {msgProfile.text && (
            <div className={`p-3 rounded-xl border text-sm font-medium ${msgProfile.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
              {msgProfile.text}
            </div>
          )}

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
                  defaultValue={staff.name || ''}
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
              disabled={loadingProfile}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              {loadingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      {/* Kolom Kanan: Keamanan Akun */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Keamanan Akun</h3>
            <p className="text-sm text-slate-500">Ubah kata sandi Anda</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {msgPassword.text && (
            <div className={`p-3 rounded-xl border text-sm font-medium ${msgPassword.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
              {msgPassword.text}
            </div>
          )}

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
              disabled={loadingPassword}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingPassword ? "Menyimpan..." : "Perbarui Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Alert Modal (SweetAlert alternative) */}
      {alert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                ${alert.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                  alert.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                {alert.type === 'error' ? <AlertTriangle size={32} /> : 
                 alert.type === 'success' ? <CheckCircle2 size={32} /> : 
                 <ShieldAlert size={32} />}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{alert.title || "Pemberitahuan"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{alert.message}</p>
              
              <button 
                onClick={() => setAlert({ ...alert, show: false })}
                className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl transition
                  ${alert.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                    alert.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                    'bg-blue-600 hover:bg-blue-700'}`}
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
