"use client";

import { useState } from "react";
import { UserPlus, Shield, CheckCircle2, Key, Trash2, Search } from "lucide-react";
import { AddSuperadminModal } from "@/components/modals/add-superadmin-modal";
import { EditSuperadminModal } from "@/components/modals/edit-superadmin-modal";
import { DeleteSuperadminModal } from "@/components/modals/delete-superadmin-modal";
import { UserAvatar } from "@/components/user-avatar";
import { Pagination } from "@/components/ui/pagination";

export default function SystemUsersClient({ users }: { users: any[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user => {
    const searchString = searchQuery.toLowerCase();
    const nameMatch = (user.name || "").toLowerCase().includes(searchString);
    const emailMatch = (user.email || "").toLowerCase().includes(searchString);
    return nameMatch || emailMatch;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola akses tim internal BimbelSync (Level Superadmin).</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-2"
        >
          <UserPlus size={18} />
          Tambah Anggota
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau email superadmin..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <tr>
                <th className="px-6 py-4 w-16">No.</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Login Terakhir</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentData.map((user, index) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar id={user.id} email={user.email} avatarUrl={user.avatar_url} size={32} />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name || user.email}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5" title={user.email}>{user.email}</p>
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
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(user)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Ganti Password">
                        <Key size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(user)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Hapus Akun">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredUsers.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      <AddSuperadminModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditSuperadminModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} />
      <DeleteSuperadminModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} user={selectedUser} />
    </div>
  );
}
