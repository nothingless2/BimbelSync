'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, QrCode, User, CreditCard, BarChart, BookOpen, Calendar, Menu, X, ChevronRight } from 'lucide-react';

export function StudentMobileNav({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 4 Primary Menu Items + 1 Menu Button
  const primaryItems = [
    { href: `/${tenantSlug}/student/dashboard`, icon: Home, label: 'Beranda', exact: true },
    { href: `/${tenantSlug}/student/evaluations`, icon: BarChart, label: 'Evaluasi' },
    { href: `/${tenantSlug}/student/scan`, icon: QrCode, label: 'Scan', isAction: true }, // Highlighted action
    { href: `/${tenantSlug}/student/profile`, icon: User, label: 'Profil' },
  ];

  // Secondary Menu Items (inside the "Lainnya" drawer)
  const secondaryItems = [
    { href: `/${tenantSlug}/student/materials`, icon: BookOpen, label: 'Materi Belajar', desc: 'Akses modul dan video pembelajaran' },
    { href: `/${tenantSlug}/student/invoices`, icon: CreditCard, label: 'Tagihan Saya', desc: 'Kelola SPP dan riwayat pembayaran' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop for More Menu */}
      {isMoreOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* Bottom Sheet Menu for "Lainnya" */}
      <div 
        className={`md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none border-t border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out transform ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="p-6 pb-8 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Menu Lainnya</h3>
            <button 
              onClick={() => setIsMoreOpen(false)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid gap-3">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 hover:border-blue-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                    <Icon size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.label}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none">
        <div className="flex justify-around items-center h-16 px-2">
          
          {/* First 2 Items (Beranda, Jadwal) */}
          {primaryItems.slice(0, 2).map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} className={active ? "transform scale-110 transition-transform" : "transition-transform"} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Center Action Button (Scan) */}
          {primaryItems.slice(2, 3).map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-[20%] h-full"
              >
                <div className={`absolute -top-5 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 ${
                  active 
                    ? 'bg-blue-700 text-white shadow-blue-500/40 transform scale-105' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                }`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] mt-10 ${active ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* 4th Item (Profil) */}
          {primaryItems.slice(3, 4).map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} className={active ? "transform scale-110 transition-transform" : "transition-transform"} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Button */}
          <button 
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors ${
              isMoreOpen 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Menu size={isMoreOpen ? 22 : 20} strokeWidth={isMoreOpen ? 2.5 : 2} className={isMoreOpen ? "transform scale-110 transition-transform" : "transition-transform"} />
            <span className={`text-[10px] ${isMoreOpen ? 'font-bold' : 'font-medium'}`}>Lainnya</span>
          </button>

        </div>
      </nav>
    </>
  );
}
