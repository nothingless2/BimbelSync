"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Student, Installment, Staff } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Banknote, RefreshCcw, Loader2, Calendar,
  Mail, Send, Copy, Check, MessageSquare, ExternalLink, Lock
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
  const [copied, setCopied] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const invoiceNumber = `INV-${invoice.id.split('-')[0].toUpperCase()}`;

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    toast.success("Nomor tagihan disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Verifikasi pelunasan seluruh invoice sekaligus
  const handleVerify = async (method: "CASH" | "MANUAL_TRANSFER") => {
    const methodLabel = method === 'CASH' ? 'Tunai' : 'Transfer Manual';
    if (!confirm(`Konfirmasi pelunasan tagihan ${invoiceNumber} via ${methodLabel}?`)) return;
    
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
      toast.error("Siswa ini belum memiliki alamat email yang terdaftar.");
      return;
    }

    if (!confirm(`Kirim notifikasi rincian tagihan ke ${invoice.student.email}?`)) return;

    setIsSendingEmail(true);
    const res = await sendInvoiceEmailAction(invoice.id);
    setIsSendingEmail(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Email rincian tagihan berhasil dikirim.");
    }
  };

  // Kirim pengingat tagihan via WhatsApp
  const handleOpenWhatsApp = () => {
    if (!invoice.student.parent_whatsapp) return;
    let phone = invoice.student.parent_whatsapp.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    
    const message = `Halo Bpk/Ibu wali dari ${invoice.student.full_name},\n\nKami menginformasikan tagihan bimbingan belajar dengan rincian berikut:\n- No. Tagihan: ${invoiceNumber}\n- Total: ${formatRupiah(invoice.total_amount)}\n- Status: ${invoice.payment_status === 'PAID' ? 'LUNAS' : 'Belum Lunas'}\n\nTerima kasih atas kerja samanya.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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

  const isPaid = invoice.payment_status === 'PAID';
  const isOverdue = invoice.payment_status === 'OVERDUE';

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/${tenantSlug}/dashboard/finance`)}
            className="p-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer text-slate-600 dark:text-slate-300"
            title="Kembali ke Daftar Tagihan"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Detail Tagihan</h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                isInstallment 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}>
                {isInstallment ? `Skema Cicilan (${totalTermsCount} Termin)` : 'Sekali Bayar'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">{invoiceNumber}</span>
              <button
                onClick={handleCopyInvoiceNumber}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                title="Salin Nomor Tagihan"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Badge Tagihan */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isPaid 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40' 
              : isOverdue
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/80 dark:border-red-800/40'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40'
          }`}>
            {isPaid ? <CheckCircle2 size={13} /> : isOverdue ? <AlertCircle size={13} /> : <Clock size={13} />}
            {isPaid ? 'Lunas' : isOverdue ? 'Jatuh Tempo' : 'Belum Lunas'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Kolom Kiri: Dokumen Tagihan & Rincian Item (8 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            
            {/* Header Informasi Siswa & Dokumen */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Penerima Tagihan</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 text-sm">{invoice.student.full_name}</p>
                <p className="text-slate-500 font-mono text-[11px]">@{invoice.student.username}</p>
                {invoice.student.email && (
                  <p className="text-slate-400 text-[11px] truncate mt-0.5">{invoice.student.email}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tanggal Penerbitan</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: localeId })}
                </p>
                <div className="mt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Periode</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {invoice.billing_period || 'Tagihan Reguler'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabel Item Tagihan */}
            <div className="p-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Rincian Item</span>
                <span>Nominal</span>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.description}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Total Keseluruhan */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Total Keseluruhan</span>
                  {isInstallment && (
                    <span className="text-[10px] text-slate-400 block">Dibagi dalam {totalTermsCount} termin</span>
                  )}
                </div>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">{formatRupiah(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Riwayat Verifikasi jika Tagihan Sudah Lunas Penuh */}
            {isPaid && invoice.verified_by && (
              <div className="px-4 py-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 border-t border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={13} />
                  <span>Diverifikasi oleh <strong>{invoice.verified_by.name}</strong></span>
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                  {invoice.payment_method === 'CASH' ? 'Tunai' : invoice.payment_method === 'MANUAL_TRANSFER' ? 'Transfer' : invoice.payment_method || 'Lunas'}
                </span>
              </div>
            )}

          </div>

          {/* Rincian Termin Cicilan jika payment_option === INSTALLMENT */}
          {isInstallment && invoice.installments.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Jadwal Termin Pembayaran</h2>
                  <p className="text-[11px] text-slate-500">Verifikasi penerimaan pembayaran per termin dari siswa.</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {paidTermsCount}/{totalTermsCount} Lunas
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.installments.map((inst) => {
                  const instPaid = inst.status === 'PAID';
                  const isProcessing = verifyingInstallmentId === inst.id;

                  return (
                    <div key={inst.id} className="py-2.5 first:pt-1 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Termin {inst.installment_number}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                              instPaid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' :
                              inst.status === 'OVERDUE' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40' :
                              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                            }`}>
                              {instPaid ? 'Lunas' : inst.status === 'OVERDUE' ? 'Jatuh Tempo' : 'Menunggu'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Calendar size={11} className="text-slate-400" />
                            <span>Jatuh tempo: {format(new Date(inst.due_date), 'd MMM yyyy', { locale: localeId })}</span>
                          </div>

                          {instPaid && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>Lunas: {inst.paid_at ? format(new Date(inst.paid_at), 'd MMM yyyy', { locale: localeId }) : '-'}</span>
                              {inst.payment_method && (
                                <span className="bg-emerald-100/60 dark:bg-emerald-950/40 px-1 rounded font-medium">
                                  {inst.payment_method}
                                </span>
                              )}
                              {inst.verified_by?.name && (
                                <span>• oleh {inst.verified_by.name}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{formatRupiah(inst.amount)}</p>

                          {!instPaid && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "CASH")}
                                disabled={isProcessing || isVerifying}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                title="Tandai Lunas via Pembayaran Tunai"
                              >
                                {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <Banknote size={10} />}
                                Tunai
                              </button>
                              <button
                                onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "MANUAL_TRANSFER")}
                                disabled={isProcessing || isVerifying}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                title="Tandai Lunas via Transfer Bank"
                              >
                                {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <CreditCard size={10} />}
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

        {/* Kolom Kanan: Aksi & Integrasi (5 Cols - Ringkas & Presisi) */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3.5">
            
            {/* Ringkasan Nominal & Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatRupiah(invoice.total_amount)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className={`inline-block text-xs font-bold ${
                  isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {isPaid ? 'Telah Lunas' : 'Belum Lunas'}
                </span>
              </div>
            </div>

            {/* Progres Pelunasan jika Cicilan */}
            {isInstallment && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Progres Pembayaran</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Terbayar</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalPaidInstallments)}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sisa Piutang</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(remainingInstallmentDebt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Aksi Verifikasi Pembayaran (Jika belum lunas) */}
            {!isPaid && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {isInstallment ? "Lunasi Seluruh Sisa Sekaligus" : "Aksi Pembayaran Manual"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleVerify("CASH")}
                    disabled={isVerifying}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? <Loader2 size={13} className="animate-spin" /> : <Banknote size={13} />}
                    Tunai
                  </button>
                  <button
                    onClick={() => handleVerify("MANUAL_TRANSFER")}
                    disabled={isVerifying}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                    Transfer
                  </button>
                </div>
              </div>
            )}

            {/* Opsi & Integrasi Tambahan (List Baris Kompak) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Opsi & Notifikasi
              </span>

              {/* Baris Email */}
              {emailInfo?.allowed ? (
                emailInfo.active ? (
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !invoice.student.email}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={13} className="text-blue-600 dark:text-blue-400" />
                      <span>Kirim Tagihan via Email</span>
                    </span>
                    {isSendingEmail ? (
                      <Loader2 size={12} className="animate-spin text-blue-600" />
                    ) : (
                      <Send size={12} className="text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                    <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-[11px]">
                      <Mail size={12} className="text-amber-600" />
                      <span>SMTP Belum Aktif</span>
                    </span>
                    <Link
                      href={`/${tenantSlug}/dashboard/settings/email`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                    >
                      Atur SMTP &rarr;
                    </Link>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Mail size={12} className="text-slate-400" />
                    <span>Email Tagihan Siswa</span>
                  </span>
                  <Link
                    href={`/${tenantSlug}/dashboard/subscription`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <span>Paket Growth</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              )}

              {/* Baris Pengingat WhatsApp */}
              {invoice.student.parent_whatsapp ? (
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Kirim pengingat tagihan ke nomor WhatsApp orang tua"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Kirim Pengingat WhatsApp</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {invoice.student.parent_whatsapp}
                  </span>
                </button>
              ) : null}

              {/* Baris Cicilan / Split Installment */}
              {!isInstallment && (
                canSplitInstallments ? (
                  <button
                    onClick={() => setIsSplitModalOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCcw size={13} className="text-blue-600 dark:text-blue-400" />
                      <span>Ubah ke Skema Cicilan</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Maks {maxTerms || "bebas"}x</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <RefreshCcw size={12} className="text-slate-400" />
                      <span>Cicilan Bertahap</span>
                    </span>
                    <Link
                      href={`/${tenantSlug}/dashboard/subscription`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-[11px] flex items-center gap-0.5"
                    >
                      <span>Paket Growth</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                )
              )}

              {/* Atur Ulang Cicilan (jika cicilan dan belum ada termin terbayar) */}
              {isInstallment && totalPaidInstallments === 0 && canSplitInstallments && (
                <button
                  onClick={() => setIsSplitModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCcw size={11} />
                  <span>Atur Ulang Termin</span>
                </button>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Modal Split Termin Cicilan */}
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
