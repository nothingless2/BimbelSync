import React from 'react';
import { LandingHeader } from '@/components/landing-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms of Service | BimbelSync",
  description: "Syarat dan ketentuan penggunaan layanan BimbelSync.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <LandingHeader />
      
      {/* Modern Header with subtle pattern */}
      <div className="relative bg-slate-900 border-b border-slate-800 pt-32 pb-20 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute inset-0 bg-slate-900/90"></div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Terms of Service</h1>
          <p className="text-sm font-medium text-slate-400">Terakhir diperbarui: 1 September 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
        <div className="prose prose-slate max-w-none text-slate-600 space-y-8">
          <p className="text-lg text-slate-700 leading-relaxed font-medium">
            Selamat datang di BimbelSync. Dengan mendaftar, mengakses, atau menggunakan platform kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan (Ketentuan) berikut ini. Harap baca dengan saksama sebelum menggunakan layanan kami.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">1. Penerimaan Syarat</h2>
          <p>
            Dengan menggunakan BimbelSync, Anda menyatakan bahwa Anda memiliki kapasitas hukum untuk menyetujui Ketentuan ini atas nama Anda sendiri atau entitas yang Anda wakili (misalnya institusi bimbingan belajar Anda).
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">2. Penggunaan Layanan</h2>
          <p>
            Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan operasional bimbingan belajar. Anda dilarang keras untuk:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Menggunakan layanan untuk tindakan ilegal, penipuan, atau pencucian uang.</li>
            <li>Mendistribusikan virus atau kode berbahaya lainnya ke dalam platform.</li>
            <li>Mencoba mendapatkan akses tidak sah ke sistem atau jaringan internal kami.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">3. Biaya dan Pembayaran</h2>
          <p>
            Layanan BimbelSync disediakan berdasarkan model berlangganan. Biaya langganan dibebankan sesuai siklus tagihan yang Anda pilih. Kegagalan pembayaran dapat mengakibatkan penangguhan atau penghentian akses ke platform. Biaya transaksi dari pihak ketiga (seperti Payment Gateway) tunduk pada kebijakan penyedia tersebut.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">4. Pemutusan Layanan</h2>
          <p>
            Kami berhak untuk menangguhkan atau menghentikan akun Anda kapan saja dengan atau tanpa pemberitahuan sebelumnya, jika kami menemukan pelanggaran serius terhadap Ketentuan ini.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">5. Perubahan Ketentuan</h2>
          <p>
            BimbelSync berhak untuk mengubah Ketentuan ini sewaktu-waktu. Kami akan memberi tahu Anda tentang perubahan yang signifikan melalui email atau pengumuman di dalam platform. Penggunaan berkelanjutan atas layanan setelah perubahan berarti Anda menerima ketentuan baru tersebut.
          </p>
        </div>
      </main>
    </div>
  );
}
