"use client";

import { useState } from "react";
import { X, Loader2, Star, BookOpen, BarChart, ClipboardCheck, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { bulkCreateEvaluationsAction } from "@/app/[tenantSlug]/dashboard/evaluations/actions";
import { CustomSelect } from "@/components/ui/custom-select";

interface AddEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  academyId: string;
  students: any[];
  programs: any[];
}

export function AddEvaluationModal({ isOpen, onClose, tenantSlug, academyId, students, programs }: AddEvaluationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    programId: "",
    title: "",
    evaluationType: "EXAM" as "EXAM" | "HOMEWORK" | "MONTHLY_REPORT",
  });
  
  const [studentEvaluations, setStudentEvaluations] = useState<Record<string, { score: string, notes: string }>>({});

  if (!isOpen) return null;

  // Filter students based on the selected program
  const availableStudents = formData.programId
    ? students.filter(s => s.enrollments.some((e: any) => e.program_id === formData.programId))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.programId) {
      toast.error("Silakan lengkapi Program dan Judul Penilaian!");
      return;
    }

    // Convert state to array of data
    const evaluationsData = availableStudents.map(s => {
      const input = studentEvaluations[s.id] || { score: "", notes: "" };
      return {
        studentId: s.id,
        score: input.score ? parseFloat(input.score) : undefined,
        notes: input.notes
      };
    });

    try {
      setIsLoading(true);
      const res = await bulkCreateEvaluationsAction({
        academyId,
        programId: formData.programId,
        title: formData.title,
        evaluationType: formData.evaluationType,
        evaluations: evaluationsData,
        tenantSlug,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Penilaian kolektif berhasil disimpan!");
      setFormData({
        programId: "",
        title: "",
        evaluationType: "EXAM",
      });
      setStudentEvaluations({});
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Input Penilaian Siswa</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Program Kursus <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              name="program_id"
              required
              placeholder="-- Pilih Program --"
              value={formData.programId}
              onChange={value => {
                setFormData({ ...formData, programId: value });
                setStudentEvaluations({});
              }}
              options={programs.map((p: any) => ({ value: p.id, label: p.name }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul Penilaian <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Contoh: Try Out 1 / PR Matematika"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Jenis Evaluasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "EXAM", label: "Ujian", icon: <Star size={16} /> },
                { id: "HOMEWORK", label: "PR/Tugas", icon: <BookOpen size={16} /> },
                { id: "MONTHLY_REPORT", label: "Rapor", icon: <BarChart size={16} /> },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, evaluationType: type.id as any })}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 border rounded-xl text-xs font-semibold transition ${
                    formData.evaluationType === type.id 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {formData.programId && availableStudents.length > 0 && (
            <div className="space-y-2 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Daftar Siswa (Input Kolektif)</h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                      <th className="px-4 py-3 font-semibold w-24">Nilai</th>
                      <th className="px-4 py-3 font-semibold">Catatan (Opsional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {availableStudents.map(s => {
                      const currentInput = studentEvaluations[s.id] || { score: "", notes: "" };
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                            {s.full_name}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={currentInput.score}
                              onChange={(e) => setStudentEvaluations({
                                ...studentEvaluations,
                                [s.id]: { ...currentInput, score: e.target.value }
                              })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                              placeholder="0-100"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={currentInput.notes}
                              onChange={(e) => setStudentEvaluations({
                                ...studentEvaluations,
                                [s.id]: { ...currentInput, notes: e.target.value }
                              })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                              placeholder="Catatan siswa..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {formData.programId && availableStudents.length === 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
              Tidak ada siswa aktif yang terdaftar di program ini.
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              Simpan Penilaian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
