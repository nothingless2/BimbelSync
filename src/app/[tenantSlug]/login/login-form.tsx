'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginTenantAction } from './actions';
import { User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export function TenantLoginForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const result = await loginTenantAction(tenantSlug, formData);

    if (result.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
          Email atau Username
        </label>
        <div className="relative">
          <input
            type="text"
            name="email"
            required
            autoComplete="username"
            className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white text-[15px]"
            placeholder="Masukkan email atau username"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
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
            type={showPassword ? 'text' : 'password'}
            name="password"
            required
            autoComplete="current-password"
            className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white text-[15px]"
            placeholder="Masukkan password akun Anda"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1D4ED8] hover:bg-blue-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 flex justify-center items-center gap-2 disabled:opacity-70 mt-3 text-[15px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memverifikasi Akun...</span>
          </>
        ) : (
          'Masuk ke Portal'
        )}
      </button>
    </form>
  );
}

