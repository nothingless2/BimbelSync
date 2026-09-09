"use client";

import { useState } from "react";
import { BookOpen, Users2, CalendarDays, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteProgramAction } from "./actions";
import { EditProgramModal } from "@/components/modals/edit-program-modal";
import { Program } from "@prisma/client";

export default function ProgramsClientPage({ programs, tenantSlug }: { programs: Program[], tenantSlug: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Program</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kapasitas Maks.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Durasi</th>
                <th scope="col" className="px-6 py-4 font-semibold">Biaya per Bulan</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data program.<br/>Klik "Tambah Program" untuk mulai membuat.
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === program.id ? 'opacity-50' : ''}`}>
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
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(program.monthly_fee)}
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
