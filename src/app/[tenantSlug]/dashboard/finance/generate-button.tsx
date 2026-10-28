"use client";

import { useState } from "react";
import { Zap, Loader2, Mail, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GenerateInvoicesButtonProps {
  academyId: string;
  isSmtpActive?: boolean;
  tenantSlug?: string;
}

export function GenerateInvoicesButton({ 
  academyId, 
  isSmtpActive = false,
  tenantSlug = "" 
}: GenerateInvoicesButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(isSmtpActive);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleExecute = async () => {
    setIsLoading(true);
    toast.info("Menganalisis data siswa dan memproses penerbitan tagihan...");
    
    try {
      const res = await fetch("/api/cron/generate-invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          academy_id: academyId,
          send_email: sendEmail && isSmtpActive,
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses penerbitan tagihan.");
      }
      
      toast.success(data.message || "Berhasil menerbitkan tagihan bulan ini.");
      setModalOpen(false);
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem saat memproses.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none bg-amber-500 hover:bg-amber-600 text-white h-10 py-2 px-4 shadow-sm shadow-amber-500/20 cursor-pointer"
      >
        <Zap className="mr-2 h-4 w-4 fill-white" />
        Generate Tagihan Bulan Ini
      </button>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/40">
                  <Zap size={20} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Terbitkan Tagihan SPP Bulan Ini
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Automasi faktur pembayaran untuk seluruh pendaftaran aktif.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isLoading && setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5">
              <p>
                Sistem akan memindai seluruh siswa dengan pendaftaran program aktif yang belum memiliki tagihan pada bulan berjalan.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                • Siswa yang sudah memiliki tagihan bulan ini akan dilewati secara otomatis (mencegah tagihan ganda).
              </p>
            </div>

            {/* Email Automation Option */}
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <label htmlFor="send_email_toggle" className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                    Kirim Email Tagihan Otomatis
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    {isSmtpActive ? (
                      "Kirimkan notifikasi invoice langsung ke inbox siswa yang memiliki email terdaftar."
                    ) : (
                      <span>
                        Layanan SMTP bimbel belum aktif. Tagihan akan dibuat tanpa pengiriman email.{" "}
                        {tenantSlug && (
                          <Link href={`/${tenantSlug}/dashboard/settings/email`} className="text-blue-600 underline font-semibold">
                            Aktifkan di sini
                          </Link>
                        )}
                      </span>
                    )}
                  </p>
                </div>

                <input
                  id="send_email_toggle"
                  type="checkbox"
                  disabled={!isSmtpActive || isLoading}
                  checked={sendEmail && isSmtpActive}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-40 cursor-pointer"
                />
              </div>

              {isSmtpActive && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-blue-100 dark:border-blue-900/30">
                  <CheckCircle2 size={12} />
                  <span>Layanan SMTP aktif. Email akan dikirimkan dengan jeda aman anti-spam.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleExecute}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 transition shadow-sm shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-white" />
                    Terbitkan Tagihan Sekarang
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
