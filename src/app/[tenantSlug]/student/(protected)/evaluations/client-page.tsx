"use client";

import { useState } from "react";
import { Star, BookOpen, BarChart, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pagination } from "@/components/ui/pagination";

export default function StudentEvaluationsClientPage({ evaluations }: { evaluations: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(evaluations.length / itemsPerPage);
  
  const currentData = evaluations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getIcon = (type: string) => {
    if (type === "EXAM") return <Star size={24} className="text-yellow-500" />;
    if (type === "HOMEWORK") return <BookOpen size={24} className="text-emerald-500" />;
    return <BarChart size={24} className="text-blue-500" />;
  };

  const getTypeName = (type: string) => {
    if (type === "EXAM") return "Ujian / Kuis";
    if (type === "HOMEWORK") return "Tugas / PR";
    return "Evaluasi Bulanan";
  };

  const formatScore = (score: string | number | null) => {
    if (score === null || score === undefined) return "-";
    const num = typeof score === 'string' ? parseFloat(score) : score;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


      {evaluations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Belum ada nilai</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Tutor belum memberikan penilaian untukmu saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentData.map((evaluation: any) => (
            <div key={evaluation.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0">
                    {getIcon(evaluation.evaluation_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">
                      {evaluation.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{getTypeName(evaluation.evaluation_type)}</span>
                      <span>•</span>
                      <span>{format(new Date(evaluation.created_at), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700 text-center shrink-0">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Nilai</span>
                  <span className="block text-xl font-black text-slate-800 dark:text-white">{formatScore(evaluation.score)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Catatan Tutor</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {evaluation.notes || <span className="text-slate-400 italic">Tidak ada catatan</span>}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Program</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {evaluation.program?.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tutor: {evaluation.evaluator?.name || evaluation.evaluator?.email || 'Tutor'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={evaluations.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
      )}
    </div>
  );
}
