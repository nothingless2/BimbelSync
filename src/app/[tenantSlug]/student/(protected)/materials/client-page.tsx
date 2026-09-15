"use client";

import { useState } from "react";
import { Search, FileText, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function StudentMaterialsClientPage({ materials }: { materials: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaterials = materials.filter((m: any) => {
    return m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.program?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getIcon = (type: string) => {
    if (type === "DOCUMENT_LINK") return <FileText size={24} className="text-blue-500" />;
    if (type === "VIDEO_LINK") return <Video size={24} className="text-red-500" />;
    return <LinkIcon size={24} className="text-emerald-500" />;
  };

  const getTypeName = (type: string) => {
    if (type === "DOCUMENT_LINK") return "Dokumen";
    if (type === "VIDEO_LINK") return "Video";
    return "Tautan";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Cari judul materi atau nama program..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200"
        />
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Materi belum tersedia</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Tutor belum mengunggah materi untuk program yang kamu ikuti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((material: any) => (
            <a 
              key={material.id} 
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition flex flex-col group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition">
                    {getIcon(material.material_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                      {material.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{getTypeName(material.material_type)}</span>
                      <span>•</span>
                      <span>{format(new Date(material.created_at), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
              
              {material.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                  {material.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md max-w-[150px] truncate">
                  {material.program?.name}
                </span>
                <span className="text-xs text-slate-500 italic">
                  Oleh: {material.creator?.name || "Tutor"}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
