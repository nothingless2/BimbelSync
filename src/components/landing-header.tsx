"use client";

import React from 'react';
import { Menu, X } from 'lucide-react';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20tertarik%20menggunakan%20platform%20ini.";

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="BimbelSync Logo" className="object-contain rounded-[20%] w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-slate-900">BimbelSync</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition">Fitur</a>
          <a href="#pricing" className="hover:text-blue-600 transition">Harga</a>
          <a href="#about" className="hover:text-blue-600 transition">Tentang</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href={WA_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition">
            Konsultasi
          </a>
          <a href={WA_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-sm">
            Hubungi Sales
          </a>
        </div>

        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Fitur</a>
          <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Harga</a>
          <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Tentang</a>
        </div>
      )}
    </header>
  );
}
