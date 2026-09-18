"use client";

import { useState } from "react";
import { Users, Pencil, Trash2, Phone, BookOpen, MoreVertical, LogOut, CheckCircle2, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteStudentAction, withdrawEnrollmentAction } from "./actions";
import { EditStudentModal } from "@/components/modals/edit-student-modal";
import { ManageEnrollmentsModal } from "@/components/modals/manage-enrollments-modal";
import { ImportStudentsModal } from "@/components/modals/import-students-modal";
import { Student, Program, Enrollment } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import Papa from "papaparse";

type StudentWithEnrollments = Student & {
  enrollments: (Enrollment & { program: Program })[];
};

export default function StudentsClientPage({ 
  students, 
  programs,
  tenantSlug 
}: { 
  students: StudentWithEnrollments[], 
  programs: Program[],
  tenantSlug: string 
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Filtering
  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const currentData = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleDropdown = (id: string) => {
    if (openDropdownId === id) setOpenDropdownId(null);
    else setOpenDropdownId(id);
  };

  const handleDelete = (student: Student) => {
    setOpenDropdownId(null);
    toast(`Hapus Siswa "${student.full_name}"?`, {
      description: "Data siswa akan dihapus dan tidak bisa login lagi.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(student.id);
          const res = await deleteStudentAction(student.id);
          if (res.error) toast.error(res.error);
          else toast.success("Siswa berhasil dihapus.");
          setDeletingId(null);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  const handleWithdraw = (enrollmentId: string, programName: string, studentName: string) => {
    setOpenDropdownId(null);
    toast(`Keluarkan ${studentName} dari ${programName}?`, {
      description: "Siswa tidak akan lagi aktif di kelas ini.",
      duration: 8000,
      action: {
        label: "Ya, Berhentikan",
        onClick: async () => {
          // Hardcode reason to 'LAINNYA' for now, can be improved to use a modal later
          const res = await withdrawEnrollmentAction(enrollmentId, "LAINNYA");
          if (res.error) toast.error(res.error);
          else toast.success("Siswa berhasil diberhentikan dari program.");
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  const handleExportCSV = () => {
    const exportData = filteredStudents.map(s => ({
      "Nama Lengkap": s.full_name,
      "Username": s.username,
      "WhatsApp Wali": s.parent_whatsapp || "-",
      "Program Aktif": s.enrollments.filter(e => e.status === 'ACTIVE').map(e => e.program.name).join(", ") || "-"
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_Siswa_${tenantSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data berhasil diekspor ke CSV!");
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} className="rotate-90" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kontak Wali</th>
                <th scope="col" className="px-6 py-4 font-semibold">Program Aktif</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data siswa.<br/>Klik "Tambah Siswa" untuk memulai.
                  </td>
                </tr>
              ) : (
                currentData.map((student, index) => {
                  const activeEnrollments = student.enrollments.filter(e => e.status === 'ACTIVE');
                  
                  return (
                    <tr key={student.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === student.id ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{student.full_name}</span>
                          <span className="text-xs text-slate-500">@{student.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.parent_whatsapp ? (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span>{student.parent_whatsapp}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Tidak ada kontak</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {activeEnrollments.length > 0 ? (
                            activeEnrollments.map(e => (
                              <div key={e.id} className="group relative">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  <CheckCircle2 size={12} />
                                  {e.program.name}
                                </span>
                                {/* Hover to withdraw */}
                                <button 
                                  onClick={() => handleWithdraw(e.id, e.program.name, student.full_name)}
                                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                                  title={`Keluarkan dari ${e.program.name}`}
                                >
                                  <LogOut size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-xs">Belum ada program aktif</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => toggleDropdown(student.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openDropdownId === student.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                              <div className={`absolute right-0 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in duration-200 ${
                                index >= currentData.length - 2 && currentData.length > 2 
                                  ? 'bottom-full mb-2 slide-in-from-bottom-2' 
                                  : 'top-full mt-2 slide-in-from-top-2'
                              }`}>
                                <div className="py-1">
                                  <button
                                    onClick={() => { setEnrollingStudent(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <BookOpen size={16} className="text-blue-500" />
                                    Kelola Program
                                  </button>
                                  <button
                                    onClick={() => { setEditingStudent(student); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Pencil size={16} className="text-slate-400" />
                                    Edit Profil
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                  <button
                                    onClick={() => handleDelete(student)}
                                    disabled={deletingId === student.id}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                    Hapus Siswa
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredStudents.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {editingStudent && (
        <EditStudentModal 
          student={editingStudent} 
          tenantSlug={tenantSlug} 
          onClose={() => setEditingStudent(null)} 
        />
      )}

      {enrollingStudent && (
        <ManageEnrollmentsModal 
          student={enrollingStudent} 
          programs={programs} 
          tenantSlug={tenantSlug} 
          onClose={() => setEnrollingStudent(null)} 
        />
      )}

      {isImportModalOpen && (
        <ImportStudentsModal
          tenantSlug={tenantSlug}
          programs={programs}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </>
  );
}
