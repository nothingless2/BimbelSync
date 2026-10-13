"use client";

import { useActionState, useState } from "react";
import { setupAcademyAction } from "./actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_6px_25px_rgb(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Mempersiapkan Portal Bimbel...
        </span>
      ) : (
        <>
          <span>Simpan & Masuk ke Dashboard</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </>
      )}
    </button>
  );
}

export default function OnboardingForm() {
  const [state, formAction] = useActionState(setupAcademyAction, null);
  const [academyName, setAcademyName] = useState("");
  const [pathUrl, setPathUrl] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);

  // Auto-generate URL slug dari nama bimbel secara realtime
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAcademyName(name);

    if (!isManualSlug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setPathUrl(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualSlug(true);
    setPathUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <form action={formAction} className="space-y-5">
      {/* Anti-Bot Honeypot */}
      <input 
        type="text" 
        name="_hp_website" 
        style={{ display: "none" }} 
        tabIndex={-1} 
        autoComplete="off" 
      />

      {/* Error Alert */}
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* 1. Nama Bimbingan Belajar */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Nama Bimbingan Belajar
        </label>
        <input 
          type="text" 
          name="academyName" 
          value={academyName}
          onChange={handleNameChange}
          required 
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
          placeholder="Contoh: Bintang Pelajar / Prestasi Prima"
        />
        <p className="mt-1 text-xs text-slate-400">
          Nama lembaga bimbel Anda yang akan tertera di portal, rapor, dan kuitansi siswa.
        </p>
      </div>

      {/* 2. URL Portal Bimbel */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          URL Portal Akses Bimbel
        </label>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all bg-slate-50 focus-within:bg-white">
          <span className="inline-flex items-center pl-3.5 pr-1 text-slate-400 text-xs sm:text-sm font-medium select-none bg-slate-100/70 border-r border-slate-200">
            bimbelsync.web.id/
          </span>
          <input 
            type="text" 
            name="pathUrl" 
            value={pathUrl}
            onChange={handleSlugChange}
            required 
            className="flex-1 block w-full min-w-0 px-3 py-3 border-none focus:ring-0 outline-none bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium"
            placeholder="bintang-pelajar"
            pattern="[a-z0-9-]+"
            title="Hanya huruf kecil, angka, dan tanda strip (-)"
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Tautan unik portal khusus untuk login admin, tutor, dan siswa bimbel Anda.
        </p>
      </div>

      {/* Info Paket Pro Uji Coba */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-blue-800">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Uji Coba 14 Hari Paket Pro Aktif</span>
        </div>
        <p className="text-blue-700/80">
          Seluruh fitur lengkap terbuka tanpa batasan (siswa tak terbatas, absensi QR Code, jadwal kelas, e-rapor, dan pencatatan pembayaran SPP).
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
