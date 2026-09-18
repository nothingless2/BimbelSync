"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 font-sans">
          <div className="max-w-2xl w-full text-center sm:text-left sm:flex sm:items-center sm:gap-12">
            <h1 className="text-8xl sm:text-[150px] font-black text-red-600 dark:text-red-500 tracking-tighter leading-none mb-4 sm:mb-0">
              ERR
            </h1>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                Kesalahan Fatal Sistem
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                Terjadi kesalahan struktural yang cukup parah. Aplikasi sama sekali tidak dapat memuat antarmuka utama.
              </p>
              <button 
                onClick={() => reset()}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Muat Ulang Paksa
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
