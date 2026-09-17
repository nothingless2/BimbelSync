import React from 'react';
import { LandingHeader } from '@/components/landing-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy | BimbelSync",
  description: "Kebijakan privasi dan pengelolaan data pengguna BimbelSync.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <LandingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Terakhir diperbarui: 1 September 2026</p>
          
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p>
              Di BimbelSync, kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi yang Anda bagikan dengan kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan mengamankan informasi Anda saat Anda menggunakan layanan kami.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat membuat akun, berlangganan layanan, atau berkomunikasi dengan kami. Informasi ini mencakup namun tidak terbatas pada: nama, alamat email, nomor telepon, dan data operasional institusi bimbingan belajar Anda (seperti data siswa, jadwal, dan tagihan).
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Penggunaan Informasi</h2>
            <p>
              Informasi yang kami kumpulkan digunakan untuk:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Menyediakan, memelihara, dan meningkatkan layanan BimbelSync.</li>
              <li>Memproses transaksi dan mengirimkan pemberitahuan terkait tagihan atau langganan.</li>
              <li>Memberikan dukungan pelanggan dan merespons pertanyaan Anda.</li>
              <li>Menganalisis tren dan statistik penggunaan untuk pengembangan produk.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Keamanan Data</h2>
            <p>
              Kami menerapkan standar keamanan industri yang wajar untuk melindungi informasi Anda dari akses, pengungkapan, atau modifikasi yang tidak sah. Namun, perlu diketahui bahwa tidak ada sistem transmisi data melalui internet yang 100% aman.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami melalui email di <strong>privacy@bimbelsync.com</strong>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
