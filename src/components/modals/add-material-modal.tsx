"use client";

import { useState } from "react";
import { X, Loader2, Link as LinkIcon, FileText, Youtube } from "lucide-react";
import { toast } from "sonner";
import { createMaterialAction } from "@/app/[tenantSlug]/dashboard/materials/actions";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  academyId: string;
  programs: any[];
}

export function AddMaterialModal({ isOpen, onClose, tenantSlug, academyId, programs }: AddMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    programId: "",
    materialType: "DOCUMENT_LINK" as "DOCUMENT_LINK" | "VIDEO_LINK" | "OTHER_LINK",
    url: "",
    description: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.programId || !formData.url) {
      toast.error("Silakan lengkapi kolom yang wajib diisi!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await createMaterialAction({
        academyId,
        programId: formData.programId,
        title: formData.title,
        description: formData.description,
        materialType: formData.materialType,
        url: formData.url,
        tenantSlug,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Materi berhasil ditambahkan!");
      setFormData({
        title: "",
        programId: "",
        materialType: "DOCUMENT_LINK",
        url: "",
        description: ""
      });
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Materi Baru</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="Contoh: Modul Matematika Bab 1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Program Terkait <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.programId}
              onChange={e => setFormData({ ...formData, programId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            >
              <option value="">-- Pilih Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Jenis Materi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "DOCUMENT_LINK", label: "Dokumen", icon: <FileText size={16} /> },
                { id: "VIDEO_LINK", label: "Video", icon: <Youtube size={16} /> },
                { id: "OTHER_LINK", label: "Link Lain", icon: <LinkIcon size={16} /> },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, materialType: type.id as any })}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 border rounded-xl text-xs font-semibold transition ${
                    formData.materialType === type.id 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tautan (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm resize-none"
              placeholder="Catatan tambahan untuk materi ini..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              Simpan Materi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
