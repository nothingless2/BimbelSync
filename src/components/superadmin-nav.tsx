"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, ShieldCheck, CreditCard, Users, HelpCircle, LogOut, Search } from "lucide-react";

const navItems = [
  { href: "/superadmin/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/superadmin/search", icon: Search, label: "Pencarian Tenant" },
  { href: "/superadmin/academies", icon: Building2, label: "Academies" },
  { href: "/superadmin/plans", icon: ShieldCheck, label: "Plans & Pricing" },
  { href: "/superadmin/billing", icon: CreditCard, label: "Platform Billing" },
  { href: "/superadmin/users", icon: Users, label: "System Users" },
];

export function SuperadminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
              isActive(href, exact)
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          href="/superadmin/support"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <HelpCircle size={18} />
          Support
        </Link>
        <Link href="/superadmin/logout" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut size={18} />
          Logout
        </Link>
      </div>
    </>
  );
}
