"use client";

import { useState } from "react";
import { UserCog, Pencil, Trash2, Mail, ShieldAlert, Search, Filter } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteStaffAction } from "./actions";
import { EditStaffModal } from "@/components/modals/edit-staff-modal";
import { Staff } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";

export default function StaffClientPage({ staffList, tenantSlug }: { staffList: Staff[], tenantSlug: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "TUTOR">("ALL");

  // Filtering
  const filteredStaff = staffList.filter(staff => {
    const matchSearch = staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "ALL" || staff.role === filterRole;
    return matchSearch && matchRole;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  const currentData = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (staff: Staff) => {
    toast(`Hapus Staf "${staff.email}"?`, {
      description: "Data staf ini akan disembunyikan dari sistem, dan tidak bisa login lagi.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(staff.id);
          const res = await deleteStaffAction(staff.id);
          if (res.error) toast.error(res.error);
          else toast.success("Staf berhasil dihapus.");
          setDeletingId(null);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari email staf..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={14} className="text-slate-400" />
            </div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value as any);
                setCurrentPage(1);
              }}
              className="block w-full sm:w-48 pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200 appearance-none bg-white"
            >
              <option value="ALL">Semua Peran</option>
              <option value="ADMIN">Admin</option>
              <option value="TUTOR">Tutor</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Email</th>
                <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <UserCog className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data staf.<br/>Klik "Tambah Staf" untuk mulai mendaftarkan admin/tutor.
                  </td>
                </tr>
              ) : (
                currentData.map((staff, index) => (
                  <tr key={staff.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === staff.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        {staff.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className={staff.role === 'ADMIN' ? 'text-blue-500' : 'text-purple-500'} />
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          staff.role === 'ADMIN' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {staff.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setEditingStaff(staff)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(staff)}
                          disabled={deletingId === staff.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredStaff.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {editingStaff && (
        <EditStaffModal 
          staff={editingStaff} 
          tenantSlug={tenantSlug} 
          onClose={() => setEditingStaff(null)} 
        />
      )}
    </>
  );
}
