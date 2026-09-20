"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, User, CreditCard, BarChart, BookOpen, LogOut } from "lucide-react";
import { logoutStudentAction } from "./profile/actions";

export function StudentDesktopNav({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: `/${tenantSlug}/student/dashboard`, icon: Home, label: "Beranda", exact: true },
    { href: `/${tenantSlug}/student/scan`, icon: QrCode, label: "Scan Absen" },
    { href: `/${tenantSlug}/student/materials`, icon: BookOpen, label: "Materi Belajar" },
    { href: `/${tenantSlug}/student/invoices`, icon: CreditCard, label: "Tagihan" },
    { href: `/${tenantSlug}/student/evaluations`, icon: BarChart, label: "Evaluasi" },
    { href: `/${tenantSlug}/student/profile`, icon: User, label: "Profil" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col flex-1 pb-6">
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                active 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <form action={logoutStudentAction.bind(null, tenantSlug)}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Keluar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
