"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Download, CheckCircle2, Clock, Loader2 } from "lucide-react";

interface ViewProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  isLoading?: boolean;
  invoiceTitle?: string;
  invoicePeriod?: string;
  invoiceAmount?: string;
  academyName?: string;
  isPaid?: boolean;
  onVerify?: () => void;
  isVerifying?: boolean;
  onReupload?: () => void;
}

export function ViewProofModal({
  isOpen,
  onClose,
  imageUrl,
  isLoading = false,
  invoiceTitle,
  invoicePeriod,
  invoiceAmount,
  academyName,
  isPaid,
  onVerify,
  isVerifying,
  onReupload,
}: ViewProofModalProps) {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const openInNewTab = () => {
    if (!imageUrl) return;
    try {
      if (imageUrl.startsWith("data:")) {
        const parts = imageUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        window.open(imageUrl, "_blank");
      }
    } catch (e) {
      window.open(imageUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    try {
      const link = document.createElement("a");
      if (imageUrl.startsWith("data:")) {
        const parts = imageUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        link.href = URL.createObjectURL(blob);
      } else {
        link.href = imageUrl;
      }
      link.download = `bukti-bayar-${invoiceTitle || "tagihan"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Gagal mendownload gambar:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bukti Pembayaran
              </h2>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={12} /> Lunas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <Clock size={12} /> Menunggu Verifikasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {academyName ? `${academyName} • ` : ""}
              {invoiceTitle ? `${invoiceTitle}` : ""}
              {invoicePeriod ? ` • Periode ${invoicePeriod}` : ""}
              {invoiceAmount ? ` • ${invoiceAmount}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!isLoading && imageUrl && (
              <>
                <button
                  onClick={handleZoomOut}
                  title="Perkecil"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset Ukuran"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleZoomIn}
                  title="Perbesar"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  onClick={openInNewTab}
                  title="Buka Tab Baru"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  title="Unduh File"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <Download size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              title="Tutup"
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 flex-1 overflow-auto flex items-center justify-center min-h-[350px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-semibold">Memuat bukti pembayaran...</p>
              <p className="text-xs text-slate-400 mt-1">Mengambil dokumen transfer terverifikasi</p>
            </div>
          ) : imageUrl ? (
            <div
              className="transition-transform duration-150 origin-center max-w-full"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={imageUrl}
                alt="Bukti Transfer"
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">Bukti pembayaran tidak ditemukan.</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {!isLoading && imageUrl && zoom !== 1
              ? `Zoom: ${Math.round(zoom * 100)}%`
              : "Klik tombol zoom atau buka di tab baru untuk tampilan penuh"}
          </div>

          <div className="flex items-center gap-2">
            {onReupload && !isPaid && !isLoading && (
              <button
                onClick={() => {
                  onClose();
                  onReupload();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Unggah Ulang Bukti
              </button>
            )}

            {onVerify && !isPaid && !isLoading && (
              <button
                onClick={onVerify}
                disabled={isVerifying}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {isVerifying ? "Memverifikasi..." : "Verifikasi & Tandai Lunas"}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
