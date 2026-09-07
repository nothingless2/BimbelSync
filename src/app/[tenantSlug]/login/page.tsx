'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginStaffAction } from './actions';
import { User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function StaffLoginPage() {
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
    const result = await loginStaffAction(tenantSlug, formData);

    if (result.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result.success) {
      router.push(`/${tenantSlug}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      <div className="hidden md:flex flex-col justify-between w-5/12 bg-slate-900 relative p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/photo-1.avif" 
            alt="Students in library" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-slate-900/10"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl shadow-sm">
            <img src="/logo.png" alt="BimbelSync Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BimbelSync</span>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-[2.75rem] font-bold text-white mb-6 leading-[1.15] tracking-tight">
            Kelola Bimbel <br/>Lebih Mudah dan <br/>Otomatis.
          </h1>
          <p className="text-slate-300 text-lg max-w-sm leading-relaxed font-medium">
            Satu platform terpadu untuk efisiensi operasional bimbingan belajar Anda.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative bg-[#F8FAFC]">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-3">
           <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
           <span className="text-xl font-bold text-slate-800 tracking-tight">BimbelSync</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Masuk ke Akun Anda</h2>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                Email atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="email"
                  required
                  className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-white text-[15px]"
                  placeholder="Masukkan email atau username"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1D4ED8] hover:bg-blue-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-70 mt-4 text-[15px]"
            >
              {isLoading ? (
                <span className="animate-pulse">Memverifikasi...</span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
