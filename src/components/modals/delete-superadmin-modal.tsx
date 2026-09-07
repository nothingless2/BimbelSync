"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { deleteSuperadminAction } from "@/app/superadmin/(dashboard)/actions";

interface DeleteSuperadminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function DeleteSuperadminModal({ isOpen, onClose, user }: DeleteSuperadminModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !user) return null;

  async function handleDelete() {
    if (confirmText !== user.email) {
      setError(`Ketik email untuk mengonfirmasi.`);
      return;
    }

    setLoading(true);
    setError("");

    const res = await deleteSuperadminAction(user.id);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Cabut Akses Superadmin?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
            Anda akan mencabut akses sistem untuk <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong>. Mereka tidak akan bisa login lagi ke dashboard ini.
          </p>

          <div className="mb-6 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ketik <b>{user.email}</b> untuk melanjutkan</label>
            <input 
              type="email" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-slate-900 dark:text-white text-sm"
            />
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={loading || confirmText !== user.email}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={18} className="mr-2 animate-spin"/> Mencabut...</> : "Ya, Cabut Akses"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
