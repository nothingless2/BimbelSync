"use client";

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 font-sans">
      <div className="max-w-2xl w-full text-center sm:text-left sm:flex sm:items-center sm:gap-12">
        <h1 className="text-8xl sm:text-[150px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4 sm:mb-0">
          500
        </h1>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3">
            Sistem Mengalami Gangguan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
            Tenang, ini bukan salah Anda. Server kami sedang tersandung masalah teknis. Tim teknisi kami mungkin sudah menyadarinya.
          </p>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            <button 
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-none hover:opacity-90 transition-opacity"
            >
              Coba Muat Ulang
            </button>
            <a 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold rounded-none hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Ke Beranda
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
