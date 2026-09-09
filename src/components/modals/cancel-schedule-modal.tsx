"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { cancelScheduleAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { Schedule, Program } from "@prisma/client";

export function CancelScheduleModal({ 
  schedule, 
  tenantSlug, 
  onClose 
}: { 
  schedule: Schedule & { program: Program }, 
  tenantSlug: string, 
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason") as string;
    
    if (!reason) {
        setErrorMsg("Alasan pembatalan wajib diisi.");
        setIsLoading(false);
        return;
    }

    const result = await cancelScheduleAction(schedule.id, reason);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      onClose();
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10">
          <div>
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Batalkan Jadwal</h2>
            <p className="text-sm text-slate-500">Program: {schedule.program.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Alasan Pembatalan
            </label>
            <p className="text-xs text-slate-500 mb-2">Berikan alasan mengapa kelas ini dibatalkan (misal: Tutor berhalangan hadir).</p>
            <textarea
              id="reason"
              name="reason"
              required
              rows={3}
              placeholder="Ketikkan alasan pembatalan di sini..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Memproses..." : "Ya, Batalkan Kelas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
