"use client";

import React from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20tertarik%20menggunakan%20platform%20ini.";

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="BimbelSync Logo" width={32} height={32} className="object-contain rounded-[20%]" />
          <span className="text-xl font-bold tracking-tight text-slate-900">BimbelSync</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/#features" className="hover:text-blue-600 transition">Fitur</a>
          <a href="/#pricing" className="hover:text-blue-600 transition">Harga</a>
          <a href="/#about" className="hover:text-blue-600 transition">Tentang</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="/register" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition">
            Masuk
          </a>
          <a href="/register" className="text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-blue-500/25">
            Daftar Gratis
          </a>
        </div>

        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Fitur</a>
          <a href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Harga</a>
          <a href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Tentang</a>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a href="/register" className="w-full text-center py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700">Masuk</a>
            <a href="/register" className="w-full text-center py-2.5 rounded-xl bg-blue-600 font-semibold text-white shadow-sm">Daftar Gratis</a>
          </div>
        </div>
      )}
    </header>
  );
}
