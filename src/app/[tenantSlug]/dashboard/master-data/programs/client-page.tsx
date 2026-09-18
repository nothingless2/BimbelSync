"use client";

import { useState } from "react";
import { BookOpen, Users2, CalendarDays, Pencil, Trash2, Search, Filter, CalendarClock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteProgramAction } from "./actions";
import { EditProgramModal } from "@/components/modals/edit-program-modal";
import { Program } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import { CustomSelect } from "@/components/ui/custom-select";

import { AutoSchedulerModal } from "@/components/modals/auto-scheduler-modal";

export default function ProgramsClientPage({ 
  programs, 
  staffs,
  rooms,
  tenantSlug 
}: { 
  programs: Program[], 
  staffs: any[],
  rooms: any[],
  tenantSlug: string 
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "REGULER" | "INTENSIF" | "PRIVATE" | "WORKSHOP">("ALL");

  // Filtering
  const filteredPrograms = programs.filter(program => {
    const matchSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === "REGULER") return matchSearch && program.duration_months === null;
    if (filterType === "INTENSIF") return matchSearch && program.duration_months !== null;
    return matchSearch;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / itemsPerPage));
  const currentData = filteredPrograms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (program: Program) => {
    toast(`Hapus Program "${program.name}"?`, {
      description: "Program yang dihapus tidak akan ditampilkan lagi.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(program.id);
          const res = await deleteProgramAction(program.id);
          if (res.error) toast.error(res.error);
          else toast.success("Program berhasil dihapus.");
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
              placeholder="Cari nama program..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <CustomSelect
              value={filterType}
              onChange={(value) => {
                setFilterType(value as any);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Semua Tipe" },
                { value: "REGULER", label: "Program Reguler" },
                { value: "INTENSIF", label: "Paket Intensif" },
                { value: "PRIVATE", label: "Kelas Privat" },
                { value: "WORKSHOP", label: "Workshop/Seminar" }
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Program</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kapasitas Maks.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Durasi</th>
                <th scope="col" className="px-6 py-4 font-semibold">Total Pertemuan</th>
                <th scope="col" className="px-6 py-4 font-semibold">Biaya per Bulan</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data program.<br/>Klik "Tambah Program" untuk mulai membuat.
                  </td>
                </tr>
              ) : (
                currentData.map((program, index) => (
                  <tr key={program.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === program.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {program.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users2 size={16} className="text-slate-400" />
                        <span>{program.max_capacity} Siswa</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-slate-400" />
                        <span>{program.duration_months ? `${program.duration_months} Bulan` : "Reguler (Aktif)"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {program.total_meetings ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{program.total_meetings} Pertemuan</span>
                      ) : (
                        <span className="text-slate-400 italic">Tak terbatas</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(program.monthly_fee)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setEditingProgram(program)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(program)}
                          disabled={deletingId === program.id}
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
          totalItems={filteredPrograms.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {editingProgram && (
        <EditProgramModal 
          program={editingProgram} 
          tenantSlug={tenantSlug} 
          onClose={() => setEditingProgram(null)} 
        />
      )}
    </>
  );
}
