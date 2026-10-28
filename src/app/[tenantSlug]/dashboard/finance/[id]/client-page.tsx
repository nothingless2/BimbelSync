"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Student, Installment, Staff } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Banknote, RefreshCcw, Loader2, Calendar,
  PieChart, CheckCircle, Mail, Send
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";
import { verifyPaymentAction, verifyInstallmentAction, sendInvoiceEmailAction } from "../actions";
import { SplitInstallmentModal } from "@/components/modals/split-installment-modal";

type InvoiceWithDetails = Invoice & {
  student: Student;
  items: InvoiceItem[];
  installments: (Installment & { verified_by?: Staff | null })[];
  verified_by: Staff | null;
};

export default function FinanceDetailClient({
  invoice,
  tenantSlug,
  canSplitInstallments,
  maxTerms,
  emailInfo,
}: {
  invoice: InvoiceWithDetails;
  tenantSlug: string;
  canSplitInstallments: boolean;
  maxTerms?: number | null;
  emailInfo?: { allowed: boolean; configured: boolean; active: boolean };
}) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [verifyingInstallmentId, setVerifyingInstallmentId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Verifikasi pelunasan seluruh invoice sekaligus
  const handleVerify = async (method: "CASH" | "MANUAL_TRANSFER") => {
    const methodLabel = method === 'CASH' ? 'Tunai' : 'Transfer Manual';
    if (!confirm(`Konfirmasi pelunasan seluruh tagihan ini via ${methodLabel}?`)) return;
    
    setIsVerifying(true);
    const result = await verifyPaymentAction(invoice.id, method);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tagihan berhasil diverifikasi (Lunas).");
      router.refresh();
    }
    setIsVerifying(false);
  };

  // Verifikasi pelunasan per termin cicilan
  const handleVerifyInstallment = async (installmentId: string, termNumber: number, method: "CASH" | "MANUAL_TRANSFER") => {
    const methodLabel = method === 'CASH' ? 'Tunai' : 'Transfer Manual';
    if (!confirm(`Tandai LUNAS Termin ${termNumber} via ${methodLabel}?`)) return;

    setVerifyingInstallmentId(installmentId);
    const result = await verifyInstallmentAction(installmentId, method);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message || `Termin ${termNumber} berhasil ditandai Lunas.`);
      router.refresh();
    }
    setVerifyingInstallmentId(null);
  };

  // Kirim notifikasi email tagihan ke siswa/wali
  const handleSendEmail = async () => {
    if (!invoice.student.email) {
      toast.error("Siswa ini belum memiliki alamat email yang terdaftar di sistem.");
      return;
    }

    if (!confirm(`Kirim notifikasi email tagihan ke ${invoice.student.email}?`)) return;

    setIsSendingEmail(true);
    const res = await sendInvoiceEmailAction(invoice.id);
    setIsSendingEmail(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Notifikasi tagihan berhasil dikirim ke email siswa.");
    }
  };

  // Kalkulasi statistik cicilan
  const isInstallment = invoice.payment_option === 'INSTALLMENT';
  const totalPaidInstallments = isInstallment 
    ? invoice.installments.filter(i => i.status === 'PAID').reduce((sum, curr) => sum + curr.amount, 0)
    : 0;
  const remainingInstallmentDebt = Math.max(0, invoice.total_amount - totalPaidInstallments);
  const paidTermsCount = isInstallment ? invoice.installments.filter(i => i.status === 'PAID').length : 0;
  const totalTermsCount = isInstallment ? invoice.installments.length : 0;
  const progressPercentage = invoice.total_amount > 0 ? Math.round((totalPaidInstallments / invoice.total_amount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push(`/${tenantSlug}/dashboard/finance`)}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
          title="Kembali ke Daftar Tagihan"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Detail Tagihan</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isInstallment 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
            }`}>
              {isInstallment ? 'CICILAN (TERMIN)' : 'LUNAS PENUH'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">INV-{invoice.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Rincian & Siswa */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Informasi Siswa</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Nama Lengkap</p>
                <p className="font-medium text-slate-900 dark:text-white">{invoice.student.full_name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Username / ID</p>
                <p className="font-medium text-slate-900 dark:text-white">@{invoice.student.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Rincian Tagihan</h3>
            
            <div className="space-y-3 mb-6">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Total Keseluruhan</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatRupiah(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Tabel Cicilan jika payment_option === INSTALLMENT */}
          {isInstallment && invoice.installments.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Jadwal Cicilan & Verifikasi Termin</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Admin dapat menandai lunas masing-masing termin saat siswa membayar.</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  {paidTermsCount}/{totalTermsCount} Lunas
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.installments.map((inst) => {
                  const isPaid = inst.status === 'PAID';
                  const isProcessing = verifyingInstallmentId === inst.id;

                  return (
                    <div key={inst.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Termin {inst.installment_number}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                              isPaid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' :
                              inst.status === 'OVERDUE' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/40' :
                              'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                            }`}>
                              {isPaid ? 'LUNAS' : inst.status === 'OVERDUE' ? 'JATUH TEMPO' : 'BELUM BAYAR'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Calendar size={13} className="text-slate-400" />
                            <span>Jatuh tempo: {format(new Date(inst.due_date), 'd MMMM yyyy', { locale: localeId })}</span>
                          </div>

                          {isPaid && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex flex-wrap items-center gap-2">
                              <span>Lunas: {inst.paid_at ? format(new Date(inst.paid_at), 'd MMM yyyy, HH:mm', { locale: localeId }) : '-'}</span>
                              {inst.payment_method && (
                                <span className="bg-emerald-100/60 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-medium">
                                  via {inst.payment_method}
                                </span>
                              )}
                              {inst.verified_by?.name && (
                                <span>• Oleh: {inst.verified_by.name}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                          <p className="text-base font-bold text-slate-900 dark:text-white">{formatRupiah(inst.amount)}</p>

                          {!isPaid && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "CASH")}
                                disabled={isProcessing || isVerifying}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 shadow-xs"
                                title="Tandai Lunas via Pembayaran Tunai"
                              >
                                {isProcessing ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Banknote size={12} />
                                )}
                                Tunai
                              </button>
                              <button
                                onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "MANUAL_TRANSFER")}
                                disabled={isProcessing || isVerifying}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 shadow-xs"
                                title="Tandai Lunas via Transfer Bank"
                              >
                                {isProcessing ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CreditCard size={12} />
                                )}
                                Transfer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Kolom Kanan: Status & Panel Aksi */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center shadow-sm">
            
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              invoice.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
              invoice.payment_status === 'OVERDUE' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
              'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
            }`}>
              {invoice.payment_status === 'PAID' ? <CheckCircle2 size={24} /> :
               invoice.payment_status === 'OVERDUE' ? <AlertCircle size={24} /> :
               <Clock size={24} />}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{invoice.payment_status}</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Status Tagihan Induk</p>

            {invoice.payment_status === 'PAID' && invoice.verified_by && (
              <div className="mt-5 w-full pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-left grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 mb-1">Diverifikasi Oleh</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{invoice.verified_by.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Metode</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{invoice.payment_method}</p>
                </div>
              </div>
            )}
          </div>

          {/* Kartu Ringkasan Progres Cicilan (Hanya jika tipe cicilan) */}
          {isInstallment && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <PieChart size={18} className="text-blue-600 dark:text-blue-400" />
                <h4>Ringkasan Pelunasan Cicilan</h4>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Progres Pembayaran</span>
                  <span className="text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 mb-1">Sudah Dibayar</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalPaidInstallments)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 mb-1">Sisa Piutang</p>
                  <p className="font-bold text-slate-900 dark:text-white">{formatRupiah(remainingInstallmentDebt)}</p>
                </div>
              </div>

              {/* Opsi Lunasi Sekaligus Semua Termin */}
              {invoice.payment_status !== 'PAID' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Opsi: Lunasi Semua Termin Sekaligus
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVerify("CASH")}
                      disabled={isVerifying}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                      Tunai (Semua)
                    </button>
                    <button
                      onClick={() => handleVerify("MANUAL_TRANSFER")}
                      disabled={isVerifying}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                      Transfer (Semua)
                    </button>
                  </div>
                </div>
              )}

              {/* Tombol Atur Ulang Cicilan (hanya jika belum ada yang dibayar) */}
              {totalPaidInstallments === 0 && canSplitInstallments && (
                <button
                  onClick={() => setIsSplitModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                >
                  <RefreshCcw size={14} />
                  Atur Ulang Termin Cicilan
                </button>
              )}
            </div>
          )}

          {/* Aksi Manual untuk Tagihan Pembayaran Penuh (FULL) */}
          {invoice.payment_status !== 'PAID' && invoice.payment_option === 'FULL' && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Aksi Manual</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleVerify("CASH")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                  Tandai Lunas (Tunai)
                </button>
                <button
                  onClick={() => handleVerify("MANUAL_TRANSFER")}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  Tandai Lunas (Transfer)
                </button>
                
                {canSplitInstallments && (
                  <>
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                      <div className="relative flex justify-center text-[11px]"><span className="bg-white dark:bg-[#111827] px-2 text-slate-400">Atau</span></div>
                    </div>
                    <button
                      onClick={() => setIsSplitModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm rounded-lg transition-colors shadow-xs"
                    >
                      <RefreshCcw size={16} />
                      Ubah ke Cicilan (Termin)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {canSplitInstallments === false && invoice.payment_status !== 'PAID' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-800/30">
              Paket langganan Anda saat ini tidak mendukung fitur <strong>Cicilan Bertahap</strong>. Silakan upgrade paket Anda untuk menikmati fitur ini.
            </div>
          )}

          {/* Card Notifikasi Email Siswa (Khusus paket dengan fitur automated_email) */}
          {emailInfo?.allowed && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Mail size={18} className="text-blue-600 dark:text-blue-400" />
                <h4>Notifikasi Email Siswa</h4>
              </div>

              {emailInfo.active ? (
                <>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <p className="text-slate-500">Penerima Notifikasi:</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {invoice.student.email || "(Email siswa belum diset)"}
                    </p>
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !invoice.student.email}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isSendingEmail ? "Mengirimkan Email..." : "Kirim Tagihan via Email"}
                  </button>
                </>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                  <p>Layanan SMTP bimbel belum aktif.</p>
                  <Link
                    href={`/${tenantSlug}/dashboard/settings/email`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Konfigurasi SMTP Sekarang &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {isSplitModalOpen && (
        <SplitInstallmentModal 
          invoice={invoice} 
          isOpen={isSplitModalOpen} 
          onClose={() => setIsSplitModalOpen(false)} 
          maxTerms={maxTerms}
        />
      )}

    </div>
  );
}

