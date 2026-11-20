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
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
      {/* Header: Label + Semantic Status Pill */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tagihan SPP Aktif
        </h4>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50">
          Menunggu Pembayaran
        </span>
      </div>

      {/* Due Date Info */}
      {formattedDate && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
          Jatuh tempo: {formattedDate}
        </p>
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