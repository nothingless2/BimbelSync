"use client";

import { useState } from "react";
import { Plus, Search, FileText, Youtube, Link as LinkIcon, Trash2, ExternalLink } from "lucide-react";
import { AddMaterialModal } from "@/components/modals/add-material-modal";
import { UserAvatar } from "@/components/user-avatar";
import { deleteMaterialAction } from "./actions";
import { toast } from "sonner";

export default function MaterialsClientPage({ materials, programs, tenantSlug, academyId }: any) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredMaterials = materials.filter((m: any) => {
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (m.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchProgram = filterProgram === "ALL" || m.program_id === filterProgram;
    return matchSearch && matchProgram;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    try {
      setDeletingId(id);
      const res = await deleteMaterialAction(id, tenantSlug);
      if (res.error) throw new Error(res.error);
      toast.success("Materi berhasil dihapus!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus materi");
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    if (type === "VIDEO_LINK") return <Youtube size={24} className="text-red-500" />;
    if (type === "DOCUMENT_LINK") return <FileText size={24} className="text-blue-500" />;
    return <LinkIcon size={24} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Learning Materials</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bank soal, modul, dan materi pembelajaran untuk tutor.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Materi
        </button>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari materi, modul, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Program</option>
            {programs.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Belum ada materi</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Tidak ada materi yang sesuai dengan pencarian atau program yang dipilih.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material: any) => (
            <div key={material.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  {getIcon(material.material_type)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {material.program.name}
                  </span>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    disabled={deletingId === material.id}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2" title={material.title}>
                  {material.title}
                </h3>
                {material.description && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                    {material.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar id={material.creator?.id || ""} email={material.creator?.email} avatarUrl={material.creator?.avatar_url} size={24} />
                  <span className="text-xs text-slate-500 font-medium">
                    {material.creator?.name?.split(' ')[0] || "Staff"}
                  </span>
                </div>
                <a 
                  href={material.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg transition"
                >
                  Buka Link <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMaterialModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        tenantSlug={tenantSlug} 
        academyId={academyId}
        programs={programs}
      />
    </div>
  );
}
