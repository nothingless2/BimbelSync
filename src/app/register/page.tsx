"use client";

import { useActionState, useState } from "react";
import { registerAcademyAction } from "./actions";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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
          Mempersiapkan Akun Anda...
        </span>
      ) : (
        <>
          <span>Daftar Akun</span>
        </>
      )}
    </button>
  );
}

function RegisterForm() {
  const [state, formAction] = useActionState(registerAcademyAction, null);
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState("");

  const handleFormAction = (formData: FormData) => {
    setClientError("");
    const phoneVal = (formData.get("adminPhone") as string)?.trim() || "";
    
    if (!/^\d+$/.test(phoneVal)) {
      setClientError("Nomor WhatsApp hanya boleh berisi angka.");
      return;
    }

    if (phoneVal.length < 10 || phoneVal.length > 15) {
      setClientError("Nomor WhatsApp harus terdiri dari 10 - 15 digit angka.");
      return;
    }

    const password = formData.get("adminPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setClientError("Konfirmasi password tidak cocok dengan password akun. Pastikan keduanya sama.");
      return;
    }

    formAction(formData);
  };

  return (
    <form action={handleFormAction} className="space-y-4">
      {/* Anti-Bot Honeypot Field (Tersembunyi dari manusia) */}
      <input 
        type="text" 
        name="_hp_website" 
        style={{ display: "none" }} 
        tabIndex={-1} 
        autoComplete="off" 
      />

      {/* Error Alert */}
      {(clientError || state?.error) && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{clientError || state?.error}</span>
        </div>
      )}

      {/* 1. Nama Lengkap Pemilik / Admin */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Nama Lengkap
        </label>
        <input 
          type="text" 
          name="adminName" 
          required 
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
          placeholder="Contoh: Budi Santoso"
        />
      </div>

      {/* 2. Nomor WhatsApp */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Nomor WhatsApp
        </label>
        <input 
          type="tel" 
          name="adminPhone" 
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            // Izinkan tombol kontrol standar navigasi & copy/paste
            if (
              ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) ||
              (e.ctrlKey || e.metaKey)
            ) {
              return;
            }
            // Blokir tombol jika bukan angka 0-9
            if (!/^[0-9]$/.test(e.key)) {
              e.preventDefault();
            }
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={15}
          required 
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
          placeholder="081234567890"
        />
        <p className="mt-1 text-xs text-slate-400">Untuk koordinasi aktivasi akun & bantuan tim onboarding (hanya angka, 10-15 digit).</p>
      </div>

      {/* 3. Email Aktif */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Email Aktif
        </label>
        <input 
          type="email" 
          name="adminEmail" 
          required 
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
          placeholder="budi@email.com"
        />
      </div>

      {/* 4. Password */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Password Akun
        </label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            name="adminPassword" 
            required 
            className="w-full pl-3.5 pr-11 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
            placeholder="Min. 8 karakter, huruf besar, angka & simbol"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 5. Konfirmasi Password (retype password) */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Ulangi Password Akun
        </label>
        <div className="relative">
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            name="confirmPassword" 
            required 
            className="w-full pl-3.5 pr-11 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
            placeholder="Ketik ulang password akun Anda"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Kombinasi minimal 8 karakter (huruf besar, huruf kecil, angka, dan simbol).
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <SubmitButton />
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Dengan mendaftar, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi BimbelSync.
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-600 selection:text-white">
      
      {/* KIRI - Visual Foto Asli & Keterangan Ringkas (Sembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-200/80">
        
        {/* Background Photo Nyata dengan Overlay yang Tidak Terlalu Gelap */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/photo-1.avif" 
            alt="Suasana Belajar Bimbingan Belajar" 
            fill 
            className="object-cover opacity-65 filter brightness-105 contrast-100" 
            priority
          />
          {/* Soft and balanced overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-900/30 z-10" />
        </div>

        {/* Top Header / Branding */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">
            <Image 
              src="/logo.png" 
              alt="BimbelSync Logo" 
              width={32} 
              height={32} 
              className="rounded-md"
            />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">BimbelSync</span>
            <p className="text-xs text-blue-200/80 font-medium">Sistem Manajemen Bimbingan Belajar Terpadu</p>
          </div>
        </div>

        {/* Bottom Typography Hero */}
        <div className="relative z-20 max-w-lg mt-auto mb-8">
          <h2 className="text-[2.5rem] xl:text-[2.75rem] font-bold text-white mb-6 leading-[1.15] tracking-tight">
            Digitalisasi Operasional Bimbel Anda Hari Ini.
          </h2>
          
          <p className="text-slate-300 text-lg max-w-sm leading-relaxed font-medium">
            Satu sistem terintegrasi untuk absensi QR Code, jadwal kelas, e-rapor siswa, hingga pencatatan pembayaran SPP tanpa ribet.
          </p>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-20 text-xs text-slate-300/80">
          © {new Date().getFullYear()} BimbelSync. Platform manajemen bimbingan belajar profesional.
        </div>
      </div>
      
      {/* KANAN - Form Pendaftaran (Ditengahkan Secara Sempurna) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-8 relative z-10 overflow-y-auto min-h-screen">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header Brand */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="BimbelSync Logo" 
                width={34} 
                height={34} 
                className="rounded-lg shadow-sm"
              />
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                BimbelSync
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
              Daftar Akun Pengelola
            </h1>
            <p className="text-slate-500 text-sm">
              Daftarkan akun anda sekarang. 
            </p>
          </div>
          
          <RegisterForm />

          <p className="text-center text-sm text-slate-500 mt-6 pt-3 border-t border-slate-100">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
}
