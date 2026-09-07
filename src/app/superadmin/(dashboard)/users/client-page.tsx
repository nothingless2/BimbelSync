"use client";

import { useState } from "react";
import { UserPlus, Shield, CheckCircle2, MoreVertical } from "lucide-react";
import { AddSuperadminModal } from "@/components/modals/add-superadmin-modal";

// Halaman Client yang akan mengambil prop initial data dari server component (jika mau)
// Tapi agar clean, kita fetch di server dan over ke client component ini
export default function SystemUsersClient({ users }: { users: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola akses tim internal BimbelSync (Level Superadmin).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-2"
        >
          <UserPlus size={18} />
          Tambah Anggota
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Login Terakhir</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0">
                         <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user.email}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5" title={user.id}>{user.id.split("-")[0]}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      <Shield size={12} /> Superadmin
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 size={14} /> Aktif
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                    {user.last_login 
                      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.last_login))
                      : "Belum pernah login"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-xs font-medium text-slate-500">Menampilkan {users.length} superadmin terdaftar</p>
        </div>
      </div>

      <AddSuperadminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
