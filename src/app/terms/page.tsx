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
      
      {/* Editorial Header */}
      <div className="bg-white border-b border-slate-200 pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Terms of Service</h1>
          <p className="text-base font-medium text-slate-500">Terakhir diperbarui: 1 September 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="prose prose-lg prose-slate max-w-none text-slate-600 space-y-8">
          <p className="lead text-xl text-slate-700 leading-relaxed">
            Selamat datang di BimbelSync. Dengan mendaftar, mengakses, atau menggunakan platform kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ("Ketentuan") berikut ini. Harap baca dengan saksama sebelum menggunakan layanan kami.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-4">1. Penerimaan Syarat</h2>
          <p>
            Dengan menggunakan BimbelSync, Anda menyatakan bahwa Anda memiliki kapasitas hukum untuk menyetujui Ketentuan ini atas nama Anda sendiri atau entitas yang Anda wakili (misalnya institusi bimbingan belajar Anda).
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-4">2. Penggunaan Layanan</h2>
          <p>
            Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan operasional bimbingan belajar. Anda dilarang keras untuk:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Menggunakan layanan untuk tindakan ilegal, penipuan, atau pencucian uang.</li>
            <li>Mendistribusikan virus atau kode berbahaya lainnya ke dalam platform.</li>
            <li>Mencoba mendapatkan akses tidak sah ke sistem atau jaringan internal kami.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-4">3. Biaya dan Pembayaran</h2>
          <p>
            Layanan BimbelSync disediakan berdasarkan model berlangganan (SaaS). Biaya langganan dibebankan sesuai siklus tagihan yang Anda pilih. Kegagalan pembayaran dapat mengakibatkan penangguhan atau penghentian akses ke platform. Biaya transaksi dari pihak ketiga (seperti Payment Gateway) tunduk pada kebijakan penyedia tersebut.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-4">4. Pemutusan Layanan</h2>
          <p>
            Kami berhak untuk menangguhkan atau menghentikan akun Anda kapan saja dengan atau tanpa pemberitahuan sebelumnya, jika kami menemukan pelanggaran serius terhadap Ketentuan ini.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-4">5. Perubahan Ketentuan</h2>
          <p>
            BimbelSync berhak untuk mengubah Ketentuan ini sewaktu-waktu. Kami akan memberi tahu Anda tentang perubahan yang signifikan melalui email atau pengumuman di dalam platform. Penggunaan berkelanjutan atas layanan setelah perubahan berarti Anda menerima ketentuan baru tersebut.
          </p>
        </div>
      </main>
    </div>
  );
}
