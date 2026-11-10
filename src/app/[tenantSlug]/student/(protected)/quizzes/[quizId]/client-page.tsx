"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Check,
  X as CloseIcon,
  Sparkles,
  Award,
} from "lucide-react";
import { submitQuizAction } from "../actions";
import { toast } from "@/components/ui/sonner";

interface QuizQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  points: number;
  orderIndex: number;
  correctAnswerIndex?: number;
  explanation?: string | null;
}

interface SubmissionData {
  id: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  answers: Record<string, number>;
  submittedAt: string;
}

interface StudentQuizPlayProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    programName: string;
  };
  questions: QuizQuestionItem[];
  submission: SubmissionData | null;
  tenantSlug: string;
}

export default function StudentQuizPlayClientPage({
  quiz,
  questions,
  submission,
  tenantSlug,
}: StudentQuizPlayProps) {
  const router = useRouter();

  // If already submitted, student is in Review Mode
  const isReviewMode = submission !== null;

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer state (duration in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(quiz.durationMinutes * 60);
  const isTimeUpRef = useRef(false);

  useEffect(() => {
    if (isReviewMode) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isTimeUpRef.current) {
            isTimeUpRef.current = true;
            toast.error("Waktu pengerjaan telah habis! Jawaban Anda otomatis dikumpulkan.");
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReviewMode]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isReviewMode) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await submitQuizAction({
        quizId: quiz.id,
        answers,
        tenantSlug,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Kuis berhasil dikumpulkan!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengumpulkan kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await submitQuizAction({
        quizId: quiz.id,
        answers,
        tenantSlug,
      });
      if (res.error) throw new Error(res.error);
      toast.success(`Kuis selesai! Skor kamu: ${res.score}/100`);
      setIsSubmitModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengumpulkan kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  // Format countdown minutes & seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const isLowTime = secondsRemaining < 300; // < 5 minutes
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

  // -------------------------------------------------------------
  // REVIEW MODE (Sudah Selesai Mengerjakan)
  // -------------------------------------------------------------
  if (isReviewMode && submission) {
    const isPassing = submission.score >= 70;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href={`/${tenantSlug}/student/quizzes`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Daftar Kuis
          </Link>

          {/* Result Score Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center font-extrabold text-3xl shadow-lg mb-4 ${
                isPassing
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-amber-500 text-white shadow-amber-500/20"
              }`}
            >
              <span>{submission.score}</span>
              <span className="text-[10px] font-medium opacity-90">/ 100</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {isPassing ? "Luar Biasa, Kamu Tuntas!" : "Tetap Semangat & Pelajari Lagi!"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Kamu berhasil menjawab benar{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {submission.totalCorrect} dari {submission.totalQuestions} soal
              </strong>{" "}
              pada kuis <span className="font-semibold text-blue-600">{quiz.title}</span>.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Sparkles size={14} />
              Nilai otomatis tersinkronisasi ke E-Rapor Evaluasimu
            </div>
          </div>

          {/* Question by Question Review */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Pembahasan Butir Soal ({questions.length})
            </h2>

            {questions.map((q, idx) => {
              const studentAnswer = submission.answers[q.id];
              const isCorrect = studentAnswer !== undefined && studentAnswer === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      Soal #{idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <Check size={12} /> Benar (+{q.points} poin)
                        </>
                      ) : (
                        <>
                          <CloseIcon size={12} /> Salah (0 poin)
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                    {q.questionText}
                  </p>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isStudentPick = studentAnswer === optIdx;
                      const isKey = q.correctAnswerIndex === optIdx;

                      let borderClass = "border-slate-200 dark:border-slate-800";
                      let bgClass = "bg-slate-50 dark:bg-slate-800/40";
                      let badge = null;

                      if (isKey) {
                        borderClass = "border-emerald-500";
                        bgClass = "bg-emerald-50/50 dark:bg-emerald-950/30";
                        badge = (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Kunci Benar
                          </span>
                        );
                      }

                      if (isStudentPick && !isCorrect) {
                        borderClass = "border-red-500";
                        bgClass = "bg-red-50/50 dark:bg-red-950/30";
                        badge = (
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0">
                            Pilihanmu (Salah)
                          </span>
                        );
                      } else if (isStudentPick && isCorrect) {
                        badge = (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Pilihanmu (Benar)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs sm:text-sm ${borderClass} ${bgClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                isKey
                                  ? "bg-emerald-600 text-white"
                                  : isStudentPick && !isCorrect
                                  ? "bg-red-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {optionLabels[optIdx] || optIdx + 1}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200">{opt}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation note */}
                  {q.explanation && (
                    <div className="mt-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                      <strong>Pembahasan Tutor: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUIZ TAKING MODE (Sedang Mengerjakan)
  // -------------------------------------------------------------
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-10 px-4 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <FileQuestion size={44} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Kuis Belum Memiliki Soal</h2>
          <p className="text-xs text-slate-500">
            Tutor belum menginput butir soal untuk kuis ini. Silakan cek kembali nanti.
          </p>
          <Link
            href={`/${tenantSlug}/student/quizzes`}
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Daftar Kuis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 pt-4 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Sticky Top Header with Timer */}
        <div className="sticky top-2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {quiz.programName}
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
              {quiz.title}
            </h1>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-sm transition ${
              isLowTime
                ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            }`}
          >
            <Clock size={16} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>
        </div>

        {/* Question Navigator Pills */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Nomor Soal</span>
            <span className="text-xs text-slate-500 font-medium">
              Terjawab: <strong className="text-blue-600">{answeredCount}</strong> / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs shrink-0 transition flex items-center justify-center ${
                    isCurrent
                      ? "ring-2 ring-blue-600 bg-blue-600 text-white"
                      : isAnswered
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Box */}
        {currentQuestion && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Soal {currentIndex + 1} dari {questions.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Bobot: {currentQuestion.points} Poin
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {/* Options Radio List */}
            <div className="space-y-2.5 pt-2">
              {currentQuestion.options.map((optionText, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {optionLabels[optIdx] || optIdx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium flex-1">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Previous & Next Controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ChevronLeft size={16} />
            <span>Sebelumnya</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <span>Selesai & Kumpulkan</span>
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar for Quick Submit */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Terjawab: <strong className="text-slate-800 dark:text-white">{answeredCount}</strong> dari{" "}
            {questions.length} soal
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
          >
            <Send size={14} />
            <span>Kumpulkan Kuis</span>
          </button>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                <Send size={22} />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kumpulkan Jawaban Kuis?
              </h3>
              <p className="text-xs text-slate-500">
                Kamu telah menjawab{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {answeredCount} dari {questions.length} soal
                </strong>
                .
              </p>
              {answeredCount < questions.length && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Masih ada {questions.length - answeredCount} butir soal yang belum kamu jawab.
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs sm:text-sm transition"
              >
                Cek Lagi
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleManualSubmit}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menilai...</span>
                  </>
                ) : (
                  <span>Ya, Kumpulkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

