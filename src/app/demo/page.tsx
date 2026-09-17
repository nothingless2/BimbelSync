import React from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Demo | BimbelSync",
  description: "Lihat bagaimana BimbelSync dapat mengotomasi operasional bimbingan belajar Anda.",
};

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20sudah%20melihat%20demo%20dan%20ingin%20berkonsultasi%20lebih%20lanjut.";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col">
      {/* Minimal Header */}
      <header className="w-full py-6 px-4 md:px-8 flex justify-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
             <img src="/logo.png" alt="BimbelSync Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">BimbelSync</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 mt-12 mb-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <PlayCircle className="w-4 h-4" /> Video Eksklusif
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Lihat Bagaimana BimbelSync Mengotomasi Bimbel Anda
          </h1>
          <p className="text-lg text-slate-400">
            Tonton video berdurasi 3 menit ini untuk mengetahui rahasia ratusan bimbel menghemat waktu dan meningkatkan omzet setiap bulannya.
          </p>
        </div>

        {/* Video Container */}
        <div className="w-full max-w-4xl bg-black rounded-2xl shadow-2xl overflow-hidden border border-slate-800 aspect-video mb-12 relative">
          {/* PLACEHOLDER YOUTUBE EMBED */}
          {/* Ganti src di bawah dengan link embed YouTube Anda yang sebenarnya */}
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0" 
            title="BimbelSync Demo" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Punya Pertanyaan Spesifik?</p>
          <a 
            href={WA_URL} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300"
          >
            Konsultasi Gratis via WhatsApp <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-800 text-slate-500 text-sm">
        © 2026 BimbelSync. All rights reserved.
      </footer>
    </div>
  );
}
