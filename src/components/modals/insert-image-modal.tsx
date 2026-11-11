"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";
import { compressImageToWebP, CompressionResult } from "@/lib/image-compression";
import { toast } from "@/components/ui/sonner";

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (imageMarkdown: string) => void;
}

export function InsertImageModal({
  isOpen,
  onClose,
  onInsertImage,
}: InsertImageModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [caption, setCaption] = useState("Diagram Soal");
  const [imageUrl, setImageUrl] = useState("");

  // Upload & Compression State
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCaption("Diagram Soal");
      setImageUrl("");
      setCompressedDataUrl(null);
      setCompressionStats(null);
      setIsCompressing(false);
      setActiveTab("upload");
    }
  }, [isOpen]);

  // Listener untuk Paste (Ctrl + V) langsung dari clipboard (misal Snipping Tool)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await processImageFile(file);
            toast.success("Gambar berhasil ditempel dari clipboard!");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (PNG, JPG, JPEG, WEBP).");
      return;
    }

    try {
      setIsCompressing(true);
      // Kompresi client-side ke format WebP proporsional (maks 800x600, kualitas 85%)
      const result = await compressImageToWebP(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.85,
      });

      setCompressedDataUrl(result.dataUrl);
      setCompressionStats(result);
    } catch (err: any) {
      console.error("Compression error:", err);
      toast.error(err.message || "Gagal memproses gambar.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handleClearImage = () => {
    setCompressedDataUrl(null);
    setCompressionStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCaption = caption.trim() || "Diagram Soal";

    if (activeTab === "upload") {
      if (!compressedDataUrl) {
        toast.error("Silakan pilih atau paste gambar terlebih dahulu!");
        return;
      }
      onInsertImage(`![${finalCaption}](${compressedDataUrl})`);
      toast.success("Gambar berhasil disisipkan ke soal!");
      onClose();
    } else {
      if (!imageUrl.trim()) {
        toast.error("Silakan masukkan URL tautan gambar!");
        return;
      }
      if (!/^https?:\/\//i.test(imageUrl.trim())) {
        toast.error("URL gambar harus diawali dengan http:// atau https://");
        return;
      }
      onInsertImage(`![${finalCaption}](${imageUrl.trim()})`);
      toast.success("Gambar berhasil disisipkan ke soal!");
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shadow-xs">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Sisipkan Gambar / Diagram Soal
              </h3>
              <p className="text-xs text-slate-500">
                Cocok untuk grafik fungsi, geometri, tabel, atau potongan wacana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === "upload"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Upload size={14} />
              <span>Upload / Paste (Ctrl+V)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === "url"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LinkIcon size={14} />
              <span>Tautan URL Web</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* TAB 1: UPLOAD / PASTE SCREENSHOT */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!compressedDataUrl ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/30 group"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {isCompressing ? (
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                    ) : (
                      <Upload size={24} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isCompressing
                      ? "Mengompresi Gambar..."
                      : "Klik untuk Pilih File atau Tarik Gambar ke Sini"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bisa juga langsung tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono font-semibold text-slate-800 dark:text-slate-200 text-[10px]">Ctrl + V</kbd> untuk menempel hasil screenshot Snipping Tool.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <Sparkles size={13} />
                    Otomatis dikompresi ke WebP hemat kuota siswa
                  </div>
                </div>
              ) : (
                /* Preview State */
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 flex items-center justify-center max-h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={compressedDataUrl}
                      alt="Pratinjau Soal"
                      className="max-h-52 object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition"
                      title="Hapus dan pilih gambar lain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {compressionStats && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Kompresi Sukses: {formatFileSize(compressionStats.compressedSize)} (WebP)</span>
                      </div>
                      <span className="font-bold text-[11px]">
                        Hemat {compressionStats.reductionPercentage}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: URL LINK */}
          {activeTab === "url" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tautan / Link Gambar (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://contoh.com/gambar-grafik.png"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 p-2 max-h-48 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Pratinjau"
                    className="max-h-44 object-contain rounded-xl"
                    onError={() => toast.error("Gambar tidak dapat dimuat dari URL ini.")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption / Keterangan Gambar */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keterangan Gambar / Teks Alternatif (Alt)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Contoh: Grafik Fungsi Kuadrat / Gambar Balok ABCD.EFGH"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs sm:text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompressing || (activeTab === "upload" && !compressedDataUrl) || (activeTab === "url" && !imageUrl)}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <ImageIcon size={14} />
              <span>Sisipkan ke Soal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

