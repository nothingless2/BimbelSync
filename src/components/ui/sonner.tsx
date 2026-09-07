"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleAddToast = (event: Event) => {
      const customEvent = event as CustomEvent<Toast>;
      const newToast = customEvent.detail;
      
      setToasts((prev) => [...prev, newToast]);

      // Auto remove after 3s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener("bimbelsync-toast", handleAddToast);
    return () => window.removeEventListener("bimbelsync-toast", handleAddToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`flex items-center gap-3 w-80 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300
            ${t.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/50" : 
              t.type === "error" ? "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800/50" : 
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}
          `}
        >
          <div className={`shrink-0 
            ${t.type === "success" ? "text-emerald-600 dark:text-emerald-400" : 
              t.type === "error" ? "text-red-600 dark:text-red-400" : 
              "text-blue-600 dark:text-blue-400"}`}>
            {t.type === "success" && <CheckCircle2 size={20} />}
            {t.type === "error" && <AlertTriangle size={20} />}
            {t.type === "info" && <Info size={20} />}
          </div>
          
          <p className={`text-sm font-medium flex-1 ${
            t.type === "success" ? "text-emerald-800 dark:text-emerald-200" : 
            t.type === "error" ? "text-red-800 dark:text-red-200" : 
            "text-slate-800 dark:text-slate-200"
          }`}>
            {t.message}
          </p>

          <button onClick={() => removeToast(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (message: string) => emitToast(message, "success"),
  error: (message: string) => emitToast(message, "error"),
  info: (message: string) => emitToast(message, "info"),
};

function emitToast(message: string, type: ToastType) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("bimbelsync-toast", {
      detail: { id: Math.random().toString(36).substr(2, 9), message, type },
    });
    window.dispatchEvent(event);
  }
}
