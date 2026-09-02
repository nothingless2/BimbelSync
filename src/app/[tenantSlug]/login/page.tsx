'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginStaffAction } from './actions';

export default function StaffLoginPage() {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1] || 'Bimbel';

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Untuk menampung pesan error dari server

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    // Ambil data dari form input
    const formData = new FormData(e.currentTarget);
    
    // Kirim ke server action
    const result = await loginStaffAction(tenantSlug, formData);

    if (result.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result.success) {
      // Jika berhasil, alihkan pengguna ke dashboard bimbel mereka
      router.push(`/${tenantSlug}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#2563EB] mb-2 tracking-tight">
            BimbelSync
          </h1>
          <p className="text-gray-500 font-medium">
            Portal Staff & Admin <br/>
            <span className="text-[#16A34A] capitalize">{tenantSlug}</span>
          </p>
        </div>

        {/* Notifikasi Error Merah */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Akses
            </label>
            {/* Tambahkan atribut name="email" agar dikenali server */}
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-gray-700"
              placeholder="admin@bimbel.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Kata Sandi
            </label>
            {/* Tambahkan atribut name="password" */}
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-gray-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center disabled:opacity-70"
          >
            {isLoading ? (
              <span className="animate-pulse">Memverifikasi...</span>
            ) : (
              'Masuk ke Dashboard'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
