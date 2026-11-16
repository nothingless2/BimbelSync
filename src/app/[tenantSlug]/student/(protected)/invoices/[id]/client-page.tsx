"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceItem, Installment } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Calendar, Landmark, Copy, Upload, Image as ImageIcon, Check, Eye } from "lucide-react";
import { StudentUploadProofModal } from "@/components/modals/student-upload-proof-modal";
import { ViewProofModal } from "@/components/modals/view-proof-modal";

type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  installments: Installment[];
};

export default function StudentInvoiceDetailClient({
  invoice,
  tenantSlug,
  bankInfo
}: {
  invoice: InvoiceWithDetails;
  tenantSlug: string;
  bankInfo?: {
    bankName: string;
    bankAccount: string;
    academyName: string;
  };
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isViewProofOpen, setIsViewProofOpen] = useState(false);
  const [isUploadProofOpen, setIsUploadProofOpen] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleCopyBank = () => {
    if (!bankInfo?.bankAccount) return;
    navigator.clipboard.writeText(bankInfo.bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOverdue = invoice.payment_status === 'OVERDUE' || invoice.installments.some(i => i.status === 'OVERDUE');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] pt-12 pb-4 px-4 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 flex items-center gap-3">
        <button 
          onClick={() => router.push(`/${tenantSlug}/student/invoices`)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors -ml-2 cursor-pointer"
        >
          <ArrowLeft size={24} className="text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Detail Tagihan</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto mt-4">
        
        {/* Status Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            invoice.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
            hasOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {invoice.payment_status === 'PAID' ? <CheckCircle2 size={40} /> :
             hasOverdue ? <AlertCircle size={40} /> :
             <Clock size={40} />}
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status Pembayaran</p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {invoice.payment_status === 'PAID' ? 'LUNAS' : hasOverdue ? 'LEWAT JATUH TEMPO' : 'BELUM DIBAYAR'}
          </h2>
          
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Tagihan</p>
          <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{formatRupiah(invoice.total_amount)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">INV-{invoice.id.split('-')[0].toUpperCase()}</p>
        </div>

        {/* Rincian Item */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Rincian Pembayaran</h3>
          <div className="space-y-4">
            {invoice.items.map((item, idx) => {
              const isDiscount = item.amount < 0;
              return (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <span className={`${isDiscount ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-300'} pr-4`}>
                    {item.description}
                  </span>
                  <span className={`font-semibold shrink-0 ${isDiscount ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-slate-900 dark:text-white'}`}>
                    {isDiscount ? `- ${formatRupiah(Math.abs(item.amount))}` : formatRupiah(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cicilan (Jika Ada) */}
        {invoice.payment_option === 'INSTALLMENT' && invoice.installments.length > 0 && (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Jadwal Termin (Cicilan)</h3>
            <div className="space-y-3">
              {invoice.installments.map((inst) => (
                <div key={inst.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Termin {inst.installment_number}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={12} />
                      {inst.status === 'PAID' && inst.paid_at ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Lunas {format(new Date(inst.paid_at), 'd MMM yyyy', { locale: localeId })}{inst.payment_method ? ` (${inst.payment_method})` : ''}
                        </span>
                      ) : (
                        <span>Jatuh tempo: {format(new Date(inst.due_date), 'd MMM yyyy', { locale: localeId })}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">{formatRupiah(inst.amount)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      inst.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rekening Transfer Bank Bimbel */}
        {invoice.payment_status !== 'PAID' && (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
              <Landmark size={18} className="text-blue-600 dark:text-blue-400" />
              <h3>Rekening Transfer Pembayaran</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Silakan lakukan transfer sesuai total tagihan ke rekening resmi bimbingan belajar berikut:
            </p>
            {bankInfo?.bankAccount ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {bankInfo.bankName || "Transfer Bank"}{bankInfo.academyName ? ` a.n ${bankInfo.academyName}` : ""}
                  </p>
                  <p className="text-base font-bold font-mono tracking-wider text-blue-600 dark:text-blue-400 mt-0.5">
                    {bankInfo.bankAccount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Salin
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 italic">
                Hubungi bagian administrasi bimbel untuk informasi nomor rekening pembayaran resmi.
              </div>
            )}
          </div>
        )}

        {/* Bukti Pembayaran */}
        {invoice.proof_of_payment_url ? (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                <h3>Bukti Pembayaran</h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                invoice.payment_status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {invoice.payment_status === 'PAID' ? 'Terverifikasi Lunas' : 'Menunggu Verifikasi'}
              </span>
            </div>

            {/* Thumbnail Preview */}
            <div 
              onClick={() => setIsViewProofOpen(true)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-pointer aspect-video flex items-center justify-center max-h-56"
            >
              <img
                src={invoice.proof_of_payment_url}
                alt="Bukti Transfer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                <Eye size={16} />
                Klik untuk Memperbesar
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsViewProofOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <Eye size={14} />
                Lihat Foto Penuh
              </button>
              {invoice.payment_status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => setIsUploadProofOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  <Upload size={14} />
                  Unggah Ulang
                </button>
              )}
            </div>

            {invoice.payment_status !== 'PAID' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Struk Anda sedang dicek oleh staf bimbel. Anda dapat mengunggah ulang jika struk sebelumnya buram atau salah file.
              </p>
            )}
          </div>
        ) : invoice.payment_status !== 'PAID' ? (
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Upload size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Unggah Bukti Pembayaran</h3>
                <p className="text-[11px] text-slate-500">Konfirmasi transfer bank</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sudah melakukan transfer? Silakan unggah foto struk ATM atau tangkapan layar (screenshot) m-Banking Anda agar staf administrasi dapat segera memverifikasi tagihan Anda.
            </p>
            <button
              type="button"
              onClick={() => setIsUploadProofOpen(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={15} />
              <span>Unggah Foto Bukti Transfer</span>
            </button>
          </div>
        ) : null}

        {/* Notification & Confirmation Notice */}
        {invoice.payment_status !== 'PAID' && (
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3 text-blue-900 dark:text-blue-200 text-xs">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Silakan lakukan transfer sesuai nominal tagihan ke rekening di atas. Setelah mengunggah bukti transfer, staf administrasi bimbel akan segera memverifikasi dan memperbarui status pembayaran Anda menjadi lunas.
            </p>
          </div>
        )}

      </div>

      {/* Modal View Proof */}
      {invoice.proof_of_payment_url && (
        <ViewProofModal
          isOpen={isViewProofOpen}
          onClose={() => setIsViewProofOpen(false)}
          imageUrl={invoice.proof_of_payment_url}
          invoiceTitle={`INV-${invoice.id.split('-')[0].toUpperCase()}`}
          invoiceAmount={formatRupiah(invoice.total_amount)}
          academyName={bankInfo?.academyName}
          isPaid={invoice.payment_status === 'PAID'}
          onReupload={invoice.payment_status !== 'PAID' ? () => {
            setIsViewProofOpen(false);
            setIsUploadProofOpen(true);
          } : undefined}
        />
      )}

      {/* Modal Upload Proof */}
      <StudentUploadProofModal
        tenantSlug={tenantSlug}
        invoiceId={invoice.id}
        isOpenControlled={isUploadProofOpen}
        onOpenChange={setIsUploadProofOpen}
        onSuccess={() => {
          setIsUploadProofOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}