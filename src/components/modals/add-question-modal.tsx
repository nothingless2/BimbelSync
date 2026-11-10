"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { addQuestionAction, updateQuestionAction } from "@/app/[tenantSlug]/dashboard/quizzes/[quizId]/actions";

interface QuestionData {
  id?: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string | null;
  points: number;
}

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  tenantSlug: string;
  initialData?: QuestionData | null;
}

export function AddQuestionModal({
  isOpen,
  onClose,
  quizId,
  tenantSlug,
  initialData,
}: AddQuestionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(10);

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.questionText);
      const opts = [...initialData.options];
      while (opts.length < 4) opts.push("");
      setOptions(opts);
      setCorrectAnswerIndex(initialData.correctAnswerIndex ?? 0);
      setExplanation(initialData.explanation || "");
      setPoints(initialData.points ?? 10);
    } else {
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswerIndex(0);
      setExplanation("");
      setPoints(10);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error("Pertanyaan soal tidak boleh kosong!");
      return;
    }

    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      toast.error("Minimal sediakan 2 opsi pilihan jawaban!");
      return;
    }

    if (correctAnswerIndex >= filledOptions.length) {
      toast.error("Pilihan kunci jawaban tidak valid!");
      return;
    }

    try {
      setIsLoading(true);

      if (initialData?.id) {
        // Update existing question
        const res = await updateQuestionAction({
          questionId: initialData.id,
          quizId,
          questionText,
          options: filledOptions,
          correctAnswerIndex,
          explanation,
          points,
          tenantSlug,
        });
        if (res.error) throw new Error(res.error);
        toast.success("Butir soal berhasil diperbarui!");
      } else {
        // Add new question
        const res = await addQuestionAction({
          quizId,
          questionText,
          options: filledOptions,
          correctAnswerIndex,
          explanation,
          points,
          tenantSlug,
        });
        if (res.error) throw new Error(res.error);
        toast.success("Soal berhasil ditambahkan ke kuis!");
      }

      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan soal.");
    } finally {
      setIsLoading(false);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                {initialData ? "Edit Butir Soal" : "Tambah Butir Soal Baru"}
              </h2>
              <p className="text-xs text-slate-500">Pilihan ganda dengan kunci jawaban otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pertanyaan / Soal <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Tuliskan teks pertanyaan di sini..."
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Pilihan Jawaban & Kunci Benar <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500">Pilih radio untuk menandai kunci</span>
            </div>

            <div className="space-y-2.5">
              {optionLabels.map((lbl, idx) => {
                const isSelected = correctAnswerIndex === idx;
                return (
                  <div
                    key={lbl}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCorrectAnswerIndex(idx)}
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                      title={`Tandai opsi ${lbl} sebagai jawaban benar`}
                    >
                      {lbl}
                    </button>
                    <input
                      type="text"
                      required={idx < 2}
                      value={options[idx] || ""}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Jawaban opsi ${lbl}...`}
                      className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    {isSelected && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pr-2 shrink-0">
                        Kunci Benar
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Points & Explanation row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bobot Poin
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Pembahasan (Opsional)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Penjelasan langkah penyelesaian untuk siswa..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs sm:text-sm resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs sm:text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Butir Soal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

