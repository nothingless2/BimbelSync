'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, QrCode, User, CreditCard } from 'lucide-react';

export function StudentMobileNav({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: `/${tenantSlug}/student/dashboard`, icon: Home, label: 'Beranda', exact: true },
    { href: `/${tenantSlug}/student/scan`, icon: QrCode, label: 'Scan' },
    { href: `/${tenantSlug}/student/invoices`, icon: CreditCard, label: 'Tagihan' },
    { href: `/${tenantSlug}/student/profile`, icon: User, label: 'Profil' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} className={active ? "transform scale-110 transition-transform" : "transition-transform"} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
