"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function SuperadminHeader() {
  const pathname = usePathname();

  let pageTitle = "Dashboard";
  if (pathname.includes("/academies")) pageTitle = "Daftar Akademi Berlangganan";
  else if (pathname.includes("/plans")) pageTitle = "Plans & Pricing";
  else if (pathname.includes("/billing")) pageTitle = "Platform Billing";
  else if (pathname.includes("/users")) pageTitle = "System Users";
  else if (pathname.includes("/support")) pageTitle = "Bantuan & Support";

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Admin</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{pageTitle}</span>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48 text-slate-800 dark:text-slate-200"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <ThemeToggle />
        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}
