"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, Server, CheckCircle2, AlertCircle, Send, Save, 
  Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw, 
  HelpCircle, Megaphone, Users, Info, ChevronRight, Check, FileText
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { FeatureLockBanner } from "@/components/feature-lock-banner";
import { 
  saveSmtpConfigAction, 
  testSmtpConfigAction, 
  broadcastAnnouncementEmailAction,
  SmtpConfigInput 
} from "./actions";

interface AnnouncementTemplate {
  id: string;
  name: string;
  tag: string;
  title: string;
  message: string;
}

const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    id: "libur",
    name: "Libur & Cuti Bersama",
    tag: "Kalender Akademik",
    title: "Pemberitahuan Libur Kegiatan Belajar Mengajar & Jadwal Pengganti",
    message: `Yth. Siswa dan Orang Tua,

Sehubungan dengan adanya hari libur nasional / cuti bersama, kami informasikan bahwa seluruh kegiatan pembelajaran di bimbel diliburkan pada:

Hari / Tanggal  : [Contoh: Senin, 17 Agustus 2026]
Kegiatan        : Diliburkan (Tidak ada kelas tatap muka)

Kegiatan bimbingan belajar akan kembali aktif normal mulai:
Hari / Tanggal  : [Contoh: Selasa, 18 Agustus 2026]

Untuk penyesuaian materi atau kelas pengganti (make-up class), pengajar/admin akan menginformasikan lebih lanjut melalui kalender di Portal Siswa.

Atas perhatian dan kerja samanya, kami ucapkan terima kasih.

Hormat kami,
Manajemen Bimbel`,
  },
  {
    id: "tryout",
    name: "Jadwal Try Out / Ujian",
    tag: "Ujian & Evaluasi",
    title: "Jadwal Pelaksanaan Ujian Simulasi & Try Out Akbar Siswa",
    message: `Yth. Siswa dan Orang Tua,

Dalam rangka mengukur capaian pembelajaran serta persiapan menghadapi ujian sekolah/seleksi nasional, bimbel akan mengadakan simulasi ujian dengan rincian sebagai berikut:

Agenda          : Ujian Simulasi / Try Out Semester
Hari / Tanggal  : [Sebutkan Hari & Tanggal Pelaksanaan]
Waktu           : [Contoh: 08.00 - 11.30 WIB]
Tempat / Ruang  : [Contoh: Ruang Belajar Bimbel / Daring via Portal Siswa]

Ketentuan dan Tata Tertib Peserta:
1. Hadir di lokasi bimbingan 15 menit sebelum ujian dimulai.
2. Membawa perlengkapan alat tulis lengkap dan kartu tanda peserta.
3. Menjaga ketertiban dan fokus selama ujian berlangsung.

Hasil analisis skor dan grafik capaian nilai dapat diakses melalui menu Evaluasi di Portal Siswa setelah ujian diperiksa oleh tim pengajar.

Semangat belajar dan raih hasil terbaik!

Hormat kami,
Tim Akademik Bimbel`,
  },
  {
    id: "spp",
    name: "Pengingat Tagihan SPP",
    tag: "Administrasi",
    title: "Pengingat Batas Waktu Pembayaran Biaya Pendidikan (SPP)",
    message: `Yth. Orang Tua dan Siswa,

Melalui pemberitahuan ini, kami ingin mengingatkan kembali mengenai batas waktu (jatuh tempo) pembayaran administrasi bimbingan belajar (SPP) untuk periode berjalan:

Batas Waktu     : Tanggal 10 setiap bulannya
Metode          : Transfer Bank Resmi Bimbel / Tunai ke Kasir Bimbel

Rincian tagihan dapat dicek secara transparan melalui menu Keuangan di Portal Siswa. Bagi Bapak/Ibu yang telah melakukan pembayaran dan menyelesaikan administrasi, silakan abaikan pengumuman ini.

Terima kasih atas komitmen dan kerja sama Bapak/Ibu dalam mempercayakan pendidikan putra/putri bersama kami.

Hormat kami,
Bagian Keuangan Bimbel`,
  },
  {
    id: "jadwal",
    name: "Perubahan Jadwal Kelas",
    tag: "Operasional",
    title: "Pemberitahuan Penyesuaian Jadwal & Ruang Belajar Kelas",
    message: `Yth. Siswa dan Orang Tua,

Kami menginformasikan adanya penyesuaian jadwal dan ruangan kegiatan bimbingan belajar untuk kelas berikut:

Nama Kelas      : [Sebutkan Nama Program / Kelas]
Mulai Berlaku   : [Sebutkan Tanggal Efektif]
Jadwal Semula   : [Contoh: Senin, 15.30 - 17.00 WIB]
Jadwal Baru     : [Contoh: Senin, 16.00 - 17.30 WIB]
Ruangan         : [Sebutkan Ruangan]

Mohon siswa dapat mencatat perubahan ini dan hadir tepat waktu sesuai jadwal terbaru. Kalender pembelajaran di Portal Siswa juga telah diperbarui secara otomatis.

Terima kasih atas pengertian dan kerja sama adik-adik siswa serta Bapak/Ibu sekalian.

Hormat kami,
Pengelola Operasional Bimbel`,
  },
  {
    id: "temu_wali",
    name: "Pertemuan Konsultasi",
    tag: "Konseling",
    title: "Undangan Pertemuan Konsultasi & Evaluasi Perkembangan Belajar Siswa",
    message: `Yth. Orang Tua Siswa,

Kami mengundang Bapak/Ibu untuk menghadiri agenda Pertemuan Konsultasi & Evaluasi Belajar Siswa guna mendiskusikan capaian akademik serta strategi belajar putra/putri tercinta:

Agenda          : Pertemuan Konsultasi Akademik Siswa
Hari / Tanggal  : [Sebutkan Hari & Tanggal]
Waktu           : [Sebutkan Sesi Waktu]
Tempat / Moda   : Kantor Bimbel / Daring via Google Meet

Pada pertemuan ini, tim tutor akan menyampaikan grafik evaluasi nilai, catatan presensi kehadiran, serta rekomendasi pemetaan target belajar siswa ke depan.

Kehadiran Bapak/Ibu sangat berarti dalam mendampingi langkah sukses pendidikan anak.

Hormat kami,
Tim Bimbingan & Konseling Bimbel`,
  },
];

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
  const isPro = (planName || "").trim().toLowerCase() === "pro";

  // Form State
  const [host, setHost] = useState(initialConfig.host);
  const [port, setPort] = useState(initialConfig.port);
  const [user, setUser] = useState(initialConfig.user);
  const [pass, setPass] = useState("");
  const [fromName, setFromName] = useState(initialConfig.fromName);
  const [fromEmail, setFromEmail] = useState(initialConfig.fromEmail);
  const [secure, setSecure] = useState(initialConfig.secure);
  const [isActive, setIsActive] = useState(initialConfig.isActive);
  const [savedActive, setSavedActive] = useState(initialConfig.isActive);
  const [hasPassword, setHasPassword] = useState(initialConfig.hasPassword);

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
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Jalankan validasi HTML5 bawaan browser (otomatis arahkan & fokus ke kolom yang belum diisi)
    const form = e.currentTarget;
    if (isActive) {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const cleanHost = (host || "").trim();
      const numPort = Number(port);
      const cleanUser = (user || "").trim();
      const cleanPass = (pass || "").replace(/\s+/g, "");

      if (!cleanHost) {
        toast.error("Host Server SMTP wajib diisi sebelum mengaktifkan layanan.");
        document.getElementById("smtp_host")?.focus();
        return;
      }

      if (!numPort || isNaN(numPort) || numPort < 1 || numPort > 65535) {
        toast.error("Port SMTP tidak valid. Harap masukkan nomor port antara 1 s.d. 65535.");
        document.getElementById("smtp_port")?.focus();
        return;
      }

      if (!cleanUser) {
        toast.error("Username atau email login SMTP wajib diisi.");
        document.getElementById("smtp_user")?.focus();
        return;
      }

      if (!hasPassword && !cleanPass) {
        toast.error("Password atau App Password SMTP wajib diisi.");
        document.getElementById("smtp_pass")?.focus();
        return;
      }

      if (cleanHost.toLowerCase().includes("gmail") && cleanPass) {
        if (cleanPass.length !== 16) {
          toast.error(`App Password Gmail harus tepat 16 karakter tanpa spasi (saat ini ${cleanPass.length} karakter).`);
          document.getElementById("smtp_pass")?.focus();
          return;
        }
      }

      if (fromEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fromEmail.trim())) {
          toast.error("Format Email Pengirim (From Email) tidak valid.");
          document.getElementById("smtp_from_email")?.focus();
          return;
        }
      }
    }

    setIsSaving(true);

    const payload: SmtpConfigInput = {
      host: host.trim(),
      port: Number(port),
      user: user.trim(),
      pass: host.toLowerCase().includes("gmail") ? pass.replace(/\s+/g, "") : pass,
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      secure,
      isActive,
    };

    const res = await saveSmtpConfigAction(payload);
    setIsSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Pengaturan SMTP berhasil disimpan.");
      setSavedActive(isActive);
      if (pass.trim()) {
        setHasPassword(true);
      }
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testTargetEmail.trim())) {
      toast.error("Format alamat email penerima uji coba tidak valid.");
      return;
    }

    const cleanHost = (host || "").trim();
    const cleanUser = (user || "").trim();
    const cleanPass = (pass || "").replace(/\s+/g, "");

    if (!cleanHost) {
      toast.error("Host SMTP belum diisi.");
      return;
    }
    if (!cleanUser) {
      toast.error("Username SMTP belum diisi.");
      return;
    }
    if (!cleanPass && !hasPassword) {
      toast.error("Password SMTP belum diisi.");
      return;
    }

    if (cleanHost.toLowerCase().includes("gmail") && cleanPass && cleanPass.length !== 16) {
      toast.error(`App Password Gmail harus tepat 16 karakter (saat ini ${cleanPass.length} karakter).`);
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

  const isConfigured = !!(host.trim() && user.trim() && (pass || hasPassword));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Email & Layanan SMTP
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Gunakan server email bimbel Anda sendiri (BYO SMTP) untuk mengirimkan notifikasi invoice dan pengumuman secara otomatis.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {savedActive ? (
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

            {/* Integrated Billing Automation Highlights */}
            {isActive && (
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>Fitur Otomasi Tagihan Terintegrasi di Menu Keuangan:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-blue-100 dark:border-blue-900/30">
                    <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Kirim otomatis saat Generate Tagihan Bulanan</span>
                  </div>
                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-blue-100 dark:border-blue-900/30">
                    <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Tombol kirim massal tagihan belum lunas di Finance</span>
                  </div>
                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-blue-100 dark:border-blue-900/30">
                    <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Pengingat jatuh tempo otomatis (H-3 dan H-1)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Host SMTP */}
              <div className="space-y-1.5">
                <label htmlFor="smtp_host" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Host Server SMTP {isActive && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="smtp_host"
                  name="smtp_host"
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
                <label htmlFor="smtp_port" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Port SMTP {isActive && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="smtp_port"
                  name="smtp_port"
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
                <label htmlFor="smtp_user" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username / Email Login SMTP {isActive && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="smtp_user"
                  name="smtp_user"
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
                  <label htmlFor="smtp_pass" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password / App Password {isActive && !hasPassword && <span className="text-red-500">*</span>}
                  </label>
                  {hasPassword && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Password tersimpan
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="smtp_pass"
                    name="smtp_pass"
                    type={showPassword ? "text" : "password"}
                    required={isActive && !hasPassword}
                    value={pass}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (host.toLowerCase().includes("gmail")) {
                        setPass(val.replace(/\s+/g, ""));
                      } else {
                        setPass(val);
                      }
                    }}
                    placeholder={hasPassword ? "•••••••• (Biarkan kosong jika tidak diubah)" : "Masukkan kata sandi atau App Password"}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {host.toLowerCase().includes("gmail") ? (
                  pass.length === 16 ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check size={12} /> Format 16 digit App Password Google sesuai.
                    </span>
                  ) : pass.length > 0 ? (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      App Password Google harus tepat 16 karakter tanpa spasi ({pass.length}/16 karakter).
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Untuk Gmail, gunakan 16 digit App Password dari Akun Google Anda (spasi otomatis dibersihkan).
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Kata sandi akun email atau API Key server SMTP Anda.
                  </span>
                )}
              </div>

              {/* Sender Name */}
              <div className="space-y-1.5">
                <label htmlFor="smtp_from_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Tampilan Pengirim (From Name)
                </label>
                <input
                  id="smtp_from_name"
                  name="smtp_from_name"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={`Contoh: ${academyName}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sender Email */}
              <div className="space-y-1.5">
                <label htmlFor="smtp_from_email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Pengirim (From Email)
                </label>
                <input
                  id="smtp_from_email"
                  name="smtp_from_email"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Contoh: billing@bimbelanda.com (Opsional, default sama dengan User)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {host.toLowerCase().includes("gmail") && fromEmail && user && fromEmail.trim().toLowerCase() !== user.trim().toLowerCase() && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      Catatan Keamanan Google SMTP:
                    </p>
                    <p className="leading-relaxed">
                      Server Gmail (<code>smtp.gmail.com</code>) akan otomatis menimpa email pengirim dengan akun login Anda (<strong>{user}</strong>), kecuali alamat <strong>{fromEmail}</strong> sudah didaftarkan dan diverifikasi sebagai alias di setelan <em>Gmail &rarr; Setelan &rarr; Akun dan Impor &rarr; Kirim email sebagai</em>.
                    </p>
                  </div>
                )}
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
          {!isPro ? (
            <FeatureLockBanner
              title="Broadcast Pengumuman Massal via Email"
              description="Fitur broadcast email massal ke seluruh siswa dan wali murid hanya tersedia pada paket Pro."
              requiredPlan="Pro"
              tenantSlug={tenantSlug}
              currentPlanName={planName}
            />
          ) : (
            <>
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

            {/* Quick Announcement Templates */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Template Pengumuman Siaran Cepat</span>
                </div>
                {(broadcastTitle || broadcastMessage) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTitle("");
                      setBroadcastMessage("");
                      toast.info("Form pengumuman dikosongkan.");
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Kosongkan Form
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih salah satu draf di bawah untuk mengisi subjek dan isi pesan secara otomatis, lalu sesuaikan bagian dalam tanda kurung [ ]:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ANNOUNCEMENT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setBroadcastTitle(tmpl.title);
                      setBroadcastMessage(tmpl.message);
                      toast.success(`Template "${tmpl.name}" diterapkan.`);
                    }}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all text-left shadow-2xs cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                    <span>{tmpl.name}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-normal">
                      ({tmpl.tag})
                    </span>
                  </button>
                ))}
              </div>
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
            </>
          )}

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
