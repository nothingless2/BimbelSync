"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle,
  HelpCircle,
  Eye,
  PenTool,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  CornerDownRight,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { addQuestionAction, updateQuestionAction } from "@/app/[tenantSlug]/dashboard/quizzes/[quizId]/actions";
import { MathText } from "@/components/math-text";

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
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit");
  const [activeCategory, setActiveCategory] = useState<"matrix" | "math" | "symbols" | "lang">("matrix");

  // Melacak input mana yang sedang aktif (Pertanyaan atau Opsi A, B, C, D)
  const [activeTarget, setActiveTarget] = useState<"question" | number>("question");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    setActiveView("edit");
    setActiveTarget("question");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const insertSnippet = (snippet: string) => {
    // 1. Jika target adalah Kolom Pertanyaan (textarea)
    if (activeTarget === "question") {
      const textarea = textareaRef.current;
      if (!textarea) {
        setQuestionText((prev) => (prev ? prev + "\n" + snippet : snippet));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = textarea.value;

      const newVal = currentVal.substring(0, start) + snippet + currentVal.substring(end);
      setQuestionText(newVal);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 10);
      return;
    }

    // 2. Jika target adalah Pilihan Ganda (Opsi A, B, C, atau D)
    if (typeof activeTarget === "number") {
      const input = optionInputRefs.current[activeTarget];
      const optIdx = activeTarget;

      // Ubah format display math $$...$$ menjadi inline math $...$ agar pas untuk pilihan ganda
      let optSnippet = snippet.trim();
      if (optSnippet.startsWith("$$") && optSnippet.endsWith("$$")) {
        optSnippet = "$" + optSnippet.slice(2, -2).trim() + "$";
      }

      if (!input) {
        handleOptionChange(optIdx, (options[optIdx] || "") + optSnippet);
        return;
      }

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentVal = input.value || "";

      const newVal = currentVal.substring(0, start) + optSnippet + currentVal.substring(end);
      handleOptionChange(optIdx, newVal);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + optSnippet.length, start + optSnippet.length);
      }, 10);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleInsertImagePrompt = () => {
    const url = prompt("Masukkan URL/Link Gambar Soal atau Diagram (misal dari Google Drive, Imgur, Cloudinary):");
    if (url && url.trim()) {
      insertSnippet(`\n![Diagram Soal](${url.trim()})\n`);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
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
              <p className="text-xs text-slate-500">Mendukung simbol & rumus matematika di soal dan pilihan ganda</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Editor vs Live Preview */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActiveView("edit")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeView === "edit"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <PenTool size={13} />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("preview")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeView === "preview"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Eye size={13} />
                <span>Pratinjau Siswa</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {activeView === "edit" ? (
            <>
              {/* Formula & Formatting Helper Toolbar (Bisa masuk ke Pertanyaan atau Opsi Jawaban) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5">
                {/* Indikator Target Sisipan */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CornerDownRight size={13} className="text-blue-600" />
                    Sisipkan Simbol Ke:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTarget("question");
                        textareaRef.current?.focus();
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold transition ${
                        activeTarget === "question"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      Pertanyaan
                    </button>
                    {optionLabels.map((lbl, idx) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => {
                          setActiveTarget(idx);
                          optionInputRefs.current[idx]?.focus();
                        }}
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold transition ${
                          activeTarget === idx
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        Opsi {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category switcher */}
                <div className="flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-700/80 pb-2 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("matrix")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      activeCategory === "matrix"
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    📐 Matriks
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("math")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      activeCategory === "math"
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    ➗ Aljabar & Pecahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("symbols")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      activeCategory === "symbols"
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    🔣 Simbol Cepat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("lang")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      activeCategory === "lang"
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    📖 Bahasa & Wacana
                  </button>
                </div>

                {/* Buttons for Active Category */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                  {activeCategory === "matrix" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`$\\begin{pmatrix} a \\\\ b \\end{pmatrix}$`)
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-emerald-500 font-mono text-[11px] text-emerald-600 dark:text-emerald-300 font-bold"
                        title="Cocok untuk pilihan ganda hasil matriks kolom 2x1"
                      >
                        Matriks Kolom (2×1)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`$\\begin{pmatrix} a & b \\end{pmatrix}$`)
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-emerald-500 font-mono text-[11px] text-emerald-600 dark:text-emerald-300 font-bold"
                        title="Matriks Baris 1x2"
                      >
                        Matriks Baris (1×2)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(
                            `\n$$\\begin{pmatrix} 1 & 2 & 12 \\\\ 4 & 3 & 7 \\end{pmatrix} \\times \\begin{pmatrix} 4 \\\\ 5 \\\\ 9 \\end{pmatrix}$$\n`
                          )
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px] text-blue-600 dark:text-blue-300 font-semibold"
                        title="Perkalian Matriks 2x3 dengan 3x1"
                      >
                        Perkalian Matriks (2×3 × 3×1)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$`)
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Matriks 2×2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$`)
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Matriks Siku [2×2]
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$\\det(A)$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        det(A)
                      </button>
                    </>
                  )}

                  {activeCategory === "math" && (
                    <>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$\\frac{a}{b}$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Pecahan (a/b)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$\\sqrt{x}$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Akar √x
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$x^{2}$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Pangkat x²
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$x_{1}$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Indeks x₁
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`$\\pm$`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                      >
                        Plus Minus ±
                      </button>
                    </>
                  )}

                  {activeCategory === "symbols" && (
                    <>
                      {["\\times", "\\div", "\\pm", "\\le", "\\ge", "\\neq", "\\approx", "\\pi", "\\alpha", "\\beta", "\\theta", "^\\circ"].map(
                        (sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => insertSnippet(`$${sym}$`)}
                            className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-mono text-[11px]"
                          >
                            {sym.replace("\\", "")}
                          </button>
                        )
                      )}
                    </>
                  )}

                  {activeCategory === "lang" && (
                    <>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`**kata penting**`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 text-[11px] font-bold"
                      >
                        Tebal
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`*kata miring*`)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 text-[11px] italic"
                      >
                        Miring
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(
                            `\n> **Wacana / Teks Bacaan:**\n> Paragraf wacana bacaan untuk menjawab pertanyaan...\n`
                          )
                        }
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 text-[11px] text-blue-600 dark:text-blue-300 font-semibold"
                      >
                        Kutipan Wacana
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertImagePrompt}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 text-[11px] text-emerald-600 dark:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <ImageIcon size={12} />
                        Sisipkan Gambar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Question Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    Pertanyaan / Soal <span className="text-red-500">*</span>
                    {activeTarget === "question" && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 font-bold">
                        Aktif
                      </span>
                    )}
                  </label>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={4}
                  required
                  value={questionText}
                  onFocus={() => setActiveTarget("question")}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition text-sm font-sans ${
                    activeTarget === "question"
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  placeholder="Contoh: Tentukan hasil perkalian matriks berikut:&#10;$$\begin{pmatrix} 1 & 2 & 12 \\ 4 & 3 & 7 \end{pmatrix} \times \begin{pmatrix} 4 \\ 5 \\ 9 \end{pmatrix}$$"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilihan Jawaban & Kunci Benar <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500">Pilih huruf untuk menandai kunci</span>
                </div>

                <div className="space-y-2.5">
                  {optionLabels.map((lbl, idx) => {
                    const isSelected = correctAnswerIndex === idx;
                    const isFocused = activeTarget === idx;
                    const optValue = options[idx] || "";
                    const hasMath = optValue.includes("$");

                    return (
                      <div
                        key={lbl}
                        className={`p-2.5 rounded-xl border transition flex flex-col gap-1.5 ${
                          isFocused
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10"
                            : isSelected
                            ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswerIndex(idx)}
                            className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                            }`}
                            title={`Tandai opsi ${lbl} sebagai kunci jawaban benar`}
                          >
                            {lbl}
                          </button>
                          <input
                            ref={(el) => {
                              optionInputRefs.current[idx] = el;
                            }}
                            type="text"
                            required={idx < 2}
                            value={optValue}
                            onFocus={() => setActiveTarget(idx)}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Jawaban opsi ${lbl}... (bisa berupa rumus misal $\\begin{pmatrix} 122 \\\\ 94 \\end{pmatrix}$ atau angka)`}
                            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-sans"
                          />
                          {isSelected && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pr-1 shrink-0">
                              Kunci Benar
                            </span>
                          )}
                        </div>

                        {/* Mini Live Preview untuk opsi jika mengandung simbol matematika */}
                        {hasMath && (
                          <div className="pl-9 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Pratinjau:</span>
                            <div className="font-medium">
                              <MathText text={optValue} />
                            </div>
                          </div>
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
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs sm:text-sm resize-none font-sans"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Live Student Preview */
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Pratinjau Tampilan di Layar Siswa
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                    {points} Poin
                  </span>
                </div>

                {/* Rendered Question */}
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {questionText ? (
                    <MathText text={questionText} />
                  ) : (
                    <span className="text-slate-400 italic">Belum ada teks pertanyaan...</span>
                  )}
                </div>

                {/* Rendered Options */}
                <div className="space-y-2 mt-4">
                  {options
                    .map((opt, i) => ({ opt, i }))
                    .filter(({ opt }) => Boolean(opt.trim()))
                    .map(({ opt, i }) => {
                      const isCorrect = correctAnswerIndex === i;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {optionLabels[i]}
                          </span>
                          <div className="flex-1">
                            <MathText text={opt} />
                          </div>
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                              Kunci Jawaban
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Rendered Explanation */}
                {explanation && (
                  <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200">Pembahasan: </strong>
                    <MathText text={explanation} />
                  </div>
                )}
              </div>
            </div>
          )}

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
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs"
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
