"use client";

import { AlertCircle, Copy, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  status?: string;
  dueDate: Date | string | null;
  hasUnpaid: boolean;
  totalDebt: number;
  bankName?: string;
  bankAccount?: string;
  tenantSlug?: string;
}

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(",00", "");

export function BillingBanner({ 
  dueDate, 
  hasUnpaid, 
  totalDebt,
  bankName = "BCA a.n PT BimbelSync Nusantara",
  bankAccount = "123-456-7890",
  tenantSlug
}: Props) {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  if (!hasUnpaid) return null;

  const handleCopy = () => {
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

  const isSubscriptionPage = pathname ? pathname.includes("/dashboard/subscription") : false;

  return (
    <div className="mb-6">
      {/* Banner Peringatan Tagihan dengan Deadline Pembayaran */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100 shadow-sm animate-in fade-in duration-300">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl shrink-0 mt-1 md:mt-0 text-red-600 dark:text-red-500">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                Menunggu Pembayaran (Tagihan Tertunda)
              </p>
              {formattedDate && (
                <span className="text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800/60 inline-flex items-center gap-1">
                  <Clock size={12} />
                  Batas Pembayaran: {formattedDate}
                </span>
              )}
            </div>

            <p className="text-xs mt-1.5 text-red-700 dark:text-red-400 leading-relaxed">
              Anda memiliki tagihan sebesar{" "}
              <strong className="font-extrabold text-red-700 dark:text-red-300 text-sm">
                {IDR(totalDebt)}
              </strong>
              {formattedDate ? (
                <> dengan batas pembayaran hingga <strong className="font-bold text-red-800 dark:text-red-200">{formattedDate}</strong>. </>
              ) : (
                <>. </>
              )}
              Silakan segera lakukan pembayaran melalui transfer bank ke:
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="text-xs font-semibold bg-white dark:bg-red-950 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/50 shadow-xs">
                {bankName}
              </span>
              <div className="flex items-center bg-white dark:bg-red-950 rounded-md border border-red-200 dark:border-red-900/50 overflow-hidden shadow-xs">
                <span className="text-xs font-bold px-2.5 py-1 font-mono tracking-wider text-slate-800 dark:text-slate-100">
                  {bankAccount}
                </span>
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 border-l border-red-200 dark:border-red-900/50 transition-colors"
                  title="Salin Nomor Rekening"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} className="text-red-600 dark:text-red-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {tenantSlug && !isSubscriptionPage && (
          <Link
            href={`/${tenantSlug}/dashboard/subscription`}
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-red-500/20"
          >
            Lihat Tagihan
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
