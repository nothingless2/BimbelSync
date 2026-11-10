"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, HelpCircle, Clock, BookOpen } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { createQuizAction } from "@/app/[tenantSlug]/dashboard/quizzes/actions";
import { CustomSelect } from "@/components/ui/custom-select";

interface AddQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  academyId: string;
  programs: Array<{ id: string; name: string }>;
}

export function AddQuizModal({ isOpen, onClose, tenantSlug, academyId, programs }: AddQuizModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    programId: programs[0]?.id || "",
    durationMinutes: 30,
    description: "",
    isPublished: true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Judul kuis wajib diisi!");
      return;
    }
    if (!formData.programId) {
      toast.error("Silakan pilih program bimbingan belajar!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await createQuizAction({
        academyId,
        programId: formData.programId,
        title: formData.title,
        description: formData.description,
        durationMinutes: Number(formData.durationMinutes) || 30,
        isPublished: formData.isPublished,
        tenantSlug,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Kuis berhasil dibuat! Menuju editor soal...");
      onClose();
      if (res.quizId) {
        router.push(`/${tenantSlug}/dashboard/quizzes/${res.quizId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat kuis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Buat Kuis Baru</h2>
              <p className="text-xs text-slate-500">Latihan soal online untuk siswa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul Kuis / Latihan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Contoh: Kuis 1: Aljabar Linier & Persamaan Kuadrat"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Program Belajar <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.programId}
              onChange={(val) => setFormData({ ...formData, programId: val })}
              options={programs.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock size={16} className="text-slate-400" />
              Durasi Pengerjaan (Menit)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              required
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="30"
            />
            <p className="text-xs text-slate-500">Waktu hitung mundur saat siswa mulai mengerjakan soal.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi & Instruksi (Opsional)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm resize-none"
              placeholder="Contoh: Kerjakan 10 butir soal pilihan ganda berikut dengan teliti. Nilai akan otomatis masuk ke rapor evaluasi."
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Terbitkan Sekarang</p>
              <p className="text-xs text-slate-500">Jika aktif, siswa langsung dapat melihat kuis ini di portal.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Membuat...</span>
                </>
              ) : (
                <span>Lanjut Buat Soal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

