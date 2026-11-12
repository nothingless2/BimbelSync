"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Users,
  Award,
  Eye,
  EyeOff,
  AlertCircle,
  FileQuestion,
  Check,
  X as CloseIcon,
  Star,
} from "lucide-react";
import { AddQuestionModal } from "@/components/modals/add-question-modal";
import { deleteQuestionAction } from "./actions";
import { togglePublishQuizAction } from "../actions";
import { toast } from "@/components/ui/sonner";
import { MathText } from "@/components/math-text";

interface QuestionItem {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string | null;
  points: number;
  orderIndex: number;
}

interface SubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  studentUsername: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  answers: Record<string, number>;
  submittedAt: string;
}

interface EnrolledStudent {
  id: string;
  name: string;
  username: string;
}

interface QuizDetailProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    evaluationType?: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT" | string;
    isPublished: boolean;
    programId: string;
    programName: string;
    creatorName: string;
    createdAt: string;
  };
  questions: QuestionItem[];
  submissions: SubmissionItem[];
  enrolledStudents: EnrolledStudent[];
  tenantSlug: string;
}

export default function QuizDetailClientPage({
  quiz,
  questions,
  submissions,
  enrolledStudents,
  tenantSlug,
}: QuizDetailProps) {
  const [activeTab, setActiveTab] = useState<"questions" | "submissions">("questions");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Identify students who haven't submitted yet
  const submittedStudentIds = new Set(submissions.map((s) => s.studentId));
  const pendingStudents = enrolledStudents.filter((st) => !submittedStudentIds.has(st.id));

  // Analytics
  const scores = submissions.map((s) => s.score);
  const avgScore =
    scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus butir soal ini?")) return;
    try {
      setDeletingQuestionId(qId);
      const res = await deleteQuestionAction(qId, quiz.id, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success("Butir soal berhasil dihapus!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus butir soal.");
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setIsTogglingPublish(true);
      const res = await togglePublishQuizAction(quiz.id, !quiz.isPublished, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success(!quiz.isPublished ? "Kuis berhasil diterbitkan!" : "Kuis dijadikan draf.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status publikasi.");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Back button & Breadcrumbs */}
      <div>
        <Link
          href={`/${tenantSlug}/dashboard/quizzes`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Kuis
        </Link>
      </div>

      {/* Quiz Header Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                <BookOpen size={12} />
                {quiz.programName}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                quiz.evaluationType === "EXAM"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
              }`}>
                {quiz.evaluationType === "EXAM" ? <Star size={12} /> : <BookOpen size={12} />}
                {quiz.evaluationType === "EXAM" ? "Ujian & Kuis" : "Tugas & Latihan"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <Clock size={12} />
                {quiz.durationMinutes} Menit
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <FileQuestion size={12} />
                {questions.length} Butir Soal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePublish}
              disabled={isTogglingPublish}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                quiz.isPublished
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {quiz.isPublished ? (
                <>
                  <Eye size={16} />
                  <span>Kuis Terbit (Aktif)</span>
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  <span>Draf (Nonaktif)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("questions")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "questions"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileQuestion size={16} />
            <span>Kelola Soal</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">
              {questions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "submissions"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users size={16} />
            <span>Hasil & Pengerjaan Siswa</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">
              {submissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Questions Management */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Daftar Butir Soal ({questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Soal pilihan ganda yang akan dikerjakan siswa secara interaktif.
              </p>
            </div>
            <button
              onClick={handleOpenAddQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Plus size={16} />
              <span>Tambah Butir Soal</span>
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <HelpCircle size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum ada butir soal di kuis ini
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Klik tombol &quot;Tambah Butir Soal&quot; untuk memasukkan pertanyaan pilihan ganda, opsi jawaban, dan kunci nilai.
              </p>
              <button
                onClick={handleOpenAddQuestion}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                <Plus size={16} />
                Tambah Butir Soal Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                >
                  {/* Question header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {q.points} Poin
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                        title="Edit Soal"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={deletingQuestionId === q.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Hapus Soal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    <MathText text={q.questionText} />
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctAnswerIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs sm:text-sm transition ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-semibold"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {optionLabels[optIdx] || optIdx + 1}
                          </span>
                          <div className="flex-1">
                            <MathText text={opt} />
                          </div>
                          {isCorrect && (
                            <Check size={14} className="text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation (if provided) */}
                  {q.explanation && (
                    <div className="pt-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-700 dark:text-slate-300">Pembahasan: </strong>
                      <MathText text={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Submissions & Analytics */}
      {activeTab === "submissions" && (
        <div className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Siswa Selesai</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {submissions.length}
                </span>
                <span className="text-xs text-slate-500">/ {enrolledStudents.length} siswa</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Rata-rata Skor</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {avgScore}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Nilai Tertinggi</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {maxScore}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Nilai Terendah</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {minScore}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Daftar Siswa yang Sudah Mengerjakan ({submissions.length})
              </h3>
              <p className="text-xs text-slate-500">
                Nilai otomatis disinkronkan ke E-Rapor dan capaian belajar siswa.
              </p>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
                Belum ada siswa yang mengumpulkan pengerjaan kuis ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nama Siswa</th>
                      <th className="px-4 py-3">Waktu Selesai</th>
                      <th className="px-4 py-3 text-center">Jawaban Benar</th>
                      <th className="px-4 py-3 text-center">Skor Akhir</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {submissions.map((sub) => {
                      const isPassing = sub.score >= 70;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {sub.studentName}
                            </div>
                            <div className="text-xs text-slate-500">@{sub.studentUsername}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {new Date(sub.submittedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center font-medium">
                            {sub.totalCorrect} / {sub.totalQuestions}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block font-extrabold text-sm px-2.5 py-1 rounded-xl ${
                                isPassing
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              {sub.score}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isPassing
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              }`}
                            >
                              {isPassing ? "Tuntas" : "Remedial"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Students (Enrolled but haven't taken) */}
          {pendingStudents.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Siswa Belum Mengerjakan ({pendingStudents.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Siswa aktif di program {quiz.programName} yang belum menyelesaikan kuis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {pendingStudents.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {st.name}
                      </p>
                      <p className="text-[11px] text-slate-400">@{st.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      <AddQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        quizId={quiz.id}
        tenantSlug={tenantSlug}
        initialData={editingQuestion}
      />
    </div>
  );
}

