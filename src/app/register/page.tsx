"use client";

import { useActionState } from "react";
import { registerAcademyAction } from "./actions";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_30px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)]"
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Mempersiapkan Sistem...
        </span>
      ) : (
        "Mulai Uji Coba Gratis 14 Hari"
      )}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAcademyAction, null);

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* KIRI - Visual & Testimonial (Sembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative overflow-hidden items-center justify-center border-r border-slate-200/60">
        
        {/* Background Image / Abstract Illustration */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/register-bg.png" 
            alt="BimbelSync Illustration" 
            fill 
            className="object-cover opacity-80 mix-blend-multiply filter hue-rotate-[-30deg]"
            priority
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-slate-900/80 z-10"></div>

        {/* Floating Glass Card / Marketing Copy */}
        <div className="relative z-20 max-w-lg p-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl mx-8">
          <div className="flex gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            "BimbelSync mengubah cara kami mengelola 500+ siswa menjadi sangat efisien dan modern."
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Platform terpadu untuk manajemen jadwal, absensi QR Code, ujian online, hingga penagihan SPP otomatis.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <p className="text-white font-semibold">Ahmad Fauzi</p>
              <p className="text-blue-200 text-sm">Direktur, Bintang Pelajar</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* KANAN - Form Pendaftaran (Clean & Minimalist) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-12 relative z-10">
        
        {/* Logo/Brand */}
        <div className="mb-12">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="BimbelSync Logo" 
              width={40} 
              height={40} 
              className="rounded-lg shadow-md"
            />
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Buat Akun Tenant</h1>
          <p className="text-slate-500 mb-8">Digitalisasi operasional bimbel Anda hari ini. Tidak perlu kartu kredit.</p>
          
          <form action={formAction} className="space-y-6">
            
            {/* Error Alert */}
            {state?.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in">
                <svg className="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-5">
              
              {/* Nama Bimbel */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Bimbingan Belajar</label>
                <input 
                  type="text" 
                  name="academyName" 
                  required 
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                  placeholder="Bintang Pelajar"
                />
              </div>
              
              {/* URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Portal (Subpath)</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all bg-slate-50 focus-within:bg-white">
                  <span className="inline-flex items-center pl-4 pr-1 text-slate-400 sm:text-sm font-medium">
                    bimbelsync.app/
                  </span>
                  <input 
                    type="text" 
                    name="pathUrl" 
                    required 
                    className="flex-1 block w-full min-w-0 px-2 py-3.5 border-none focus:ring-0 outline-none bg-transparent text-slate-900 placeholder-slate-400"
                    placeholder="bintang-pelajar"
                    pattern="[a-z0-9-]+"
                    title="Hanya huruf kecil, angka, dan tanda strip"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Tautan khusus untuk staf dan siswa Anda.</p>
              </div>

              {/* Data Admin Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Pemilik</label>
                  <input 
                    type="text" 
                    name="adminName" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                    placeholder="Budi Santoso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Aktif</label>
                  <input 
                    type="email" 
                    name="adminEmail" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                    placeholder="budi@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password Super Aman</label>
                <input 
                  type="password" 
                  name="adminPassword" 
                  required 
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                  placeholder="Min 8 karakter, Huruf Besar, Angka & Simbol"
                />
              </div>

            </div>

            <div className="pt-4">
              <SubmitButton />
            </div>
            
            <p className="text-center text-sm text-slate-500 mt-6">
              Sudah memiliki akun tenant? <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition">Masuk di sini</Link>
            </p>
          </form>
        </div>
      </div>
      
    </div>
  );
}
