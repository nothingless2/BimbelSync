"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeft, Calculator, Download, Settings2, BarChart, BookOpen, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";
import { updateProgramWeightsAction } from "../actions";

export default function GradebookClientPage({ tenantSlug, program, students, evaluations, userRole }: any) {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightExam, setWeightExam] = useState(program.weight_exam || 70);
  const [weightHomework, setWeightHomework] = useState(program.weight_homework || 30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive unique columns from published evaluations
  const columns = useMemo(() => {
    const cols = new Map<string, any>();
    evaluations.forEach((e: any) => {
      const key = `${e.title.toLowerCase()}_${e.evaluation_type}`;
      if (!cols.has(key)) {
        cols.set(key, { title: e.title, type: e.evaluation_type, date: e.created_at });
      }
    });
    return Array.from(cols.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [evaluations]);

  const examCols = columns.filter(c => c.type === "EXAM");
  const hwCols = columns.filter(c => c.type === "HOMEWORK");

  // Calculate student averages and final grade
  const gradebookData = useMemo(() => {
    return students.map((student: any) => {
      const studentEvals = evaluations.filter((e: any) => e.student_id === student.id);
      
      const exams = studentEvals.filter((e: any) => e.evaluation_type === "EXAM" && e.score !== null);
      const hws = studentEvals.filter((e: any) => e.evaluation_type === "HOMEWORK" && e.score !== null);

      const examAvg = exams.length > 0 
        ? exams.reduce((sum: number, e: any) => sum + Number(e.score), 0) / exams.length 
        : 0;
      
      const hwAvg = hws.length > 0 
        ? hws.reduce((sum: number, e: any) => sum + Number(e.score), 0) / hws.length 
        : 0;

      const finalGrade = (examAvg * (program.weight_exam / 100)) + (hwAvg * (program.weight_homework / 100));

      return {
        ...student,
        evaluations: studentEvals,
        examAvg,
        hwAvg,
        finalGrade
      };
    });
  }, [students, evaluations, program.weight_exam, program.weight_homework]);

  const handleUpdateWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weightExam + weightHomework !== 100) {
      toast.error("Total bobot harus tepat 100%!");
      return;
    }
    
    setIsSubmitting(true);
    const res = await updateProgramWeightsAction(program.id, weightExam, weightHomework, tenantSlug);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Bobot penilaian berhasil diperbarui!");
      setIsWeightModalOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href={`/${tenantSlug}/dashboard/evaluations`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2">
            <ArrowLeft size={16} /> Kembali ke Mode Input
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Gradebook Akhir
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Program: <strong className="text-slate-700 dark:text-slate-300">{program.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(userRole === "ADMIN" || userRole === "SUPERADMIN") && (
            <button
              onClick={() => setIsWeightModalOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Settings2 size={16} /> Atur Bobot Penilaian
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Download size={16} /> Ekspor PDF / Cetak
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Bobot Ujian (Kuis/UAS)</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{program.weight_exam}%</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Bobot PR (Tugas Harian)</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{program.weight_homework}%</span>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <Calculator size={14} /> Nilai Akhir otomatis dihitung berdasarkan bobot.
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 text-sm sm:text-base">
            Belum ada siswa yang terdaftar di kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 font-semibold border-b border-r border-slate-200 dark:border-slate-800 min-w-[150px] sticky left-0 z-20 bg-slate-50 dark:bg-slate-900">
                    Nama Siswa
                  </th>
                  
                  {examCols.length > 0 && (
                    <th colSpan={examCols.length} className="px-4 py-2 font-semibold border-b border-r border-slate-200 dark:border-slate-800 text-center bg-yellow-50/50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-500">
                      Ujian & Kuis ({program.weight_exam}%)
                    </th>
                  )}
                  {hwCols.length > 0 && (
                    <th colSpan={hwCols.length} className="px-4 py-2 font-semibold border-b border-r border-slate-200 dark:border-slate-800 text-center bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-500">
                      PR & Tugas ({program.weight_homework}%)
                    </th>
                  )}
                  
                  <th className="px-3 py-3 sm:px-4 sm:py-4 font-bold border-b border-slate-200 dark:border-slate-800 min-w-[120px] text-center sticky right-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-[-1px_0_0_0_#e2e8f0] dark:shadow-[-1px_0_0_0_#1e293b]">
                    NILAI AKHIR
                  </th>
                </tr>
                {/* Sub-header for individual tasks */}
                <tr>
                  <th className="px-3 py-2 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900"></th>
                  {examCols.map((col, idx) => (
                    <th key={`exam-${idx}`} className="px-2 py-2 font-medium border-b border-slate-200 dark:border-slate-800 text-center max-w-[100px] truncate" title={col.title}>
                      {col.title}
                    </th>
                  ))}
                  {hwCols.map((col, idx) => (
                    <th key={`hw-${idx}`} className="px-2 py-2 font-medium border-b border-slate-200 dark:border-slate-800 text-center max-w-[100px] truncate" title={col.title}>
                      {col.title}
                    </th>
                  ))}
                  <th className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 sticky right-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-[-1px_0_0_0_#e2e8f0] dark:shadow-[-1px_0_0_0_#1e293b]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {gradebookData.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-3 py-3 sm:px-4 sm:py-3 font-medium text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50">
                      {student.full_name}
                    </td>
                    
                    {/* Exam Scores */}
                    {examCols.map((col, idx) => {
                      const ev = student.evaluations.find((e: any) => e.evaluation_type === col.type && e.title === col.title);
                      return (
                        <td key={`sc-exam-${idx}`} className="px-2 py-2 text-center text-slate-700 dark:text-slate-300">
                          {ev?.score ?? "-"}
                        </td>
                      );
                    })}

                    {/* HW Scores */}
                    {hwCols.map((col, idx) => {
                      const ev = student.evaluations.find((e: any) => e.evaluation_type === col.type && e.title === col.title);
                      return (
                        <td key={`sc-hw-${idx}`} className="px-2 py-2 text-center text-slate-700 dark:text-slate-300">
                          {ev?.score ?? "-"}
                        </td>
                      );
                    })}

                    <td className="px-3 py-3 sm:px-4 sm:py-3 text-center sticky right-0 z-10 bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 shadow-[-1px_0_0_0_#e2e8f0] dark:shadow-[-1px_0_0_0_#1e293b] font-bold text-lg text-blue-600 dark:text-blue-400">
                      {student.finalGrade.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weight Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Atur Bobot Penilaian</h2>
            </div>
            <form onSubmit={handleUpdateWeights} className="p-5 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Bobot Ujian (EXAM) <span>{weightExam}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightExam}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWeightExam(val);
                      setWeightHomework(100 - val);
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Bobot PR (HOMEWORK) <span>{weightHomework}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightHomework}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWeightHomework(val);
                      setWeightExam(100 - val);
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Bobot:</span>
                  <span className={`text-lg font-bold ${weightExam + weightHomework === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {weightExam + weightHomework}%
                  </span>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (weightExam + weightHomework !== 100)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Bobot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
