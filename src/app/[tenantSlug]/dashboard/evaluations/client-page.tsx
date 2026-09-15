"use client";

import { useState } from "react";
import { Plus, Search, Trash2, FileText, BarChart, BookOpen, Star, Save, ClipboardEdit, CheckCircle2, AlertCircle } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { deleteEvaluationAction, createEvaluationAction } from "./actions";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function EvaluationsClientPage({ evaluations, students, programs, tenantSlug, academyId, userRole }: any) {
  const [activeTab, setActiveTab] = useState<"INPUT" | "HISTORY">(userRole === "TUTOR" ? "INPUT" : "HISTORY");
  
  // HISTORY STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // INPUT STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    programId: "",
    title: "",
    evaluationType: "EXAM" as "EXAM" | "HOMEWORK" | "MONTHLY_REPORT",
  });
  
  // Single Input State
  const [singleInput, setSingleInput] = useState({ score: "", notes: "" });

  // HISTORY LOGIC
  const filteredEvaluations = evaluations.filter((e: any) => {
    const searchString = searchQuery.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(searchString) || 
                        e.student?.full_name.toLowerCase().includes(searchString);
    const matchType = filterType === "ALL" || e.evaluation_type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus penilaian ini?")) return;
    try {
      setDeletingId(id);
      const res = await deleteEvaluationAction(id, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success("Penilaian berhasil dihapus!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus penilaian");
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    if (type === "EXAM") return <Star size={24} className="text-yellow-500" />;
    if (type === "HOMEWORK") return <BookOpen size={24} className="text-emerald-500" />;
    return <BarChart size={24} className="text-blue-500" />; // MONTHLY_REPORT
  };

  const getSmallIcon = (type: string) => {
    if (type === "EXAM") return <Star size={16} />;
    if (type === "HOMEWORK") return <BookOpen size={16} />;
    return <BarChart size={16} />; 
  };

  const formatScore = (score: string | number | null) => {
    if (score === null || score === undefined) return "-";
    const num = typeof score === 'string' ? parseFloat(score) : score;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  // INPUT LOGIC
  const availableStudents = formData.programId
    ? students.filter((s: any) => s.enrollments.some((e: any) => e.program_id === formData.programId))
    : [];

  const handleSaveSingleEvaluation = async (studentId: string) => {
    if (!formData.programId || !formData.title.trim()) {
      toast.error("Program dan Judul Evaluasi harus diisi!");
      return;
    }

    setIsSubmitting(true);
    const res = await createEvaluationAction({
      academyId,
      studentId,
      programId: formData.programId,
      title: formData.title.trim(),
      evaluationType: formData.evaluationType,
      score: singleInput.score ? parseFloat(singleInput.score) : undefined,
      notes: singleInput.notes || undefined,
      tenantSlug,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Nilai berhasil disimpan!");
      setEditingStudentId(null);
      setSingleInput({ score: "", notes: "" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola nilai, PR, dan rapor evaluasi bulanan siswa.</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {userRole === "TUTOR" && (
          <button
            onClick={() => setActiveTab("INPUT")}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "INPUT"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ClipboardEdit size={18} />
            Tracker Penilaian
          </button>
        )}
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "HISTORY"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FileText size={18} />
          Riwayat Penilaian
        </button>
      </div>

      {/* INPUT TAB CONTENT */}
      {activeTab === "INPUT" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Program / Kelas</label>
                <select
                  value={formData.programId}
                  onChange={e => setFormData({ ...formData, programId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>-- Pilih Program --</option>
                  {programs.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis Evaluasi</label>
                <select
                  value={formData.evaluationType}
                  onChange={e => setFormData({ ...formData, evaluationType: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="HOMEWORK">PR / Tugas</option>
                  <option value="EXAM">Ujian / Kuis</option>
                  <option value="MONTHLY_REPORT">Laporan Bulanan (Rapor)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Judul Penilaian</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Misal: Kuis Matriks 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {formData.programId && (
              <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Daftar Siswa</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                      {availableStudents.length} Siswa
                    </span>
                  </div>
                  
                  {formData.title.trim() ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Menampilkan status untuk: <span className="font-semibold text-blue-600 dark:text-blue-400">{formData.title}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-red-500 font-medium flex items-center gap-1.5">
                      <AlertCircle size={14} /> Isi Judul Penilaian terlebih dahulu
                    </div>
                  )}
                </div>
                
                {availableStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada siswa yang terdaftar di program ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Nama Siswa</th>
                          <th className="px-6 py-3 font-semibold text-center w-48">Status Penilaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
                        {availableStudents.map((student: any) => {
                          // Check if evaluation exists
                          const existingEval = evaluations.find((e: any) => 
                            e.student_id === student.id &&
                            e.program_id === formData.programId &&
                            e.evaluation_type === formData.evaluationType &&
                            e.title.toLowerCase() === formData.title.trim().toLowerCase()
                          );

                          const isEditing = editingStudentId === student.id;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                                {student.full_name}
                              </td>
                              <td className="px-6 py-4">
                                {!formData.title.trim() ? (
                                  <div className="text-center text-slate-400 text-xs italic">-</div>
                                ) : isEditing ? (
                                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <input
                                      type="number"
                                      placeholder="Nilai (0-100)"
                                      value={singleInput.score}
                                      onChange={(e) => setSingleInput({...singleInput, score: e.target.value})}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Catatan..."
                                      value={singleInput.notes}
                                      onChange={(e) => setSingleInput({...singleInput, notes: e.target.value})}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <div className="flex gap-2 justify-end mt-1">
                                      <button 
                                        onClick={() => setEditingStudentId(null)}
                                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                                      >
                                        Batal
                                      </button>
                                      <button 
                                        onClick={() => handleSaveSingleEvaluation(student.id)}
                                        disabled={isSubmitting}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 font-medium disabled:opacity-50"
                                      >
                                        <Save size={12} /> Simpan
                                      </button>
                                    </div>
                                  </div>
                                ) : existingEval ? (
                                  <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                                      <CheckCircle2 size={16} />
                                      <span className="font-bold">{formatScore(existingEval.score)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <button 
                                      onClick={() => {
                                        setEditingStudentId(student.id);
                                        setSingleInput({ score: "", notes: "" });
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-colors group"
                                    >
                                      <span className="group-hover:hidden flex items-center gap-1.5">
                                        <AlertCircle size={16} /> <span className="text-xs font-semibold">Belum Dinilai</span>
                                      </span>
                                      <span className="hidden group-hover:flex items-center gap-1.5">
                                        {getSmallIcon(formData.evaluationType)} <span className="text-xs font-semibold">Beri Nilai</span>
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama siswa atau judul evaluasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="EXAM">Ujian / Kuis</option>
                <option value="HOMEWORK">PR / Tugas</option>
                <option value="MONTHLY_REPORT">Evaluasi Bulanan</option>
              </select>
            </div>
          </div>

          {filteredEvaluations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Belum ada evaluasi</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Tidak ada data penilaian yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.map((evaluation: any) => (
                <div key={evaluation.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        {getIcon(evaluation.evaluation_type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1" title={evaluation.title}>
                          {evaluation.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(evaluation.created_at), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </div>
                    </div>
                    {userRole === 'TUTOR' && (
                      <button 
                        onClick={() => handleDelete(evaluation.id)}
                        disabled={deletingId === evaluation.id}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Siswa</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{evaluation.student?.full_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nilai</p>
                        <p className="font-black text-blue-600 dark:text-blue-400 text-xl">{formatScore(evaluation.score)}</p>
                      </div>
                    </div>
                    {evaluation.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Catatan</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic line-clamp-2">"{evaluation.notes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md max-w-[150px] truncate">
                      {evaluation.program?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {evaluation.evaluator?.name?.split(' ')[0] || "Staff"}
                      </span>
                      <UserAvatar id={evaluation.evaluator?.id || ""} email={evaluation.evaluator?.email} avatarUrl={evaluation.evaluator?.avatar_url} size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
