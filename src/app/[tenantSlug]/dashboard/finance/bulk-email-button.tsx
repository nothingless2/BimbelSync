"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, X, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendBulkInvoiceEmailsAction } from "./actions";

interface BulkEmailInvoicesButtonProps {
  unpaidCount: number;
  isSmtpActive: boolean;
  tenantSlug: string;
}

export function BulkEmailInvoicesButton({
  unpaidCount,
  isSmtpActive,
  tenantSlug,
}: BulkEmailInvoicesButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    setIsSending(true);
    toast.info("Memulai pengiriman email tagihan massal...");

    try {
      const res = await sendBulkInvoiceEmailsAction();

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Email tagihan massal berhasil dikirim.");
        setModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem saat mengirimkan email massal.");
    } finally {
      setIsSending(false);
    }
  };

  if (unpaidCount === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <Mail size={15} className="text-blue-600 dark:text-blue-400" />
        <span>Kirim Email Massal</span>
        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
          {unpaidCount}
        </span>
      </button>

      {/* Bulk Email Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/40">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Kirim Email Tagihan Massal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kirimkan rincian tagihan serentak ke siswa yang belum lunas.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSending && setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Stats */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Sasaran Tagihan Belum Lunas:</span>
                <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  {unpaidCount} Siswa
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistem akan menyusun faktur dan rekening pembayaran bimbel, lalu mengirimkannya satu per satu dengan jeda aman anti-spam ke seluruh siswa yang memiliki email terdaftar.
              </p>
            </div>

            {/* SMTP Status Check */}
            {isSmtpActive ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Layanan email SMTP aktif dan siap melakukan pengiriman massal.</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Layanan SMTP Belum Aktif</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Untuk mengirimkan email tagihan, aktifkan server SMTP bimbel Anda terlebih dahulu di menu{" "}
                  <Link href={`/${tenantSlug}/dashboard/settings/email`} className="text-blue-600 underline font-semibold">
                    Pengaturan Email
                  </Link>.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSending}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSending || !isSmtpActive}
                onClick={handleSend}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Mengirimkan Email...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kirimkan Sekarang
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
