"use client";

import { useState } from "react";
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
  tenantSlug,
}: {
  quizzes: QuizItem[];
  tenantSlug: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const isCompleted = q.submission !== null;
    const matchesTab =
      filterTab === "ALL" ||
      (filterTab === "PENDING" && !isCompleted) ||
      (filterTab === "COMPLETED" && isCompleted);

    return matchesSearch && matchesTab;
  });

  const pendingCount = quizzes.filter((q) => !q.submission).length;
  const completedCount = quizzes.filter((q) => q.submission).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search and Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari kuis atau program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Semua ({quizzes.length})
          </button>
          <button
            onClick={() => setFilterTab("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "PENDING"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Belum Dikerjakan ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              filterTab === "COMPLETED"
                ? "bg-blue-600 text-white shadow-sm"
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
            {quizzes.length === 0 ? "Belum Ada Kuis Tersedia" : "Tidak Ada Kuis yang Sesuai"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {quizzes.length === 0
              ? "Tutor belum menerbitkan latihan kuis online untuk program bimbingan belajarmu."
              : "Coba ganti filter tab atau kata kunci pencarian di atas."}
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

