"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, Video, Link as LinkIcon, ExternalLink, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function StudentMaterialsClientPage({
  materials,
  programs = [],
}: {
  materials: any[];
  programs?: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const queryProgramId = searchParams.get("programId");

  // Default ke query param, atau program pertama siswa jika ada, agar fokus per program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    queryProgramId || (programs.length > 0 ? programs[0].id : "ALL")
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentProgramName = currentProgram
    ? currentProgram.name
    : selectedProgramId === "ALL"
    ? "Semua Program"
    : "";

  const filteredMaterials = materials.filter((m: any) => {
    const matchesProgram =
      selectedProgramId === "ALL" || m.program_id === selectedProgramId;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.program?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });

  const getIcon = (type: string) => {
    if (type === "DOCUMENT_LINK") return <FileText size={22} className="text-blue-500" />;
    if (type === "VIDEO_LINK") return <Video size={22} className="text-red-500" />;
    return <LinkIcon size={22} className="text-emerald-500" />;
  };

  const getTypeName = (type: string) => {
    if (type === "DOCUMENT_LINK") return "Dokumen";
    if (type === "VIDEO_LINK") return "Video";
    return "Tautan";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Program Selector Tabs (Mobile-Friendly Horizontal Pills) */}
      {programs.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pilih Program Belajar:
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {currentProgramName}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {programs.map((p) => {
              const isSelected = selectedProgramId === p.id;
              const count = materials.filter((m) => m.program_id === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProgramId(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                  <span>{p.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedProgramId("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedProgramId === "ALL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30 scale-[1.02]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Materi</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  selectedProgramId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {materials.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={
            selectedProgramId !== "ALL" && currentProgramName
              ? `Cari materi ${currentProgramName}...`
              : "Cari judul materi atau nama program..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-9 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 shadow-sm dark:text-slate-200"
        />
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
          <BookOpen size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Materi belum tersedia untuk ${currentProgramName}`
              : "Materi belum tersedia"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedProgramId !== "ALL" && currentProgramName
              ? `Tutor untuk program ${currentProgramName} belum mengunggah materi pembelajaran.`
              : "Tutor belum mengunggah materi untuk program yang kamu ikuti."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMaterials.map((material: any) => (
            <a
              key={material.id}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition flex flex-col group"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition shrink-0">
                    {getIcon(material.material_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                      {material.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {getTypeName(material.material_type)}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(material.created_at), "dd MMM yyyy", { locale: id })}</span>
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500 transition shrink-0" />
              </div>

              {material.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                  {material.description}
                </p>
              )}

              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md max-w-[150px] truncate">
                  {material.program?.name}
                </span>
                <span className="text-[11px] text-slate-400 italic">
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
