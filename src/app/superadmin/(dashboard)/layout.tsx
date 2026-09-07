import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuperadminNav } from "@/components/superadmin-nav";
import { SuperadminHeader } from "@/components/superadmin-header";

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
            <img src="/logo.png" alt="BimbelSync Logo" className="w-7 h-7 object-contain rounded-md" />
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <SuperadminNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <SuperadminHeader />

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

