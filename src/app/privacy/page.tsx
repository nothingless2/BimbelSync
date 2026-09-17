import React from 'react';
import { LandingHeader } from '@/components/landing-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy | BimbelSync",
  description: "Kebijakan privasi dan pengelolaan data pengguna BimbelSync.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <LandingHeader />
      
      {/* Modern Header with subtle pattern */}
      <div className="relative bg-slate-900 border-b border-slate-800 pt-32 pb-20 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute inset-0 bg-slate-900/90"></div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-sm font-medium text-slate-400">Terakhir diperbarui: 1 September 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
        <div className="prose prose-slate max-w-none text-slate-600 space-y-8">
          <p className="text-lg text-slate-700 leading-relaxed font-medium">
            Di BimbelSync, kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi yang Anda bagikan dengan kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan mengamankan informasi Anda saat Anda menggunakan layanan kami.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">1. Informasi yang Kami Kumpulkan</h2>
          <p>
            Kami mengumpulkan informasi yang Anda berikan secara langsung saat membuat akun, berlangganan layanan, atau berkomunikasi dengan kami. Informasi ini mencakup namun tidak terbatas pada: nama, alamat email, nomor telepon, dan data operasional institusi bimbingan belajar Anda (seperti data siswa, jadwal, dan tagihan).
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">2. Penggunaan Informasi</h2>
          <p>
            Informasi yang kami kumpulkan digunakan untuk:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Menyediakan, memelihara, dan meningkatkan layanan BimbelSync.</li>
            <li>Memproses transaksi dan mengirimkan pemberitahuan terkait tagihan atau langganan.</li>
            <li>Memberikan dukungan pelanggan dan merespons pertanyaan Anda.</li>
            <li>Menganalisis tren dan statistik penggunaan untuk pengembangan produk.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">3. Keamanan Data</h2>
          <p>
            Kami menerapkan standar keamanan industri yang wajar untuk melindungi informasi Anda dari akses, pengungkapan, atau modifikasi yang tidak sah. Namun, perlu diketahui bahwa tidak ada sistem transmisi data melalui internet yang 100% aman.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-12 mb-6">4. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami melalui email di <a href="mailto:privacy@bimbelsync.com" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">privacy@bimbelsync.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
