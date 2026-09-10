'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginStudentAction } from './actions';
import { User, Eye, EyeOff, BookOpen, GraduationCap } from 'lucide-react';

export default function StudentLoginPage() {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1] || 'Bimbel';

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    const result = await loginStudentAction(tenantSlug, formData);

    if (result.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result.success) {
      if (result.mustChangePassword) {
        router.push(`/${tenantSlug}/student/change-password`);
      } else {
        router.push(`/${tenantSlug}/student/dashboard`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Kolom Kiri: Visual (Sembunyi di Mobile) */}
      <div className="hidden md:flex flex-col justify-between w-5/12 bg-blue-900 relative p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/photo-1.avif" 
            alt="Student studying" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/60 to-blue-900/10"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl shadow-sm text-blue-600">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Portal Siswa</span>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-[2.75rem] font-bold text-white mb-6 leading-[1.15] tracking-tight">
            Pantau Jadwal <br/>dan Absensi<br/>Lebih Mudah.
          </h1>
          <p className="text-blue-100 text-lg max-w-sm leading-relaxed font-medium">
            Masuk untuk melihat jadwal kelas, absensi QR Code, dan tagihan bimbingan belajarmu.
          </p>
        </div>
      </div>

      {/* Kolom Kanan: Form Login */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-[#F8FAFC]">
        {/* Header Mobile */}
        <div className="w-full max-w-md md:hidden flex items-center gap-3 mb-8">
           <div className="bg-blue-600 p-2 rounded-lg text-white">
             <GraduationCap size={20} />
           </div>
           <span className="text-xl font-bold text-slate-800 tracking-tight">Portal Siswa</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Selamat Datang</h2>
            <p className="text-slate-500 text-sm mt-2">Silakan masuk dengan menggunakan username.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-white text-[15px]"
                  placeholder="cth: andibudi123"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-white text-[15px]"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1D4ED8] hover:bg-blue-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-70 mt-4 text-[15px]"
            >
              {isLoading ? (
                <span className="animate-pulse">Memverifikasi...</span>
              ) : (
                'Masuk ke Portal'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
