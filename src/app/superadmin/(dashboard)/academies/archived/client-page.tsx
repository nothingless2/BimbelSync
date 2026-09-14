"use client";

import { useState } from "react";
import { Building2, ArrowLeft, RefreshCw, Trash2, AlertTriangle, X, Save } from "lucide-react";
import Link from "next/link";
import { restoreAcademyAction, hardDeleteAcademyAction } from "@/app/superadmin/(dashboard)/actions";

export default function ArchivedClientPage({ academies }: { academies: any[] }) {
  const [selectedAcademy, setSelectedAcademy] = useState<any>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const handleRestore = async () => {
    setLoading(true);
    setMessage(null);
    const res = await restoreAcademyAction(selectedAcademy.id);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      setLoading(false);
    } else {
      if (res.collision) {
        setMessage({ type: "success", text: `Bentrok nama URL terdeteksi! Dipulihkan sebagai: ${res.restoredSlug}` });
      } else {
        setIsRestoreModalOpen(false);
      }
      setLoading(false);
      if (!res.collision) setSelectedAcademy(null);
    }
  };

  const handleHardDelete = async () => {
    setLoading(true);
    setMessage(null);
    const res = await hardDeleteAcademyAction(selectedAcademy.id);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setIsDeleteModalOpen(false);
      setSelectedAcademy(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/superadmin/academies" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tempat Sampah</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar akademi yang telah dihapus (Soft Delete).</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {academies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Trash2 size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Arsip Kosong</h3>
            <p className="text-slate-500 mt-1">Tidak ada akademi yang berada di tempat sampah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Bimbel (URL Lama)</th>
                  <th className="px-6 py-4 font-semibold">Paket</th>
                  <th className="px-6 py-4 font-semibold">Dihapus Pada</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {academies.map((academy) => (
                  <tr key={academy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{academy.name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{academy.path_url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {academy.plan.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(academy.deleted_at))}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setSelectedAcademy(academy); setIsRestoreModalOpen(true); setMessage(null); }}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition"
                      >
                        Pulihkan
                      </button>
                      <button 
                        onClick={() => { setSelectedAcademy(academy); setIsDeleteModalOpen(true); setMessage(null); }}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition"
                      >
                        Hapus Permanen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Modal */}
      {isRestoreModalOpen && selectedAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pulihkan Akademi?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Apakah Anda yakin ingin mengembalikan <b>{selectedAcademy.name}</b> ke daftar aktif? Sistem akan mencoba mengembalikan URL aslinya.
            </p>
            {message && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                {message.text}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setIsRestoreModalOpen(false); setSelectedAcademy(null); }}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleRestore}
                disabled={loading || message?.type === 'success'}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : "Pulihkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Modal */}
      {isDeleteModalOpen && selectedAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-red-200 dark:border-red-900 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Permanen?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Peringatan! Menghapus <b>{selectedAcademy.name}</b> secara permanen akan memusnahkan SEMUA data tagihan, staf, murid, dan materi yang ada di dalamnya secara tidak dapat dikembalikan.
            </p>
            {message?.type === 'error' && (
              <div className="p-3 rounded-xl mb-4 text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                {message.text}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setSelectedAcademy(null); }}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleHardDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
