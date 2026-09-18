import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 font-sans">
      <div className="max-w-2xl w-full text-center sm:text-left sm:flex sm:items-center sm:gap-12">
        <h1 className="text-8xl sm:text-[150px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4 sm:mb-0">
          404
        </h1>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
            Maaf, halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau memang tidak pernah ada. Mari kembali ke jalan yang benar.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold rounded-none hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
