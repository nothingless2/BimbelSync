import React from "react";
import { Mail, MessageCircle, ExternalLink, FileText, Phone } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Bantuan & Support</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pusat bantuan internal untuk tim Superadmin BimbelSync.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dokumentasi Sistem */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Dokumentasi Sistem</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
            Pelajari arsitektur database, cara kerja multi-tenant, dan panduan troubleshooting.
          </p>
          <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Baca Dokumentasi <ExternalLink size={16} />
          </a>
        </div>

        {/* Kontak Developer */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tim Engineering</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
            Hubungi tim Developer untuk melaporkan bug atau meminta bantuan teknis tingkat lanjut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:dev@bimbelsync.com" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition">
              <Mail size={16} /> Email Tim
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-semibold transition">
              <Phone size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Internal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">FAQ Internal</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Bagaimana cara mengaktifkan akademi yang di-suspend?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Buka menu <b>Academies</b>, cari akademi yang dimaksud, lalu klik ikon Pensil (Edit). Ubah statusnya kembali ke <b>Active</b> dan simpan perubahan.
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Mengapa sebuah paket tidak bisa dihapus?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sistem memproteksi paket yang sedang digunakan oleh klien (akademi) untuk mencegah kerusakan data tagihan. Anda harus memindahkan semua akademi dari paket tersebut ke paket lain sebelum dapat menghapusnya.
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Apa yang terjadi jika saya mengganti password saya?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fitur <b>Global Session Invalidation</b> akan aktif. Semua perangkat lain (PC atau HP lain) yang saat ini sedang login dengan akun Anda akan otomatis dipaksa keluar (Logout) saat itu juga untuk alasan keamanan.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
