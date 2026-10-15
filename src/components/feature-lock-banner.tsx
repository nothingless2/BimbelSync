"use client";

import { Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

interface FeatureLockBannerProps {
  title: string;
  description: string;
  requiredPlan: "Growth" | "Pro";
  tenantSlug: string;
  currentPlanName?: string;
  readOnlyNotice?: boolean;
}

export function FeatureLockBanner({
  title,
  description,
  requiredPlan,
  tenantSlug,
  currentPlanName,
  readOnlyNotice = false,
}: FeatureLockBannerProps) {
  if (readOnlyNotice) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Mode Hanya-Lihat (Read-Only)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              Data historis tetap tersimpan aman. Pembuatan data baru untuk fitur ini memerlukan paket{" "}
              <strong>{requiredPlan}</strong> (Paket aktif: <em>{currentPlanName || "Starter"}</em>).
            </p>
          </div>
        </div>
        <Link
          href={`/${tenantSlug}/dashboard/subscription`}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Tingkatkan Paket
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[420px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Lock size={30} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 mb-3">
          <Sparkles size={13} />
          Memerlukan Paket {requiredPlan}
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        <div className="space-y-2.5">
          <Link
            href={`/${tenantSlug}/dashboard/subscription`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-600/20"
          >
            Upgrade ke Paket {requiredPlan}
            <ArrowRight size={16} />
          </Link>

          {currentPlanName && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Paket Anda saat ini: <span className="font-semibold">{currentPlanName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
