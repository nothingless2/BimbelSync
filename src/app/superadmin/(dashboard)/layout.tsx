import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuperadminNav } from "@/components/superadmin-nav";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans">
      {/* Sidebar - Clean Light Theme */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M12 2L2 7l10 5 10-5-10-5z" />
                 <path d="M2 17l10 5 10-5" />
                 <path d="M2 12l10 5 10-5" />
               </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <SuperadminNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm">
             <span className="text-slate-400">Admin</span>
             <span className="text-slate-300">/</span>
             <span className="font-semibold text-slate-700 dark:text-slate-200">Daftar Akademi Berlangganan</span>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden">
               {/* Superadmin avatar */}
               <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-900 dark:text-slate-100">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

