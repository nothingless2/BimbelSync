"use client";

import { useState } from "react";
import { Upload, X, AlertCircle, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { bulkCreateStudentsAction } from "@/app/[tenantSlug]/dashboard/master-data/students/actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";
import { Program } from "@prisma/client";
import Papa from "papaparse";

export function ImportStudentsModal({ 
  tenantSlug, 
  programs, 
  onClose 
}: { 
  tenantSlug: string, 
  programs: Program[],
  onClose: () => void 
}) {
  const [programId, setProgramId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "full_name,username,email,parent_whatsapp\nBudi Santoso,budi123,budi@gmail.com,081234567890\nSiti Aminah,siti_a,siti@gmail.com,089876543210";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_import_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Format file tidak didukung. Harap unggah file CSV.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);

    // Parse CSV to preview count
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validation headers
        const requiredHeaders = ["full_name", "username"];
        const headers = results.meta.fields || [];
        
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast.error(`Format CSV salah. Kolom berikut tidak ditemukan: ${missingHeaders.join(", ")}`);
          setFile(null);
          setParsedData(null);
          if (e.target) e.target.value = "";
          return;
        }

        setParsedData(results.data);
      },
      error: (error) => {
        toast.error(`Gagal membaca file CSV: ${error.message}`);
        setFile(null);
        setParsedData(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!programId) {
      toast.error("Harap pilih program terlebih dahulu.");
      return;
    }

    if (!parsedData || parsedData.length === 0) {
      toast.error("File CSV kosong atau belum diunggah.");
      return;
    }

    setIsSubmitting(true);
    
    // Map parsed data to strict format
    const studentsToImport = parsedData.map(row => ({
      full_name: row.full_name,
      username: row.username,
      email: row.email || "",
      parent_whatsapp: row.parent_whatsapp || "",
    }));

    try {
      const result = await bulkCreateStudentsAction(programId, studentsToImport);
      
      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
      } else {
        toast.success(`Berhasil mengimpor ${studentsToImport.length} siswa.`);
        onClose();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat impor.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Import Data Siswa</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Unggah file CSV untuk memasukkan banyak siswa.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm border border-blue-100 dark:border-blue-900/30">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p><strong>Penting:</strong> Password default untuk siswa yang diimpor akan di-set menjadi <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-700">username123!</code>. Siswa akan diwajibkan mengganti password saat login pertama kali.</p>
                  <button type="button" onClick={handleDownloadTemplate} className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm border border-blue-100 dark:border-slate-700 text-xs mt-1 transition-colors">
                    <Download size={14} /> Download Template CSV
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Program <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Semua siswa di dalam file CSV akan dimasukkan ke program ini.</p>
                <CustomSelect
                  value={programId}
                  onChange={setProgramId}
                  placeholder="-- Pilih Program --"
                  options={programs.map(p => ({
                    value: p.id,
                    label: p.name
                  }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unggah File CSV <span className="text-red-500">*</span></label>
                <label className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  
                  {file ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {parsedData ? `${parsedData.length} baris data terdeteksi` : "Memproses file..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-1">
                        <Upload size={24} />
                      </div>
                      <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Klik untuk memilih file CSV</p>
                      <p className="text-xs text-slate-500">atau drag and drop file ke sini</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !file || !programId || !parsedData}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
