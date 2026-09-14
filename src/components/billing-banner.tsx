"use client";

import { AlertCircle, Copy, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

interface Props {
  status: string;
  dueDate: Date | null;
  hasUnpaid: boolean;
  totalDebt: number;
}

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(",00", "");

export function BillingBanner({ status, dueDate, hasUnpaid, totalDebt }: Props) {
  const [copied, setCopied] = useState(false);
  
  const bankAccount = "123-456-7890";
  const bankName = "BCA a.n PT BimbelSync Nusantara";

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = dueDate 
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dueDate))
    : "Selamanya";

  return (
    <div className="mb-8 flex flex-col gap-3">
      {/* Banner Info Masa Aktif */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Clock size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Status Langganan: {status === 'TRIAL' ? 'Masa Percobaan' : 'Aktif'}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Akses Anda berlaku hingga <span className="font-bold">{formattedDate}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Banner Peringatan Tagihan */}
      {hasUnpaid && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100 shadow-sm">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0 mt-1 md:mt-0">
              <AlertCircle size={20} className="text-red-600 dark:text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Menunggu Pembayaran (Tagihan Tertunda)</p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400">
                Anda memiliki tagihan sebesar <strong className="font-bold text-red-700 dark:text-red-300">{IDR(totalDebt)}</strong>. Silakan segera lakukan pembayaran melalui transfer bank ke:
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-semibold bg-white dark:bg-red-950 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/50">
                  {bankName}
                </span>
                <div className="flex items-center bg-white dark:bg-red-950 rounded-md border border-red-200 dark:border-red-900/50 overflow-hidden">
                  <span className="text-xs font-bold px-2.5 py-1 font-mono tracking-wider">{bankAccount}</span>
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
        </div>
      )}
    </div>
  );
}
