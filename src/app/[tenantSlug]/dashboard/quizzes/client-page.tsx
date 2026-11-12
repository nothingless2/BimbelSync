"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Search,
  Clock,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Edit,
  SlidersHorizontal,
  FileQuestion,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { AddQuizModal } from "@/components/modals/add-quiz-modal";
import { togglePublishQuizAction, deleteQuizAction } from "./actions";
import { toast } from "@/components/ui/sonner";

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  evaluationType?: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT" | string;
  isPublished: boolean;
  createdAt: string;
  programId: string;
  programName: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar: string | null;
  totalQuestions: number;
  totalSubmissions: number;
  avgScore: number | null;
}

interface QuizzesClientPageProps {
  quizzes: QuizItem[];
  programs: Array<{ id: string; name: string }>;
  tenantSlug: string;
  academyId: string;
  userRole: string;
}

export default function QuizzesClientPage({
  quizzes,
  programs,
  tenantSlug,
  academyId,
  userRole,
}: QuizzesClientPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.programName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = filterProgram === "ALL" || q.programId === filterProgram;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PUBLISHED" && q.isPublished) ||
      (filterStatus === "DRAFT" && !q.isPublished);

    return matchesSearch && matchesProgram && matchesStatus;
  });

  // KPI metrics
  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter((q) => q.isPublished).length;
  const totalSubmissions = quizzes.reduce((acc, q) => acc + q.totalSubmissions, 0);

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    try {
      setTogglingId(quizId);
      const res = await togglePublishQuizAction(quizId, !currentStatus, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success(!currentStatus ? "Kuis berhasil diterbitkan!" : "Kuis diubah ke status draf.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status publikasi.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (quizId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kuis "${title}"?`)) return;
    try {
      setDeletingId(quizId);
      const res = await deleteQuizAction(quizId, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success("Kuis berhasil dihapus!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kuis.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-xl">
              <FileQuestion size={24} />
            </span>
            Kuis & Latihan Soal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola bank soal online, buat kuis interaktif, dan pantau hasil evaluasi otomatis siswa.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 shadow-blue-500/20 w-full sm:w-auto"
        >
          <Plus size={18} />
          Buat Kuis Baru
        </button>
      </div>

      {/* KPI Metrics: Mobile Compact 3-Column / Desktop Cards */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs text-center flex flex-col justify-between min-h-[75px]">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Total Kuis
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalQuizzes}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs text-center flex flex-col justify-between min-h-[75px]">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
            Kuis Aktif
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{publishedQuizzes}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs text-center flex flex-col justify-between min-h-[75px]">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">
            Pengerjaan
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalSubmissions}</p>
        </div>
      </div>

      {/* KPI Cards Desktop (hidden sm:grid) */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Kuis
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <FileQuestion size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalQuizzes}</span>
            <span className="text-xs text-slate-500">paket soal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kuis Aktif (Terbit)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {publishedQuizzes}
            </span>
            <span className="text-xs text-slate-500">dapat dikerjakan siswa</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Pengerjaan Siswa
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalSubmissions}
            </span>
            <span className="text-xs text-slate-500">kali diselesaikan</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari judul kuis, materi, atau program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="w-full md:w-56">
          <CustomSelect
            value={filterProgram}
            onChange={setFilterProgram}
            options={[
              { value: "ALL", label: "Semua Program" },
              ...programs.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="w-full md:w-44">
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "PUBLISHED", label: "Terbit (Aktif)" },
              { value: "DRAFT", label: "Draf" },
            ]}
          />
        </div>
      </div>

      {/* Quizzes List / Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <FileQuestion size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {quizzes.length === 0 ? "Belum Ada Kuis Dibuat" : "Tidak Ada Kuis yang Cocok"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {quizzes.length === 0
              ? "Mulai buat kuis pilihan ganda online untuk melatih pemahaman siswa sesuai program kelas."
              : "Coba ubah kata kunci pencarian atau filter program di atas."}
          </p>
          {quizzes.length === 0 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus size={16} />
              Buat Kuis Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Badge row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      <BookOpen size={12} />
                      {q.programName}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      q.evaluationType === "EXAM"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                    }`}>
                      {q.evaluationType === "EXAM" ? <Star size={10} /> : <BookOpen size={10} />}
                      {q.evaluationType === "EXAM" ? "Ujian & Kuis" : "Tugas & Latihan"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTogglePublish(q.id, q.isPublished)}
                    disabled={togglingId === q.id}
                    title={q.isPublished ? "Klik untuk jadikan Draf" : "Klik untuk Terbitkan"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                      q.isPublished
                        ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {q.isPublished ? (
                      <>
                        <Eye size={12} />
                        Terbit
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} />
                        Draf
                      </>
                    )}
                  </button>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition line-clamp-2">
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {q.description}
                    </p>
                  )}
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Clock size={14} className="text-slate-400" />
                    <span>{q.durationMinutes} Menit</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <FileQuestion size={14} className="text-slate-400" />
                    <span>{q.totalQuestions} Butir Soal</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users size={14} className="text-slate-400" />
                    <span>{q.totalSubmissions} Siswa Selesai</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Award size={14} className="text-amber-500" />
                    <span>
                      Rata-rata:{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {q.avgScore !== null ? q.avgScore : "-"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/${tenantSlug}/dashboard/quizzes/${q.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 rounded-xl text-xs font-semibold transition"
                >
                  <Edit size={14} />
                  <span>Kelola Soal & Hasil</span>
                </Link>

                <button
                  onClick={() => handleDelete(q.id, q.title)}
                  disabled={deletingId === q.id}
                  title="Hapus Kuis"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Quiz Modal */}
      <AddQuizModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tenantSlug={tenantSlug}
        academyId={academyId}
        programs={programs}
      />
    </div>
  );
}

