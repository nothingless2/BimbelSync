"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, Server, CheckCircle2, AlertCircle, Send, Save, 
  Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw, 
  HelpCircle, Megaphone, Users, Info, ChevronRight, Check
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  saveSmtpConfigAction, 
  testSmtpConfigAction, 
  broadcastAnnouncementEmailAction,
  SmtpConfigInput 
} from "./actions";

interface InitialConfig {
  host: string;
  port: number;
  user: string;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string;
  secure: boolean;
  isActive: boolean;
}

export default function EmailSettingsClientPage({
  tenantSlug,
  academyName,
  planName,
  adminEmail,
  activeStudentCount,
  initialConfig,
}: {
  tenantSlug: string;
  academyName: string;
  planName: string;
  adminEmail: string;
  activeStudentCount: number;
  initialConfig: InitialConfig;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"smtp" | "broadcast">("smtp");

  // Form State
  const [host, setHost] = useState(initialConfig.host);
  const [port, setPort] = useState(initialConfig.port);
  const [user, setUser] = useState(initialConfig.user);
  const [pass, setPass] = useState("");
  const [fromName, setFromName] = useState(initialConfig.fromName);
  const [fromEmail, setFromEmail] = useState(initialConfig.fromEmail);
  const [secure, setSecure] = useState(initialConfig.secure);
  const [isActive, setIsActive] = useState(initialConfig.isActive);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTargetEmail, setTestTargetEmail] = useState(adminEmail);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastConfirmOpen, setBroadcastConfirmOpen] = useState(false);

  // Apply Presets
  const applyPreset = (preset: "gmail" | "brevo" | "custom") => {
    if (preset === "gmail") {
      setHost("smtp.gmail.com");
      setPort(587);
      setSecure(false);
      toast.info("Preset Gmail / Google Workspace diterapkan. Gunakan App Password (16 digit) Google.");
    } else if (preset === "brevo") {
      setHost("smtp-relay.brevo.com");
      setPort(587);
      setSecure(false);
      toast.info("Preset Brevo diterapkan. Gunakan Master Password / SMTP Key dari akun Brevo.");
    } else {
      setHost("");
      setPort(587);
      setSecure(false);
      toast.info("Mode kustom aktif. Masukkan host dan port dari penyedia email Anda.");
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload: SmtpConfigInput = {
      host,
      port: Number(port),
      user,
      pass,
      fromName,
      fromEmail,
      secure,
      isActive,
    };

    const res = await saveSmtpConfigAction(payload);
    setIsSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Pengaturan SMTP berhasil disimpan.");
      setPass(""); // Kosongkan input password setelah simpan demi keamanan
      router.refresh();
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    if (!testTargetEmail) {
      toast.error("Alamat email penerima uji coba wajib diisi.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const payload = {
      host,
      port: Number(port),
      user,
      pass,
      fromName,
      fromEmail,
      secure,
      targetEmail: testTargetEmail,
    };

    const res = await testSmtpConfigAction(payload);
    setIsTesting(false);

    if (res.error) {
      setTestResult({ success: false, message: res.error });
      toast.error(res.error);
    } else {
      setTestResult({ success: true, message: res.message });
      toast.success(res.message || "Email pengujian berhasil dikirim.");
    }
  };

  // Handle Broadcast Announcement
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Judul dan pesan pengumuman wajib diisi.");
      return;
    }

    setIsBroadcasting(true);
    const res = await broadcastAnnouncementEmailAction({
      title: broadcastTitle,
      message: broadcastMessage,
    });
    setIsBroadcasting(false);
    setBroadcastConfirmOpen(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Pengumuman berhasil dikirim ke seluruh siswa.");
      setBroadcastTitle("");
      setBroadcastMessage("");
    }
  };

  const isConfigured = !!(initialConfig.host && initialConfig.user && initialConfig.hasPassword);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Pengaturan</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">Email & SMTP</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Email & Layanan SMTP
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                Paket {planName}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Gunakan server email bimbel Anda sendiri (BYO SMTP) untuk mengirimkan notifikasi invoice dan pengumuman secara otomatis.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isActive ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Layanan Email Aktif
              </div>
            ) : isConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Tersimpan (Nonaktif)
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Belum Dikonfigurasi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("smtp")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "smtp"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Server size={16} />
          Konfigurasi SMTP
        </button>
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "broadcast"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Megaphone size={16} />
          Broadcast Pengumuman
          {activeStudentCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {activeStudentCount} Siswa
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: KONFIGURASI SMTP */}
      {activeTab === "smtp" && (
        <div className="space-y-6">
          
          {/* Quick Presets Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/30 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                  Preset Cepat Penyedia Email
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Pilih layanan email yang digunakan bimbel Anda untuk mengisi Host dan Port secara otomatis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("gmail")}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                >
                  Gmail / Google
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("brevo")}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                >
                  Brevo (Sendinblue)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("custom")}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                >
                  Kustom / Lainnya
                </button>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSave} className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            
            {/* Activation Switch */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label htmlFor="is_smtp_active_toggle" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer">
                  Aktifkan Pengiriman Email Otomatis
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saat aktif, sistem akan mengizinkan pengiriman notifikasi invoice tagihan SPP dan email massal ke siswa.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="is_smtp_active_toggle"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Host SMTP */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Host Server SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={isActive}
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="Contoh: smtp.gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Port SMTP */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Port SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required={isActive}
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400">Umumnya 587 (STARTTLS) atau 465 (SSL).</span>
              </div>

              {/* Username SMTP */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username / Email Login SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={isActive}
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="Contoh: admin@bimbelanda.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password / App Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password / App Password <span className="text-red-500">*</span>
                  </label>
                  {initialConfig.hasPassword && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Password tersimpan
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder={initialConfig.hasPassword ? "•••••••• (Biarkan kosong jika tidak diubah)" : "Masukkan kata sandi atau App Password"}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">Untuk Gmail, gunakan 16 digit App Password dari Akun Google Anda.</span>
              </div>

              {/* Sender Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Tampilan Pengirim (From Name)
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={`Contoh: ${academyName}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sender Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Pengirim (From Email)
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Contoh: billing@bimbelanda.com (Opsional, default sama dengan User)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Checkbox SSL */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="secure_ssl"
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="secure_ssl" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Gunakan koneksi SSL Langsung (Wajib dicentang jika menggunakan Port 465). Kosongkan untuk Port 587 (STARTTLS).
              </label>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setTestResult(null);
                  setTestModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
              >
                <Send size={16} />
                Kirim Email Uji Coba
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Konfigurasi
              </button>
            </div>

          </form>

          {/* Panduan Bantuan Akun Google */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Info size={16} className="text-blue-500" />
              Petunjuk Penggunaan Akun Gmail / Google Workspace
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              <li>Aktifkan <strong>Verifikasi 2 Langkah (2-Step Verification)</strong> pada akun Google Anda.</li>
              <li>Buka menu <strong>Keamanan Akun Google &gt; Sandi Aplikasi (App Passwords)</strong>.</li>
              <li>Buat sandi baru untuk aplikasi &quot;BimbelSync Mailer&quot;.</li>
              <li>Salin kode 16 digit yang dihasilkan ke kolom <strong>Password / App Password</strong> di atas tanpa spasi.</li>
            </ol>
          </div>

        </div>
      )}

      {/* TAB 2: BROADCAST PENGUMUMAN */}
      {activeTab === "broadcast" && (
        <div className="space-y-6">
          
          {!isActive && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Layanan SMTP bimbel Anda saat ini belum aktif. Aktifkan toggle di tab <strong>Konfigurasi SMTP</strong> terlebih dahulu sebelum melakukan siaran pengumuman.
              </span>
            </div>
          )}

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Siaran Pengumuman Massal via Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kirimkan informasi penting, perubahan jadwal, atau edaran resmi bimbel secara serentak ke inbox seluruh siswa aktif.
              </p>
            </div>

            {/* Recipient Counter Badge */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Estimasi Penerima Siaran</p>
                  <p className="text-xs text-slate-500">Siswa berstatus aktif dengan email terdaftar</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {activeStudentCount} Siswa
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subjek / Judul Pengumuman <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Contoh: Libur Nasional & Jadwal Pengganti Pembelajaran"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Isi Pesan Pengumuman <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Tuliskan isi pengumuman atau instruksi akademik di sini..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {/* Broadcast Action Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                disabled={!isActive || !broadcastTitle.trim() || !broadcastMessage.trim() || activeStudentCount === 0}
                onClick={() => setBroadcastConfirmOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Megaphone size={16} />
                Kirim Pengumuman Sekarang
              </button>
            </div>

          </div>

        </div>
      )}

      {/* MODAL UJI COBA KONEKSI SMTP */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Uji Coba Pengiriman Email</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verifikasi koneksi server SMTP</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sistem akan mengirimkan satu email pengujian ke alamat tujuan untuk memastikan kredensial dan port SMTP dapat terhubung.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alamat Email Penerima Tes
              </label>
              <input
                type="email"
                value={testTargetEmail}
                onChange={(e) => setTestTargetEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success 
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40" 
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40"
              }`}>
                {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isTesting || !testTargetEmail}
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {isTesting ? "Menguji Koneksi..." : "Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BROADCAST */}
      {broadcastConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Megaphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Siaran Email</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kirim ke {activeStudentCount} siswa aktif</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menyiarkan pengumuman <strong>&quot;{broadcastTitle}&quot;</strong> sekarang? Email akan langsung dikirimkan ke kotak masuk masing-masing siswa.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => setBroadcastConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={handleBroadcast}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
              >
                {isBroadcasting ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
                {isBroadcasting ? "Mengirimkan Siaran..." : "Ya, Kirim Siaran"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
