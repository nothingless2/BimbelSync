"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Clock,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  ArrowRight,
  Award,
  Calendar,
} from "lucide-react";

interface QuizItem {
  id: string;
  programId?: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  programName: string;
  creatorName: string;
  totalQuestions: number;
  createdAt: string;
  submission: {
    id: string;
    score: number;
    totalCorrect: number;
    totalQuestions: number;
    submittedAt: string;
  } | null;
}

export default function StudentQuizzesClientPage({
  quizzes,
  programs = [],
  tenantSlug,
}: {
  quizzes: QuizItem[];
  programs?: { id: string; name: string }[];
  tenantSlug: string;
}) {
  const searchParams = useSearchParams();
  const queryProgramId = searchParams.get("programId");

  // Default ke query param, atau program pertama siswa jika ada, agar fokus per program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    queryProgramId || (programs.length > 0 ? programs[0].id : "ALL")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentProgramName = currentProgram
    ? currentProgram.name
    : selectedProgramId === "ALL"
    ? "Semua Program"
    : "";

  // Filter kuis berdasarkan program yang dipilih
  const programQuizzes = selectedProgramId === "ALL"
    ? quizzes
    : quizzes.filter((q) => q.programId === selectedProgramId);

  const pendingCount = programQuizzes.filter((q) => !q.submission).length;
  const completedCount = programQuizzes.filter((q) => q.submission).length;

  const filteredQuizzes = programQuizzes.filter((q) => {
    const isCompleted = q.submission !== null;
    const matchesTab =
      filterTab === "ALL" ||
      (filterTab === "PENDING" && !isCompleted) ||
      (filterTab === "COMPLETED" && isCompleted);

    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Program Selector Tabs (Mobile-Friendly Horizontal Pills) */}
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
              const count = quizzes.filter((q) => q.programId === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProgramId(p.id)}
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
              onClick={() => setSelectedProgramId("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedProgramId === "ALL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Kuis</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  selectedProgramId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {quizzes.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-3.5 sm:p-4 space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={
              selectedProgramId !== "ALL" && currentProgramName
                ? `Cari kuis ${currentProgramName}...`
                : "Cari kuis atau program..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Semua ({programQuizzes.length})
          </button>
          <button
            onClick={() => setFilterTab("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Belum Dikerjakan ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
          <FileQuestion size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Belum ada kuis untuk program ${currentProgramName}`
              : "Tidak ada kuis ditemukan"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Tutor untuk program ${currentProgramName} belum merilis kuis online untukmu.`
              : searchQuery
              ? "Coba gunakan kata kunci pencarian yang lain."
              : "Belum ada kuis aktif yang tersedia untuk kategori ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => {
            const isCompleted = quiz.submission !== null;

            return (
              <div
                key={quiz.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Program badge and status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      <BookOpen size={12} />
                      {quiz.programName}
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={12} />
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        <Clock size={12} />
                        Tersedia
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      {quiz.durationMinutes} Menit
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileQuestion size={13} className="text-slate-400" />
                      {quiz.totalQuestions} Soal
                    </span>
                  </div>

                  {/* Score box if completed */}
                  {isCompleted && quiz.submission && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                          Skor Pengerjaan
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {quiz.submission.totalCorrect} dari {quiz.submission.totalQuestions} soal benar
                        </p>
                      </div>
                      <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                        {quiz.submission.score}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/${tenantSlug}/student/quizzes/${quiz.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                      isCompleted
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
                    }`}
                  >
                    <span>{isCompleted ? "Lihat Hasil & Pembahasan" : "Mulai Kerjakan Kuis"}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

