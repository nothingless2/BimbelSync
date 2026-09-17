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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Avatar & Info Pribadi */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Informasi Dasar</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <UserAvatar id={user.id} email={user.email} avatarUrl={user.avatar_url} size={80} className="border-4 border-white dark:border-slate-800 shadow-lg" />
                
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
                <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name || "Superadmin"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">Role: Superadmin</p>
              </div>
            </div>

            <form action={handleProfileSubmit} className="space-y-5">
              {msgProfile.text && (
                <div className={`p-3 rounded-xl border text-sm font-medium ${msgProfile.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
                  {msgProfile.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      defaultValue={user.name || ""}
                      placeholder="Masukkan nama Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 opacity-60 cursor-not-allowed">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      name="email"
                      disabled
                      defaultValue={user.email}
                      title="Email tidak dapat diubah"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Alamat email superadmin tidak dapat diubah.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loadingProfile}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingProfile ? <Loader2 size={18} className="animate-spin mr-2"/> : <CheckCircle2 size={18} className="mr-2" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Kolom Kanan: Ganti Password */}
        <div className="space-y-8">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Keamanan Akun</h2>
                <p className="text-xs text-slate-500">Ubah kata sandi Anda</p>
              </div>
            </div>

            <form id="form-password" action={handlePasswordSubmit} className="space-y-5">
              {msgPassword.text && (
                <div className={`p-3 rounded-xl border text-xs font-medium ${msgPassword.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
                  {msgPassword.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Saat Ini</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="password" 
                    name="old_password"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="password" 
                    name="new_password"
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gunakan huruf besar, kecil, angka, & simbol spesial.</p>
              </div>

              <div className="space-y-1.5 mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ulangi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="password" 
                    name="confirm_password"
                    required
                    minLength={8}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loadingPassword}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingPassword ? <Loader2 size={16} className="animate-spin mr-2"/> : "Perbarui Password"}
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
