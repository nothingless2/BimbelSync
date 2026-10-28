"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Student, Installment, Staff } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Banknote, RefreshCcw, Loader2, Calendar,
  Mail, Send, Copy, Check, MessageSquare, Printer, Lock, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";
import { verifyPaymentAction, verifyInstallmentAction, sendInvoiceEmailAction } from "../actions";
import { SplitInstallmentModal } from "@/components/modals/split-installment-modal";

type InvoiceWithDetails = Invoice & {
  academy?: {
    name: string;
    bank_name: string | null;
    bank_account: string | null;
  } | null;
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

  const formatBillingPeriod = (period?: string | null) => {
    if (!period) return "Tagihan Reguler";
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, "MMMM yyyy", { locale: localeId });
    }
    return period;
  };

  const invoiceNumber = `INV-${invoice.id.split('-')[0].toUpperCase()}`;

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    toast.success("Nomor tagihan disalin");
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
      toast.success("Tagihan berhasil diverifikasi lunas.");
      router.refresh();
    }
    setIsVerifying(false);
  };

  // Verifikasi pelunasan per termin cicilan
  const handleVerifyInstallment = async (installmentId: string, termNumber: number, method: "CASH" | "MANUAL_TRANSFER") => {
    const methodLabel = method === 'CASH' ? 'Tunai' : 'Transfer Manual';
    if (!confirm(`Tandai Lunas Termin ${termNumber} via ${methodLabel}?`)) return;

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

  // Kirim notifikasi email tagihan ke siswa
  const handleSendEmail = async () => {
    if (!invoice.student.email) {
      toast.error("Siswa ini belum memiliki alamat email yang terdaftar.");
      return;
    }

    if (!confirm(`Kirim rincian tagihan ini ke ${invoice.student.email}?`)) return;

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
    
    const message = `Halo Bpk/Ibu wali dari ${invoice.student.full_name},\n\nKami menginformasikan tagihan bimbingan belajar dengan rincian berikut:\n- No. Faktur: ${invoiceNumber}\n- Total: ${formatRupiah(invoice.total_amount)}\n- Status: ${invoice.payment_status === 'PAID' ? 'LUNAS' : 'Belum Lunas'}\n\nTerima kasih atas kerja samanya.`;
    
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <button 
            onClick={() => router.push(`/${tenantSlug}/dashboard/finance`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Daftar Tagihan</span>
          </button>
          
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              Faktur #{invoiceNumber}
            </h1>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPaid 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40' 
                : isOverdue
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40'
            }`}>
              {isPaid ? <CheckCircle2 size={12} /> : isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
              {isPaid ? 'Lunas' : isOverdue ? 'Jatuh Tempo' : 'Menunggu Pembayaran'}
            </span>

            {/* Payment Scheme Pill */}
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {isInstallment ? `Cicilan (${totalTermsCount}x)` : 'Sekali Bayar'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Diterbitkan pada {format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: localeId })}
          </p>
        </div>

        {/* Top Quick Utility Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleCopyInvoiceNumber}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Salin Nomor Faktur"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? "Tersalin" : "Salin ID"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Cetak Faktur Tagihan"
          >
            <Printer size={13} />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Invoice Sheet), Right (Actions & Meta) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">
        
        {/* Kolom Kiri: Dokumen Faktur Digital (8 Kolom) */}
        <div className="lg:col-span-8 space-y-4 print:w-full print:m-0 print:p-0">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none">
            
            {/* Header Lembar Faktur */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {invoice.academy?.name || "BimbelSync"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Faktur Tagihan Siswa</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    #{invoiceNumber}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: localeId })}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isPaid ? 'Lunas' : isOverdue ? 'Jatuh Tempo' : 'Belum Lunas'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium block">Total Kewajiban</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(invoice.total_amount)}
                </p>
              </div>
            </div>

            {/* Informasi Pelanggan & Penerbit */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-1">Ditagihkan kepada:</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.student.full_name}</p>
                <p className="text-slate-500 mt-0.5">ID: @{invoice.student.username}</p>
                <p className="text-slate-500 mt-0.5">{invoice.student.email || "Email belum ditambahkan"}</p>
                {invoice.student.parent_whatsapp && (
                  <p className="text-slate-500 mt-0.5">WA: {invoice.student.parent_whatsapp}</p>
                )}
              </div>

              <div className="sm:text-right">
                <span className="text-slate-400 font-medium block mb-1">Rincian Periode:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatBillingPeriod(invoice.billing_period)}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Jatuh tempo: {invoice.due_date ? format(new Date(invoice.due_date), 'd MMMM yyyy', { locale: localeId }) : 'Sesuai Ketentuan Bimbel'}
                </p>
                {invoice.academy?.bank_account ? (
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono">
                    {invoice.academy.bank_name}: {invoice.academy.bank_account}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Tabel Item Tagihan */}
            <div className="p-6 space-y-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Deskripsi Layanan / Program</th>
                    <th className="pb-3 font-medium text-center w-16">Jumlah</th>
                    <th className="pb-3 font-medium text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 text-slate-800 dark:text-slate-200 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3 text-slate-500 text-center">
                        1x
                      </td>
                      <td className="py-3 text-slate-900 dark:text-white font-semibold font-mono text-right">
                        {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Rincian Ringkasan Finansial */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatRupiah(invoice.total_amount)}</span>
                  </div>

                  {isInstallment && (
                    <>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Total Terbayar:</span>
                        <span className="font-mono font-medium">{formatRupiah(totalPaidInstallments)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>Sisa Tagihan:</span>
                        <span className="font-mono font-medium">{formatRupiah(remainingInstallmentDebt)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                    <span>Total Akhir:</span>
                    <span className="font-mono text-base">{formatRupiah(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Verifikasi jika Tagihan Telah Lunas */}
            {isPaid && invoice.verified_by && (
              <div className="px-6 py-3 bg-emerald-50/60 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Diverifikasi lunas oleh <strong>{invoice.verified_by.name}</strong></span>
                </span>
                <span className="font-medium text-emerald-800 dark:text-emerald-300">
                  via {invoice.payment_method === 'CASH' ? 'Tunai' : invoice.payment_method === 'MANUAL_TRANSFER' ? 'Transfer Bank' : invoice.payment_method}
                </span>
              </div>
            )}

          </div>

          {/* Tabel Termin Cicilan jika payment_option === INSTALLMENT */}
          {isInstallment && invoice.installments.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Jadwal Termin Pembayaran</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Progres: {paidTermsCount} dari {totalTermsCount} termin telah selesai ({progressPercentage}%)
                  </p>
                </div>
                <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {invoice.installments.map((inst) => {
                  const instPaid = inst.status === 'PAID';
                  const isProcessing = verifyingInstallmentId === inst.id;

                  return (
                    <div key={inst.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">Termin {inst.installment_number}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            instPaid 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40' 
                              : inst.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40'
                          }`}>
                            {instPaid ? 'Lunas' : inst.status === 'OVERDUE' ? 'Jatuh Tempo' : 'Belum Bayar'}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Jatuh tempo: {format(new Date(inst.due_date), 'd MMMM yyyy', { locale: localeId })}
                        </p>
                        {instPaid && inst.verified_by && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Diverifikasi oleh {inst.verified_by.name} {inst.paid_at ? `pada ${format(new Date(inst.paid_at), 'd MMM yyyy', { locale: localeId })}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {formatRupiah(inst.amount)}
                        </span>

                        {!instPaid && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "CASH")}
                              disabled={isProcessing || isVerifying}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isProcessing ? <Loader2 size={12} className="animate-spin inline" /> : "Tunai"}
                            </button>
                            <button
                              onClick={() => handleVerifyInstallment(inst.id, inst.installment_number, "MANUAL_TRANSFER")}
                              disabled={isProcessing || isVerifying}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/80 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isProcessing ? <Loader2 size={12} className="animate-spin inline" /> : "Transfer"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Kolom Kanan: Panel Tindakan & Saluran Tagihan (4 Kolom) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          
          {/* Kartu Tindakan Pembayaran */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi Pembayaran</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPaid ? "Tagihan ini telah diverifikasi lunas." : "Catat pembayaran yang diterima dari siswa:"}
              </p>
            </div>

            {!isPaid ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleVerify("CASH")}
                  disabled={isVerifying}
                  className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                      {isVerifying ? <Loader2 size={15} className="animate-spin" /> : <Banknote size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        Pembayaran Tunai
                      </p>
                      <p className="text-[11px] text-slate-400">Diterima langsung di kasir bimbel</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button
                  onClick={() => handleVerify("MANUAL_TRANSFER")}
                  disabled={isVerifying}
                  className="w-full p-3 bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      {isVerifying ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        Transfer Bank Manual
                      </p>
                      <p className="text-[11px] text-slate-400">Verifikasi mutasi rekening</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Lunas Terverifikasi</p>
                <p className="text-slate-500">
                  Pembayaran ini telah dicatat ke kas bimbel. Tidak ada tindakan pembayaran lanjutan yang diperlukan.
                </p>
              </div>
            )}
          </div>

          {/* Kartu Saluran Pengiriman & Skema */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saluran & Opsi</h2>
            </div>

            <div className="space-y-2 text-xs">
              
              {/* Notifikasi Email */}
              {emailInfo?.allowed ? (
                emailInfo.active ? (
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !invoice.student.email}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Kirim Rincian via Email</span>
                    </span>
                    {isSendingEmail ? (
                      <Loader2 size={13} className="animate-spin text-blue-600" />
                    ) : (
                      <Send size={13} className="text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} className="text-slate-400" />
                      <span>SMTP Belum Aktif</span>
                    </span>
                    <Link
                      href={`/${tenantSlug}/dashboard/settings/email`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Konfigurasi &rarr;
                    </Link>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Mail size={14} className="text-slate-400" />
                    <span>Email Tagihan Otomatis</span>
                  </span>
                  <Link
                    href={`/${tenantSlug}/dashboard/subscription`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <Lock size={10} />
                    <span>Paket Growth</span>
                  </Link>
                </div>
              )}

              {/* Pengingat WhatsApp */}
              {invoice.student.parent_whatsapp ? (
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <MessageSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Kirim Pengingat WhatsApp</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {invoice.student.parent_whatsapp}
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
                  <span className="flex items-center gap-2 text-slate-400">
                    <MessageSquare size={14} />
                    <span>Pengingat WhatsApp</span>
                  </span>
                  <span className="text-[11px] text-slate-400 italic">No. WA belum diisi</span>
                </div>
              )}

              {/* Skema Cicilan */}
              {!isInstallment ? (
                canSplitInstallments ? (
                  <button
                    onClick={() => setIsSplitModalOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <RefreshCcw size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Ubah ke Cicilan Termin</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Maks {maxTerms || "bebas"}x</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-slate-500">
                      <RefreshCcw size={14} className="text-slate-400" />
                      <span>Cicilan Bertahap</span>
                    </span>
                    <Link
                      href={`/${tenantSlug}/dashboard/subscription`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                    >
                      <Lock size={10} />
                      <span>Paket Growth</span>
                    </Link>
                  </div>
                )
              ) : (
                totalPaidInstallments === 0 && canSplitInstallments && (
                  <button
                    onClick={() => setIsSplitModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCcw size={12} />
                    <span>Atur Ulang Termin</span>
                  </button>
                )
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Modal Split Cicilan */}
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
