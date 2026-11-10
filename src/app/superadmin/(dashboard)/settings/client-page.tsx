"use client";

import { useState } from "react";
import {
  Settings,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  GraduationCap,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { RetentionStats, PurgeResult } from "@/lib/user-cleanup";
import { saveRetentionConfigAction, executeManualPurgeAction } from "./actions";

interface SettingsClientPageProps {
  stats: RetentionStats;
}

export default function SettingsClientPage({ stats }: SettingsClientPageProps) {
  // Form State
  const [retentionDays, setRetentionDays] = useState<number>(stats.config.retentionDays);
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState<boolean>(stats.config.autoPurgeEnabled);
  const [targetStaff, setTargetStaff] = useState<boolean>(stats.config.targetStaff);
  const [targetStudent, setTargetStudent] = useState<boolean>(stats.config.targetStudent);
  const [targetAcademy, setTargetAcademy] = useState<boolean>(stats.config.targetAcademy);

  // Action State
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Purge Modal State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmInput, setPurgeConfirmInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState("");
  const [lastPurgeSummary, setLastPurgeSummary] = useState<PurgeResult | null>(stats.lastPurgeSummary);

  const totalExpiredNow =
    (targetStudent ? stats.students.expiredCount : 0) +
    (targetStaff ? stats.staff.expiredCount : 0) +
    (targetAcademy ? stats.academies.expiredCount : 0);

  const totalInactiveAll =
    stats.students.totalInactive + stats.staff.totalInactive + stats.academies.totalInactive;

  const durationOptions = [
    {
      days: 30,
      label: "30 Hari",
      approx: "~1 Bulan",
      description: "Pembersihan agresif untuk menghemat kuota basis data dengan cepat.",
      badge: null,
    },
    {
      days: 90,
      label: "90 Hari",
      approx: "~3 Bulan",
      description: "Standar industri SaaS. Memberikan jeda waktu jika bimbel ingin memulihkan akun.",
      badge: "REKOMENDASI",
    },
    {
      days: 180,
      label: "180 Hari",
      approx: "~6 Bulan",
      description: "Menyimpan data nonaktif selama satu semester ajaran sebelum dihapus permanen.",
      badge: null,
    },
    {
      days: 365,
      label: "365 Hari",
      approx: "~1 Tahun",
      description: "Arsip satu tahun ajaran penuh untuk kebutuhan audit atau rekonsiliasi tahunan.",
      badge: null,
    },
  ];

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveFeedback(null);

    const formData = new FormData();
    formData.append("retention_days", String(retentionDays));
    formData.append("auto_purge_enabled", String(autoPurgeEnabled));
    formData.append("target_staff", String(targetStaff));
    formData.append("target_student", String(targetStudent));
    formData.append("target_academy", String(targetAcademy));

    const res = await saveRetentionConfigAction(formData);

    setIsSaving(false);
    if (res.error) {
      setSaveFeedback({ type: "error", text: res.error });
    } else {
      setSaveFeedback({
        type: "success",
        text: res.message || "Kebijakan retensi data berhasil diperbarui.",
      });
      setTimeout(() => setSaveFeedback(null), 5000);
    }
  }

  async function handleExecuteManualPurge() {
    if (purgeConfirmInput.trim().toUpperCase() !== "BERSIHKAN DATA") {
      setPurgeError('Ketik "BERSIHKAN DATA" untuk mengonfirmasi.');
      return;
    }

    setIsPurging(true);
    setPurgeError("");

    const res = await executeManualPurgeAction();

    setIsPurging(false);
    if (res.error) {
      setPurgeError(res.error);
    } else if (res.result) {
      setLastPurgeSummary(res.result);
      setIsPurgeModalOpen(false);
      setPurgeConfirmInput("");
    }
  }

  const formattedCutoff = new Date(stats.cutoffDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedLastPurge = stats.lastPurgeAt
    ? new Date(stats.lastPurgeAt).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Platform Settings & Data Retention
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi kebijakan masa tenggang data nonaktif, jadwal pembersihan permanen (hard delete), dan audit sistem.
          </p>
        </div>

        <button
          onClick={() => {
            setPurgeConfirmInput("");
            setPurgeError("");
            setIsPurgeModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Manual Purge Run</span>
        </button>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Masa Retensi Aktif */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kebijakan Aktif
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                autoPurgeEnabled
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {autoPurgeEnabled ? "Auto-Purge ON" : "Auto-Purge OFF"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {retentionDays}
            </span>
            <span className="text-sm font-medium text-slate-500">Hari</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Cutoff: Sebelum {formattedCutoff}
          </p>
        </div>

        {/* Card 2: Siswa Nonaktif */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Siswa di Trash
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.students.expiredCount}
            </span>
            <span className="text-xs text-slate-500">siap purge</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total nonaktif: <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.students.totalInactive}</span> siswa
          </p>
        </div>

        {/* Card 3: Staf & Tutor Nonaktif */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Staf & Tutor Trash
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.staff.expiredCount}
            </span>
            <span className="text-xs text-slate-500">siap purge</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total nonaktif: <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.staff.totalInactive}</span> staf
          </p>
        </div>

        {/* Card 4: Bimbel / Akademi Nonaktif */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bimbel Nonaktif
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.academies.expiredCount}
            </span>
            <span className="text-xs text-slate-500">siap purge</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total nonaktif: <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.academies.totalInactive}</span> akademi
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Rentang Retensi */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Rentang Waktu Retensi Data Nonaktif (Grace Period)
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Pilih batas lama data nonaktif (soft-deleted) disimpan di basis data sebelum memenuhi syarat untuk dihapus permanen secara otomatis oleh sistem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {durationOptions.map((opt) => {
                const isSelected = retentionDays === opt.days;
                return (
                  <div
                    key={opt.days}
                    onClick={() => setRetentionDays(opt.days)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {opt.badge && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-full shadow-sm">
                        {opt.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {opt.label}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {opt.approx}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className={isSelected ? "font-bold text-blue-600" : "text-slate-400"}>
                        {isSelected ? "Pilihan Aktif" : "Klik untuk Pilih"}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2: Cakupan Target Entitas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cakupan Entitas Target Pembersihan
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Tentukan entitas apa saja yang akan diproses saat hard delete dijalankan (baik via cron otomatis maupun pembersihan manual).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Siswa */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                  targetStudent
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetStudent}
                  onChange={(e) => setTargetStudent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    <span>Akun Siswa</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Siswa nonaktif, data presensi, pendaftaran kelas, asesmen nilai, dan invoice SPP terkait.
                  </p>
                </div>
              </label>

              {/* Target Staf */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                  targetStaff
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetStaff}
                  onChange={(e) => setTargetStaff(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Staf & Tutor</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Akun staf/tutor nonaktif, pelepasan penugasan materi, verifikasi, dan jadwal kelas yang diajar.
                  </p>
                </div>
              </label>

              {/* Target Bimbel / Akademi */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                  targetAcademy
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetAcademy}
                  onChange={(e) => setTargetAcademy(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Akademi / Bimbel</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bimbel nonaktif (cascading hapus seluruh data siswa, program, ruangan, invoice platform, dan tenant).
                  </p>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 3: Otomasi Pembersihan Background (Cron) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Otomasi Pembersihan Berkala (Background Cron Purge)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Jika diaktifkan, endpoint cron <code>/api/cron/purge-deleted-users</code> akan membersihkan data kadaluarsa sesuai kebijakan retensi setiap malam. Jika dinonaktifkan, data nonaktif hanya akan dibersihkan saat Superadmin menekan tombol manual run.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoPurgeEnabled}
                onChange={(e) => setAutoPurgeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Feedback Message */}
          {saveFeedback && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                saveFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              {saveFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              )}
              <span>{saveFeedback.text}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition shadow-sm flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Simpan Pengaturan Retensi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Manual Purge & Audit Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Manual Purge Action Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tindakan Pembersihan Langsung (Manual Run)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Superadmin dapat menjalankan pembersihan database seketika tanpa menunggu jadwal cron harian. Sistem akan menghapus seluruh data yang telah melampaui batas cutoff <strong>{retentionDays} hari</strong> secara permanen.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Batas Cutoff Tanggal Nonaktif:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formattedCutoff}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Total Data Memenuhi Syarat Hard Delete:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{totalExpiredNow} Entitas</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Rincian:</span>
                <span>
                  {targetStudent ? `${stats.students.expiredCount} Siswa` : "Siswa (diabaikan)"} •{" "}
                  {targetStaff ? `${stats.staff.expiredCount} Staf` : "Staf (diabaikan)"} •{" "}
                  {targetAcademy ? `${stats.academies.expiredCount} Bimbel` : "Bimbel (diabaikan)"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setPurgeConfirmInput("");
              setPurgeError("");
              setIsPurgeModalOpen(true);
            }}
            disabled={totalExpiredNow === 0}
            className="w-full mt-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {totalExpiredNow === 0
                ? "Tidak Ada Data Kadaluarsa Saat Ini"
                : `Hapus Permanen ${totalExpiredNow} Data Kadaluarsa`}
            </span>
          </button>
        </div>

        {/* Card: Riwayat Eksekusi Pembersihan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Riwayat Pembersihan Terakhir
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Catatan hasil eksekusi pembersihan sistem permanen terakhir yang dicatat dalam log konfigurasi platform.
            </p>

            {lastPurgeSummary ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Waktu Eksekusi:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formattedLastPurge || "Baru saja"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Kebijakan Retensi Saat Run:</span>
                    <span className="font-semibold">{lastPurgeSummary.retentionDays} Hari</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        lastPurgeSummary.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {lastPurgeSummary.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 space-y-1">
                    <p>• Siswa dihapus permanen: <strong className="text-slate-800 dark:text-slate-200">{lastPurgeSummary.purgedStudentCount}</strong></p>
                    <p>• Staf/Tutor dihapus permanen: <strong className="text-slate-800 dark:text-slate-200">{lastPurgeSummary.purgedStaffCount}</strong></p>
                    <p>• Akademi/Bimbel dihapus permanen: <strong className="text-slate-800 dark:text-slate-200">{lastPurgeSummary.purgedAcademyCount}</strong></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Belum ada catatan pembersihan yang pernah dijalankan sebelumnya.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Seluruh aksi pembersihan tercatat dalam jejak Audit Logs platform.</span>
          </div>
        </div>

      </div>

      {/* Modal Konfirmasi Manual Purge */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Pembersihan Data Permanen (Hard Delete)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 text-center leading-relaxed">
                Tindakan ini akan <strong>menghapus secara fisik</strong> data yang telah dinonaktifkan lebih dari{" "}
                <strong>{retentionDays} hari</strong> (sebelum {formattedCutoff}). Data yang terhapus <strong>TIDAK DAPAT DIKEMBALIKAN</strong>.
              </p>

              {/* Data Summary Box */}
              <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 mb-5 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <p className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px] mb-1">
                  Rincian Data yang Akan Dihapus:
                </p>
                <div className="flex justify-between">
                  <span>Siswa Kadaluarsa:</span>
                  <span className="font-bold">{targetStudent ? `${stats.students.expiredCount} akun` : "Diabaikan (Filter Off)"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Staf & Tutor Kadaluarsa:</span>
                  <span className="font-bold">{targetStaff ? `${stats.staff.expiredCount} akun` : "Diabaikan (Filter Off)"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bimbel / Akademi Kadaluarsa:</span>
                  <span className="font-bold">{targetAcademy ? `${stats.academies.expiredCount} tenant` : "Diabaikan (Filter Off)"}</span>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="mb-5 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Ketik <strong className="text-rose-600 font-mono">BERSIHKAN DATA</strong> di bawah ini untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={purgeConfirmInput}
                  onChange={(e) => setPurgeConfirmInput(e.target.value)}
                  placeholder="BERSIHKAN DATA"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition text-slate-900 dark:text-white text-sm uppercase tracking-wide font-mono"
                />
                {purgeError && <p className="text-xs text-rose-500 font-medium">{purgeError}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  disabled={isPurging}
                  className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteManualPurge}
                  disabled={isPurging || purgeConfirmInput.trim().toUpperCase() !== "BERSIHKAN DATA"}
                  className="w-1/2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {isPurging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Permanen</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

