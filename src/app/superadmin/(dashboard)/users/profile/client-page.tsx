"use client";

import { useState, useRef } from "react";
import { Camera, CheckCircle2, Loader2, Lock, Mail, User, ShieldAlert, AlertTriangle, X } from "lucide-react";
import { updateProfileAction, updateAvatarAction, changePasswordAction } from "./actions";
import { UserAvatar } from "@/components/user-avatar";

export default function ProfileClientPage({ user }: { user: any }) {
  const [alert, setAlert] = useState<{show: boolean, message: string, title?: string, type?: 'error' | 'success' | 'warning'}>({show: false, message: ''});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [msgProfile, setMsgProfile] = useState({ type: "", text: "" });
  const [msgPassword, setMsgPassword] = useState({ type: "", text: "" });
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleProfileSubmit(formData: FormData) {
    setLoadingProfile(true);
    setMsgProfile({ type: "", text: "" });

    const res = await updateProfileAction(formData);
    if (res.error) setMsgProfile({ type: "error", text: res.error });
    else setMsgProfile({ type: "success", text: "Profil berhasil diperbarui!" });
    
    setLoadingProfile(false);
  }

  async function handlePasswordSubmit(formData: FormData) {
    setLoadingPassword(true);
    setMsgPassword({ type: "", text: "" });

    const res = await changePasswordAction(formData);
    if (res.error) setMsgPassword({ type: "error", text: res.error });
    else {
      setMsgPassword({ type: "success", text: "Password berhasil diubah. Sesi lain telah di-logout." });
      (document.getElementById("form-password") as HTMLFormElement).reset();
    }
    
    setLoadingPassword(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await updateAvatarAction(base64);
      if (res.error) {
        setAlert({ show: true, title: "Gagal Menyimpan", message: res.error, type: "error" });
      } else {
        setAlert({ show: true, title: "Berhasil", message: "Foto profil berhasil diperbarui!", type: "success" });
      }
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header Banner Identitas Profil */}
        <div className="p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <UserAvatar id={user.id} email={user.email} avatarUrl={user.avatar_url} size={76} className="border-4 border-white dark:border-slate-800 shadow-md" />
              
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
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                  {user.name || "Superadmin"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                  Superadmin
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Konten Form Terpadu (2 Kolom Seimbang di Dalam 1 Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Kolom Kiri: Informasi Dasar */}
          <div className="p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">Informasi Dasar</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Data identitas profil akun Anda</p>
                </div>
              </div>

              <form action={handleProfileSubmit} id="form-profile" className="space-y-5">
                {msgProfile.text && (
                  <div className={`p-3 rounded-xl border text-sm font-medium ${msgProfile.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
                    {msgProfile.text}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={16} />
                    </span>
                    <input 
                      type="text" 
                      name="name"
                      defaultValue={user.name || ""}
                      placeholder="Masukkan nama Anda"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      name="email"
                      disabled
                      defaultValue={user.email}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-400 cursor-not-allowed outline-none text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Alamat email superadmin tidak dapat diubah.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loadingProfile}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingProfile ? <Loader2 size={16} className="animate-spin mr-1"/> : <CheckCircle2 size={16} className="mr-1" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Keamanan Akun */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Keamanan Akun</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ubah kata sandi Anda</p>
              </div>
            </div>

            <form id="form-password" action={handlePasswordSubmit} className="space-y-5">
              {msgPassword.text && (
                <div className={`p-3 rounded-xl border text-sm font-medium ${msgPassword.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
                  {msgPassword.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Saat Ini</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    name="old_password"
                    required
                    placeholder="Masukkan password saat ini"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    name="new_password"
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Gunakan huruf besar, kecil, angka, & simbol spesial.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ulangi Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    name="confirm_password"
                    required
                    minLength={8}
                    placeholder="Ulangi password baru"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loadingPassword}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingPassword ? <Loader2 size={16} className="animate-spin mr-1"/> : <Lock size={16} className="mr-1" />}
                  Perbarui Password
                </button>
              </div>
            </form>
          </div>

        </div>
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
