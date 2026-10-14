"use client";

import { useActionState, useState, Suspense } from "react";
import { loginAction } from "./actions";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
          Memverifikasi Akun...
        </span>
      ) : (
        <>
          <span>Masuk ke Akun</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </>
      )}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const isVerifiedSuccess = searchParams.get("verified") === "true";

  return (
    <div className="space-y-4">
      {/* Success Notification after OTP verification */}
      {isVerifiedSuccess && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-start gap-3 animate-fade-in shadow-xs">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-emerald-900">Email Berhasil Diverifikasi!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Akun Anda telah aktif. Silakan masuk dengan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {state?.error && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200 text-sm font-medium flex flex-col gap-2 animate-fade-in shadow-xs">
          <div className="flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{state.error}</span>
          </div>

          {state.needsVerification && (
            <div className="pl-7 pt-1">
              <Link
                href="/verify-otp"
                className="inline-flex items-center text-xs font-bold text-red-700 hover:text-red-900 underline"
              >
                Masukkan Kode OTP Sekarang &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Anti-Bot Honeypot Field */}
        <input 
          type="text" 
          name="_hp_website" 
          style={{ display: "none" }} 
          tabIndex={-1} 
          autoComplete="off" 
        />

        {/* 1. Email atau Username */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Email atau Username
          </label>
          <input 
            type="text" 
            name="identifier" 
            required 
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
            placeholder="Masukkan email atau username"
          />
        </div>

        {/* 2. Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              {showPassword ? "Sembunyikan" : "Lihat Password"}
            </button>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            name="password" 
            required 
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
            placeholder="Masukkan password akun Anda"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-600 selection:text-white">
      {/* KIRI - Visual Foto Asli & Keterangan Ringkas (Sembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-200/80">
        {/* Background Photo Nyata */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/photo-1.avif" 
            alt="Suasana Belajar Bimbingan Belajar" 
            fill 
            className="object-cover opacity-65 filter brightness-105 contrast-100"
            priority
          />
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

        {/* Middle / Value Proposition */}
        <div className="relative z-20 max-w-lg my-auto py-8">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-sm">
            Selamat Datang Kembali di BimbelSync.
          </h2>
          
          <p className="text-slate-200 text-base xl:text-lg leading-relaxed font-normal drop-shadow-xs max-w-md">
            Satu sistem terintegrasi untuk absensi QR Code, jadwal kelas, e-rapor siswa, hingga pencatatan pembayaran SPP tanpa ribet.
          </p>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-20 text-xs text-slate-300/80">
          © {new Date().getFullYear()} BimbelSync. Platform manajemen bimbingan belajar profesional.
        </div>
      </div>
      
      {/* KANAN - Form Login (Ditengahkan Secara Sempurna) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-10 relative z-10 overflow-y-auto min-h-screen">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header Brand */}
          <div className="lg:hidden mb-8">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              Masuk ke Akun Anda
            </h1>
            <p className="text-slate-500 text-sm">
              Silakan masukkan email atau username untuk melanjutkan.
            </p>
          </div>
          
          <Suspense fallback={<div className="py-8 text-center text-slate-400 text-sm">Memuat form login...</div>}>
            <LoginForm />
          </Suspense>

          {/* Links Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Belum memiliki akun bimbel?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition">
                Daftar Uji Coba Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
