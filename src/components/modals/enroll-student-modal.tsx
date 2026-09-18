"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { enrollStudentAction } from "@/app/[tenantSlug]/dashboard/master-data/students/actions";
import { Student, Program } from "@prisma/client";
import { CustomSelect } from "@/components/ui/custom-select";

export function EnrollStudentModal({ 
  student, 
  programs,
  tenantSlug, 
  onClose 
}: { 
  student: Student, 
  programs: Program[],
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
    const programId = formData.get("program_id") as string;
    
    if (!programId) {
        setErrorMsg("Pilih program terlebih dahulu.");
        setIsLoading(false);
        return;
    }

    const result = await enrollStudentAction(student.id, programId);

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
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daftar Kelas Tambahan</h2>
            <p className="text-sm text-slate-500">Mendaftarkan {student.full_name}</p>
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
            <label htmlFor="program_id" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Pilih Program / Paket Belajar</label>
            <CustomSelect
              id="program_id"
              name="program_id"
              required
              placeholder="Pilih Program..."
              options={programs.map((program) => ({
                value: program.id,
                label: `${program.name} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(program.monthly_fee)}/bln`
              }))}
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Memproses..." : "Daftarkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
