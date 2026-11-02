"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { 
  Building2, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  Zap, 
  Info 
} from "lucide-react";
import { compressImageToWebP, type CompressionResult } from "@/lib/image-compression";
import { updateAcademyBrandingAction } from "./actions";

interface AcademyData {
  id: string;
  name: string;
  path_url: string;
  logo_url: string | null;
  phone: string | null;
}

export default function BrandingClientPage({
  academy,
  tenantSlug,
}: {
  academy: AcademyData;
  tenantSlug: string;
}) {
  const [name, setName] = useState(academy.name || "");
  const [phone, setPhone] = useState(academy.phone || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(academy.logo_url);
  const [pendingLogoData, setPendingLogoData] = useState<string | null>(null);
  const [shouldRemoveLogo, setShouldRemoveLogo] = useState(false);

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Hanya file gambar (PNG, JPG, JPEG, WEBP) yang diizinkan.",
      });
      return;
    }

    try {
      setIsCompressing(true);
      setStatusMessage({ type: "", text: "" });

      // Kompresi otomatis di sisi browser ke WebP proporsional maks 400x400
      const result = await compressImageToWebP(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });

      setPendingLogoData(result.dataUrl);
      setLogoPreview(result.dataUrl);
      setShouldRemoveLogo(false);
      setCompressionStats(result);
    } catch (err) {
      console.error("Kompresi logo gagal:", err);
      setStatusMessage({
        type: "error",
        text: "Gagal memproses gambar. Silakan coba gunakan format PNG atau JPG lain.",
      });
    } finally {
      setIsCompressing(false);
      // Reset input agar bisa memilih file yang sama lagi jika perlu
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setPendingLogoData(null);
    setShouldRemoveLogo(true);
    setCompressionStats(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Nama bimbel tidak boleh kosong." });
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage({ type: "", text: "" });

      const res = await updateAcademyBrandingAction(tenantSlug, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        logoDataUrl: pendingLogoData,
        removeLogo: shouldRemoveLogo,
      });

      if (res.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({
          type: "success",
          text: "Identitas dan logo bimbel berhasil diperbarui! Tampilan login & header telah disinkronkan.",
        });
        setPendingLogoData(null);
        setShouldRemoveLogo(false);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: "Terjadi kesalahan koneksi saat menyimpan perubahan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fallback inisial untuk nama bimbel jika tidak ada logo
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "BS";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Kolom Form Pengaturan */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Informasi & Logo Resmi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data ini akan menjadi ciri khas portal bimbel Anda.
              </p>
            </div>
          </div>

          {statusMessage.text && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-medium animate-fadeIn ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Logo Bimbel Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Logo Bimbel
            </label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              {/* Logo Box Preview */}
              <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden shadow-sm shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Building2 size={28} />
                    <span className="text-[10px] mt-1 font-bold">{initials}</span>
                  </div>
                )}

                {isCompressing && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              {/* Upload Actions & Guidelines */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing || isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    <Upload size={14} />
                    Pilih Gambar Logo
                  </button>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isCompressing || isSaving}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900/50 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  )}
                </div>

                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Format gambar: <strong className="text-slate-700 dark:text-slate-300">PNG, JPG, atau WEBP</strong> (disarankan latar transparan). Ukuran file asli bebas, sistem otomatis mengompresi secara cerdas menjadi ~20 KB.
                </p>

                {/* Compression Info Badge */}
                {compressionStats && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    <Zap size={14} className="text-emerald-600" />
                    <span>
                      Ukuran asli: <strong>{formatBytes(compressionStats.originalSize)}</strong> → Terkompresi: <strong>{formatBytes(compressionStats.compressedSize)}</strong> (Hemat {compressionStats.reductionPercentage}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nama Bimbel */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Nama Resmi Bimbel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition"
              placeholder="Contoh: Bimbel Prestasi Teladan"
            />
            <p className="text-xs text-slate-500 mt-1">
              Nama ini akan tampil di seluruh portal, kwitansi invoice siswa, dan halaman login.
            </p>
          </div>

          {/* Nomor Kontak / WhatsApp */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Nomor WhatsApp / Telepon Bimbel
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition"
              placeholder="Contoh: 081234567890"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isCompressing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Simpan Perubahan Identitas
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Kolom Kanan: Live Preview Visual */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
            <Eye size={18} className="text-blue-600" />
            <span>Simulasi Tampilan Langsung (Live Preview)</span>
          </div>

          {/* Preview 1: Di Halaman Login */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1. Preview Header Halaman Login (Desktop / Mobile)
            </span>
            <div className="p-5 rounded-2xl bg-[#0F172A] text-white space-y-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white leading-tight">
                    {name || "Nama Bimbel"}
                  </h4>
                  <p className="text-[10px] text-blue-300 font-medium">
                    Portal Siswa & Pengajar
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>URL: /{tenantSlug}/login</span>
                <span className="text-slate-500">Powered by BimbelSync</span>
              </div>
            </div>
          </div>

          {/* Preview 2: Di Sidebar Dashboard */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2. Preview Sidebar Navigasi Dashboard
            </span>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {name || "Nama Bimbel"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sistem Terverifikasi
                </p>
              </div>
            </div>
          </div>

          {/* Benefit Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
              <ShieldCheck size={16} />
              <span>Keunggulan Auto-Kompresi</span>
            </div>
            <p className="leading-relaxed text-[11.5px] text-slate-600 dark:text-slate-400">
              Logo disimpan dalam format WebP resolusi tajam dengan berat hanya ~20 KB. Halaman login Anda akan termuat secara instan tanpa ada waktu tunggu (0 ms lag).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

