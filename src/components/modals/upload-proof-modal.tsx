"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { uploadPlatformInvoiceProofAction } from "@/app/[tenantSlug]/dashboard/subscription/actions";
import { toast } from "@/components/ui/sonner";

interface UploadProofModalProps {
  tenantSlug: string;
  invoiceId: string;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
  isOpenControlled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Client-side image compression to ensure fast, reliable upload without payload issues
async function compressImage(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function UploadProofModal({
  tenantSlug,
  invoiceId,
  onSuccess,
  triggerButton,
  isOpenControlled,
  onOpenChange,
}: UploadProofModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isModalOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setModalOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 15 * 1024 * 1024) {
        setError("Ukuran file maksimal 15MB.");
        return;
      }

      setError(null);
      setIsCompressing(true);

      try {
        const compressedBase64 = await compressImage(selectedFile, 1280, 1280, 0.82);
        setPreview(compressedBase64);
      } catch (err) {
        console.error("Gagal memproses gambar:", err);
        setError("Gagal membaca file gambar. Silakan coba file lain.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!preview) {
      setError("Pilih file terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await uploadPlatformInvoiceProofAction(tenantSlug, invoiceId, preview);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Bukti pembayaran berhasil diunggah. Menunggu verifikasi tim BimbelSync.");
        setModalOpen(false);
        setPreview(null);
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengunggah.");
      toast.error("Gagal mengunggah bukti pembayaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {triggerButton !== undefined ? (
        <div onClick={() => setModalOpen(true)} className="cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors"
        >
          <Upload size={14} /> Upload Bukti
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Bukti Pembayaran</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah foto struk transfer ATM, mobile banking, atau bukti pembayaran Anda. Format JPG/PNG.
              </p>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-xs font-medium border border-red-200 dark:border-red-800/50">
                  {error}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors min-h-[220px]">
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mengoptimalkan gambar...</p>
                  </div>
                ) : preview ? (
                  <div className="relative w-full">
                    <img
                      src={preview}
                      alt="Preview Bukti Transfer"
                      className="w-full h-auto max-h-[260px] object-contain rounded-xl mx-auto shadow-sm"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors shadow-md"
                      title="Hapus / Ganti gambar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Klik untuk memilih foto / struk
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maksimal 15MB (JPG, JPEG, PNG)
                    </p>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleFileChange}
                  disabled={isLoading || isCompressing || !!preview}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading || isCompressing || !preview}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isLoading ? "Mengunggah..." : "Kirim Bukti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
