"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, FileText, BarChart, BookOpen, Star, Save, ClipboardEdit, CheckCircle2, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { updateEvaluationScoreAction, deleteEvaluationColumnAction, bulkCreateEvaluationsAction, updateEvaluationNotesAction } from "./actions";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";

export default function EvaluationsClientPage({ evaluations, students, programs, tenantSlug, academyId, userRole }: any) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    evaluationType: "EXAM" as "EXAM" | "HOMEWORK" | "MONTHLY_REPORT",
  });

  // Local state for auto-save inputs to prevent losing focus
  const [localScores, setLocalScores] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");

  const [noteModal, setNoteModal] = useState<{ id: string, title: string, studentName: string, notes: string } | null>(null);

  // Sync local scores with server data on load/change
  useEffect(() => {
    const scores: Record<string, string> = {};
    evaluations.forEach((e: any) => {
      scores[e.id] = e.score !== null ? e.score.toString() : "";
    });
    setLocalScores(scores);
  }, [evaluations]);

  // Derived Data
  const availableStudents = selectedProgramId
    ? students.filter((s: any) => s.enrollments.some((e: any) => e.program_id === selectedProgramId))
    : [];

  const columns = React.useMemo(() => {
    if (!selectedProgramId) return [];
    const evals = evaluations.filter((e: any) => e.program_id === selectedProgramId);
    const cols = new Map<string, any>();
    evals.forEach((e: any) => {
      const key = `${e.title.toLowerCase()}_${e.evaluation_type}`;
      if (!cols.has(key)) {
        cols.set(key, { title: e.title, type: e.evaluation_type, date: e.created_at });
      }
    });
    // Sort by date descending (newest on left)
    return Array.from(cols.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, selectedProgramId]);

  const getSmallIcon = (type: string) => {
    if (type === "EXAM") return <Star size={14} className="text-yellow-500" />;
    if (type === "HOMEWORK") return <BookOpen size={14} className="text-emerald-500" />;
    return <BarChart size={14} className="text-blue-500" />; 
  };

  // Actions
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (availableStudents.length === 0) {
      toast.error("Tidak ada siswa di kelas ini.");
      return;
    }

    setIsSubmitting(true);
    // Create null evaluations for all students
    const evaluationData = availableStudents.map((student: any) => ({
      studentId: student.id,
      score: undefined,
      notes: undefined,
    }));

    const res = await bulkCreateEvaluationsAction({
      academyId,
      programId: selectedProgramId,
      title: formData.title.trim(),
      evaluationType: formData.evaluationType,
      evaluations: evaluationData,
      tenantSlug,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Tugas baru berhasil ditambahkan!");
      setIsAddModalOpen(false);
      setFormData({ title: "", evaluationType: "EXAM" });
    }
    setIsSubmitting(false);
  };

  const handleDeleteColumn = async (title: string, type: string) => {
    if (!confirm(`Hapus semua nilai untuk tugas "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    setSavingStatus("SAVING");
    const res = await deleteEvaluationColumnAction(selectedProgramId, title, type as any, tenantSlug);
    if (res.error) {
      toast.error(res.error);
      setSavingStatus("IDLE");
    } else {
      toast.success("Kolom berhasil dihapus.");
      setSavingStatus("SAVED");
      setTimeout(() => setSavingStatus("IDLE"), 2000);
    }
  };

  const handleScoreBlur = async (evaluationId: string, originalScore: string | number | null, newValue: string) => {
    const originalStr = originalScore !== null ? originalScore.toString() : "";
    if (newValue === originalStr) return; // No change

    setSavingStatus("SAVING");
    let scoreNum = newValue === "" ? null : parseFloat(newValue);
    if (scoreNum !== null && isNaN(scoreNum)) scoreNum = null;

    const res = await updateEvaluationScoreAction(evaluationId, scoreNum, tenantSlug);
    if (res.error) {
      toast.error("Gagal menyimpan nilai");
      // Revert local state
      setLocalScores(prev => ({ ...prev, [evaluationId]: originalStr }));
      setSavingStatus("IDLE");
    } else {
      setSavingStatus("SAVED");
      setTimeout(() => setSavingStatus("IDLE"), 2000);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModal) return;

    setIsSubmitting(true);
    const res = await updateEvaluationNotesAction(noteModal.id, noteModal.notes || null, tenantSlug);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Catatan disimpan!");
      setNoteModal(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gradebook</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Sistem rekapitulasi nilai siswa.</p>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-4">
        <div className="sm:w-80 flex items-center gap-3">
          <label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Program:</label>
          <CustomSelect
            value={selectedProgramId}
            onChange={setSelectedProgramId}
            placeholder="-- Pilih Program --"
            options={programs.map((p: any) => ({
              value: p.id,
              label: p.name
            }))}
          />
        </div>
      </div>

      {selectedProgramId ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total: <span className="font-bold text-slate-900 dark:text-white">{availableStudents.length} Siswa</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                {savingStatus === "SAVING" && (
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Loader2 size={14} className="animate-spin" /> Auto-Saving...
                  </span>
                )}
                {savingStatus === "SAVED" && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Tersimpan
                  </span>
                )}
              </div>
            </div>
            
            {userRole === "TUTOR" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus size={16} /> Tambah Tugas Baru
              </button>
            )}
          </div>

          {/* Matrix Table */}
          {availableStudents.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-500 text-sm sm:text-base">
              Belum ada siswa yang terdaftar di kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3 sm:px-4 sm:py-4 font-semibold border-b border-r border-slate-200 dark:border-slate-800 min-w-[150px] sm:min-w-[200px] sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">
                      Nama Siswa
                    </th>
                    {columns.length === 0 && (
                      <th className="px-3 py-3 sm:px-4 sm:py-4 font-normal text-slate-400 border-b border-slate-200 dark:border-slate-800 text-center italic text-xs">
                        Belum ada tugas/evaluasi. Klik "Tambah Tugas Baru".
                      </th>
                    )}
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-800 min-w-[140px] text-center align-top group">
                        <div className="flex flex-col items-center gap-1 relative">
                          <div className="flex items-center gap-1.5 justify-center w-full">
                            {getSmallIcon(col.type)}
                            <span className="truncate max-w-[100px]" title={col.title}>{col.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {format(new Date(col.date), 'dd MMM yy', { locale: id })}
                          </span>
                          
                          {/* Hover Delete Button */}
                          {userRole === "TUTOR" && (
                            <button
                              onClick={() => handleDeleteColumn(col.title, col.type)}
                              className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-all shadow-sm"
                              title="Hapus Tugas Ini"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {availableStudents.map((student: any) => (
                    <tr key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-medium text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 transition-colors shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">
                        <div className="truncate max-w-[140px] sm:max-w-[200px]" title={student.full_name}>
                          {student.full_name}
                        </div>
                      </td>
                      
                      {columns.length === 0 && <td className="bg-slate-50/30 dark:bg-slate-900/10"></td>}
                      
                      {columns.map((col, idx) => {
                        // Find evaluation for this student and column
                        const ev = evaluations.find((e: any) => 
                          e.student_id === student.id &&
                          e.program_id === selectedProgramId &&
                          e.evaluation_type === col.type &&
                          e.title.toLowerCase() === col.title.toLowerCase()
                        );

                        if (!ev) {
                          return <td key={idx} className="bg-slate-50/50 dark:bg-slate-900/20 text-center text-slate-300 text-xs">-</td>;
                        }

                        const inputValue = localScores[ev.id] ?? "";
                        const hasNote = !!ev.notes;

                        return (
                          <td key={idx} className="px-1.5 py-1.5 sm:px-2 sm:py-2">
                            <div className="relative flex justify-center items-center gap-1 sm:gap-1.5 group/cell">
                              <input
                                type="number"
                                placeholder="--"
                                value={inputValue}
                                onChange={(e) => setLocalScores(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                onBlur={(e) => handleScoreBlur(ev.id, ev.score, e.target.value)}
                                className={`w-12 sm:w-16 h-8 text-center text-xs sm:text-sm font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  inputValue !== "" 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" 
                                    : "bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                }`}
                              />
                              <button
                                onClick={() => setNoteModal({ id: ev.id, title: col.title, studentName: student.full_name, notes: ev.notes || "" })}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  hasNote 
                                    ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100" 
                                    : "text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-slate-400 dark:hover:bg-slate-800 opacity-0 group-hover/cell:opacity-100"
                                }`}
                                title={hasNote ? "Edit Catatan" : "Tambah Catatan"}
                              >
                                <MessageSquare size={12} />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Pilih Program</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Silakan pilih program dari dropdown di pojok kanan atas untuk melihat dan mengisi rekapitulasi nilai kelas.
          </p>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah Evaluasi / Tugas</h2>
            </div>
            <form onSubmit={handleAddColumn} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Judul Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ujian Harian 1"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis</label>
                <CustomSelect
                  value={formData.evaluationType}
                  onChange={(value) => setFormData({ ...formData, evaluationType: value as any })}
                  options={[
                    { value: "HOMEWORK", label: "PR / Tugas" },
                    { value: "EXAM", label: "Ujian / Kuis" },
                    { value: "MONTHLY_REPORT", label: "Laporan Bulanan (Rapor)" }
                  ]}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Buat Kolom Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Catatan Tutor</h2>
                <p className="text-xs text-slate-500 mt-0.5">{noteModal.studentName} - {noteModal.title}</p>
              </div>
            </div>
            <form onSubmit={handleSaveNotes} className="p-4 space-y-4">
              <textarea
                autoFocus
                placeholder="Tuliskan catatan opsional tentang murid ini (Misal: Telat 5 menit mengumpulkan tugas)"
                value={noteModal.notes}
                onChange={e => setNoteModal({ ...noteModal, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] text-sm resize-none"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteModal(null)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
