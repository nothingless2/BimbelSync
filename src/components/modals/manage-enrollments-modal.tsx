"use client";

import { useState } from "react";
import { X, AlertCircle, Plus, LogOut } from "lucide-react";
import { enrollStudentAction, withdrawEnrollmentAction } from "@/app/[tenantSlug]/dashboard/master-data/students/actions";
import { Student, Program, Enrollment } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";

export function ManageEnrollmentsModal({ 
  student, 
  programs,
  tenantSlug, 
  onClose 
}: { 
  student: any, 
  programs: Program[],
  tenantSlug: string, 
  onClose: () => void 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [localEnrollments, setLocalEnrollments] = useState<any[]>(student.enrollments);

  const handleEnroll = async () => {
    if (!selectedProgramId) return;
    
    setIsLoading(true);
    setErrorMsg(null);

    const result = await enrollStudentAction(student.id, selectedProgramId);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      toast.success("Berhasil mendaftarkan siswa ke program!");
      router.refresh();
      onClose();
    }
    
    setIsLoading(false);
  };

  const handleWithdraw = async (enrollmentId: string) => {
    if (!confirm("Yakin ingin memberhentikan siswa dari kelas ini?")) return;
    
    setIsLoading(true);
    setErrorMsg(null);

    // Using "OTHER" reason by default for simplicity from this UI
    const result = await withdrawEnrollmentAction(enrollmentId, "OTHER", "Diberhentikan via kelola program");

    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      toast.success("Siswa berhasil diberhentikan dari program.");
      setLocalEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      router.refresh();
    }
    
    setIsLoading(false);
  };

  // Filter out programs the student is already actively enrolled in
  const activeProgramIds = localEnrollments.map((e: any) => e.program_id);
  const availablePrograms = programs.filter(p => !activeProgramIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kelola Program & Kelas</h2>
            <p className="text-sm text-slate-500">Mengelola kelas aktif untuk {student.full_name}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Active Programs List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Kelas Aktif Saat Ini</h3>
            {localEnrollments.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                Belum mengikuti kelas apapun.
              </p>
            ) : (
              <div className="space-y-2">
                {localEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{enrollment.program.name}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded w-fit mt-1">Status: Aktif</span>
                    </div>
                    <button
                      onClick={() => handleWithdraw(enrollment.id)}
                      disabled={isLoading}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
                      title="Berhentikan dari kelas"
                    >
                      <LogOut size={16} />
                      Berhentikan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6"></div>

          {/* Add New Program */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Daftarkan ke Kelas Baru</h3>
            <div className="flex gap-2">
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-medium text-sm"
              >
                <option value="" disabled>Pilih Program...</option>
                {availablePrograms.length === 0 ? (
                  <option value="" disabled>Tidak ada program tersedia</option>
                ) : (
                  availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={handleEnroll}
                disabled={isLoading || !selectedProgramId}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={16} />
                Tambah
              </button>
            </div>
            <p className="text-xs text-slate-500">Mendaftarkan ke kelas baru akan otomatis membuat tagihan awal.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors w-full sm:w-auto"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
