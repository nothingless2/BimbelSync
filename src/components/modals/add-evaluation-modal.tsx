"use client";

import { useState } from "react";
import { X, Loader2, Star, BookOpen, BarChart } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { createEvaluationAction } from "@/app/[tenantSlug]/dashboard/evaluations/actions";

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
    studentId: "",
    programId: "",
    title: "",
    evaluationType: "EXAM" as "EXAM" | "HOMEWORK" | "MONTHLY_REPORT",
    score: "",
    notes: ""
  });

  if (!isOpen) return null;

  // Filter programs based on the selected student's active enrollments
  const selectedStudent = students.find(s => s.id === formData.studentId);
  const availablePrograms = selectedStudent 
    ? selectedStudent.enrollments.map((e: any) => e.program)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.studentId || !formData.programId) {
      toast.error("Silakan lengkapi kolom yang wajib diisi!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await createEvaluationAction({
        academyId,
        studentId: formData.studentId,
        programId: formData.programId,
        title: formData.title,
        evaluationType: formData.evaluationType,
        score: formData.score ? parseFloat(formData.score) : undefined,
        notes: formData.notes,
        tenantSlug,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Penilaian berhasil ditambahkan!");
      setFormData({
        studentId: "",
        programId: "",
        title: "",
        evaluationType: "EXAM",
        score: "",
        notes: ""
      });
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
              Siswa <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value, programId: "" })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Program Kursus <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={!formData.studentId}
              value={formData.programId}
              onChange={e => setFormData({ ...formData, programId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm disabled:opacity-50"
            >
              <option value="">-- Pilih Program --</option>
              {availablePrograms.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {formData.studentId && availablePrograms.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">Siswa ini tidak memiliki program aktif.</p>
            )}
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nilai / Skor (Opsional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.score}
              onChange={e => setFormData({ ...formData, score: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="0 - 100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Catatan Evaluasi (Opsional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm resize-none"
              placeholder="Catatan perkembangan atau evaluasi untuk siswa..."
            />
          </div>

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
