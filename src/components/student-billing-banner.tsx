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
  tenantSlug: string;
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
  tenantSlug,
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

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-100 shadow-sm animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl shrink-0 mt-0.5 text-red-600 dark:text-red-400">
            <AlertCircle size={22} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                Menunggu Pembayaran (Tagihan SPP Tertunda)
              </h4>
              {formattedDate && (
                <span className="text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800/60 inline-flex items-center gap-1">
                  <Clock size={12} />
                  Batas Pembayaran: {formattedDate}
                </span>
              )}
            </div>

            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
              Anda memiliki tagihan yang belum lunas sebesar{" "}
              <strong className="font-extrabold text-red-700 dark:text-red-300 text-sm">
                {IDR(totalDebt)}
              </strong>
              . {bankAccount ? "Silakan segera lakukan pembayaran melalui transfer bank ke:" : "Silakan segera selesaikan pembayaran ke pihak administrasi bimbel."}
            </p>

            {bankAccount && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-xs font-semibold bg-white dark:bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 shadow-xs">
                  {bankName || "Transfer Bank"}
                </span>
                <div className="flex items-center bg-white dark:bg-red-950/80 rounded-lg border border-red-200 dark:border-red-900/60 overflow-hidden shadow-xs">
                  <span className="text-xs font-bold px-2.5 py-1 font-mono tracking-wider text-slate-800 dark:text-slate-100">
                    {bankAccount}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 border-l border-red-200 dark:border-red-900/60 transition-colors"
                    title="Salin Nomor Rekening"
                  >
                    {copied ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-red-600 dark:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/${tenantSlug}/student/invoices`}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-red-500/20"
        >
          Lihat Tagihan
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
