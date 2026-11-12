"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Star, BookOpen, BarChart, FileText, Award, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pagination } from "@/components/ui/pagination";

export default function StudentEvaluationsClientPage({
  evaluations,
  programs = [],
}: {
  evaluations: any[];
  programs?: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const queryProgramId = searchParams.get("programId");

  // Default ke program query param, atau program pertama siswa jika ada, agar fokus per program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    queryProgramId || (programs.length > 0 ? programs[0].id : "ALL")
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Evaluasi difilter berdasarkan program yang dipilih
  const programEvaluations = selectedProgramId === "ALL"
    ? evaluations
    : evaluations.filter((e) => e.program_id === selectedProgramId);

  // Filter lanjutan berdasarkan jenis evaluasi
  const filteredEvaluations = selectedType === "ALL"
    ? programEvaluations
    : programEvaluations.filter((e) => e.evaluation_type === selectedType);

  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);
  const currentData = filteredEvaluations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentProgramName = currentProgram
    ? currentProgram.name
    : selectedProgramId === "ALL"
    ? "Semua Program"
    : "";

  // Kalkulasi statistik untuk program yang sedang dipilih
  const scoredEvals = programEvaluations.filter((e) => e.score !== null);
  const averageScore = scoredEvals.length > 0
    ? scoredEvals.reduce((acc, curr) => acc + Number(curr.score), 0) / scoredEvals.length
    : null;

  const examEvals = programEvaluations.filter((e) => e.evaluation_type === "EXAM" && e.score !== null);
  const examAverage = examEvals.length > 0
    ? examEvals.reduce((acc, curr) => acc + Number(curr.score), 0) / examEvals.length
    : null;

  const hwEvals = programEvaluations.filter((e) => e.evaluation_type === "HOMEWORK" && e.score !== null);
  const hwAverage = hwEvals.length > 0
    ? hwEvals.reduce((acc, curr) => acc + Number(curr.score), 0) / hwEvals.length
    : null;

  const getIcon = (type: string) => {
    if (type === "EXAM") return <Star size={22} className="text-amber-500" />;
    if (type === "HOMEWORK") return <BookOpen size={22} className="text-emerald-500" />;
    return <BarChart size={22} className="text-blue-500" />;
  };

  const getTypeName = (type: string) => {
    if (type === "EXAM") return "Ujian & Kuis";
    if (type === "HOMEWORK") return "Tugas & Latihan";
    return "Laporan Bulanan";
  };

  const formatScore = (score: string | number | null) => {
    if (score === null || score === undefined) return "-";
    const num = typeof score === "string" ? parseFloat(score) : score;
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Selector Program Belajar (Mobile-Friendly Horizontal Pill Tabs) */}
      {programs.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pilih Program Belajar:
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {currentProgramName}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {programs.map((p) => {
              const isSelected = selectedProgramId === p.id;
              const count = evaluations.filter((e) => e.program_id === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgramId(p.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                  <span>{p.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setSelectedProgramId("ALL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedProgramId === "ALL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Program</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  selectedProgramId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {evaluations.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Ringkasan Nilai Program (Mini Snapshot Card) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              Rata-rata Nilai
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {averageScore !== null ? `${averageScore.toFixed(0)}/100` : "—"}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {scoredEvals.length} dari {programEvaluations.length} dinilai
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              Ujian & Kuis
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {examAverage !== null ? `${examAverage.toFixed(0)}/100` : "—"}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {examEvals.length} ujian dinilai
            </span>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Tugas & Latihan
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {hwAverage !== null ? `${hwAverage.toFixed(0)}/100` : "—"}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {hwEvals.length} tugas dinilai
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Total Tugas
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {programEvaluations.length}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
              {currentProgramName || "Semua"}
            </span>
          </div>
        </div>

        {/* Filter Kategori Tugas (Ujian vs Tugas vs Semua) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSelectedType("ALL");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              selectedType === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Semua Tipe ({programEvaluations.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("EXAM");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              selectedType === "EXAM"
                ? "bg-amber-500 text-white font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Ujian & Kuis ({programEvaluations.filter((e) => e.evaluation_type === "EXAM").length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("HOMEWORK");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              selectedType === "HOMEWORK"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Tugas & Latihan ({programEvaluations.filter((e) => e.evaluation_type === "HOMEWORK").length})
          </button>
        </div>
      </div>

      {/* List Evaluasi Tugas */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
          <FileText size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Belum ada nilai untuk program ${currentProgramName}`
              : "Belum ada nilai"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Tutor untuk program ${currentProgramName} belum menerbitkan evaluasi untukmu.`
              : "Tutor belum memberikan penilaian untukmu saat ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {currentData.map((evaluation: any) => (
            <div
              key={evaluation.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0">
                    {getIcon(evaluation.evaluation_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                      {evaluation.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {getTypeName(evaluation.evaluation_type)}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(evaluation.created_at), "dd MMM yyyy", { locale: id })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3.5 py-1.5 sm:px-4 sm:py-2 border border-slate-100 dark:border-slate-700 text-center shrink-0">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Nilai</span>
                  <span className="block text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                    {formatScore(evaluation.score)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Catatan Tutor</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {evaluation.notes || <span className="text-slate-400 italic">Tidak ada catatan</span>}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Program</p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {evaluation.program?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tutor: {evaluation.evaluator?.name || evaluation.evaluator?.email || "Tutor"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredEvaluations.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
