'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function StaffLoginPage() {
  const pathname = usePathname();
  // Mengambil nama bimbel (tenantSlug) dari URL (contoh: /zenith/login -> zenith)
  const tenantSlug = pathname.split('/')[1] || 'Bimbel';

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Panggil Server Action untuk validasi ke database
    setTimeout(() => {
      setIsLoading(false);
      alert('Fitur Server Action menyusul di Tahap 5!');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#2563EB] mb-2 tracking-tight">
            BimbelSync
          </h1>
          <p className="text-gray-500 font-medium">
            Portal Staff & Admin <br/>
            <span className="text-[#16A34A] capitalize">{tenantSlug}</span>
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Akses
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-gray-700"
              placeholder="admin@bimbel.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-gray-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center"
          >
            {isLoading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              'Masuk ke Dashboard'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
