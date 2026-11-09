"use client";

import { AlertCircle, Copy, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface StudentBillingBannerProps {
  hasUnpaid: boolean;
  totalDebt: number;
  dueDate?: Date | string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  academyName?: string | null;
  tenantSlug: string;
  targetInvoiceId?: string | null;
}

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(",00", "");

export function StudentBillingBanner({
  hasUnpaid,
  totalDebt,
  dueDate,
  bankName,
  bankAccount,
  academyName,
  tenantSlug,
  targetInvoiceId,
}: StudentBillingBannerProps) {
  const [copied, setCopied] = useState(false);

  if (!hasUnpaid || totalDebt <= 0) return null;

  const handleCopy = () => {
    if (!bankAccount) return;
    navigator.clipboard.writeText(bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = dueDate ? (() => {
    try {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
      return null;
    }
  })() : null;

  const invoiceHref = targetInvoiceId 
    ? `/${tenantSlug}/student/invoices/${targetInvoiceId}`
    : `/${tenantSlug}/student/invoices`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in duration-300">
      {/* Header: Alert Icon + Title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <AlertCircle size={14} />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-red-950 dark:text-red-200">
          Menunggu Pembayaran (Tagihan SPP)
        </h4>
      </div>

      {/* Due Date Badge */}
      {formattedDate && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-300 text-[11px] font-medium mb-3">
          <Clock size={12} />
          <span>Batas Pembayaran: {formattedDate}</span>
        </div>
      )}

      {/* Big Prominent Amount */}
      <div className="my-1">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {IDR(totalDebt)}
        </p>
      </div>

      {/* Bank Account Info */}
      <div className="mt-2 text-left">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {bankName || "Transfer Bank"}{academyName ? ` a.n ${academyName}` : ""}
        </p>
        {bankAccount && (
          <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200">
            <span className="font-mono font-bold tracking-wider">{bankAccount}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              title="Salin Nomor Rekening"
            >
              {copied ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Button: Blue Button matching mockup */}
      <Link
        href={invoiceHref}
        className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
      >
        <span>Lihat Detail Tagihan</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}