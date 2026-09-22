"use client";

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadPlatformInvoiceProofAction } from "@/app/[tenantSlug]/dashboard/subscription/actions";

interface UploadProofModalProps {
  tenantSlug: string;
  invoiceId: string;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function UploadProofModal({ tenantSlug, invoiceId, onSuccess, triggerButton }: UploadProofModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB.");
        return;
      }
      setFile(selectedFile);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
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
      } else {
        setIsOpen(false);
        setFile(null);
        setPreview(null);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {triggerButton || (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
            <Upload size={14} /> Upload Bukti
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Bukti Pembayaran</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Silakan unggah foto struk transfer atau screenshot bukti pembayaran mobile banking.
              </p>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800/50">
                  {error}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {preview ? (
                  <div className="relative w-full">
                    <img src={preview} alt="Preview" className="w-full h-auto max-h-[300px] object-contain rounded-lg" />
                    <button 
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-slate-900/70 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={48} className="text-slate-400 dark:text-slate-500 mb-3" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Klik untuk memilih gambar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">PNG, JPG, JPEG (Maks. 5MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  disabled={isLoading || !!preview}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={isLoading || !preview}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isLoading ? "Mengunggah..." : "Unggah Bukti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
