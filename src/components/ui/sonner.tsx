"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "confirm";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
}

// ─── Global event bus ────────────────────────────────────────────────────────
function emit(detail: Omit<ToastItem, "id">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("bimbelsync-toast", {
      detail: { id: Math.random().toString(36).slice(2, 9), ...detail },
    })
  );
}

// ─── toast API ───────────────────────────────────────────────────────────────
export function toast(
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: ToastAction;
    cancel?: ToastAction;
  }
) {
  emit({ message, type: "confirm", ...options });
}

toast.success = (message: string) => emit({ message, type: "success" });
toast.error   = (message: string) => emit({ message, type: "error" });
toast.info    = (message: string) => emit({ message, type: "info" });

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent<ToastItem>).detail;
      setToasts((prev) => [...prev, t]);
      const ms = t.duration ?? (t.type === "confirm" ? 8000 : 3500);
      setTimeout(() => remove(t.id), ms);
    };
    window.addEventListener("bimbelsync-toast", handler);
    return () => window.removeEventListener("bimbelsync-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const isConfirm = t.type === "confirm";

        const bg = isConfirm
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          : t.type === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/50"
          : t.type === "error"
          ? "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800/50"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";

        const iconColor = isConfirm
          ? "text-amber-500"
          : t.type === "success"
          ? "text-emerald-600 dark:text-emerald-400"
          : t.type === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-blue-600 dark:text-blue-400";

        const textColor = isConfirm
          ? "text-slate-900 dark:text-white"
          : t.type === "success"
          ? "text-emerald-800 dark:text-emerald-200"
          : t.type === "error"
          ? "text-red-800 dark:text-red-200"
          : "text-slate-800 dark:text-slate-200";

        return (
          <div
            key={t.id}
            className={`flex flex-col w-full px-4 py-3.5 rounded-2xl shadow-lg border animate-in slide-in-from-bottom-4 fade-in duration-300 ${bg}`}
          >
            {/* Header row */}
            <div className="flex items-start gap-3">
              <span className={`shrink-0 mt-0.5 ${iconColor}`}>
                {t.type === "success" && <CheckCircle2 size={17} />}
                {t.type === "error"   && <AlertTriangle size={17} />}
                {t.type === "info"    && <Info size={17} />}
                {isConfirm            && <AlertCircle size={17} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${textColor}`}>
                  {t.message}
                </p>
                {t.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 -mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Action buttons — hanya untuk confirm toast */}
            {isConfirm && (t.action || t.cancel) && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {t.cancel && (
                  <button
                    onClick={() => { t.cancel!.onClick(); remove(t.id); }}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                  >
                    {t.cancel.label}
                  </button>
                )}
                {t.action && (
                  <button
                    onClick={() => { t.action!.onClick(); remove(t.id); }}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
