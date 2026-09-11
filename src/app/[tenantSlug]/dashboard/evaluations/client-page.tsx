"use client";

import { useState } from "react";
import { Plus, Search, Trash2, FileText, BarChart, BookOpen, Star } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { deleteEvaluationAction } from "./actions";
import { toast } from "@/components/ui/sonner";
import { AddEvaluationModal } from "@/components/modals/add-evaluation-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function EvaluationsClientPage({ evaluations, students, programs, tenantSlug, academyId, userRole }: any) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formatScore = (score: string | number | null) => {
    if (score === null || score === undefined) return "-";
    const num = typeof score === 'string' ? parseFloat(score) : score;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Progress</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola nilai, PR, dan rapor evaluasi bulanan siswa.</p>
        </div>
        {userRole === 'TUTOR' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Input Nilai
          </button>
        )}
      </div>

      {/* Toolbar Filter */}
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

      {/* Evaluations Grid */}
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

      <AddEvaluationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        tenantSlug={tenantSlug} 
        academyId={academyId}
        students={students}
        programs={programs}
      />
    </div>
  );
}
