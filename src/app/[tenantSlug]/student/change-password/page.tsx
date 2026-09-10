'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { changePasswordAction } from './actions';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ChangePasswordPage() {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1] || 'Bimbel';

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(tenantSlug, formData);

    if (result.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result.success) {
      router.push(`/${tenantSlug}/student/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100 relative overflow-hidden">
        {/* Dekorasi Atas */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

        <div className="text-center mb-8 mt-2 flex flex-col items-center">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Amankan Akunmu</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Ini adalah login pertamamu. Demi keamanan, silakan ganti password default dari admin dengan password baru rahasiamu.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                required
                minLength={6}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-slate-50 focus:bg-white text-[15px]"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
              Ulangi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                required
                minLength={6}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-slate-50 focus:bg-white text-[15px]"
                placeholder="Ulangi password di atas"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1D4ED8] hover:bg-blue-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-70 mt-6 text-[15px]"
          >
            {isLoading ? (
              <span className="animate-pulse">Menyimpan...</span>
            ) : (
              'Simpan & Lanjutkan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
